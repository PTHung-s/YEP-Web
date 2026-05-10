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

const TICKETS_CSV = path.join(DATA_DIR, 'tickets.csv');
const REGISTRATIONS_CSV = path.join(DATA_DIR, 'registrations.csv');

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
