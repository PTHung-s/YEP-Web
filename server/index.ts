import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { appendTicketRow, appendRegistrationRow, getSheetSummary } from './sheets';
import { saveTicketCSV, saveRegistrationCSV, getTicketsCSV } from './csv-fallback';
import {
  calculateMerchBundleDiscount,
  calculateServiceFee,
  calculateTicketBulkDiscount,
  getTicketPriceForUser,
  readConfig,
  writeConfig,
} from './config';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

const adminTokens = new Set<string>();

function generateId(): string {
  return 'YEP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
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

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.header('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !adminTokens.has(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
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

  const token = crypto.randomBytes(24).toString('hex');
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

    const sheetOk = await appendTicketRow(record);

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

    res.status(201).json({
      success: true,
      ticketId: record.id,
      storedIn: sheetOk ? 'sheets' : 'csv',
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
