import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';

export interface TicketCardOptions {
  kind: 'ticket' | 'merch';
  code: string;
  kicker: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  tertiaryLabel: string;
  tertiaryValue: string;
  bottomLeftLabel: string;
  bottomLeftValue: string;
  bottomMiddleLabel: string;
  bottomMiddleValue: string;
  bottomRightLabel: string;
  bottomRightValue: string;
}

function getAppUrl(): string {
  const baseUrl = (process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:3000';
  return baseUrl.endsWith('/yep26') ? baseUrl : `${baseUrl}/yep26`;
}

function getTicketCheckinUrl(ticketCode: string): string {
  return `${getAppUrl()}/checkin-yep-2026?ticket=${encodeURIComponent(ticketCode)}`;
}

function escapeSvg(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getShortTicketCode(ticketCode: string): string {
  const normalized = ticketCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return normalized.slice(-6) || ticketCode.slice(-6).toUpperCase();
}

function wrapSvgText(value: string, maxChars: number, maxLines = 2): string[] {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (words.length && lines.length === maxLines) {
    const usedWords = lines.join(' ').split(/\s+/).length;
    if (usedWords < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\.*$/, '')}...`;
    }
  }

  return lines.length ? lines : [''];
}

async function readAssetDataUri(assetPath: string): Promise<string> {
  const bytes = await fs.readFile(path.resolve(assetPath));
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

function textLinesSvg(lines: string[], x: number, y: number, lineHeight: number, attrs: string): string {
  return lines.map((line, index) => (
    `<text x="${x}" y="${y + index * lineHeight}" ${attrs}>${escapeSvg(line)}</text>`
  )).join('');
}

export async function renderTicketCardPng(options: TicketCardOptions): Promise<Buffer> {
  const [backgroundDataUri, logoDataUri] = await Promise.all([
    readAssetDataUri('public/assets/yep/Background_Ticket.png'),
    readAssetDataUri('public/assets/yep/event_name.png'),
  ]);
  const qrPng = await QRCode.toBuffer(getTicketCheckinUrl(options.code), {
    type: 'png',
    margin: 1,
    width: 300,
    errorCorrectionLevel: 'M',
  });
  const qrDataUri = `data:image/png;base64,${qrPng.toString('base64')}`;
  const shortCode = getShortTicketCode(options.code);
  const isMerch = options.kind === 'merch';
  const titleLines = wrapSvgText(options.title.toUpperCase(), isMerch ? 16 : 24, 2);
  const primaryValueLines = wrapSvgText(options.primaryValue, isMerch ? 44 : 24, isMerch ? 3 : 2);

  const titleSvg = textLinesSvg(
    titleLines,
    300,
    108,
    42,
    'fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="900" letter-spacing="1" filter="url(#textShadow)"',
  );

  const merchMainSvg = isMerch ? `
    <text x="300" y="218" fill="#ffffff" fill-opacity="0.74" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" letter-spacing="3">${escapeSvg(options.primaryLabel.toUpperCase())}</text>
    ${textLinesSvg(primaryValueLines, 300, 255, 27, 'fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="900" filter="url(#textShadow)"')}
  ` : '';

  const ticketDetailsSvg = isMerch ? '' : `
    <line x1="54" y1="216" x2="852" y2="216" stroke="#ffffff" stroke-opacity="0.24" stroke-width="1"/>
    <text x="54" y="254" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" letter-spacing="3">${escapeSvg(options.primaryLabel.toUpperCase())}</text>
    ${textLinesSvg(primaryValueLines, 54, 286, 27, 'fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="900" filter="url(#textShadow)"')}

    <text x="398" y="254" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" letter-spacing="3">${escapeSvg(options.secondaryLabel.toUpperCase())}</text>
    <text x="398" y="286" fill="#20d9ff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900">${escapeSvg(options.secondaryValue)}</text>

    <text x="662" y="254" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" letter-spacing="3">${escapeSvg(options.tertiaryLabel.toUpperCase())}</text>
    <text x="662" y="286" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900">${escapeSvg(options.tertiaryValue)}</text>

    <line x1="54" y1="321" x2="852" y2="321" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1"/>
    <text x="54" y="354" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3">${escapeSvg(options.bottomLeftLabel.toUpperCase())}</text>
    <text x="54" y="380" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900">${escapeSvg(options.bottomLeftValue)}</text>

    <text x="398" y="354" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3">${escapeSvg(options.bottomMiddleLabel.toUpperCase())}</text>
    <text x="398" y="380" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900">${escapeSvg(options.bottomMiddleValue)}</text>

    <text x="662" y="354" fill="#ffffff" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" letter-spacing="3">${escapeSvg(options.bottomRightLabel.toUpperCase())}</text>
    <text x="662" y="380" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900">${escapeSvg(options.bottomRightValue)}</text>
  `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="410" viewBox="0 0 1200 410">
      <defs>
        <clipPath id="card"><rect x="0" y="0" width="1200" height="410" rx="26" ry="26"/></clipPath>
        <linearGradient id="qrBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#fcfbff"/>
          <stop offset="0.58" stop-color="#f2ebff"/>
          <stop offset="1" stop-color="#eafaff"/>
        </linearGradient>
        <linearGradient id="leftShade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#130631" stop-opacity="0.12"/>
          <stop offset="0.38" stop-color="#130631" stop-opacity="0.06"/>
          <stop offset="1" stop-color="#130631" stop-opacity="0"/>
        </linearGradient>
        <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#12041f" flood-opacity="0.55"/>
        </filter>
      </defs>
      <rect width="1200" height="410" fill="#ffffff"/>
      <g clip-path="url(#card)">
        <rect width="1200" height="410" fill="#201047"/>
        <image href="${backgroundDataUri}" x="0" y="0" width="910" height="410" preserveAspectRatio="xMidYMid slice"/>
        <rect x="0" y="0" width="910" height="410" fill="url(#leftShade)"/>
        <rect x="910" y="0" width="290" height="410" fill="url(#qrBg)"/>
        <line x1="910" y1="0" x2="910" y2="410" stroke="#a98de5" stroke-width="3" stroke-dasharray="8 8"/>
        <circle cx="910" cy="0" r="21" fill="#ffffff" stroke="#d7c6f1" stroke-width="1"/>
        <circle cx="910" cy="410" r="21" fill="#ffffff" stroke="#d7c6f1" stroke-width="1"/>

        <image href="${logoDataUri}" x="0" y="8" width="312" height="184" preserveAspectRatio="xMidYMid meet"/>
        <line x1="286" y1="36" x2="286" y2="194" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>

        <text x="300" y="70" fill="#20d9ff" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" letter-spacing="5">${escapeSvg(options.kicker.toUpperCase())}</text>
        ${titleSvg}
        <text x="300" y="172" fill="#ffffff" fill-opacity="0.96" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="500" filter="url(#textShadow)">${escapeSvg(options.subtitle)}</text>
        ${merchMainSvg}
        ${ticketDetailsSvg}

        <line x1="1020" y1="47" x2="1084" y2="47" stroke="#20d9ff" stroke-width="3" opacity="0.55"/>
        <text x="1055" y="91" text-anchor="middle" fill="#4f2aa7" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" letter-spacing="4">${isMerch ? 'MERCH' : 'CHECK-IN'}</text>
        <rect x="965" y="116" width="180" height="180" rx="18" fill="#ffffff" stroke="#e3ddef" stroke-width="2"/>
        <image href="${qrDataUri}" x="982" y="133" width="146" height="146"/>
        <rect x="956" y="326" width="198" height="54" rx="7" fill="#ffffff" fill-opacity="0.9" stroke="#d7cbed" stroke-width="1"/>
        <text x="1055" y="360" text-anchor="middle" fill="#24133f" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" letter-spacing="2">${escapeSvg(shortCode)}</text>
      </g>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderTicketCardPdf(options: TicketCardOptions): Promise<Buffer> {
  const png = await renderTicketCardPng(options);
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(png);
  const page = pdf.addPage([image.width, image.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return Buffer.from(await pdf.save());
}
