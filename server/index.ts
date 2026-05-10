import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { appendTicketRow, appendRegistrationRow, getSheetSummary } from './sheets';
import { saveTicketCSV, saveRegistrationCSV, getTicketsCSV } from './csv-fallback';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// POST /api/tickets - Save a ticket purchase
app.post('/api/tickets', async (req, res) => {
  try {
    const {
      fullName, email, phone, userType, userCategory,
      studentId, workplace, ticketQuantity, ticketPrice,
      merchItems, discountCode, discountAmount, totalAmount,
      paymentMethod,
    } = req.body;

    if (!fullName || !email || !phone || !userType || !ticketQuantity) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

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
      ticketQuantity: String(ticketQuantity),
      ticketPrice: String(ticketPrice),
      merchItems: typeof merchItems === 'string' ? merchItems : JSON.stringify(merchItems || []),
      discountCode: discountCode || '',
      discountAmount: String(discountAmount || 0),
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
app.get('/api/admin/summary', async (_req, res) => {
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
app.get('/api/admin/tickets', async (_req, res) => {
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
