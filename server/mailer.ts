import type { MerchClaimRow, TicketItemRow } from './sheets';
import nodemailer from 'nodemailer';
import { renderTicketCardPdf, renderTicketCardPng, type TicketCardOptions } from './ticket-card';

interface TicketEmailInput {
  to: string;
  buyerName: string;
  orderId: string;
  totalAmount: string;
  paymentMethod: string;
  ticketItems: TicketItemRow[];
  merchItems?: string;
  merchClaims?: MerchClaimRow[];
}

interface EmailResult {
  configured: boolean;
  sent: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

interface BrevoAttachment {
  name: string;
  content: string;
}

interface GeneratedPassFile {
  code: string;
  imageUrl: string;
  cid: string;
  pngName: string;
  png: Buffer;
  pdfName: string;
  pdf: Buffer;
}

function isEmailConfigured(): boolean {
  return Boolean(process.env.MAIL_FROM_EMAIL && (process.env.BREVO_API_KEY || isSmtpConfigured()));
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.MAIL_FROM_EMAIL &&
    (process.env.SMTP_USER || process.env.BREVO_SMTP_LOGIN) &&
    (process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY),
  );
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
  return input.ticketItems[0]?.phone || input.merchClaims?.[0]?.phone || '';
}

function getPurchaseInfo(input: TicketEmailInput): string {
  const quantity = input.ticketItems.length;
  const typeText = uniqueTicketTypes(input.ticketItems);
  const ticketText = quantity > 0 ? `${quantity} ticket${quantity > 1 ? 's' : ''} - ${typeText}` : 'Merch only';
  const merchText = input.merchItems ? ` - ${input.merchItems}` : '';
  return `${ticketText}${merchText} - ${formatVND(input.totalAmount)}`;
}

function getShortTicketCode(ticketCode: string): string {
  const normalized = ticketCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized.slice(-6) || ticketCode.slice(-6).toUpperCase();
}

function sanitizeFilePart(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'pass';
}

function buildTicketCardOptions(ticket: TicketItemRow): TicketCardOptions {
  return {
    kind: 'ticket',
    code: ticket.ticketCode,
    kicker: `${Number(ticket.orderTicketQuantity) > 1 ? `Ticket ${ticket.ticketNo}` : 'Your Ticket'} - Check-in Pass`,
    title: 'The Kaleido Soul',
    subtitle: 'Sports Complex, VinUniversity - 25/6/2026',
    primaryLabel: 'Ticket Type',
    primaryValue: ticket.ticketType,
    secondaryLabel: 'Check-in',
    secondaryValue: '17:00 - 19:00',
    tertiaryLabel: 'Quantity',
    tertiaryValue: `${ticket.ticketNo} / ${ticket.orderTicketQuantity || '1'}`,
    bottomLeftLabel: 'Guest Name',
    bottomLeftValue: ticket.buyerName,
    bottomMiddleLabel: 'Event',
    bottomMiddleValue: "YEP'26",
    bottomRightLabel: 'Date',
    bottomRightValue: '25/6',
  };
}

function buildMerchCardOptions(claim: MerchClaimRow): TicketCardOptions {
  return {
    kind: 'merch',
    code: claim.merchClaimCode,
    kicker: 'Merch Claim Pass',
    title: 'Merch Pickup',
    subtitle: 'Show this QR at the SC booth.',
    primaryLabel: 'Merch Items',
    primaryValue: claim.merchItems,
    secondaryLabel: '',
    secondaryValue: '',
    tertiaryLabel: '',
    tertiaryValue: '',
    bottomLeftLabel: '',
    bottomLeftValue: '',
    bottomMiddleLabel: '',
    bottomMiddleValue: '',
    bottomRightLabel: '',
    bottomRightValue: '',
  };
}

async function buildTicketEmailAttachments(input: TicketEmailInput): Promise<BrevoAttachment[]> {
  const files = await buildTicketEmailPassFiles(input);

  return files.map(file => ({
    name: file.pdfName,
    content: file.pdf.toString('base64'),
  }));
}

async function buildTicketEmailPassFiles(input: TicketEmailInput): Promise<GeneratedPassFile[]> {
  const ticketFiles = await Promise.all(input.ticketItems.map(async (ticket, index) => {
    const options = buildTicketCardOptions(ticket);
    const [png, pdf] = await Promise.all([
      renderTicketCardPng(options),
      renderTicketCardPdf(options),
    ]);
    const code = sanitizeFilePart(getShortTicketCode(ticket.ticketCode));
    const ticketNo = input.ticketItems.length > 1 ? `-${index + 1}` : '';

    return {
      code: ticket.ticketCode,
      imageUrl: getTicketCardUrl(ticket.ticketCode),
      cid: `ticket-${index + 1}-${code}@yep26`,
      pngName: `YEP26-ticket${ticketNo}-${code}.png`,
      png,
      pdfName: `YEP26-ticket${ticketNo}-${code}.pdf`,
      pdf,
    };
  }));

  const merchFiles = await Promise.all((input.merchClaims || []).map(async (claim, index) => {
    const options = buildMerchCardOptions(claim);
    const [png, pdf] = await Promise.all([
      renderTicketCardPng(options),
      renderTicketCardPdf(options),
    ]);
    const code = sanitizeFilePart(getShortTicketCode(claim.merchClaimCode));

    return {
      code: claim.merchClaimCode,
      imageUrl: getTicketCardUrl(claim.merchClaimCode),
      cid: `merch-${index + 1}-${code}@yep26`,
      pngName: `YEP26-merch-${code}.png`,
      png,
      pdfName: `YEP26-merch-${code}.pdf`,
      pdf,
    };
  }));

  return [...ticketFiles, ...merchFiles];
}

function applyInlineCidImages(html: string, files: GeneratedPassFile[]): string {
  return files.reduce((updated, file) => (
    updated.split(escapeHtml(file.imageUrl)).join(`cid:${file.cid}`)
  ), html);
}

async function sendTicketEmailViaSmtp(input: TicketEmailInput): Promise<EmailResult> {
  const senderName = process.env.MAIL_FROM_NAME || "YEP'26";
  const supportEmail = getSupportEmail();
  const files = await buildTicketEmailPassFiles(input);
  const html = applyInlineCidImages(buildTicketEmailHtml(input), files);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER || process.env.BREVO_SMTP_LOGIN,
      pass: process.env.SMTP_PASS || process.env.BREVO_SMTP_KEY,
    },
  });

  const info = await transporter.sendMail({
    from: { name: senderName, address: process.env.MAIL_FROM_EMAIL || '' },
    to: { name: input.buyerName, address: input.to },
    replyTo: { name: 'VinUni Student Council', address: supportEmail },
    subject: `Your YEP'26 Ticket - Order ${input.orderId}`,
    html,
    text: buildTicketEmailText(input),
    headers: {
      'List-Unsubscribe': buildListUnsubscribeHeader(),
    },
    attachments: files.flatMap(file => [
      {
        filename: file.pngName,
        content: file.png,
        contentType: 'image/png',
        cid: file.cid,
      },
      {
        filename: file.pdfName,
        content: file.pdf,
        contentType: 'application/pdf',
      },
    ]),
  });

  return { configured: true, sent: true, provider: 'smtp', messageId: info.messageId };
}

export function getTicketQrUrl(ticketCode: string): string {
  return `${getRootAppUrl()}/api/ticket-qr/${encodeURIComponent(ticketCode)}.png`;
}

export function getTicketCardUrl(ticketCode: string): string {
  return `${getRootAppUrl()}/api/ticket-card/${encodeURIComponent(ticketCode)}.png`;
}

export function getTicketCheckinUrl(ticketCode: string): string {
  return `${getAppUrl()}/checkin-yep-2026?ticket=${encodeURIComponent(ticketCode)}`;
}

function buildTicketCards(input: TicketEmailInput): string {
  return input.ticketItems.map((ticket, index) => {
    const title = input.ticketItems.length > 1 ? `Ticket ${index + 1}` : 'Your Ticket';
    const cardUrl = getTicketCardUrl(ticket.ticketCode);

    return `
      <div style="margin:18px 0 0;">
        <img src="${escapeHtml(cardUrl)}" width="760" alt="${escapeHtml(title)} check-in pass ${escapeHtml(ticket.ticketCode)}" style="display:block;width:100%;max-width:760px;height:auto;border:0;border-radius:16px;" />
        <p style="margin:6px 0 0;color:#4b5563;font-size:12px;line-height:1.45;">${escapeHtml(title)} code: <strong>${escapeHtml(ticket.ticketCode)}</strong></p>
      </div>
    `;
  }).join('');
}

function buildMerchClaimCards(input: TicketEmailInput): string {
  if (!input.merchClaims?.length) return '';

  return input.merchClaims.map(claim => {
    const cardUrl = getTicketCardUrl(claim.merchClaimCode);

    return `
      <div style="margin:18px 0 0;">
        <img src="${escapeHtml(cardUrl)}" width="760" alt="Merch pickup pass ${escapeHtml(claim.merchClaimCode)}" style="display:block;width:100%;max-width:760px;height:auto;border:0;border-radius:16px;" />
        <p style="margin:6px 0 0;color:#4b5563;font-size:12px;line-height:1.45;">Merch code: <strong>${escapeHtml(claim.merchClaimCode)}</strong></p>
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
          @media only screen and (max-width: 520px) {
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
              width: 78px !important;
              padding: 5px !important;
            }
            .ticket-logo {
              width: 68px !important;
              height: auto !important;
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
              <p style="margin:0 0 22px;color:#1f2937;font-size:15px;line-height:1.75;">Your ticket or merch pickup QR code has been attached to this email. Please also review your purchase information below:</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;color:#1f2937;font-size:14px;line-height:1.55;">
                <tr><td width="120" style="padding:5px 0;color:#6b7280;">Full name:</td><td style="padding:5px 0;font-weight:700;">${escapeHtml(input.buyerName)}</td></tr>
                <tr><td width="120" style="padding:5px 0;color:#6b7280;">Phone number:</td><td style="padding:5px 0;font-weight:700;">${escapeHtml(phone || 'N/A')}</td></tr>
                <tr><td width="120" style="padding:5px 0;color:#6b7280;">Purchase info:</td><td style="padding:5px 0;font-weight:700;">${escapeHtml(purchaseInfo)}</td></tr>
              </table>

              ${buildTicketCards(input)}
              ${buildMerchClaimCards(input)}

              <p style="margin:14px 0 0;color:#6b7280;font-size:12px;line-height:1.55;">If you cannot see the QR code, please choose <strong>Download external images/materials</strong> in your email app.</p>

              <p style="margin:24px 0 16px;color:#1f2937;font-size:15px;line-height:1.75;">If any of the information above is incorrect, please contact us via email or our fanpage for assistance.</p>
              <p style="margin:0 0 12px;color:#1f2937;font-size:15px;line-height:1.75;">Before <strong>YEP'26: The Kaleido Soul</strong>, we would like to remind you of the following:</p>

              <p style="margin:0 0 10px;color:#1f2937;font-size:15px;line-height:1.75;font-weight:800;">Please arrive on time for the best experience:</p>
              <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.75;"><strong>Date:</strong> Thursday, 25/6/2026</p>
              <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.75;"><strong>Check-in time:</strong> From 17:00 to 19:00</p>
              <p style="margin:0 0 18px;color:#1f2937;font-size:14px;line-height:1.75;"><strong>Location:</strong> Sports Complex, VinUniversity, Vinhomes Ocean Park, Hà Nội</p>

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
  const merchLines = (input.merchClaims || []).map(claim => [
    'Merch Pickup Pass:',
    `Merch claim code: ${claim.merchClaimCode}`,
    `Merch items: ${claim.merchItems}`,
    `Open Merch QR: ${getTicketCheckinUrl(claim.merchClaimCode)}`,
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
    merchLines ? `\n${merchLines}` : '',
    '',
    'If any of the information above is incorrect, please contact us via email or our fanpage for assistance.',
    '',
    "Before YEP'26: The Kaleido Soul, we would like to remind you of the following:",
    '',
    'Please arrive on time for the best experience:',
    'Date: Thursday, 25/6/2026',
    'Check-in time: From 17:00 to 19:00',
    'Location: Sports Complex, VinUniversity, Vinhomes Ocean Park, Hà Nội',
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
    if (isSmtpConfigured()) {
      return await sendTicketEmailViaSmtp(input);
    }

    const senderName = process.env.MAIL_FROM_NAME || "YEP'26";
    const supportEmail = getSupportEmail();
    const attachments = await buildTicketEmailAttachments(input);
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
        attachment: attachments,
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

