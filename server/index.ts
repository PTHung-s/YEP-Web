import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import QRCode from 'qrcode';
import {
  appendCheckinRow,
  appendMerchClaimRows,
  appendRegistrationRow,
  appendTicketItemRows,
  appendTicketRow,
  findCheckinByCode,
  findMerchClaimByCode,
  findTicketItemByCode,
  findDiscountCode,
  getRecentCheckins,
  getDiscountCodeRows,
  getSheetSummary,
  getTicketRows,
  appendDiscountCodeUseRows,
  appendDiscountCodeRows,
  discountCodeUsesExistForOrder,
  incrementDiscountCodeUsage,
  merchClaimsExistForOrder,
  markMerchClaimedByCode,
  ticketItemsExistForOrder,
  ticketOrderExists,
  type CheckinRow,
  type DiscountCodeRow,
  type MerchClaimRow,
  type TicketItemRow,
} from './sheets';
import {
  findCheckinCSV,
  findMerchClaimCSV,
  findTicketItemCSV,
  getCheckinsCSV,
  markMerchClaimedCSV,
  getTicketItemsCSV,
  getTicketsCSV,
  saveCheckinCSV,
  saveMerchClaimsCSV,
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
import { renderTicketCardPng } from './ticket-card';
import {
  createPaymentLink,
  generateOrderCode,
  generateStatusKey,
  verifyWebhook,
  storePendingOrder,
  getPendingOrder,
  beginOrderProcessing,
  releaseOrderProcessing,
  markOrderPaid,
  markOrderEmailSent,
  storePaidResult,
  getPaidResult,
  getPaidOrdersNeedingEmail,
  checkPaymentStatus,
  isPayOSConfigured,
  confirmWebhook,
  recoverPaidOrders,
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
const discountPreviewLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30, scope: 'discount-preview' });
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

function generateMerchClaimCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(6);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `M26-${body}`;
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

function hasMerchOrder(merchItems: string, merchTotal: number): boolean {
  const normalized = String(merchItems || '').trim();
  return merchTotal > 0 && normalized !== '' && normalized !== '[]';
}

type MerchLimitKey = 'kaleidoLanyardYoyo' | 'kaleidoBadana';

const MERCH_LIMIT_LABELS: Record<MerchLimitKey, string> = {
  kaleidoLanyardYoyo: 'Combo Lanyard + Yoyo Kaleido',
  kaleidoBadana: 'Badana Kaleido',
};

function parseMerchQuantities(merchItems: string): Record<MerchLimitKey, number> {
  const counts: Record<MerchLimitKey, number> = {
    kaleidoLanyardYoyo: 0,
    kaleidoBadana: 0,
  };

  for (const part of String(merchItems || '').split(';')) {
    const normalized = part.toUpperCase();
    const quantityMatch = normalized.match(/\bX\s*(\d+)\b/) || normalized.match(/^\s*(\d+)\s*X\b/);
    const quantity = Math.max(0, Number(quantityMatch?.[1] || 0));
    if (!quantity) continue;

    if (normalized.includes('LANYARD') || normalized.includes('YOYO')) {
      counts.kaleidoLanyardYoyo += quantity;
    } else if (normalized.includes('BADANA')) {
      counts.kaleidoBadana += quantity;
    }
  }

  return counts;
}

async function getSoldMerchCounts(): Promise<Record<MerchLimitKey, number>> {
  const counts: Record<MerchLimitKey, number> = {
    kaleidoLanyardYoyo: 0,
    kaleidoBadana: 0,
  };

  const sheetRows = await getTicketRows();
  const ticketRows: Array<{ merchItems?: string }> = sheetRows || await getTicketsCSV();

  for (const row of ticketRows) {
    const rowCounts = parseMerchQuantities(row.merchItems || '');
    counts.kaleidoLanyardYoyo += rowCounts.kaleidoLanyardYoyo;
    counts.kaleidoBadana += rowCounts.kaleidoBadana;
  }

  return counts;
}

async function getMerchLimitError(config: Awaited<ReturnType<typeof readConfig>>, requestedMerchItems: string): Promise<string> {
  const requested = parseMerchQuantities(requestedMerchItems);
  if (!requested.kaleidoLanyardYoyo && !requested.kaleidoBadana) return '';

  const sold = await getSoldMerchCounts();

  for (const key of Object.keys(requested) as MerchLimitKey[]) {
    const limit = config.merchLimits[key];
    if (sold[key] + requested[key] > limit) {
      const remaining = Math.max(0, limit - sold[key]);
      return `${MERCH_LIMIT_LABELS[key]} is sold out or only ${remaining} left.`;
    }
  }

  return '';
}

type DiscountCodeType = DiscountCodeRow['type'];

interface DiscountValidationResult {
  valid: boolean;
  code: string;
  name: string;
  type: DiscountCodeType | '';
  rate: number;
  message: string;
}

interface TicketDiscountResult {
  discountCodes: string[];
  ticketDiscount: number;
  capped: boolean;
  appliedCodeDiscount: number;
  message: string;
  appliedDiscounts: DiscountValidationResult[];
}

function normalizeDiscountCode(value: unknown): string {
  return cleanText(value, 40).replace(/\s+/g, '').toUpperCase();
}

function normalizeDiscountCodeList(value: unknown): string[] {
  const rawCodes = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return Array.from(new Set(rawCodes.map(normalizeDiscountCode).filter(Boolean)));
}

function generateDiscountCode(prefix: 'YEPD5' | 'YEPD10' | 'YEPD20', existing: Set<string>): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  do {
    const body = Array.from(crypto.randomBytes(6), byte => alphabet[byte % alphabet.length]).join('');
    code = `${prefix}-${body}`;
  } while (existing.has(code));

  existing.add(code);
  return code;
}

async function validateDiscountCode(rawCode: unknown): Promise<DiscountValidationResult> {
  const code = normalizeDiscountCode(rawCode);
  if (!code) {
    return { valid: false, code: '', name: '', type: '', rate: 0, message: 'Enter a discount code.' };
  }

  const found = await findDiscountCode(code);
  if (!found) {
    return { valid: false, code, name: '', type: '', rate: 0, message: 'Discount code not found.' };
  }

  const row = found.row;
  if (!row.active) {
    return { valid: false, code, name: row.name, type: row.type, rate: row.rate, message: 'Discount code is inactive.' };
  }

  if (row.maxUses > 0 && row.usedCount >= row.maxUses) {
    return { valid: false, code, name: row.name, type: row.type, rate: row.rate, message: 'Discount code has already been used.' };
  }

  return {
    valid: true,
    code: row.code,
    name: row.name,
    type: row.type,
    rate: row.rate,
    message: row.rate > 0 ? `${Math.round(row.rate * 100)}% discount applied.` : 'Code applied.',
  };
}

async function validateDiscountCodeList(rawCodes: unknown): Promise<{ valid: boolean; discounts: DiscountValidationResult[]; message: string }> {
  const codes = normalizeDiscountCodeList(rawCodes);
  const discounts: DiscountValidationResult[] = [];

  for (const code of codes) {
    const validation = await validateDiscountCode(code);
    if (!validation.valid) {
      return { valid: false, discounts: [], message: validation.message || 'Invalid discount code' };
    }
    discounts.push(validation);
  }

  const trackingCodeCount = discounts.filter(item => item.type === 'KPI' || item.type === 'REFERRAL').length;
  if (trackingCodeCount > 1) {
    return { valid: false, discounts: [], message: 'Only one KPI or referral code can be applied.' };
  }

  const vipCount = discounts.filter(item => item.type === 'VIP_20').length;
  if (vipCount > 1) {
    return { valid: false, discounts: [], message: 'Only one 20% code can be applied.' };
  }

  if (vipCount > 0 && discounts.some(item => item.type !== 'VIP_20' && item.type !== 'REFERRAL')) {
    return { valid: false, discounts: [], message: '20% codes cannot be combined with other discount codes.' };
  }

  return { valid: true, discounts, message: '' };
}

function calculateTicketDiscountWithCodes(
  ticketSubtotal: number,
  ticketBulkDiscount: number,
  discounts: DiscountValidationResult[],
): TicketDiscountResult {
  const validDiscounts = discounts.filter(discount => discount.valid);
  if (validDiscounts.length === 0 || ticketSubtotal <= 0) {
    return {
      discountCodes: [],
      ticketDiscount: ticketBulkDiscount,
      capped: false,
      appliedCodeDiscount: 0,
      message: '',
      appliedDiscounts: [],
    };
  }

  const vipCode = validDiscounts.find(discount => discount.type === 'VIP_20');
  if (vipCode) {
    const ticketDiscount = Math.round(ticketSubtotal * vipCode.rate);
    return {
      discountCodes: validDiscounts.map(discount => discount.code),
      ticketDiscount,
      capped: false,
      appliedCodeDiscount: ticketDiscount,
      message: '20% discount applied. Bulk discount is not combined with this code.',
      appliedDiscounts: validDiscounts,
    };
  }

  const bulkRate = ticketBulkDiscount / ticketSubtotal;
  const codeRate = validDiscounts
    .filter(discount => discount.type !== 'REFERRAL')
    .reduce((sum, discount) => sum + discount.rate, 0);
  const uncappedRate = bulkRate + codeRate;
  const finalRate = Math.min(0.15, uncappedRate);
  const ticketDiscount = Math.round(ticketSubtotal * finalRate);
  const capped = uncappedRate > 0.15;

  return {
    discountCodes: validDiscounts.map(discount => discount.code),
    ticketDiscount,
    capped,
    appliedCodeDiscount: Math.max(0, ticketDiscount - ticketBulkDiscount),
    message: capped
      ? 'Discount applied, but total ticket discount is capped at 15%.'
      : validDiscounts.some(discount => discount.type !== 'REFERRAL')
        ? 'Discount codes applied.'
        : 'Code applied.',
    appliedDiscounts: validDiscounts,
  };
}

function buildDiscountUseRows(params: {
  orderId: string;
  timestamp: string;
  buyerName: string;
  email: string;
  phone: string;
  ticketQuantity: string;
  ticketSubtotal: number;
  ticketBulkDiscount: number;
  discountResult: TicketDiscountResult;
}) {
  const { discountResult, ticketSubtotal, ticketBulkDiscount } = params;
  const nonReferralDiscounts = discountResult.appliedDiscounts.filter(discount => discount.type !== 'REFERRAL');
  const totalNonReferralRate = nonReferralDiscounts.reduce((sum, discount) => sum + discount.rate, 0);
  const codeDiscountPool = Math.max(0, discountResult.ticketDiscount - (discountResult.appliedDiscounts.some(discount => discount.type === 'VIP_20') ? 0 : ticketBulkDiscount));

  return discountResult.appliedDiscounts.map(discount => {
    let discountApplied = 0;
    if (discount.type === 'VIP_20') {
      discountApplied = Math.round(ticketSubtotal * discount.rate);
    } else if (discount.type !== 'REFERRAL' && totalNonReferralRate > 0) {
      discountApplied = Math.round(codeDiscountPool * (discount.rate / totalNonReferralRate));
    }

    return {
      timestamp: params.timestamp,
      orderId: params.orderId,
      code: discount.code,
      type: discount.type as DiscountCodeRow['type'],
      rate: discount.rate,
      buyerName: params.buyerName,
      email: params.email,
      phone: params.phone,
      ticketQuantity: params.ticketQuantity,
      discountApplied: String(discountApplied),
    };
  });
}

async function recordDiscountCodeUsage(params: Parameters<typeof buildDiscountUseRows>[0]) {
  const rows = buildDiscountUseRows(params);
  if (rows.length === 0) return;

  const alreadyRecorded = await discountCodeUsesExistForOrder(params.orderId);
  if (alreadyRecorded) {
    console.log('[Sheets] Discount code uses already recorded:', params.orderId);
    return;
  }

  const appended = await appendDiscountCodeUseRows(rows);
  if (!appended) return;

  for (const row of rows) {
    await incrementDiscountCodeUsage(row.code);
  }
}

function getStoredDiscountResult(orderData: PayOSOrderData): TicketDiscountResult {
  const discounts = (orderData.appliedDiscounts || [])
    .map(discount => ({
      valid: true,
      code: discount.code,
      name: discount.name || '',
      type: discount.type as DiscountCodeType,
      rate: Number(discount.rate) || 0,
      message: '',
    }))
    .filter(discount => discount.code);

  return {
    discountCodes: discounts.map(discount => discount.code),
    ticketDiscount: Number(orderData.ticketDiscount ?? orderData.ticketBulkDiscount) || 0,
    capped: false,
    appliedCodeDiscount: 0,
    message: '',
    appliedDiscounts: discounts,
  };
}

type StoredPayOSOrder = NonNullable<ReturnType<typeof getPendingOrder>>;

async function appendPaidOrderArtifacts(
  record: {
    id: string;
    timestamp: string;
    fullName: string;
    email: string;
    phone: string;
    userType: string;
    userCategory: string;
    studentId: string;
    workplace: string;
    upcomingStudent: boolean;
    applicationId: string;
    ticketQuantity: string;
    ticketPrice: string;
    merchItems: string;
    discountCode: string;
    discountAmount: string;
    totalAmount: string;
    paymentMethod: string;
  },
  pending: StoredPayOSOrder,
  source: string,
) {
  const ticketAlreadyExists = await ticketOrderExists(record.id);
  const sheetOk = ticketAlreadyExists === true ? true : await appendTicketRow(record);
  if (ticketAlreadyExists === true) {
    console.log(`[PayOS] Ticket row already exists (${source}):`, record.id);
  }

  const itemsAlreadyExist = pending.ticketItems.length > 0
    ? await ticketItemsExistForOrder(record.id)
    : true;
  const itemSheetOk = itemsAlreadyExist === true ? true : await appendTicketItemRows(pending.ticketItems);
  if (pending.ticketItems.length > 0 && itemsAlreadyExist === true) {
    console.log(`[PayOS] Ticket items already exist (${source}):`, record.id);
  }

  const pendingMerchClaims = pending.merchClaims || [];
  const merchAlreadyExists = pendingMerchClaims.length > 0
    ? await merchClaimsExistForOrder(record.id)
    : true;
  const merchSheetOk = merchAlreadyExists === true ? true : await appendMerchClaimRows(pendingMerchClaims);
  if (pendingMerchClaims.length > 0 && merchAlreadyExists === true) {
    console.log(`[PayOS] Merch claim already exists (${source}):`, record.id);
  }

  if (!sheetOk) {
    await saveTicketCSV({
      ...record,
      ticketQuantity: Number(record.ticketQuantity),
      ticketPrice: Number(record.ticketPrice),
      discountAmount: Number(record.discountAmount),
      totalAmount: Number(record.totalAmount),
      timestamp: nowVN(),
    } as any);
    console.log(`[CSV] PayOS ticket saved locally (${source}):`, record.id);
  }

  if (pending.ticketItems.length > 0 && !itemSheetOk) {
    await saveTicketItemsCSV(pending.ticketItems);
    console.log(`[CSV] PayOS ticket items saved locally (${source}):`, pending.ticketItems.length);
  }

  if (pendingMerchClaims.length > 0 && !merchSheetOk) {
    await saveMerchClaimsCSV(pendingMerchClaims);
    console.log(`[CSV] PayOS merch claim saved locally (${source}):`, pendingMerchClaims[0].merchClaimCode);
  }

  return {
    sheetOk,
    itemSheetOk,
    merchSheetOk,
    pendingMerchClaims,
  };
}

async function resendPayOSOrderEmail(orderCode: number, pending: StoredPayOSOrder, source: string) {
  const orderData = pending.data;
  const recordTotalAmount = String(orderData.totalAmount);
  const emailResult = await sendTicketEmail({
    to: orderData.email,
    buyerName: orderData.fullName,
    orderId: pending.orderId,
    totalAmount: recordTotalAmount,
    paymentMethod: orderData.paymentMethod,
    ticketItems: pending.ticketItems,
    merchItems: orderData.merchItems,
    merchClaims: pending.merchClaims || [],
  });

  if (emailResult.sent) {
    markOrderEmailSent(orderCode);
    console.log(`[Email] PayOS ticket email sent (${source}):`, orderData.email, emailResult.messageId || '');
  } else {
    console.log(`[Email] PayOS ticket email not sent (${source}):`, emailResult.error || 'not configured');
  }

  return emailResult;
}

async function processPaidPayOSOrder(orderCode: number, source: string) {
  const existingResult = getPaidResult(orderCode);
  if (existingResult) {
    return { result: existingResult, alreadyProcessed: true, emailSent: true };
  }

  const storedOrder = getPendingOrder(orderCode);
  if (storedOrder?.status === 'paid') {
    const result = {
      ticketId: storedOrder.orderId,
      ticketCodes: storedOrder.ticketItems.map(item => item.ticketCode),
      storedIn: 'sheets',
      statusKey: storedOrder.statusKey,
    };
    storePaidResult(orderCode, result);
    return { result, alreadyProcessed: true, emailSent: storedOrder.emailSent === true };
  }

  const pending = beginOrderProcessing(orderCode);
  if (!pending) {
    return { result: null, alreadyProcessing: true, emailSent: false };
  }

  try {
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
      discountCode: orderData.discountCode || '',
      discountAmount: String((orderData.ticketDiscount ?? orderData.ticketBulkDiscount) + orderData.merchBulkDiscount),
      totalAmount: String(orderData.totalAmount),
      paymentMethod: orderData.paymentMethod,
    };

    const { sheetOk, pendingMerchClaims } = await appendPaidOrderArtifacts(record, pending, source);

    await recordDiscountCodeUsage({
      orderId: record.id,
      timestamp: record.timestamp,
      buyerName: record.fullName,
      email: record.email,
      phone: record.phone,
      ticketQuantity: record.ticketQuantity,
      ticketSubtotal: Number(orderData.ticketPrice) * Number(orderData.ticketQuantity),
      ticketBulkDiscount: Number(orderData.ticketBulkDiscount) || 0,
      discountResult: getStoredDiscountResult(orderData),
    });

    const emailResult = await sendTicketEmail({
      to: orderData.email,
      buyerName: orderData.fullName,
      orderId: pending.orderId,
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      ticketItems: pending.ticketItems,
      merchItems: orderData.merchItems,
      merchClaims: pendingMerchClaims,
    });

    if (!emailResult.sent) {
      console.log(`[Email] PayOS ticket email not sent (${source}):`, emailResult.error || 'not configured');
    } else {
      console.log(`[Email] PayOS ticket email sent (${source}):`, orderData.email, emailResult.messageId || '');
    }

    const result = {
      ticketId: pending.orderId,
      ticketCodes: pending.ticketItems.map(item => item.ticketCode),
      storedIn: sheetOk ? 'sheets' : 'csv',
      statusKey: pending.statusKey,
    };

    markOrderPaid(orderCode, emailResult.sent);
    storePaidResult(orderCode, result);

    return { result, alreadyProcessed: false, emailSent: emailResult.sent };
  } catch (err) {
    releaseOrderProcessing(orderCode);
    throw err;
  }
}

async function seedDefaultDiscountCodes(): Promise<{ created: number; skipped: number }> {
  const existingRows = await getDiscountCodeRows();
  if (!existingRows) throw new Error('Google Sheets is not configured');

  const existing = new Set(existingRows.map(row => row.code));
  const now = nowVN();
  const rows: DiscountCodeRow[] = [];

  const addRows = (targetCount: number, prefix: 'YEPD5' | 'YEPD10' | 'YEPD20', name: string, type: DiscountCodeType, rate: number) => {
    const currentCount = existingRows.filter(row => row.type === type && row.code.startsWith(`${prefix}-`)).length;
    const missingCount = Math.max(0, targetCount - currentCount);
    for (let i = 0; i < missingCount; i += 1) {
      rows.push({
        code: generateDiscountCode(prefix, existing),
        name,
        type,
        rate,
        maxUses: 1,
        usedCount: 0,
        active: true,
        owner: '',
        notes: 'Generated by admin',
        createdAt: now,
        lastUsedAt: '',
      });
    }
  };

  addRows(100, 'YEPD5', 'Booth Game 5%', 'GAME_5', 0.05);
  addRows(100, 'YEPD10', 'Booth Game 10%', 'GAME_10', 0.1);
  addRows(20, 'YEPD20', 'Booth Game 20%', 'VIP_20', 0.2);

  if (!existing.has('NGOCYEP26')) {
    rows.push({
      code: 'NGOCYEP26',
      name: 'Ngoc Referral Tracking',
      type: 'REFERRAL',
      rate: 0,
      maxUses: 999999,
      usedCount: 0,
      active: true,
      owner: 'Ngoc',
      notes: 'Referral tracking only',
      createdAt: now,
      lastUsedAt: '',
    });
  }

  const ok = await appendDiscountCodeRows(rows);
  if (!ok) throw new Error('Failed to append discount codes');

  return { created: rows.length, skipped: existingRows.length };
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

app.get('/api/ticket-card/:ticketCode.png', async (req, res) => {
  try {
    const ticketCode = extractTicketCode(req.params.ticketCode || '');
    if (!ticketCode || ticketCode.length > 80) {
      res.status(400).send('Invalid ticket code');
      return;
    }

    const ticket = await findTicketItemByCode(ticketCode) || await findTicketItemCSV(ticketCode);
    if (ticket) {
      const png = await renderTicketCardPng({
        kind: 'ticket',
        code: ticket.ticketCode,
        kicker: `${Number(ticket.orderTicketQuantity) > 1 ? `Ticket ${ticket.ticketNo}` : 'Your Ticket'} - Check-in Pass`,
        title: 'The Kaleido Soul',
        subtitle: 'Amphitheatre, VinUniversity - 25/6/2026',
        primaryLabel: 'Ticket Type',
        primaryValue: ticket.ticketType,
        secondaryLabel: 'Check-in',
        secondaryValue: '17:00 - 19:00',
        tertiaryLabel: 'Quantity',
        tertiaryValue: `${ticket.ticketNo} / ${ticket.orderTicketQuantity || '1'}`,
        bottomLeftLabel: 'Guest Name',
        bottomLeftValue: ticket.buyerName,
        bottomMiddleLabel: 'Event',
        bottomMiddleValue: "YEP'26",
        bottomRightLabel: 'Date',
        bottomRightValue: '25/6',
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(png);
      return;
    }

    const merchClaim = await findMerchClaimByCode(ticketCode) || await findMerchClaimCSV(ticketCode);
    if (merchClaim) {
      const png = await renderTicketCardPng({
        kind: 'merch',
        code: merchClaim.merchClaimCode,
        kicker: 'Merch Claim Pass',
        title: 'Merch Pickup',
        subtitle: 'Show this QR at the SC booth.',
        primaryLabel: 'Merch Items',
        primaryValue: merchClaim.merchItems,
        secondaryLabel: '',
        secondaryValue: '',
        tertiaryLabel: '',
        tertiaryValue: '',
        bottomLeftLabel: '',
        bottomLeftValue: '',
        bottomMiddleLabel: '',
        bottomMiddleValue: '',
        bottomRightLabel: '',
        bottomRightValue: '',
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(png);
      return;
    }

    res.status(404).send('Ticket or merch claim not found');
  } catch (err) {
    console.error('[API] Error generating ticket card:', err);
    res.status(500).send('Failed to generate ticket card');
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

app.post('/api/admin/discount-codes/generate', requireAdmin, async (_req, res) => {
  try {
    const result = await seedDefaultDiscountCodes();
    await writeAdminAuditLog(_req, 'discount_codes_generated', result);
    res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    console.error('[Admin] Error generating discount codes:', err);
    res.status(500).json({ error: err.message || 'Failed to generate discount codes' });
  }
});

app.post('/api/discount/preview', discountPreviewLimiter, async (req, res) => {
  try {
    const newCode = normalizeDiscountCode(req.body?.discountCode);
    const existingCodes = normalizeDiscountCodeList(req.body?.discountCodes);
    const allCodes = [...existingCodes, newCode].filter(Boolean);
    if (existingCodes.includes(newCode)) {
      res.status(400).json({ valid: false, message: 'Code already applied.' });
      return;
    }

    const validation = await validateDiscountCodeList(allCodes);
    if (!validation.valid) {
      res.status(400).json({ valid: false, message: validation.message });
      return;
    }

    const config = await readConfig();
    const userType = cleanText(req.body?.userType, 32);
    const ticketQuantity = Math.min(MAX_TICKETS_PER_ORDER, Math.max(0, Math.floor(Number(req.body?.ticketQuantity) || 0)));
    const ticketPrice = getTicketPriceForUser(config, userType);
    const ticketSubtotal = ticketPrice * ticketQuantity;
    const isEarlyBirdOrder = userType === 'vinnunian' && config.earlyBirdEnabled;
    const ticketBulkDiscount = isEarlyBirdOrder
      ? 0
      : calculateTicketBulkDiscount(config, ticketSubtotal, ticketQuantity);
    const ticketDiscount = calculateTicketDiscountWithCodes(ticketSubtotal, ticketBulkDiscount, validation.discounts);
    const appliedDiscount = validation.discounts.find(item => item.code === newCode) || validation.discounts[validation.discounts.length - 1];

    res.json({
      valid: true,
      code: appliedDiscount.code,
      name: appliedDiscount.name,
      type: appliedDiscount.type,
      rate: appliedDiscount.rate,
      discounts: ticketDiscount.appliedDiscounts.map(discount => ({
        code: discount.code,
        name: discount.name,
        type: discount.type,
        rate: discount.rate,
      })),
      ticketDiscount: ticketDiscount.ticketDiscount,
      appliedCodeDiscount: ticketDiscount.appliedCodeDiscount,
      capped: ticketDiscount.capped,
      message: ticketDiscount.message || appliedDiscount.message,
    });
  } catch (err) {
    console.error('[API] Error previewing discount:', err);
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
      const merchClaim = await findMerchClaimByCode(ticketCode) || await findMerchClaimCSV(ticketCode);
      if (!merchClaim) {
        res.status(404).json({ error: 'Ticket or merch claim not found', ticketCode });
        return;
      }

      res.json({
        status: merchClaim.claimedAt ? 'merch_claimed' : 'valid',
        kind: 'merch',
        merchClaim,
      });
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
      const merchClaim = await findMerchClaimByCode(ticketCode) || await findMerchClaimCSV(ticketCode);
      if (!merchClaim) {
        res.status(404).json({ error: 'Ticket or merch claim not found', ticketCode });
        return;
      }

      if (merchClaim.claimedAt) {
        res.status(409).json({
          error: 'Merch already claimed',
          status: 'merch_claimed',
          kind: 'merch',
          merchClaim,
        });
        return;
      }

      const claimedAt = nowVN();
      const claimed = await markMerchClaimedByCode(ticketCode, claimedAt, checkedInBy)
        || await markMerchClaimedCSV(ticketCode, claimedAt, checkedInBy);

      if (!claimed) {
        res.status(500).json({ error: 'Cannot claim merch right now' });
        return;
      }

      res.status(201).json({
        success: true,
        status: 'merch_claimed',
        kind: 'merch',
        merchClaim: claimed,
      });
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
      merchItems, merchTotal, discountCode, discountCodes, ageConfirmed,
    } = req.body;

    if (!fullName || !email || !phone || !userType || ticketQuantity === undefined || ticketQuantity === null) {
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
    const normalizedAgeConfirmed = ageConfirmed === true || String(ageConfirmed).toLowerCase() === 'true';

    if (!normalizedFullName) {
      res.status(400).json({ error: 'Invalid buyer full name' });
      return;
    }
    if (!normalizedAgeConfirmed) {
      res.status(400).json({ error: 'Please confirm that you are at least 18 years old' });
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Invalid buyer email' });
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      res.status(400).json({ error: 'Invalid buyer phone number' });
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

    const normalizedTicketQuantity = Math.min(MAX_TICKETS_PER_ORDER, Math.max(0, Math.floor(Number(ticketQuantity) || 0)));
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
    const normalizedDiscountCodes = normalizeDiscountCodeList(discountCodes ?? discountCode);
    const discountValidation = await validateDiscountCodeList(normalizedDiscountCodes);
    if (normalizedDiscountCodes.length > 0 && !discountValidation.valid) {
      res.status(400).json({ error: discountValidation.message || 'Invalid discount code' });
      return;
    }
    const ticketDiscountResult = calculateTicketDiscountWithCodes(ticketSubtotal, ticketBulkDiscount, discountValidation.discounts);
    const merchBulkDiscount = calculateMerchBundleDiscount(config, normalizedMerchTotal, normalizedTicketQuantity);
    const totalAmount = Math.max(0, subtotal + serviceFee - ticketDiscountResult.ticketDiscount - merchBulkDiscount);

    if (normalizedTicketQuantity < 1 && normalizedMerchTotal < 1) {
      res.status(400).json({ error: 'Please select at least one ticket or one merch item' });
      return;
    }

    const merchLimitError = await getMerchLimitError(config, normalizedMerchItems);
    if (merchLimitError) {
      res.status(409).json({ error: merchLimitError });
      return;
    }

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
      const merchClaims: MerchClaimRow[] = hasMerchOrder(normalizedMerchItems, normalizedMerchTotal)
        ? [{
            merchClaimCode: generateMerchClaimCode(),
            orderId,
            buyerName: normalizedFullName,
            email: normalizedEmail,
            phone: normalizedPhone,
            merchItems: normalizedMerchItems,
            claimedAt: '',
            claimedBy: '',
          }]
        : [];

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
        ticketDiscount: ticketDiscountResult.ticketDiscount,
        merchBulkDiscount,
        discountCode: ticketDiscountResult.discountCodes.join(', '),
        appliedDiscounts: ticketDiscountResult.appliedDiscounts.map(discount => ({
          code: discount.code,
          name: discount.name,
          type: discount.type,
          rate: discount.rate,
        })),
        paymentMethod: 'payos',
      };

      storePendingOrder(orderCode, orderData, ticketItems, merchClaims, orderId, statusKey);

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
      discountCode: ticketDiscountResult.discountCodes.join(', '),
      discountAmount: String(ticketDiscountResult.ticketDiscount + merchBulkDiscount),
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
    const merchClaims: MerchClaimRow[] = hasMerchOrder(normalizedMerchItems, normalizedMerchTotal)
      ? [{
          merchClaimCode: generateMerchClaimCode(),
          orderId: record.id,
          buyerName: normalizedFullName,
          email: normalizedEmail,
          phone: normalizedPhone,
          merchItems: normalizedMerchItems,
          claimedAt: '',
          claimedBy: '',
        }]
      : [];

    const sheetOk = await appendTicketRow(record);

    const itemSheetOk = await appendTicketItemRows(ticketItems);
    const merchSheetOk = await appendMerchClaimRows(merchClaims);

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

    if (merchClaims.length > 0 && !merchSheetOk) {
      await saveMerchClaimsCSV(merchClaims);
      console.log('[CSV] Merch claim saved locally:', merchClaims[0].merchClaimCode);
    }

    await recordDiscountCodeUsage({
      orderId: record.id,
      timestamp: record.timestamp,
      buyerName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      ticketQuantity: String(normalizedTicketQuantity),
      ticketSubtotal,
      ticketBulkDiscount,
      discountResult: ticketDiscountResult,
    });

    const emailResult = await sendTicketEmail({
      to: normalizedEmail,
      buyerName: normalizedFullName,
      orderId: record.id,
      totalAmount: record.totalAmount,
      paymentMethod: record.paymentMethod,
      ticketItems,
      merchItems: normalizedMerchItems,
      merchClaims,
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

// POST /api/admin/manual-ticket - Create ticket manually (admin override, no PayOS)
app.post('/api/admin/manual-ticket', requireAdmin, async (req, res) => {
  try {
    const {
      fullName, email, phone, userType, userCategory,
      studentId, workplace, upcomingStudent, applicationId,
      ticketQuantity, merchItems, merchTotal,
      skipEmail, customPaymentMethod,
    } = req.body;

    if (!fullName || !email || !phone || !userType || ticketQuantity === undefined || ticketQuantity === null) {
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

    if (!normalizedFullName) {
      res.status(400).json({ error: 'Invalid buyer full name' });
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Invalid buyer email' });
      return;
    }
    if (!isValidPhone(normalizedPhone)) {
      res.status(400).json({ error: 'Invalid buyer phone number' });
      return;
    }
    if (!['vinnunian', 'non-vinnunian'].includes(normalizedUserType)) {
      res.status(400).json({ error: 'Invalid ticket type' });
      return;
    }

    const config = await readConfig();
    const normalizedTicketQuantity = Math.min(MAX_TICKETS_PER_ORDER, Math.max(0, Math.floor(Number(ticketQuantity) || 0)));
    const normalizedTicketPrice = normalizedUserType === 'vinnunian'
      ? (config.earlyBirdEnabled ? config.prices.earlyBird : config.prices.vinnunian)
      : config.prices.guest;
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

    if (normalizedTicketQuantity < 1 && normalizedMerchTotal < 1) {
      res.status(400).json({ error: 'Please select at least one ticket or one merch item' });
      return;
    }

    const paymentMethod = cleanText(customPaymentMethod, 40) || 'manual';
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
      ticketPrice: String(normalizedTicketPrice),
      merchItems: normalizedMerchItems,
      discountCode: '',
      discountAmount: String(ticketBulkDiscount + merchBulkDiscount),
      totalAmount: String(totalAmount),
      paymentMethod,
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
    const merchClaims: MerchClaimRow[] = hasMerchOrder(normalizedMerchItems, normalizedMerchTotal)
      ? [{
          merchClaimCode: generateMerchClaimCode(),
          orderId: record.id,
          buyerName: normalizedFullName,
          email: normalizedEmail,
          phone: normalizedPhone,
          merchItems: normalizedMerchItems,
          claimedAt: '',
          claimedBy: '',
        }]
      : [];

    const sheetOk = await appendTicketRow(record);
    const itemSheetOk = await appendTicketItemRows(ticketItems);
    const merchSheetOk = await appendMerchClaimRows(merchClaims);

    if (!sheetOk) {
      await saveTicketCSV({
        ...record,
        ticketQuantity: Number(record.ticketQuantity),
        ticketPrice: Number(record.ticketPrice),
        discountAmount: Number(record.discountAmount),
        totalAmount: Number(record.totalAmount),
      } as any);
      console.log('[CSV] Manual ticket saved locally:', record.id);
    }
    if (!itemSheetOk) {
      await saveTicketItemsCSV(ticketItems);
      console.log('[CSV] Manual ticket items saved locally:', ticketItems.length);
    }
    if (merchClaims.length > 0 && !merchSheetOk) {
      await saveMerchClaimsCSV(merchClaims);
      console.log('[CSV] Manual merch claim saved locally:', merchClaims[0].merchClaimCode);
    }

    let emailResult;
    if (!skipEmail) {
      emailResult = await sendTicketEmail({
        to: normalizedEmail,
        buyerName: normalizedFullName,
        orderId: record.id,
        totalAmount: record.totalAmount,
        paymentMethod: record.paymentMethod,
        ticketItems,
        merchItems: normalizedMerchItems,
        merchClaims,
      });
      if (!emailResult.sent) {
        console.log('[Email] Manual ticket email not sent:', emailResult.error || 'not configured');
      } else {
        console.log('[Email] Manual ticket email sent:', normalizedEmail, emailResult.messageId || '');
      }
    } else {
      emailResult = { configured: false, sent: false, error: 'Skipped by admin' };
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
    console.error('[Admin] Error creating manual ticket:', err);
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

    const processed = await processPaidPayOSOrder(orderCode, 'webhook');
    if (processed.alreadyProcessing) {
      res.status(202).json({ success: true, message: 'Order is already being processed' });
      return;
    }
    if (!processed.result) {
      res.status(500).json({ error: 'Unable to process order' });
      return;
    }

    res.status(200).json({ success: true, message: 'Payment processed', ...processed.result });
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

    const processed = await processPaidPayOSOrder(orderCode, 'status check');
    if (processed.alreadyProcessing) {
      res.json({ status: 'processing' });
      return;
    }
    if (!processed.result) {
      res.status(500).json({ error: 'Unable to process payment' });
      return;
    }

    res.json({ status: 'paid', ...processed.result });
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

// ─────── PayOS Auto-Recovery ───────
// Every 5 minutes, check pending orders against PayOS and auto-process paid ones
// This catches webhooks missed during server restart/deploy

async function runPayOSRecovery() {
  if (!isPayOSConfigured()) return;

  try {
    const result = await recoverPaidOrders(async (orderCode, pending) => {
      await processPaidPayOSOrder(orderCode, 'recovery');
    });

    if (result.checked > 0) {
      console.log(`[PayOS Recovery] Checked ${result.checked} pending, recovered ${result.recovered}`);
    }

    const emailRetryOrders = getPaidOrdersNeedingEmail();
    for (const { orderCode, order } of emailRetryOrders) {
      await resendPayOSOrderEmail(orderCode, order, 'email retry');
      await new Promise(r => setTimeout(r, 200));
    }
    if (emailRetryOrders.length > 0) {
      console.log(`[PayOS Recovery] Retried ${emailRetryOrders.length} paid order emails`);
    }
  } catch (err) {
    console.error('[PayOS Recovery] Error:', err);
  }
}

const PAYOS_RECOVERY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

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
    console.log('[Server] â  Google Sheets not configured. Using CSV fallback.');
    console.log('[Server] To enable Sheets: set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY in .env');
  }
  if (!process.env.PAYOS_CLIENT_ID) {
    console.log('[Server] â  PayOS not configured. PayOS payment disabled.');
    console.log('[Server] To enable PayOS: set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env');
  } else {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    confirmWebhook(appUrl);

    // Start auto-recovery: run immediately, then every 5 minutes
    console.log(`[PayOS Recovery] Auto-recovery enabled (every ${PAYOS_RECOVERY_INTERVAL_MS / 60000} min)`);
    runPayOSRecovery();
    setInterval(runPayOSRecovery, PAYOS_RECOVERY_INTERVAL_MS);
  }
});
