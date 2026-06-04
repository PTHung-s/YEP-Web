import { google, sheets_v4 } from 'googleapis';

let sheetsClient: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets | null {
  if (sheetsClient) return sheetsClient;

  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    console.log('[Sheets] Google Sheets credentials not configured. Using CSV fallback.');
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('[Sheets] Google Sheets client initialized.');
    return sheetsClient;
  } catch (err) {
    console.error('[Sheets] Failed to initialize Google Sheets client:', err);
    return null;
  }
}

export function getSpreadsheetId(): string {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';
}

function formatTimestampVN(): string {
  const now = new Date();
  return now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

const TICKET_HEADERS = [
  'Order ID',
  'Timestamp',
  'Full Name',
  'Email',
  'Phone',
  'User Type',
  'User Category',
  'Student ID',
  'Workplace',
  'Upcoming Student',
  'Application ID',
  'Ticket Quantity',
  'Ticket Price (VND)',
  'Merch Items',
  'Discount Code',
  'Discount Amount (VND)',
  'Total Amount (VND)',
  'Payment Method',
];

const REG_HEADERS = [
  'Registration ID',
  'Timestamp',
  'Full Name',
  'Email',
  'Phone',
  'Description / Notes',
];

const TICKET_ITEM_HEADERS = [
  'Ticket Code',
  'Order ID',
  'Timestamp',
  'Buyer Name',
  'Email',
  'Phone',
  'Ticket Type',
  'Ticket No',
  'Order Ticket Quantity',
];
const CHECKIN_HEADERS = [
  'Ticket Code',
  'Order ID',
  'Buyer Name',
  'Email',
  'Phone',
  'Ticket Type',
  'Checked In At',
  'Checked In By',
];

const MERCH_CLAIM_HEADERS = [
  'Merch Claim Code',
  'Order ID',
  'Buyer Name',
  'Email',
  'Phone',
  'Merch Items',
  'Claimed At',
  'Claimed By',
];

const DISCOUNT_CODE_HEADERS = [
  'Code',
  'Name',
  'Type',
  'Rate',
  'Max Uses',
  'Used Count',
  'Active',
  'Owner',
  'Notes',
  'Created At',
  'Last Used At',
];

async function ensureHeaders(sheetName: string, headers: string[]): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = (meta.data.sheets || []).some(sheet => sheet.properties?.title === sheetName);
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      console.log(`[Sheets] Sheet created: "${sheetName}"`);
    }

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });

    if (!existing.data.values || existing.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
      console.log(`[Sheets] Headers created for "${sheetName}"`);
    } else if ((existing.data.values[0] || []).length < headers.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
      console.log(`[Sheets] Headers updated for "${sheetName}"`);
    }
  } catch (err) {
    console.error(`[Sheets] Failed to ensure headers for "${sheetName}":`, err);
  }
}

export interface TicketRow {
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
}

export async function appendTicketRow(row: TicketRow): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return false;

  try {
    await ensureHeaders('Tickets', TICKET_HEADERS);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Tickets!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          row.id,
          row.timestamp,
          row.fullName,
          row.email,
          row.phone,
          row.userType === 'vinnunian' ? 'VinUnian' : 'Non-VinUnian',
          row.userCategory || '',
          row.studentId || '',
          row.workplace || '',
          row.upcomingStudent ? 'Yes' : '',
          row.applicationId || '',
          row.ticketQuantity,
          row.ticketPrice,
          row.merchItems,
          row.discountCode || '',
          row.discountAmount,
          row.totalAmount,
          row.paymentMethod === 'credit' ? 'Thẻ tín dụng' : row.paymentMethod === 'payos' ? 'PayOS' : 'Chuyển khoản',
        ]],
      },
    });
    console.log('[Sheets] Ticket appended:', row.id);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to append ticket:', err);
    return false;
  }
}

export async function getTicketRows(): Promise<TicketRow[] | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('Tickets', TICKET_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Tickets!A2:R',
    });

    return (res.data.values || []).map(row => ({
      id: String(row[0] || ''),
      timestamp: String(row[1] || ''),
      fullName: String(row[2] || ''),
      email: String(row[3] || ''),
      phone: String(row[4] || ''),
      userType: String(row[5] || ''),
      userCategory: String(row[6] || ''),
      studentId: String(row[7] || ''),
      workplace: String(row[8] || ''),
      upcomingStudent: String(row[9] || '').toLowerCase() === 'yes',
      applicationId: String(row[10] || ''),
      ticketQuantity: String(row[11] || ''),
      ticketPrice: String(row[12] || ''),
      merchItems: String(row[13] || ''),
      discountCode: String(row[14] || ''),
      discountAmount: String(row[15] || ''),
      totalAmount: String(row[16] || ''),
      paymentMethod: String(row[17] || ''),
    }));
  } catch (err) {
    console.error('[Sheets] Failed to get ticket rows:', err);
    return null;
  }
}

export interface DiscountCodeRow {
  code: string;
  name: string;
  type: 'GAME_5' | 'GAME_10' | 'VIP_20' | 'KPI' | 'REFERRAL';
  rate: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  owner: string;
  notes: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface DiscountCodeLookupResult {
  row: DiscountCodeRow;
  rowNumber: number;
}

function parseDiscountType(value: unknown): DiscountCodeRow['type'] {
  const type = String(value || '').trim().toUpperCase();
  if (['GAME_5', 'GAME_10', 'VIP_20', 'KPI', 'REFERRAL'].includes(type)) {
    return type as DiscountCodeRow['type'];
  }
  return 'REFERRAL';
}

function parseBoolean(value: unknown): boolean {
  const text = String(value || '').trim().toLowerCase();
  return ['true', 'yes', '1', 'active'].includes(text);
}

function normalizeDiscountRow(row: any[]): DiscountCodeRow {
  return {
    code: String(row[0] || '').trim().toUpperCase(),
    name: String(row[1] || '').trim(),
    type: parseDiscountType(row[2]),
    rate: Number(row[3]) || 0,
    maxUses: Number(row[4]) || 0,
    usedCount: Number(row[5]) || 0,
    active: parseBoolean(row[6]),
    owner: String(row[7] || '').trim(),
    notes: String(row[8] || '').trim(),
    createdAt: String(row[9] || '').trim(),
    lastUsedAt: String(row[10] || '').trim(),
  };
}

export async function getDiscountCodeRows(): Promise<DiscountCodeRow[] | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('DiscountCodes', DISCOUNT_CODE_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DiscountCodes!A2:K',
    });

    return (res.data.values || [])
      .map(normalizeDiscountRow)
      .filter(row => row.code);
  } catch (err) {
    console.error('[Sheets] Failed to get discount codes:', err);
    return null;
  }
}

export async function findDiscountCode(code: string): Promise<DiscountCodeLookupResult | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('DiscountCodes', DISCOUNT_CODE_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'DiscountCodes!A2:K',
    });
    const normalizedCode = code.trim().toUpperCase();
    const rows = res.data.values || [];
    const index = rows.findIndex(row => String(row[0] || '').trim().toUpperCase() === normalizedCode);
    if (index < 0) return null;

    return {
      row: normalizeDiscountRow(rows[index]),
      rowNumber: index + 2,
    };
  } catch (err) {
    console.error('[Sheets] Failed to find discount code:', err);
    return null;
  }
}

export async function appendDiscountCodeRows(rows: DiscountCodeRow[]): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId || rows.length === 0) return false;

  try {
    await ensureHeaders('DiscountCodes', DISCOUNT_CODE_HEADERS);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'DiscountCodes!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows.map(row => [
          row.code,
          row.name,
          row.type,
          row.rate,
          row.maxUses,
          row.usedCount,
          row.active ? 'TRUE' : 'FALSE',
          row.owner,
          row.notes,
          row.createdAt,
          row.lastUsedAt,
        ]),
      },
    });
    console.log('[Sheets] Discount codes appended:', rows.length);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to append discount codes:', err);
    return false;
  }
}

export async function incrementDiscountCodeUsage(code: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return false;

  try {
    const found = await findDiscountCode(code);
    if (!found) return false;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `DiscountCodes!F${found.rowNumber}:K${found.rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          found.row.usedCount + 1,
          found.row.active ? 'TRUE' : 'FALSE',
          found.row.owner,
          found.row.notes,
          found.row.createdAt,
          formatTimestampVN(),
        ]],
      },
    });
    console.log('[Sheets] Discount code usage updated:', code);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to update discount code usage:', err);
    return false;
  }
}

interface RegistrationRow {
  id: string;
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  description: string;
}

export interface TicketItemRow {
  ticketCode: string;
  orderId: string;
  timestamp: string;
  buyerName: string;
  email: string;
  phone: string;
  ticketType: string;
  ticketNo: string;
  orderTicketQuantity: string;
}

export interface CheckinRow {
  ticketCode: string;
  orderId: string;
  buyerName: string;
  email: string;
  phone: string;
  ticketType: string;
  checkedInAt: string;
  checkedInBy: string;
}

export interface MerchClaimRow {
  merchClaimCode: string;
  orderId: string;
  buyerName: string;
  email: string;
  phone: string;
  merchItems: string;
  claimedAt: string;
  claimedBy: string;
}

export async function appendRegistrationRow(row: RegistrationRow): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return false;

  try {
    await ensureHeaders('Registrations', REG_HEADERS);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Registrations!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[row.id, row.timestamp, row.fullName, row.email, row.phone, row.description]],
      },
    });
    console.log('[Sheets] Registration appended:', row.id);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to append registration:', err);
    return false;
  }
}

export async function appendTicketItemRows(rows: TicketItemRow[]): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId || rows.length === 0) return false;

  try {
    await ensureHeaders('TicketItems', TICKET_ITEM_HEADERS);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'TicketItems!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows.map(row => [
          row.ticketCode,
          row.orderId,
          row.timestamp,
          row.buyerName,
          row.email,
          row.phone,
          row.ticketType,
          row.ticketNo,
          row.orderTicketQuantity,
        ]),
      },
    });
    console.log('[Sheets] Ticket items appended:', rows.length);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to append ticket items:', err);
    return false;
  }
}

export async function appendMerchClaimRows(rows: MerchClaimRow[]): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId || rows.length === 0) return false;

  try {
    await ensureHeaders('MerchClaims', MERCH_CLAIM_HEADERS);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'MerchClaims!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows.map(row => [
          row.merchClaimCode,
          row.orderId,
          row.buyerName,
          row.email,
          row.phone,
          row.merchItems,
          row.claimedAt,
          row.claimedBy,
        ]),
      },
    });
    console.log('[Sheets] Merch claims appended:', rows.length);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to append merch claims:', err);
    return false;
  }
}

export async function findTicketItemByCode(ticketCode: string): Promise<TicketItemRow | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('TicketItems', TICKET_ITEM_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'TicketItems!A2:I',
    });

    const normalized = ticketCode.trim().toUpperCase();
    const row = (res.data.values || []).find(item => String(item[0] || '').trim().toUpperCase() === normalized);
    if (!row) return null;

    return {
      ticketCode: String(row[0] || ''),
      orderId: String(row[1] || ''),
      timestamp: String(row[2] || ''),
      buyerName: String(row[3] || ''),
      email: String(row[4] || ''),
      phone: String(row[5] || ''),
      ticketType: String(row[6] || ''),
      ticketNo: String(row[7] || ''),
      orderTicketQuantity: String(row[8] || ''),
    };
  } catch (err) {
    console.error('[Sheets] Failed to find ticket item:', err);
    return null;
  }
}

export async function findMerchClaimByCode(merchClaimCode: string): Promise<MerchClaimRow | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('MerchClaims', MERCH_CLAIM_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MerchClaims!A2:H',
    });

    const normalized = merchClaimCode.trim().toUpperCase();
    const row = (res.data.values || []).find(item => String(item[0] || '').trim().toUpperCase() === normalized);
    if (!row) return null;

    return {
      merchClaimCode: String(row[0] || ''),
      orderId: String(row[1] || ''),
      buyerName: String(row[2] || ''),
      email: String(row[3] || ''),
      phone: String(row[4] || ''),
      merchItems: String(row[5] || ''),
      claimedAt: String(row[6] || ''),
      claimedBy: String(row[7] || ''),
    };
  } catch (err) {
    console.error('[Sheets] Failed to find merch claim:', err);
    return null;
  }
}

export async function markMerchClaimedByCode(merchClaimCode: string, claimedAt: string, claimedBy: string): Promise<MerchClaimRow | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('MerchClaims', MERCH_CLAIM_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'MerchClaims!A2:H',
    });

    const normalized = merchClaimCode.trim().toUpperCase();
    const rows = res.data.values || [];
    const index = rows.findIndex(item => String(item[0] || '').trim().toUpperCase() === normalized);
    if (index < 0) return null;

    const row = rows[index];
    if (String(row[6] || '').trim()) {
      return {
        merchClaimCode: String(row[0] || ''),
        orderId: String(row[1] || ''),
        buyerName: String(row[2] || ''),
        email: String(row[3] || ''),
        phone: String(row[4] || ''),
        merchItems: String(row[5] || ''),
        claimedAt: String(row[6] || ''),
        claimedBy: String(row[7] || ''),
      };
    }

    const sheetRowNumber = index + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `MerchClaims!G${sheetRowNumber}:H${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[claimedAt, claimedBy]] },
    });

    return {
      merchClaimCode: String(row[0] || ''),
      orderId: String(row[1] || ''),
      buyerName: String(row[2] || ''),
      email: String(row[3] || ''),
      phone: String(row[4] || ''),
      merchItems: String(row[5] || ''),
      claimedAt,
      claimedBy,
    };
  } catch (err) {
    console.error('[Sheets] Failed to mark merch claimed:', err);
    return null;
  }
}

export async function findCheckinByCode(ticketCode: string): Promise<CheckinRow | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('Checked-in', CHECKIN_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Checked-in!A2:H',
    });

    const normalized = ticketCode.trim().toUpperCase();
    const row = (res.data.values || []).find(item => String(item[0] || '').trim().toUpperCase() === normalized);
    if (!row) return null;

    return {
      ticketCode: String(row[0] || ''),
      orderId: String(row[1] || ''),
      buyerName: String(row[2] || ''),
      email: String(row[3] || ''),
      phone: String(row[4] || ''),
      ticketType: String(row[5] || ''),
      checkedInAt: String(row[6] || ''),
      checkedInBy: String(row[7] || ''),
    };
  } catch (err) {
    console.error('[Sheets] Failed to find check-in:', err);
    return null;
  }
}

export async function getRecentCheckins(limit = 20): Promise<CheckinRow[] | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    await ensureHeaders('Checked-in', CHECKIN_HEADERS);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Checked-in!A2:H',
    });

    return (res.data.values || [])
      .slice(-limit)
      .reverse()
      .map(row => ({
        ticketCode: String(row[0] || ''),
        orderId: String(row[1] || ''),
        buyerName: String(row[2] || ''),
        email: String(row[3] || ''),
        phone: String(row[4] || ''),
        ticketType: String(row[5] || ''),
        checkedInAt: String(row[6] || ''),
        checkedInBy: String(row[7] || ''),
      }));
  } catch (err) {
    console.error('[Sheets] Failed to get recent check-ins:', err);
    return null;
  }
}

export async function appendCheckinRow(row: CheckinRow): Promise<boolean> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return false;

  try {
    await ensureHeaders('Checked-in', CHECKIN_HEADERS);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Checked-in!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          row.ticketCode,
          row.orderId,
          row.buyerName,
          row.email,
          row.phone,
          row.ticketType,
          row.checkedInAt,
          row.checkedInBy,
        ]],
      },
    });
    console.log('[Sheets] Check-in appended:', row.ticketCode);
    return true;
  } catch (err) {
    console.error('[Sheets] Failed to append check-in:', err);
    return false;
  }
}

export async function getSheetSummary(): Promise<{ ticketCount: number; registrationCount: number } | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  if (!sheets || !spreadsheetId) return null;

  try {
    const [ticketsRes, regsRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Tickets!A:A' }),
      sheets.spreadsheets.values.get({ spreadsheetId, range: 'Registrations!A:A' }),
    ]);

    return {
      ticketCount: Math.max(0, (ticketsRes.data.values?.length || 1) - 1),
      registrationCount: Math.max(0, (regsRes.data.values?.length || 1) - 1),
    };
  } catch (err) {
    console.error('[Sheets] Failed to get summary:', err);
    return null;
  }
}
