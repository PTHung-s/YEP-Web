import type { TicketItemRow } from './sheets';

interface TicketEmailInput {
  to: string;
  buyerName: string;
  orderId: string;
  totalAmount: string;
  paymentMethod: string;
  ticketItems: TicketItemRow[];
}

interface EmailResult {
  configured: boolean;
  sent: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL);
}

function getAppUrl(): string {
  const baseUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:3000';
  return baseUrl.endsWith('/yep26') ? baseUrl : `${baseUrl}/yep26`;
}

function getRootAppUrl(): string {
  return getAppUrl().replace(/\/yep26$/, '');
}

function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL || process.env.MAIL_REPLY_TO || process.env.MAIL_FROM_EMAIL || 'tickets@vinunistudentcouncil.com';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatVND(value: string | number): string {
  const amount = Number(value) || 0;
  return amount.toLocaleString('vi-VN') + ' VND';
}

function formatOrderDate(ticketItems: TicketItemRow[]): string {
  const raw = ticketItems[0]?.timestamp;
  if (!raw) return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const [datePart] = raw.split(' ');
  const [day, month, year] = datePart.split('/');
  const fallback = new Date(Number(year), Number(month) - 1, Number(day));
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return raw;
}

export function getTicketQrUrl(ticketCode: string): string {
  return `${getRootAppUrl()}/api/ticket-qr/${encodeURIComponent(ticketCode)}.png`;
}

export function getTicketCheckinUrl(ticketCode: string): string {
  const checkinUrl = `${getAppUrl()}/checkin-yep-2026?ticket=${encodeURIComponent(ticketCode)}`;
  return checkinUrl;
}

function buildTicketEmailHtml(input: TicketEmailInput): string {
  const supportEmail = getSupportEmail();
  const bannerUrl = `${getAppUrl()}/assets/yep/email-banner-kaleido.jpg`;
  const orderDate = formatOrderDate(input.ticketItems);
  const ticketCards = input.ticketItems.map((ticket, index) => {
    const checkinUrl = getTicketCheckinUrl(ticket.ticketCode);
    const qrUrl = getTicketQrUrl(ticket.ticketCode);
    return `
      <div style="background:#ffffff;border:1px solid #d8c7ff;border-radius:14px;margin:18px 0;padding:24px;box-shadow:0 8px 26px rgba(78,36,155,0.12);">
        <p style="margin:0 0 18px;color:#4f22a8;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Your Ticket ${input.ticketItems.length > 1 ? `#${index + 1}` : ''}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;padding:0 22px 0 0;">
              <div style="background:#f7f2ff;border:1px solid #eadfff;border-radius:12px;padding:16px;margin-bottom:14px;">
                <p style="margin:0 0 6px;color:#6b42c2;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Ticket Code</p>
                <p style="margin:0;color:#171329;font-size:28px;line-height:1.1;font-weight:900;letter-spacing:.02em;">${escapeHtml(ticket.ticketCode)}</p>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;color:#2a2540;font-size:15px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eee6fb;color:#5b2bb8;font-weight:700;">Ticket Type</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eee6fb;text-align:right;">${escapeHtml(ticket.ticketType)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eee6fb;color:#5b2bb8;font-weight:700;">Ticket ID</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eee6fb;text-align:right;">${escapeHtml(input.orderId)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eee6fb;color:#5b2bb8;font-weight:700;">Order Date</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eee6fb;text-align:right;">${escapeHtml(orderDate)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#5b2bb8;font-weight:700;">Quantity</td>
                  <td style="padding:10px 0;text-align:right;">${escapeHtml(ticket.ticketNo)} / ${escapeHtml(ticket.orderTicketQuantity || input.ticketItems.length)}</td>
                </tr>
              </table>
            </td>
            <td width="236" style="vertical-align:top;text-align:center;padding:0;">
              <div style="background:#ffffff;border:1px solid #eee6fb;border-radius:14px;padding:14px;display:inline-block;">
                <img src="${escapeHtml(qrUrl)}" width="188" height="188" alt="Check-in QR code for ${escapeHtml(ticket.ticketCode)}" style="display:block;width:188px;height:188px;border:0;margin:0 auto;" />
              </div>
              <a href="${escapeHtml(checkinUrl)}" style="display:block;background:#5b2bb8;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 16px;margin:10px auto 8px;font-size:14px;font-weight:800;max-width:190px;">Open Ticket QR</a>
              <p style="margin:0;color:#655d78;font-size:12px;line-height:1.5;">Show this QR code at the check-in gate.</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }).join('');

  const paymentNote = input.paymentMethod === 'bank'
    ? 'Your order has been recorded. Please complete the bank transfer according to the organizer instructions.'
    : input.paymentMethod === 'payos'
    ? 'Your order has been recorded and paid via PayOS. Thank you for your payment!'
    : 'Your order has been recorded successfully.';

  return `<!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f6f4fb;color:#171329;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your YEP'26 ticket and check-in QR code are ready.</div>
        <div style="padding:28px 14px;background:#f6f4fb;">
          <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e3dcf1;border-radius:14px;overflow:hidden;">
            <img src="${escapeHtml(bannerUrl)}" width="760" alt="YEP'26 The Kaleido Soul" style="display:block;width:100%;max-width:760px;height:auto;border:0;" />

            <div style="padding:28px 30px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-bottom:2px solid #5b2bb8;padding-bottom:20px;margin-bottom:26px;">
                <tr>
                  <td style="padding:0 0 20px;">
                    <p style="margin:0;color:#4f22a8;font-size:30px;line-height:1.1;font-weight:900;">YEP'26</p>
                    <p style="margin:4px 0 0;color:#6b42c2;font-size:14px;line-height:1.5;">The Kaleido Soul<br />Born to Bloom Different</p>
                  </td>
                  <td style="padding:0 0 20px;text-align:right;color:#4f22a8;font-size:15px;font-weight:800;">VinUni Student Council</td>
                </tr>
              </table>

              <h1 style="margin:0 0 18px;color:#171329;font-size:28px;line-height:1.25;">Hi ${escapeHtml(input.buyerName)},</h1>
              <p style="margin:0 0 14px;color:#2a2540;font-size:16px;line-height:1.7;">Thank you for registering for YEP'26.</p>
              <p style="margin:0 0 24px;color:#2a2540;font-size:16px;line-height:1.7;">${paymentNote}</p>

              <div style="background:#fbf8ff;border:1px solid #d8c7ff;border-radius:12px;padding:20px 22px;margin:0 0 24px;">
                <p style="margin:0 0 16px;color:#4f22a8;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">Event Details</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;color:#2a2540;font-size:15px;line-height:1.6;">
                  <tr><td width="110" style="padding:6px 0;color:#5b2bb8;font-weight:700;">Date</td><td style="padding:6px 0;">June 27, 2026</td></tr>
                  <tr><td width="110" style="padding:6px 0;color:#5b2bb8;font-weight:700;">Venue</td><td style="padding:6px 0;">Amphitheatre, VinUni Campus</td></tr>
                  <tr><td width="110" style="padding:6px 0;color:#5b2bb8;font-weight:700;">Time</td><td style="padding:6px 0;">17:00 - 21:45</td></tr>
                  <tr><td width="110" style="padding:6px 0;color:#5b2bb8;font-weight:700;">Order</td><td style="padding:6px 0;">${escapeHtml(input.orderId)} · ${formatVND(input.totalAmount)}</td></tr>
                </table>
              </div>

              ${ticketCards}

              <div style="background:#f7f2ff;border-radius:12px;padding:20px 22px;margin:26px 0 26px;color:#2a2540;">
                <p style="margin:0 0 12px;color:#4f22a8;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;">Important Notes</p>
                <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;">
                  <li>Please present the QR code above at the check-in gate.</li>
                  <li>Each QR code can only be scanned once.</li>
                  <li>If you purchased multiple tickets, each ticket has a unique QR code.</li>
                  <li>Keep this email safe. Do not share your QR code with others.</li>
                </ul>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #d8c7ff;padding-top:20px;">
                <tr>
                  <td style="padding:20px 0;color:#2a2540;font-size:14px;line-height:1.7;">
                    <strong style="color:#4f22a8;">Need help?</strong><br />
                    Contact us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#5b2bb8;text-decoration:none;font-weight:700;">${escapeHtml(supportEmail)}</a><br />
                    VinUni Student Council
                  </td>
                  <td style="padding:20px 0;text-align:right;color:#655d78;font-size:13px;line-height:1.7;">
                    YEP'26: The Kaleido Soul<br />
                    Amphitheatre, VinUni Campus
                  </td>
                </tr>
              </table>
            </div>

            <div style="background:#f2ebff;padding:24px 30px;text-align:center;color:#655d78;font-size:12px;line-height:1.7;">
              This is an automated transactional email for your YEP'26 ticket purchase.<br />
              © 2026 VinUni Student Council. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildTicketEmailText(input: TicketEmailInput): string {
  const ticketLines = input.ticketItems.map((ticket, index) => [
    `Ticket ${index + 1}: ${ticket.ticketCode}`,
    `Type: ${ticket.ticketType}`,
    `Open Ticket QR: ${getTicketCheckinUrl(ticket.ticketCode)}`,
  ].join('\n')).join('\n\n');

  return [
    `Hi ${input.buyerName},`,
    '',
    "Thank you for registering for YEP'26: The Kaleido Soul.",
    `Order ID: ${input.orderId}`,
    `Total: ${formatVND(input.totalAmount)}`,
    '',
    'Event details:',
    'Date: June 27, 2026',
    'Venue: Amphitheatre, VinUni Campus',
    'Time: 17:00 - 21:45',
    '',
    ticketLines,
    '',
    'Please present your QR code at the check-in gate. Each QR code can only be scanned once.',
    '',
    `Need help? Contact ${getSupportEmail()}`,
    'This is an automated transactional email from VinUni Student Council.',
  ].join('\n');
}

function buildListUnsubscribeHeader(): string {
  const supportEmail = getSupportEmail();
  return `<mailto:${supportEmail}?subject=YEP%2726%20email%20preferences>`;
}

export async function sendTicketEmail(input: TicketEmailInput): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return { configured: false, sent: false, provider: 'brevo', error: 'Email is not configured' };
  }

  try {
    const senderName = process.env.MAIL_FROM_NAME || "YEP'26";
    const supportEmail = getSupportEmail();
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: process.env.MAIL_FROM_EMAIL },
        to: [{ email: input.to, name: input.buyerName }],
        replyTo: { email: supportEmail, name: 'VinUni Student Council' },
        subject: `Your YEP'26 Ticket - Order ${input.orderId}`,
        htmlContent: buildTicketEmailHtml(input),
        textContent: buildTicketEmailText(input),
        headers: {
          'List-Unsubscribe': buildListUnsubscribeHeader(),
        },
      }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      const text = responseText;
      return { configured: true, sent: false, provider: 'brevo', error: text };
    }

    const data = responseText ? JSON.parse(responseText) : {};
    return { configured: true, sent: true, provider: 'brevo', messageId: data.messageId };
  } catch (err: any) {
    return { configured: true, sent: false, provider: 'brevo', error: err.message || 'Failed to send email' };
  }
}
