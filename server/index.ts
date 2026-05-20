import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import {
  appendCheckinRow,
  appendRegistrationRow,
  appendTicketItemRows,
  appendTicketRow,
  findCheckinByCode,
  findTicketItemByCode,
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
import { sendTicketEmail } from './mailer';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 18;

app.use(cors());
app.use(express.json());

const adminTokens = new Set<string>();

function generateId(): string {
  return 'YEP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateTicketCode(orderId: string, index: number): string {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${orderId}-${String(index).padStart(2, '0')}-${suffix}`;
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
  if (userType === 'vinnunian') return earlyBirdEnabled ? 'Vinnunian Early Bird' : 'Vinnunian Regular';
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

app.get('/api/config', async (_req, res) => {
  try {
    res.json(await readConfig());
  } catch (err) {
    console.error('[API] Error reading config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const passcode = getAdminPasscode();
  if (!passcode) {
    res.status(503).json({ error: 'Admin passcode is not configured' });
    return;
  }

  if (req.body?.passcode !== passcode) {
    res.status(401).json({ error: 'Invalid passcode' });
    return;
  }

  const token = createAdminToken(passcode);
  adminTokens.add(token);
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
    const checkins = await getCheckinsCSV();
    res.json({ source: 'csv', checkins: checkins.slice(-20).reverse() });
  } catch (err) {
    console.error('[API] Error getting recent check-ins:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tickets - Save a ticket purchase
app.post('/api/tickets', async (req, res) => {
  try {
    const {
      fullName, email, phone, userType, userCategory,
      studentId, workplace, ticketQuantity, ticketPrice,
      merchItems, merchTotal,
      paymentMethod,
    } = req.body;

    if (!fullName || !email || !phone || !userType || !ticketQuantity) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const config = await readConfig();
    const normalizedTicketQuantity = Math.max(1, Number(ticketQuantity) || 1);
    const normalizedTicketPrice = getTicketPriceForUser(config, userType);
    const normalizedMerchTotal = Math.max(0, Number(merchTotal) || 0);
    const ticketSubtotal = normalizedTicketPrice * normalizedTicketQuantity;
    const subtotal = ticketSubtotal + normalizedMerchTotal;
    const serviceFee = calculateServiceFee(config, subtotal);
    const ticketBulkDiscount = calculateTicketBulkDiscount(config, ticketSubtotal, normalizedTicketQuantity);
    const merchBulkDiscount = calculateMerchBundleDiscount(config, normalizedMerchTotal, normalizedTicketQuantity);
    const totalAmount = Math.max(0, subtotal + serviceFee - ticketBulkDiscount - merchBulkDiscount);

    const record = {
      id: generateId(),
      timestamp: nowVN(),
      fullName,
      email,
      phone,
      userType,
      userCategory: userCategory || '',
      studentId: studentId || '',
      workplace: workplace || '',
      ticketQuantity: String(normalizedTicketQuantity),
      ticketPrice: String(normalizedTicketPrice || ticketPrice),
      merchItems: typeof merchItems === 'string' ? merchItems : JSON.stringify(merchItems || []),
      discountCode: 'AUTO',
      discountAmount: String(ticketBulkDiscount + merchBulkDiscount),
      totalAmount: String(totalAmount),
      paymentMethod: paymentMethod || 'credit',
    };
    const ticketType = getTicketTypeLabel(userType, config.earlyBirdEnabled);
    const ticketItems: TicketItemRow[] = Array.from({ length: normalizedTicketQuantity }, (_, index) => ({
      ticketCode: generateTicketCode(record.id, index + 1),
      orderId: record.id,
      timestamp: record.timestamp,
      buyerName: fullName,
      email,
      phone,
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
      to: email,
      buyerName: fullName,
      orderId: record.id,
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      ticketItems,
      appUrl: getRequestAppUrl(req),
    });
    if (!emailResult.sent) {
      console.log('[Email] Ticket email not sent:', emailResult.error || 'not configured');
    } else {
      console.log('[Email] Ticket email sent:', email, emailResult.messageId || '');
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

// POST /api/registrations - Save a contest registration
app.post('/api/registrations', async (req, res) => {
  try {
    const { fullName, email, phone, description } = req.body;

    if (!fullName || !email) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const record = {
      id: generateId(),
      timestamp: nowVN(),
      fullName,
      email,
      phone: phone || '',
      description: description || '',
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

// GET /api/admin/tickets - Export all tickets (for Excel)
app.get('/api/admin/tickets', requireAdmin, async (_req, res) => {
  try {
    const tickets = await getTicketsCSV();
    res.json({ source: 'csv', tickets });
  } catch (err) {
    console.error('[API] Error getting tickets:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static frontend in production
const distPath = path.resolve('dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log('[Server] Endpoints:');
  console.log('  POST /api/tickets');
  console.log('  POST /api/registrations');
  console.log('  GET  /api/admin/summary');
  console.log('  GET  /api/admin/tickets');

  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    console.log('[Server] ⚠ Google Sheets not configured. Using CSV fallback.');
    console.log('[Server] To enable Sheets: set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY in .env');
  }
});
