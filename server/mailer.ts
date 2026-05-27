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
  return process.env.SUPPORT_EMAIL || process.env.MAIL_REPLY_TO || 'vinunistudentcouncil@vinuni.edu.vn';
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

function uniqueTicketTypes(ticketItems: TicketItemRow[]): string {
  const counts = ticketItems.reduce<Record<string, number>>((acc, ticket) => {
    const type = ticket.ticketType || 'YEP Ticket';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([type, count]) => `${count} x ${type}`)
    .join(', ');
}

function getBuyerPhone(input: TicketEmailInput): string {
  return input.ticketItems[0]?.phone || '';
}

function getPurchaseInfo(input: TicketEmailInput): string {
  const quantity = input.ticketItems.length;
  const typeText = uniqueTicketTypes(input.ticketItems);
  return `${quantity} ticket${quantity > 1 ? 's' : ''} - ${typeText} - ${formatVND(input.totalAmount)}`;
}

function getShortTicketCode(ticketCode: string): string {
  const normalized = ticketCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized.slice(-6) || ticketCode.slice(-6).toUpperCase();
}

export function getTicketQrUrl(ticketCode: string): string {
  return `${getRootAppUrl()}/api/ticket-qr/${encodeURIComponent(ticketCode)}.png`;
}

export function getTicketCheckinUrl(ticketCode: string): string {
  return `${getAppUrl()}/checkin-yep-2026?ticket=${encodeURIComponent(ticketCode)}`;
}

function buildTicketCards(input: TicketEmailInput): string {
  const logoUrl = `${getAppUrl()}/assets/yep/yep-logo.png`;

  return input.ticketItems.map((ticket, index) => {
    const qrUrl = getTicketQrUrl(ticket.ticketCode);
    const title = input.ticketItems.length > 1 ? `Ticket ${index + 1}` : 'Your Ticket';
    const shortCode = getShortTicketCode(ticket.ticketCode);

    return `
      <div style="margin:18px 0 0;border-radius:16px;overflow:hidden;background:#ffffff;box-shadow:0 12px 24px rgba(40,24,92,0.09);border:1px solid #d8cdef;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td class="ticket-info" style="padding:0;vertical-align:stretch;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td class="ticket-logo-cell" style="width:80px;background:#ffffff;color:#4f2aa7;text-align:center;vertical-align:middle;padding:4px;border-right:1px solid #ece7f5;">
                    <img class="ticket-logo" src="${escapeHtml(logoUrl)}" width="72" height="72" alt="YEP'26" style="display:block;width:72px;height:72px;object-fit:contain;border:0;margin:0 auto;" />
                  </td>
                  <td class="ticket-title-cell" style="padding:15px 18px 10px;vertical-align:top;">
                    <p class="ticket-kicker" style="margin:0 0 6px;color:#20d9ff;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.16em;">${escapeHtml(title)} · Check-in Pass</p>
                    <p class="ticket-title" style="margin:0;color:#111827;font-size:23px;line-height:1.05;font-weight:900;letter-spacing:.02em;text-transform:uppercase;">The Kaleido Soul</p>
                    <p class="ticket-meta" style="margin:6px 0 0;color:#4b5563;font-size:12px;line-height:1.35;">Amphitheatre, VinUniversity · Thursday, 25/6/2026</p>
                  </td>
                </tr>
              </table>
              <div class="ticket-detail-wrap" style="padding:0 18px 15px 98px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;color:#1f2937;font-size:12px;line-height:1.35;border-top:1px solid #ece7f5;">
                <tr>
                  <td class="ticket-detail-label" style="padding:11px 10px 6px 0;color:#6b7280;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">Ticket Type</td>
                  <td class="ticket-detail-label" style="padding:11px 10px 6px 0;color:#6b7280;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">Check-in</td>
                  <td class="ticket-detail-label" style="padding:11px 0 6px;color:#6b7280;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">Quantity</td>
                </tr>
                <tr>
                  <td class="ticket-detail-value" style="padding:0 10px 0 0;font-weight:800;color:#111827;">${escapeHtml(ticket.ticketType)}</td>
                  <td class="ticket-detail-value" style="padding:0 10px 12px 0;font-weight:800;color:#4f2aa7;">17:00 - 19:00</td>
                  <td class="ticket-detail-value" style="padding:0 0 12px;font-weight:800;color:#111827;">${escapeHtml(ticket.ticketNo)} / ${escapeHtml(ticket.orderTicketQuantity || input.ticketItems.length)}</td>
                </tr>
                <tr>
                  <td class="ticket-detail-label" style="padding:10px 10px 0 0;border-top:1px solid #ece7f5;color:#6b7280;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">Guest Name</td>
                  <td class="ticket-detail-label" style="padding:10px 10px 0 0;border-top:1px solid #ece7f5;color:#6b7280;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">Event</td>
                  <td class="ticket-detail-label" style="padding:10px 0 0;border-top:1px solid #ece7f5;color:#6b7280;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;">Date</td>
                </tr>
                <tr>
                  <td class="ticket-detail-value" style="padding:0 10px 0 0;font-weight:800;color:#111827;">${escapeHtml(input.buyerName)}</td>
                  <td class="ticket-detail-value" style="padding:0 10px 0 0;font-weight:800;color:#111827;">YEP'26</td>
                  <td class="ticket-detail-value" style="padding:0;font-weight:800;color:#111827;">25/6</td>
                </tr>
              </table>
              </div>
            </td>
            <td class="ticket-qr" width="176" style="padding:14px 14px;text-align:center;vertical-align:middle;background:#f3efff;background-image:linear-gradient(135deg,#fbfaff 0%,#f0eaff 62%,#eafaff 100%);border-left:2px dashed #bba9e8;position:relative;">
              <div style="height:2px;width:42px;background:#20d9ff;margin:0 auto 8px;border-radius:99px;opacity:.55;"></div>
              <p style="margin:0 0 8px;color:#4f2aa7;font-size:13px;line-height:1.15;font-weight:900;letter-spacing:.1em;text-transform:uppercase;">Check-in</p>
              <div style="display:inline-block;padding:8px;border:1px solid #e5e0f2;border-radius:12px;background:#ffffff;box-shadow:0 7px 16px rgba(79,42,167,0.08);">
                <img src="${escapeHtml(qrUrl)}" width="118" height="118" alt="Check-in QR code for ${escapeHtml(ticket.ticketCode)}" style="display:block;width:118px;height:118px;border:0;margin:0 auto;" />
              </div>
              <div style="display:block;margin:9px auto 0;padding:8px 10px;max-width:132px;border-radius:4px;background:rgba(255,255,255,0.78);border:1px solid rgba(79,42,167,0.16);color:#24133f;text-decoration:none;font-size:12px;font-weight:900;letter-spacing:.08em;">${escapeHtml(shortCode)}</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }).join('');
}

export function buildTicketEmailHtml(input: TicketEmailInput): string {
  const supportEmail = getSupportEmail();
  const phone = getBuyerPhone(input);
  const purchaseInfo = getPurchaseInfo(input);
  const bannerUrl = `${getAppUrl()}/assets/yep/email-banner-kaleido.jpg`;

  return `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <style>
          @media only screen and (max-width: 640px) {
            .email-shell { padding: 0 !important; }
            .email-card { border-radius: 0 !important; }
            .email-banner { height: 178px !important; }
            .email-body { padding: 24px 18px !important; }
            .ticket-info, .ticket-qr {
              display: block !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            .ticket-info { padding-bottom: 0 !important; }
            .ticket-qr {
              padding: 18px 14px 16px !important;
              border-left: 0 !important;
              border-top: 2px dashed #bba9e8 !important;
            }
            .ticket-logo-cell {
              width: 62px !important;
              padding: 6px !important;
            }
            .ticket-logo {
              width: 52px !important;
              height: 52px !important;
            }
            .ticket-title-cell {
              padding: 12px 12px 8px !important;
            }
            .ticket-kicker {
              font-size: 8px !important;
              letter-spacing: .12em !important;
            }
            .ticket-title {
              font-size: 20px !important;
              line-height: 1.05 !important;
            }
            .ticket-meta {
              font-size: 11px !important;
              line-height: 1.35 !important;
            }
            .ticket-detail-wrap {
              padding: 0 14px 14px !important;
            }
            .ticket-detail-label {
              font-size: 8px !important;
              letter-spacing: .08em !important;
              padding-right: 6px !important;
            }
            .ticket-detail-value {
              font-size: 11px !important;
              padding-right: 6px !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your YEP'26 ticket QR code is ready.</div>
        <div class="email-shell" style="padding:0;background:#ffffff;">
          <div class="email-card" style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:0;overflow:visible;">
            <div class="email-banner" style="height:210px;overflow:hidden;background:#2a145a;">
              <img src="${escapeHtml(bannerUrl)}" width="760" alt="YEP'26: The Kaleido Soul" style="display:block;width:100%;height:100%;object-fit:cover;object-position:center 43%;border:0;" />
            </div>
            <div style="padding:20px 28px;border-bottom:1px solid #ececf0;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;color:#4f2aa7;font-size:24px;line-height:1.1;font-weight:900;">YEP'26</p>
                    <p style="margin:5px 0 0;color:#4b5563;font-size:14px;line-height:1.45;">The Kaleido Soul</p>
                  </td>
                  <td style="vertical-align:middle;text-align:right;color:#4f2aa7;font-size:15px;font-weight:800;">VinUni Student Council</td>
                </tr>
              </table>
            </div>

            <div class="email-body" style="padding:30px 34px 34px;">
              <p style="margin:0 0 20px;color:#111827;font-size:18px;line-height:1.6;">Dear ${escapeHtml(input.buyerName)},</p>

              <p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.75;">The YEP '26 Organizing Team is delighted to confirm your ticket purchase at <strong>YEP '26: The Kaleido Soul</strong>.</p>
              <p style="margin:0 0 22px;color:#1f2937;font-size:15px;line-height:1.75;">Your ticket QR code has been attached to this email. Please also review your ticket information below:</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;color:#1f2937;font-size:14px;line-height:1.55;">
                <tr><td width="120" style="padding:5px 0;color:#6b7280;">Full name:</td><td style="padding:5px 0;font-weight:700;">${escapeHtml(input.buyerName)}</td></tr>
                <tr><td width="120" style="padding:5px 0;color:#6b7280;">Phone number:</td><td style="padding:5px 0;font-weight:700;">${escapeHtml(phone || 'N/A')}</td></tr>
                <tr><td width="120" style="padding:5px 0;color:#6b7280;">Purchase info:</td><td style="padding:5px 0;font-weight:700;">${escapeHtml(purchaseInfo)}</td></tr>
              </table>

              ${buildTicketCards(input)}

              <p style="margin:24px 0 16px;color:#1f2937;font-size:15px;line-height:1.75;">If any of the information above is incorrect, please contact us via email or our fanpage for assistance.</p>
              <p style="margin:0 0 12px;color:#1f2937;font-size:15px;line-height:1.75;">Before <strong>YEP'26: The Kaleido Soul</strong>, we would like to remind you of the following:</p>

              <p style="margin:0 0 10px;color:#1f2937;font-size:15px;line-height:1.75;font-weight:800;">Please arrive on time for the best experience:</p>
              <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.75;"><strong>Date:</strong> Thursday, 25/6/2026</p>
              <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.75;"><strong>Check-in time:</strong> From 17:00 to 19:00</p>
              <p style="margin:0 0 18px;color:#1f2937;font-size:14px;line-height:1.75;"><strong>Location:</strong> Amphitheatre, VinUniversity, Vinhomes Ocean Park, Hà Nội</p>

              <ul style="margin:0 0 22px;padding-left:20px;color:#1f2937;font-size:14px;line-height:1.8;">
                <li>Please bring your VinUni student ID for check-in. If you are not a student of VinUniversity, please present your National ID or Passport.</li>
                <li>This email serves as your ticket. Please present the QR code attached below in this email at the check-in counter.</li>
                <li>Tickets are non-refundable and non-transferrable after purchase.</li>
                <li>After purchasing any merchandise, you can collect it at the SC booth starting from 15/06 or at the booth during the event.</li>
                <li>Dresscode: Gardenia summer - colorful, expressive, and radiant. Be ready for photos!</li>
              </ul>

              <p style="margin:0 0 16px;color:#1f2937;font-size:15px;line-height:1.75;">Please follow our fanpage: <strong>VinUni Student Council</strong> to stay updated with the latest announcement.</p>
              <p style="margin:0 0 22px;color:#1f2937;font-size:15px;line-height:1.75;">We hope you will have unforgettable memories in <strong>YEP '26: The Kaleido Soul</strong>!</p>

              <p style="margin:0 0 22px;color:#1f2937;font-size:15px;line-height:1.75;">Best regards,<br />VinUni Student Council and the YEP '26 Organizing Team</p>

              <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;color:#4b5563;font-size:13px;line-height:1.7;">
                <p style="margin:0 0 6px;font-weight:800;color:#111827;">Contact</p>
                <p style="margin:0;">Page: VinUni Student Council</p>
                <p style="margin:0;">Mail: <a href="mailto:${escapeHtml(supportEmail)}" style="color:#4f2aa7;text-decoration:none;font-weight:700;">${escapeHtml(supportEmail)}</a></p>
                <p style="margin:0;">Website: <a href="${escapeHtml(getAppUrl())}" style="color:#4f2aa7;text-decoration:none;font-weight:700;">${escapeHtml(getAppUrl())}</a></p>
                <p style="margin:0;">Hotline: 0377488195 (Mr. Trường Trần)</p>
              </div>
            </div>

            <div style="background:#f9fafb;padding:16px 28px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;border-top:1px solid #ececf0;">
              This is an automated transactional email for your YEP'26 ticket purchase.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function buildTicketEmailText(input: TicketEmailInput): string {
  const ticketLines = input.ticketItems.map((ticket, index) => [
    `Ticket ${index + 1}:`,
    `Ticket code: ${ticket.ticketCode}`,
    `Ticket type: ${ticket.ticketType}`,
    `Open Ticket QR: ${getTicketCheckinUrl(ticket.ticketCode)}`,
  ].join('\n')).join('\n\n');

  return [
    `Dear ${input.buyerName},`,
    '',
    "The YEP '26 Organizing Team is delighted to confirm your ticket purchase at YEP '26: The Kaleido Soul.",
    '',
    'Your ticket QR code has been attached to this email. Please also review your ticket information below:',
    '',
    `Full name: ${input.buyerName}`,
    `Phone number: ${getBuyerPhone(input) || 'N/A'}`,
    `Purchase info: ${getPurchaseInfo(input)}`,
    '',
    ticketLines,
    '',
    'If any of the information above is incorrect, please contact us via email or our fanpage for assistance.',
    '',
    "Before YEP'26: The Kaleido Soul, we would like to remind you of the following:",
    '',
    'Please arrive on time for the best experience:',
    'Date: Thursday, 25/6/2026',
    'Check-in time: From 17:00 to 19:00',
    'Location: Amphitheatre, VinUniversity, Vinhomes Ocean Park, Hà Nội',
    'Please bring your VinUni student ID for check-in. If you are not a student of VinUniversity, please present your National ID or Passport.',
    'This email serves as your ticket. Please present the QR code attached below in this email at the check-in counter.',
    'Tickets are non-refundable and non-transferrable after purchase.',
    'After purchasing any merchandise, you can collect it at the SC booth starting from 15/06 or at the booth during the event.',
    'Dresscode: Gardenia summer - colorful, expressive, and radiant. Be ready for photos!',
    '',
    'Please follow our fanpage: VinUni Student Council to stay updated with the latest announcement.',
    '',
    "We hope you will have unforgettable memories in YEP '26: The Kaleido Soul!",
    '',
    'Best regards,',
    "VinUni Student Council and the YEP '26 Organizing Team",
    '',
    'Contact:',
    'Page: VinUni Student Council',
    `Mail: ${getSupportEmail()}`,
    `Website: ${getAppUrl()}`,
    'Hotline: 0377488195 (Mr. Trường Trần)',
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
      return { configured: true, sent: false, provider: 'brevo', error: responseText };
    }

    const data = responseText ? JSON.parse(responseText) : {};
    return { configured: true, sent: true, provider: 'brevo', messageId: data.messageId };
  } catch (err: any) {
    return { configured: true, sent: false, provider: 'brevo', error: err.message || 'Failed to send email' };
  }
}
