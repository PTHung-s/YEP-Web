import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

const DATA_DIR = path.resolve('server', 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface TicketRecord {
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
  ticketQuantity: number;
  ticketPrice: number;
  merchItems: string;
  discountCode: string;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
}

interface RegistrationRecord {
  id: string;
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  description: string;
}

export interface TicketItemRecord {
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

export interface CheckinRecord {
  ticketCode: string;
  orderId: string;
  buyerName: string;
  email: string;
  phone: string;
  ticketType: string;
  checkedInAt: string;
  checkedInBy: string;
}

const TICKETS_CSV = path.join(DATA_DIR, 'tickets.csv');
const REGISTRATIONS_CSV = path.join(DATA_DIR, 'registrations.csv');
const TICKET_ITEMS_CSV = path.join(DATA_DIR, 'ticket-items.csv');
const CHECKINS_CSV = path.join(DATA_DIR, 'checked-in.csv');

const ticketHeaders = [
  { id: 'id', title: 'ID' },
  { id: 'timestamp', title: 'Timestamp' },
  { id: 'fullName', title: 'Full Name' },
  { id: 'email', title: 'Email' },
  { id: 'phone', title: 'Phone' },
  { id: 'userType', title: 'User Type' },
  { id: 'userCategory', title: 'Category' },
  { id: 'studentId', title: 'Student ID' },
  { id: 'workplace', title: 'Workplace' },
  { id: 'upcomingStudent', title: 'Upcoming Student' },
  { id: 'applicationId', title: 'Application ID' },
  { id: 'ticketQuantity', title: 'Ticket Qty' },
  { id: 'ticketPrice', title: 'Ticket Price' },
  { id: 'merchItems', title: 'Merch' },
  { id: 'discountCode', title: 'Discount Code' },
  { id: 'discountAmount', title: 'Discount' },
  { id: 'totalAmount', title: 'Total' },
  { id: 'paymentMethod', title: 'Payment' },
];

const registrationHeaders = [
  { id: 'id', title: 'ID' },
  { id: 'timestamp', title: 'Timestamp' },
  { id: 'fullName', title: 'Full Name' },
  { id: 'email', title: 'Email' },
  { id: 'phone', title: 'Phone' },
  { id: 'description', title: 'Description' },
];

const ticketItemHeaders = [
  { id: 'ticketCode', title: 'Ticket Code' },
  { id: 'orderId', title: 'Order ID' },
  { id: 'timestamp', title: 'Timestamp' },
  { id: 'buyerName', title: 'Buyer Name' },
  { id: 'email', title: 'Email' },
  { id: 'phone', title: 'Phone' },
  { id: 'ticketType', title: 'Ticket Type' },
  { id: 'ticketNo', title: 'Ticket No' },
  { id: 'orderTicketQuantity', title: 'Order Ticket Qty' },
];

const checkinHeaders = [
  { id: 'ticketCode', title: 'Ticket Code' },
  { id: 'orderId', title: 'Order ID' },
  { id: 'buyerName', title: 'Buyer Name' },
  { id: 'email', title: 'Email' },
  { id: 'phone', title: 'Phone' },
  { id: 'ticketType', title: 'Ticket Type' },
  { id: 'checkedInAt', title: 'Checked In At' },
  { id: 'checkedInBy', title: 'Checked In By' },
];

const ticketCsvWriter = createObjectCsvWriter({
  path: TICKETS_CSV,
  header: ticketHeaders,
  append: true,
});

const registrationCsvWriter = createObjectCsvWriter({
  path: REGISTRATIONS_CSV,
  header: registrationHeaders,
  append: true,
});

const ticketItemCsvWriter = createObjectCsvWriter({
  path: TICKET_ITEMS_CSV,
  header: ticketItemHeaders,
  append: true,
});

const checkinCsvWriter = createObjectCsvWriter({
  path: CHECKINS_CSV,
  header: checkinHeaders,
  append: true,
});

function isFirstWrite(filePath: string): boolean {
  return !fs.existsSync(filePath);
}

async function writeHeaderIfNeeded(filePath: string, headers: { id: string; title: string }[]) {
  if (isFirstWrite(filePath)) {
    const header = headers.map(h => h.title).join(',') + '\n';
    fs.writeFileSync(filePath, header, 'utf-8');
  }
}

export async function saveTicketCSV(data: TicketRecord): Promise<void> {
  ensureDir();
  await writeHeaderIfNeeded(TICKETS_CSV, ticketHeaders);
  await ticketCsvWriter.writeRecords([data]);
}

export async function saveRegistrationCSV(data: RegistrationRecord): Promise<void> {
  ensureDir();
  await writeHeaderIfNeeded(REGISTRATIONS_CSV, registrationHeaders);
  await registrationCsvWriter.writeRecords([data]);
}

export async function saveTicketItemsCSV(data: TicketItemRecord[]): Promise<void> {
  ensureDir();
  if (data.length === 0) return;
  await writeHeaderIfNeeded(TICKET_ITEMS_CSV, ticketItemHeaders);
  await ticketItemCsvWriter.writeRecords(data);
}

export async function saveCheckinCSV(data: CheckinRecord): Promise<void> {
  ensureDir();
  await writeHeaderIfNeeded(CHECKINS_CSV, checkinHeaders);
  await checkinCsvWriter.writeRecords([data]);
}

export async function getTicketsCSV(): Promise<TicketRecord[]> {
  ensureDir();
  if (!fs.existsSync(TICKETS_CSV)) return [];
  const { default: csvParser } = await import('csv-parser');
  return new Promise((resolve, reject) => {
    const results: TicketRecord[] = [];
    fs.createReadStream(TICKETS_CSV)
      .pipe(csvParser())
      .on('data', (data) => results.push(data as TicketRecord))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function readCsv<T>(filePath: string): Promise<T[]> {
  ensureDir();
  if (!fs.existsSync(filePath)) return [];
  const { default: csvParser } = await import('csv-parser');
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data as T))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

export async function getTicketItemsCSV(): Promise<TicketItemRecord[]> {
  const rows = await readCsv<any>(TICKET_ITEMS_CSV);
  return rows.map(row => ({
    ticketCode: row.ticketCode || row['Ticket Code'] || '',
    orderId: row.orderId || row['Order ID'] || '',
    timestamp: row.timestamp || row.Timestamp || '',
    buyerName: row.buyerName || row['Buyer Name'] || '',
    email: row.email || row.Email || '',
    phone: row.phone || row.Phone || '',
    ticketType: row.ticketType || row['Ticket Type'] || '',
    ticketNo: row.ticketNo || row['Ticket No'] || '',
    orderTicketQuantity: row.orderTicketQuantity || row['Order Ticket Qty'] || '',
  }));
}

export async function getCheckinsCSV(): Promise<CheckinRecord[]> {
  const rows = await readCsv<any>(CHECKINS_CSV);
  return rows.map(row => ({
    ticketCode: row.ticketCode || row['Ticket Code'] || '',
    orderId: row.orderId || row['Order ID'] || '',
    buyerName: row.buyerName || row['Buyer Name'] || '',
    email: row.email || row.Email || '',
    phone: row.phone || row.Phone || '',
    ticketType: row.ticketType || row['Ticket Type'] || '',
    checkedInAt: row.checkedInAt || row['Checked In At'] || '',
    checkedInBy: row.checkedInBy || row['Checked In By'] || '',
  }));
}

export async function findTicketItemCSV(ticketCode: string): Promise<TicketItemRecord | null> {
  const normalized = ticketCode.trim().toUpperCase();
  const items = await getTicketItemsCSV();
  return items.find(item => String(item.ticketCode || '').trim().toUpperCase() === normalized) || null;
}

export async function findCheckinCSV(ticketCode: string): Promise<CheckinRecord | null> {
  const normalized = ticketCode.trim().toUpperCase();
  const checkins = await getCheckinsCSV();
  return checkins.find(item => String(item.ticketCode || '').trim().toUpperCase() === normalized) || null;
}
