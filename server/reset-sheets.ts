import 'dotenv/config';
import { google } from 'googleapis';

const {
  GOOGLE_SHEETS_SPREADSHEET_ID,
  GOOGLE_SHEETS_CLIENT_EMAIL,
  GOOGLE_SHEETS_PRIVATE_KEY,
} = process.env;

async function resetSheets() {
  const auth = new google.auth.JWT({
    email: GOOGLE_SHEETS_CLIENT_EMAIL,
    key: GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const sid = GOOGLE_SHEETS_SPREADSHEET_ID!;

  // Get all sheets in the spreadsheet
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sid });
  const existingSheets = meta.data.sheets || [];
  console.log('Existing sheets:', existingSheets.map(s => s.properties?.title).join(', '));

  // Clear all sheets first
  for (const s of existingSheets) {
    const title = s.properties?.title || '';
    console.log(`Clearing "${title}"...`);
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sid,
      range: `${title}!A:Z`,
    });
  }

  // Ensure "Tickets" sheet exists (rename first sheet if needed)
  let ticketsSheetId = existingSheets.find(s => s.properties?.title === 'Tickets')?.properties?.sheetId;
  if (!ticketsSheetId) {
    // Rename first sheet to "Tickets"
    const firstId = existingSheets[0]?.properties?.sheetId;
    if (firstId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sid,
        requestBody: {
          requests: [{
            updateSheetProperties: {
              properties: { sheetId: firstId, title: 'Tickets' },
              fields: 'title',
            },
          }],
        },
      });
      ticketsSheetId = firstId;
    }
  }

  // Ensure "Registrations" sheet exists
  let regSheet = existingSheets.find(s => s.properties?.title === 'Registrations');
  if (!regSheet) {
    const createRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      requestBody: {
        requests: [{
          addSheet: { properties: { title: 'Registrations' } },
        }],
      },
    });
    console.log('Created "Registrations" sheet');
  }

  // Write Tickets headers
  const ticketHeaders = [
    'Mã vé', 'Ngày giờ', 'Họ và tên', 'Email', 'Số điện thoại',
    'Loại người dùng', 'Phân loại', 'MSSV', 'Nơi ở / Công tác',
    'SL Vé', 'Đơn giá vé (VND)', 'Merch đã mua',
    'Mã giảm giá', 'Tiền giảm (VND)', 'Tổng tiền (VND)', 'Phương thức TT',
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sid,
    range: 'Tickets!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [ticketHeaders] },
  });

  // Format Tickets headers
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sid,
    requestBody: {
      requests: [{
        repeatCell: {
          range: { sheetId: ticketsSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 16 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.1, green: 0.1, blue: 0.1 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        },
      }],
    },
  });

  // Write Registrations headers
  const regHeaders = ['Mã đăng ký', 'Ngày giờ', 'Họ và tên', 'Email', 'Số điện thoại', 'Mô tả / Ghi chú'];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sid,
    range: 'Registrations!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [regHeaders] },
  });

  // Get reg sheet ID
  const updatedMeta = await sheets.spreadsheets.get({ spreadsheetId: sid });
  const regSheetId = updatedMeta.data.sheets?.find(s => s.properties?.title === 'Registrations')?.properties?.sheetId;

  // Format Registrations headers
  if (regSheetId !== undefined) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sid,
      requestBody: {
        requests: [{
          repeatCell: {
            range: { sheetId: regSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.1, green: 0.1, blue: 0.1 },
                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
          },
        }],
      },
    });
  }

  // Freeze header rows
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sid,
    requestBody: {
      requests: [
        ...((ticketsSheetId !== undefined) ? [{
          updateSheetProperties: {
            properties: { sheetId: ticketsSheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        }] : []),
        ...((regSheetId !== undefined) ? [{
          updateSheetProperties: {
            properties: { sheetId: regSheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        }] : []),
      ],
    },
  });

  // Delete extra sheets (keep only Tickets and Registrations)
  const finalMeta = await sheets.spreadsheets.get({ spreadsheetId: sid });
  for (const s of finalMeta.data.sheets || []) {
    const title = s.properties?.title || '';
    const sid_ = s.properties?.sheetId;
    if (title !== 'Tickets' && title !== 'Registrations' && sid_ !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sid,
        requestBody: { requests: [{ deleteSheet: { sheetId: sid_ } }] },
      });
      console.log(`Deleted extra sheet "${title}"`);
    }
  }

  console.log('\n✅ Sheet đã được reset thành công!');
  console.log('  - Tickets: 16 cột, header đen chữ trắng, dòng 1 cố định');
  console.log('  - Registrations: 6 cột, header đen chữ trắng, dòng 1 cố định');
}

resetSheets().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
