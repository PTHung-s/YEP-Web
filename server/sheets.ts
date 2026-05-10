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

async function ensureHeaders(sheetName: string, headers: string[]): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  try {
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
          row.userType === 'vinnunian' ? 'Vinnunian' : 'Non-Vinnunian',
          row.userCategory || '',
          row.studentId || '',
          row.workplace || '',
          row.ticketQuantity,
          row.ticketPrice,
          row.merchItems,
          row.discountCode || '',
          row.discountAmount,
          row.totalAmount,
          row.paymentMethod === 'credit' ? 'Thẻ tín dụng' : 'Chuyển khoản',
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
