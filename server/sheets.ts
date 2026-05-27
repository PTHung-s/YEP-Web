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
  'Mã vé',
  'Ngày giờ',
  'Họ và tên',
  'Email',
  'Số điện thoại',
  'Loại người dùng',
  'Phân loại',
  'MSSV',
  'Nơi ở / Công tác',
  'Upcoming Student',
  'Application ID',
  'SL Vé',
  'Đơn giá vé (VND)',
  'Merch đã mua',
  'Mã giảm giá',
  'Tiền giảm (VND)',
  'Tổng tiền (VND)',
  'Phương thức TT',
];

const REG_HEADERS = [
  'Mã đăng ký',
  'Ngày giờ',
  'Họ và tên',
  'Email',
  'Số điện thoại',
  'Mô tả / Ghi chú',
];

const TICKET_ITEM_HEADERS = [
  'Ticket Code',
  'Order ID',
  'NgĂ y giá»',
  'Há» vĂ  tĂªn',
  'Email',
  'Sá»‘ Ä‘iá»‡n thoáº¡i',
  'Loáº¡i vĂ©',
  'Ticket No',
  'Tổng vé trong order',
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

interface TicketRow {
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
