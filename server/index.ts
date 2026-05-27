import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import {
  appendCheckinRow,
  appendRegistrationRow,
  appendTicketItemRows,
  appendTicketRow,
  findCheckinByCode,
  findTicketItemByCode,
  getRecentCheckins,
  getSheetSummary,
  type CheckinRow,
  type TicketItemRow,
} from './sheets';
import {
  findCheckinCSV,
  findTicketItemCSV,
  getCheckinsCSV,
  getTicketItemsCSV,
  getTicketsCSV,
  saveCheckinCSV,
  saveRegistrationCSV,
  saveTicketCSV,
  saveTicketItemsCSV,
  type CheckinRecord,
  type TicketItemRecord,
} from './csv-fallback';
import {
  calculateMerchBundleDiscount,
  calculateServiceFee,
  calculateTicketBulkDiscount,
  getTicketPriceForUser,
  readConfig,
  writeConfig,
} from './config';
import { getTicketCheckinUrl, sendTicketEmail } from './mailer';
import {
  createPaymentLink,
  generateOrderCode,
  generateStatusKey,
  verifyWebhook,
  storePendingOrder,
  getPendingOrder,
  markOrderPaid,
  storePaidResult,
  getPaidResult,
  checkPaymentStatus,
  isPayOSConfigured,
  confirmWebhook,
  type PayOSOrderData,
} from './payos';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 18;

app.disable('x-powered-by');
app.use((_req, res, next) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

const allowedOrigins = new Set([
  'https://vinunistudentcouncil.com',
  'https://www.vinunistudentcouncil.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  ...(process.env.APP_URL ? [process.env.APP_URL.replace(/\/$/, '')] : []),
]);

app.use(cors({
  origin(origin, callback) {
    if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '64kb' }));

const adminTokens = new Set<string>();
const MAX_TICKETS_PER_ORDER = 10;

function getClientIp(req: express.Request): string {
  const forwardedIp = String(req.header('cf-connecting-ip') || req.header('x-forwarded-for') || '').split(',')[0].trim();
  return forwardedIp || req.ip || req.socket.remoteAddress || 'unknown';
}

function createRateLimiter(options: { windowMs: number; max: number; scope?: string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${getClientIp(req)}:${options.scope || req.path}`;
    const now = Date.now();
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (current.count >= options.max) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    current.count += 1;
    next();
  };
}

const adminLoginLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, scope: 'admin-login' });
const publicWriteLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 12, scope: 'public-write' });
const paymentStatusLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 10, scope: 'payos-status' });
const adminExportLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3, scope: 'admin-ticket-export' });

function cleanText(value: unknown, maxLength = 160): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function isValidPhone(value: string): boolean {
  return /^[0-9+\-\s().]{7,24}$/.test(value);
}

function generateId(): string {
  return 'YEP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateTicketCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `Y26-${body}`;
}

function nowVN(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

function getAdminPasscode(): string {
  return process.env.ADMIN_PASSCODE || '';
}

function signAdminToken(payload: string, passcode: string): string {
  return crypto.createHmac('sha256', passcode).update(payload).digest('hex');
}

function createAdminToken(passcode: string): string {
  const issuedAt = Date.now().toString(36);
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${signAdminToken(payload, passcode)}`;
}

function isSignedAdminTokenValid(token: string, passcode: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [issuedAt, nonce, signature] = parts;
  const payload = `${issuedAt}.${nonce}`;
  const expected = signAdminToken(payload, passcode);
  const tokenAge = Date.now() - parseInt(issuedAt, 36);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    Number.isFinite(tokenAge) &&
    tokenAge >= 0 &&
    tokenAge <= ADMIN_TOKEN_TTL_MS &&
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.header('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const passcode = getAdminPasscode();

  if (!token || (!adminTokens.has(token) && (!passcode || !isSignedAdminTokenValid(token, passcode)))) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

function getTicketTypeLabel(userType: string, earlyBirdEnabled: boolean): string {
  if (userType === 'vinnunian') return earlyBirdEnabled ? 'VinUnian Early Bird' : 'VinUnian Regular';
  return 'Guest';
}

function extractTicketCode(input: string): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';

  const ticketParamMatch = trimmed.match(/[?&]ticket=([^&\s]+)/i);
  if (ticketParamMatch?.[1]) {
    return decodeURIComponent(ticketParamMatch[1]).trim().toUpperCase();
  }

  try {
    const url = new URL(trimmed);
    return (url.searchParams.get('ticket') || trimmed).trim().toUpperCase();
  } catch {
    return trimmed.toUpperCase();
  }
}

function getRequestAppUrl(req: express.Request): string | undefined {
  const origin = req.header('origin');
  if (origin) return origin;

  const referer = req.header('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function getPublicConfig(config: Awaited<ReturnType<typeof readConfig>>) {
  const { limits: _limits, ...publicConfig } = config;
  return publicConfig;
}

async function writeAdminAuditLog(req: express.Request, action: string, detail: Record<string, unknown> = {}) {
  try {
    const auditPath = path.resolve('server', 'data', 'admin-audit.log');
    const event = {
      at: new Date().toISOString(),
      action,
      ip: getClientIp(req),
      userAgent: req.header('user-agent') || '',
      ...detail,
    };
    await fs.mkdir(path.dirname(auditPath), { recursive: true });
    await fs.appendFile(auditPath, `${JSON.stringify(event)}\n`, 'utf-8');
  } catch (err) {
    console.error('[Audit] Failed to write admin audit log:', err);
  }
}

app.get('/api/config', async (_req, res) => {
  try {
    res.json(getPublicConfig(await readConfig()));
  } catch (err) {
    console.error('[API] Error reading config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/ticket-qr/:ticketCode.png', async (req, res) => {
  try {
    const ticketCode = extractTicketCode(req.params.ticketCode || '');
    if (!ticketCode || ticketCode.length > 80) {
      res.status(400).send('Invalid ticket code');
      return;
    }

    const checkinUrl = getTicketCheckinUrl(ticketCode);
    const png = await QRCode.toBuffer(checkinUrl, {
      type: 'png',
      margin: 1,
      width: 420,
      errorCorrectionLevel: 'M',
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(png);
  } catch (err) {
    console.error('[API] Error generating ticket QR:', err);
    res.status(500).send('Failed to generate QR code');
  }
});

app.post('/api/admin/login', adminLoginLimiter, async (req, res) => {
  const passcode = getAdminPasscode();
  if (!passcode) {
    await writeAdminAuditLog(req, 'admin_login_unconfigured');
    res.status(503).json({ error: 'Admin passcode is not configured' });
    return;
  }

  if (req.body?.passcode !== passcode) {
    await writeAdminAuditLog(req, 'admin_login_failed');
    res.status(401).json({ error: 'Invalid passcode' });
    return;
  }

  const token = createAdminToken(passcode);
  adminTokens.add(token);
  await writeAdminAuditLog(req, 'admin_login_success');
  res.json({ token });
});

app.get('/api/admin/config', requireAdmin, async (_req, res) => {
  try {
    res.json(await readConfig());
  } catch (err) {
    console.error('[API] Error reading admin config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/config', requireAdmin, async (req, res) => {
  try {
    const saved = await writeConfig(req.body);
    res.json(saved);
  } catch (err) {
    console.error('[API] Error saving admin config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/checkin/search', requireAdmin, async (req, res) => {
  try {
    const ticketCode = extractTicketCode(String(req.query.q || req.query.ticket || ''));
    if (!ticketCode) {
      res.status(400).json({ error: 'Missing ticket code' });
      return;
    }

    const ticket = await findTicketItemByCode(ticketCode) || await findTicketItemCSV(ticketCode);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found', ticketCode });
      return;
    }

    const checkedIn = await findCheckinByCode(ticketCode) || await findCheckinCSV(ticketCode);
    res.json({
      ticket,
      status: checkedIn ? 'checked_in' : 'valid',
      checkedIn,
    });
  } catch (err) {
    console.error('[API] Error searching check-in:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/checkin', requireAdmin, async (req, res) => {
  try {
    const ticketCode = extractTicketCode(req.body?.ticketCode || req.body?.q || '');
    const checkedInBy = String(req.body?.checkedInBy || 'Staff').trim() || 'Staff';

    if (!ticketCode) {
      res.status(400).json({ error: 'Missing ticket code' });
      return;
    }

    const ticket = await findTicketItemByCode(ticketCode) || await findTicketItemCSV(ticketCode);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found', ticketCode });
      return;
    }

    const existing = await findCheckinByCode(ticketCode) || await findCheckinCSV(ticketCode);
    if (existing) {
      res.status(409).json({
        error: 'Ticket already checked in',
        status: 'checked_in',
        ticket,
        checkedIn: existing,
      });
      return;
    }

    const checkin: CheckinRow = {
      ticketCode: ticket.ticketCode,
      orderId: ticket.orderId,
      buyerName: ticket.buyerName,
      email: ticket.email,
      phone: ticket.phone,
      ticketType: ticket.ticketType,
      checkedInAt: nowVN(),
      checkedInBy,
    };

    const sheetOk = await appendCheckinRow(checkin);
    if (!sheetOk) {
      await saveCheckinCSV(checkin);
      console.log('[CSV] Check-in saved locally:', ticket.ticketCode);
    }

    res.status(201).json({
      success: true,
      status: 'checked_in',
      ticket,
      checkedIn: checkin,
      storedIn: sheetOk ? 'sheets' : 'csv',
    });
  } catch (err) {
    console.error('[API] Error checking in ticket:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/checkin/recent', requireAdmin, async (_req, res) => {
  try {
    const sheetCheckins = await getRecentCheckins(20);
    if (sheetCheckins) {
      res.json({ source: 'sheets', checkins: sheetCheckins });
      return;
    }

    const checkins = await getCheckinsCSV();
    res.json({ source: 'csv', checkins: checkins.slice(-20).reverse() });
  } catch (err) {
    console.error('[API] Error getting recent check-ins:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tickets - Save a ticket purchase
app.post('/api/tickets', publicWriteLimiter, async (req, res) => {
  try {
    const {
      fullName, email, phone, userType, userCategory,
      studentId, workplace, upcomingStudent, applicationId, ticketQuantity, ticketPrice,
      merchItems, merchTotal,
    } = req.body;

    if (!fullName || !email || !phone || !userType || !ticketQuantity) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const normalizedFullName = cleanText(fullName, 120);
    const normalizedEmail = cleanText(email, 254).toLowerCase();
    const normalizedPhone = cleanText(phone, 24);
    const normalizedUserType = cleanText(userType, 32);
    const normalizedUserCategory = cleanText(userCategory, 80);
    const normalizedStudentId = cleanText(studentId, 80);
    const normalizedWorkplace = cleanText(workplace, 120);
    const normalizedUpcomingStudent = normalizedUserType === 'non-vinnunian'
      ? req.body?.upcomingStudent === true || String(req.body?.upcomingStudent).toLowerCase() === 'true'
      : false;
    const normalizedApplicationId = normalizedUpcomingStudent ? cleanText(applicationId, 120) : '';

    if (!normalizedFullName || !isValidEmail(normalizedEmail) || !isValidPhone(normalizedPhone)) {
      res.status(400).json({ error: 'Invalid buyer information' });
      return;
    }

    if (!['vinnunian', 'non-vinnunian'].includes(normalizedUserType)) {
      res.status(400).json({ error: 'Invalid ticket type' });
      return;
    }

    if (normalizedUserType === 'vinnunian' && !normalizedEmail.endsWith('@vinuni.edu.vn')) {
      res.status(400).json({ error: 'VinUnian tickets require a vinuni.edu.vn email address' });
      return;
    }

    const config = await readConfig();
    if (config.salesStatus !== 'open') {
      res.status(403).json({ error: 'Ticket sales are not open' });
      return;
    }

    if (normalizedUserType === 'non-vinnunian' && !config.allowGuests) {
      res.status(403).json({ error: 'Guest tickets are not available' });
      return;
    }

    if (normalizedUpcomingStudent && !normalizedApplicationId) {
      res.status(400).json({ error: 'Application ID is required for upcoming students' });
      return;
    }

    const normalizedTicketQuantity = Math.min(MAX_TICKETS_PER_ORDER, Math.max(1, Math.floor(Number(ticketQuantity) || 1)));
    const normalizedTicketPrice = getTicketPriceForUser(config, normalizedUserType);
    const normalizedMerchTotal = Math.max(0, Number(merchTotal) || 0);
    const normalizedMerchItems = cleanText(
      typeof merchItems === 'string' ? merchItems : JSON.stringify(merchItems || []),
      2000,
    );
    const ticketSubtotal = normalizedTicketPrice * normalizedTicketQuantity;
    const subtotal = ticketSubtotal + normalizedMerchTotal;
    const serviceFee = calculateServiceFee(config, subtotal);
    const isEarlyBirdOrder = normalizedUserType === 'vinnunian' && config.earlyBirdEnabled;
    const ticketBulkDiscount = isEarlyBirdOrder
      ? 0
      : calculateTicketBulkDiscount(config, ticketSubtotal, normalizedTicketQuantity);
    const merchBulkDiscount = calculateMerchBundleDiscount(config, normalizedMerchTotal, normalizedTicketQuantity);
    const totalAmount = Math.max(0, subtotal + serviceFee - ticketBulkDiscount - merchBulkDiscount);

    if (isPayOSConfigured()) {
      const orderCode = generateOrderCode();
      const orderId = generateId();
      const statusKey = generateStatusKey();
      const ticketType = getTicketTypeLabel(normalizedUserType, config.earlyBirdEnabled);
      const ticketItems: TicketItemRow[] = Array.from({ length: normalizedTicketQuantity }, (_, index) => ({
        ticketCode: generateTicketCode(),
        orderId,
        timestamp: nowVN(),
        buyerName: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        ticketType,
        ticketNo: String(index + 1),
        orderTicketQuantity: String(normalizedTicketQuantity),
      }));

      const orderData: PayOSOrderData = {
        fullName: normalizedFullName,
        email: normalizedEmail,
        phone: normalizedPhone,
        userType: normalizedUserType,
        userCategory: normalizedUserCategory,
        studentId: normalizedStudentId,
        workplace: normalizedWorkplace,
        upcomingStudent: normalizedUpcomingStudent,
        applicationId: normalizedApplicationId,
        ticketQuantity: normalizedTicketQuantity,
        ticketPrice: normalizedTicketPrice,
        merchItems: normalizedMerchItems,
        merchTotal: normalizedMerchTotal,
        totalAmount,
        ticketBulkDiscount,
        merchBulkDiscount,
        paymentMethod: 'payos',
      };

      storePendingOrder(orderCode, orderData, ticketItems, orderId, statusKey);

      const { checkoutUrl, qrCode } = await createPaymentLink(orderData, orderCode);

      res.status(201).json({
        success: true,
        payos: true,
        orderCode,
        statusKey,
        checkoutUrl,
        qrCode,
        message: 'PAYOS payment link created. Complete payment to receive tickets.',
      });
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Payment provider is not available. Please try again later.' });
      return;
    }

    const record = {
      id: generateId(),
      timestamp: nowVN(),
      fullName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      userType: normalizedUserType,
      userCategory: normalizedUserCategory,
      studentId: normalizedStudentId,
      workplace: normalizedWorkplace,
      upcomingStudent: normalizedUpcomingStudent,
      applicationId: normalizedApplicationId,
      ticketQuantity: String(normalizedTicketQuantity),
      ticketPrice: String(normalizedTicketPrice || ticketPrice),
      merchItems: normalizedMerchItems,
      discountCode: 'AUTO',
      discountAmount: String(ticketBulkDiscount + merchBulkDiscount),
      totalAmount: String(totalAmount),
      paymentMethod: 'payos',
    };
    const ticketType = getTicketTypeLabel(normalizedUserType, config.earlyBirdEnabled);
    const ticketItems: TicketItemRow[] = Array.from({ length: normalizedTicketQuantity }, (_, index) => ({
      ticketCode: generateTicketCode(),
      orderId: record.id,
      timestamp: record.timestamp,
      buyerName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      ticketType,
      ticketNo: String(index + 1),
      orderTicketQuantity: String(normalizedTicketQuantity),
    }));

    const sheetOk = await appendTicketRow(record);

    const itemSheetOk = await appendTicketItemRows(ticketItems);

    if (!sheetOk) {
      await saveTicketCSV({
        ...record,
        ticketQuantity: Number(record.ticketQuantity),
        ticketPrice: Number(record.ticketPrice),
        discountAmount: Number(record.discountAmount),
        totalAmount: Number(record.totalAmount),
        timestamp: nowVN(),
      } as any);
      console.log('[CSV] Ticket saved locally:', record.id);
    }

    if (!itemSheetOk) {
      await saveTicketItemsCSV(ticketItems);
      console.log('[CSV] Ticket items saved locally:', ticketItems.length);
    }

    const emailResult = await sendTicketEmail({
      to: normalizedEmail,
      buyerName: normalizedFullName,
      orderId: record.id,
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      ticketItems,
    });
    if (!emailResult.sent) {
      console.log('[Email] Ticket email not sent:', emailResult.error || 'not configured');
    } else {
      console.log('[Email] Ticket email sent:', normalizedEmail, emailResult.messageId || '');
    }

    res.status(201).json({
      success: true,
      ticketId: record.id,
      ticketCodes: ticketItems.map(item => item.ticketCode),
      storedIn: sheetOk ? 'sheets' : 'csv',
      email: emailResult,
      message: sheetOk
        ? 'Ticket saved to Google Sheets'
        : 'Ticket saved locally (CSV). Configure Google Sheets credentials for cloud storage.',
    });
  } catch (err) {
    console.error('[API] Error saving ticket:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payos/webhook - PayOS payment webhook
app.post('/api/payos/webhook', async (req, res) => {
  try {
    const { verified, data, error: verifyError } = await verifyWebhook(req.body);
    if (!verified || !data) {
      res.status(400).json({ error: 'Invalid webhook signature', detail: verifyError });
      return;
    }

    const orderCode = data.orderCode;
    const pending = getPendingOrder(orderCode);
    if (!pending) {
      res.status(404).json({ error: 'Order not found', orderCode });
      return;
    }

    if (pending.status === 'paid') {
      res.status(200).json({ success: true, message: 'Order already processed' });
      return;
    }

    const orderData = pending.data;
    const record = {
      id: pending.orderId,
      timestamp: pending.ticketItems[0]?.timestamp || nowVN(),
      fullName: orderData.fullName,
      email: orderData.email,
      phone: orderData.phone,
      userType: orderData.userType,
      userCategory: orderData.userCategory || '',
      studentId: orderData.studentId || '',
      workplace: orderData.workplace || '',
      upcomingStudent: Boolean(orderData.upcomingStudent),
      applicationId: orderData.applicationId || '',
      ticketQuantity: String(orderData.ticketQuantity),
      ticketPrice: String(orderData.ticketPrice),
      merchItems: orderData.merchItems,
      discountCode: 'AUTO',
      discountAmount: String(orderData.ticketBulkDiscount + orderData.merchBulkDiscount),
      totalAmount: String(orderData.totalAmount),
      paymentMethod: orderData.paymentMethod,
    };

    const sheetOk = await appendTicketRow(record);
    const itemSheetOk = await appendTicketItemRows(pending.ticketItems);

    if (!sheetOk) {
      await saveTicketCSV({
        ...record,
        ticketQuantity: Number(record.ticketQuantity),
        ticketPrice: Number(record.ticketPrice),
        discountAmount: Number(record.discountAmount),
        totalAmount: Number(record.totalAmount),
        timestamp: nowVN(),
      } as any);
      console.log('[CSV] PayOS ticket saved locally:', record.id);
    }

    if (!itemSheetOk) {
      await saveTicketItemsCSV(pending.ticketItems);
      console.log('[CSV] PayOS ticket items saved locally:', pending.ticketItems.length);
    }

    const emailResult = await sendTicketEmail({
      to: orderData.email,
      buyerName: orderData.fullName,
      orderId: pending.orderId,
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      ticketItems: pending.ticketItems,
    });
    if (!emailResult.sent) {
      console.log('[Email] PayOS ticket email not sent:', emailResult.error || 'not configured');
    } else {
      console.log('[Email] PayOS ticket email sent:', orderData.email, emailResult.messageId || '');
    }

    const result = {
      ticketId: pending.orderId,
      ticketCodes: pending.ticketItems.map(item => item.ticketCode),
      storedIn: sheetOk ? 'sheets' : 'csv',
      statusKey: pending.statusKey,
    };
    markOrderPaid(orderCode);
    storePaidResult(orderCode, result);

    res.status(200).json({ success: true, message: 'Payment processed', ...result });
  } catch (err) {
    console.error('[PayOS] Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payos/status/:orderCode - Check PayOS payment status
app.get('/api/payos/status/:orderCode', paymentStatusLimiter, async (req, res) => {
  try {
    const orderCode = Number(req.params.orderCode);
    const statusKey = cleanText(req.header('x-payos-status-key'), 96);
    const denyStatusLookup = () => res.status(404).json({ error: 'Payment status unavailable' });

    if (!orderCode || Number.isNaN(orderCode)) {
      denyStatusLookup();
      return;
    }

    const paidResult = getPaidResult(orderCode);
    if (paidResult) {
      if (!statusKey || statusKey !== paidResult.statusKey) {
        denyStatusLookup();
        return;
      }
      res.json({ status: 'paid', ...paidResult });
      return;
    }

    const pending = getPendingOrder(orderCode);
    if (!pending) {
      denyStatusLookup();
      return;
    }

    if (!statusKey || statusKey !== pending.statusKey) {
      denyStatusLookup();
      return;
    }

    const isPaid = await checkPaymentStatus(orderCode);
    if (!isPaid) {
      res.json({ status: 'pending' });
      return;
    }

    const orderData = pending.data;
    const record = {
      id: pending.orderId,
      timestamp: pending.ticketItems[0]?.timestamp || nowVN(),
      fullName: orderData.fullName,
      email: orderData.email,
      phone: orderData.phone,
      userType: orderData.userType,
      userCategory: orderData.userCategory || '',
      studentId: orderData.studentId || '',
      workplace: orderData.workplace || '',
      upcomingStudent: Boolean(orderData.upcomingStudent),
      applicationId: orderData.applicationId || '',
      ticketQuantity: String(orderData.ticketQuantity),
      ticketPrice: String(orderData.ticketPrice),
      merchItems: orderData.merchItems,
      discountCode: 'AUTO',
      discountAmount: String(orderData.ticketBulkDiscount + orderData.merchBulkDiscount),
      totalAmount: String(orderData.totalAmount),
      paymentMethod: orderData.paymentMethod,
    };

    const sheetOk = await appendTicketRow(record);
    const itemSheetOk = await appendTicketItemRows(pending.ticketItems);

    if (!sheetOk) {
      await saveTicketCSV({
        ...record,
        ticketQuantity: Number(record.ticketQuantity),
        ticketPrice: Number(record.ticketPrice),
        discountAmount: Number(record.discountAmount),
        totalAmount: Number(record.totalAmount),
        timestamp: nowVN(),
      } as any);
      console.log('[CSV] PayOS ticket saved locally (status check):', record.id);
    }

    if (!itemSheetOk) {
      await saveTicketItemsCSV(pending.ticketItems);
      console.log('[CSV] PayOS ticket items saved locally (status check):', pending.ticketItems.length);
    }

    const emailResult = await sendTicketEmail({
      to: orderData.email,
      buyerName: orderData.fullName,
      orderId: pending.orderId,
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      ticketItems: pending.ticketItems,
    });
    if (!emailResult.sent) {
      console.log('[Email] PayOS ticket email not sent (status check):', emailResult.error || 'not configured');
    }

    const result = {
      ticketId: pending.orderId,
      ticketCodes: pending.ticketItems.map(item => item.ticketCode),
      storedIn: sheetOk ? 'sheets' : 'csv',
      statusKey: pending.statusKey,
    };
    markOrderPaid(orderCode);
    storePaidResult(orderCode, result);

    res.json({ status: 'paid', ...result });
  } catch (err) {
    console.error('[PayOS] Status check error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/registrations - Save a contest registration
app.post('/api/registrations', publicWriteLimiter, async (req, res) => {
  try {
    const { fullName, email, phone, description } = req.body;

    if (!fullName || !email) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const normalizedFullName = cleanText(fullName, 120);
    const normalizedEmail = cleanText(email, 254).toLowerCase();
    const normalizedPhone = cleanText(phone, 24);
    const normalizedDescription = cleanText(description, 2000);

    if (!normalizedFullName || !isValidEmail(normalizedEmail) || (normalizedPhone && !isValidPhone(normalizedPhone))) {
      res.status(400).json({ error: 'Invalid registration information' });
      return;
    }

    const record = {
      id: generateId(),
      timestamp: nowVN(),
      fullName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      description: normalizedDescription,
    };

    const sheetOk = await appendRegistrationRow(record);

    if (!sheetOk) {
      await saveRegistrationCSV(record);
      console.log('[CSV] Registration saved locally:', record.id);
    }

    res.status(201).json({
      success: true,
      registrationId: record.id,
      storedIn: sheetOk ? 'sheets' : 'csv',
    });
  } catch (err) {
    console.error('[API] Error saving registration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/summary - Get statistics
app.get('/api/admin/summary', requireAdmin, async (_req, res) => {
  try {
    const sheetSummary = await getSheetSummary();

    if (sheetSummary) {
      res.json({ source: 'sheets', ...sheetSummary });
      return;
    }

    const tickets = await getTicketsCSV();
    res.json({
      source: 'csv',
      ticketCount: tickets.length,
    });
  } catch (err) {
    console.error('[API] Error getting summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/tickets - Export recent ticket rows for admin review
app.get('/api/admin/tickets', requireAdmin, adminExportLimiter, async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Math.min(500, Math.max(1, Math.floor(requestedLimit || 500)));
    const tickets = await getTicketsCSV();
    const exportedTickets = tickets.slice(-limit);
    await writeAdminAuditLog(req, 'admin_tickets_export', {
      exportedCount: exportedTickets.length,
      totalAvailable: tickets.length,
      limit,
    });
    res.json({ source: 'csv', tickets: exportedTickets, totalAvailable: tickets.length, limit });
  } catch (err) {
    console.error('[API] Error getting tickets:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static frontend in production
const distPath = path.resolve('dist');
if (process.env.NODE_ENV === 'production') {
  app.get('/', (_req, res) => {
    res.redirect(301, '/yep26/');
  });
  app.get('/checkin-yep-2026', (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(301, `/yep26/checkin-yep-2026${query}`);
  });
  app.get('/ops-yep-2026', (_req, res) => {
    res.redirect(301, '/yep26/ops-yep-2026');
  });
  app.use('/yep26', express.static(distPath));
  app.get(/^\/yep26(?:\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log('[Server] Endpoints:');
  console.log('  POST /api/tickets');
  console.log('  POST /api/registrations');
  console.log('  POST /api/payos/webhook');
  console.log('  GET  /api/payos/status/:orderCode');
  console.log('  GET  /api/admin/summary');
  console.log('  GET  /api/admin/tickets');

  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log('[Server] ⚠ Google Sheets not configured. Using CSV fallback.');
    console.log('[Server] To enable Sheets: set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY in .env');
  }
  if (!process.env.PAYOS_CLIENT_ID) {
    console.log('[Server] ⚠ PayOS not configured. PayOS payment disabled.');
    console.log('[Server] To enable PayOS: set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env');
  } else {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    confirmWebhook(appUrl);
  }
});
