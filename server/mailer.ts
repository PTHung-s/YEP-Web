import QRCode from 'qrcode';
import type { TicketItemRow } from './sheets';

interface TicketEmailInput {
  to: string;
  buyerName: string;
  orderId: string;
  totalAmount: string;
  paymentMethod: string;
  ticketItems: TicketItemRow[];
  appUrl?: string;
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

function getAppUrl(appUrl?: string): string {
  return (appUrl || process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:3000';
}

function formatVND(value: string | number): string {
  const amount = Number(value) || 0;
  return amount.toLocaleString('vi-VN') + ' VND';
}

async function buildQrAttachment(ticketCode: string, appUrl?: string) {
  const checkinUrl = `${getAppUrl(appUrl)}/checkin-yep-2026?ticket=${encodeURIComponent(ticketCode)}`;
  const dataUrl = await QRCode.toDataURL(checkinUrl, { margin: 1, width: 480 });
  return {
    name: `${ticketCode}.png`,
    content: dataUrl.replace(/^data:image\/png;base64,/, ''),
  };
}

function buildTicketEmailHtml(input: TicketEmailInput): string {
  const ticketRows = input.ticketItems.map((ticket, index) => {
    const checkinUrl = `${getAppUrl(input.appUrl)}/checkin-yep-2026?ticket=${encodeURIComponent(ticket.ticketCode)}`;
    return `
      <tr>
        <td style="padding:12px;border:1px solid #d8c8e7;">${index + 1}</td>
        <td style="padding:12px;border:1px solid #d8c8e7;font-weight:700;">${ticket.ticketCode}</td>
        <td style="padding:12px;border:1px solid #d8c8e7;">${ticket.ticketType}</td>
        <td style="padding:12px;border:1px solid #d8c8e7;"><a href="${checkinUrl}">QR link</a></td>
      </tr>
    `;
  }).join('');

  const paymentNote = input.paymentMethod === 'bank'
    ? 'Your order has been recorded. Please complete the bank transfer according to the organizer instructions.'
    : 'Your order has been recorded successfully.';

  return `
    <div style="font-family:Arial,sans-serif;background:#f8f2ff;color:#160925;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff9ff;border:2px solid #160925;padding:28px;">
        <h1 style="margin:0 0 8px;font-size:32px;line-height:1;text-transform:uppercase;">YEP'26 Ticket Confirmation</h1>
        <p style="margin:0 0 24px;color:#5f5070;">The Kaleido Soul / Born to Bloom Different</p>

        <p>Hi <strong>${input.buyerName}</strong>,</p>
        <p>${paymentNote}</p>

        <div style="background:#efe0ff;border:2px solid #160925;padding:16px;margin:20px 0;">
          <p style="margin:0;"><strong>Order ID:</strong> ${input.orderId}</p>
          <p style="margin:8px 0 0;"><strong>Total:</strong> ${formatVND(input.totalAmount)}</p>
          <p style="margin:8px 0 0;"><strong>Tickets:</strong> ${input.ticketItems.length}</p>
        </div>

        <h2 style="font-size:20px;text-transform:uppercase;margin-top:28px;">Your Ticket Codes</h2>
        <table style="width:100%;border-collapse:collapse;background:white;">
          <thead>
            <tr>
              <th style="padding:12px;border:1px solid #d8c8e7;text-align:left;">#</th>
              <th style="padding:12px;border:1px solid #d8c8e7;text-align:left;">Ticket Code</th>
              <th style="padding:12px;border:1px solid #d8c8e7;text-align:left;">Type</th>
              <th style="padding:12px;border:1px solid #d8c8e7;text-align:left;">Check-in</th>
            </tr>
          </thead>
          <tbody>${ticketRows}</tbody>
        </table>

        <p style="margin-top:24px;">QR images for each ticket are attached to this email. Please prepare the QR code or ticket code at the check-in gate.</p>
        <p style="color:#5f5070;font-size:13px;">If you bought multiple tickets, each attached QR code is a separate ticket.</p>
      </div>
    </div>
  `;
}

export async function sendTicketEmail(input: TicketEmailInput): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    return { configured: false, sent: false, provider: 'brevo', error: 'Email is not configured' };
  }

  try {
    const attachments = await Promise.all(input.ticketItems.map(item => buildQrAttachment(item.ticketCode, input.appUrl)));
    const senderName = process.env.MAIL_FROM_NAME || "YEP'26";
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
        subject: `Your YEP'26 Tickets - ${input.orderId}`,
        htmlContent: buildTicketEmailHtml(input),
        attachment: attachments,
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
