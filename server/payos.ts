import { PayOS } from '@payos/node';
import type { Webhook, WebhookData } from '@payos/node';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { MerchClaimRow, TicketItemRow } from './sheets';

function getPayOS(): PayOS | null {
  if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
    console.log('[PayOS] PayOS not configured. Set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env');
    return null;
  }
  try {
    return new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY,
    });
  } catch (err) {
    console.error('[PayOS] Failed to initialize PayOS client:', err);
    return null;
  }
}

export interface PayOSOrderData {
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
  merchTotal: number;
  totalAmount: number;
  ticketBulkDiscount: number;
  merchBulkDiscount: number;
  paymentMethod: string;
}

interface PendingOrder {
  data: PayOSOrderData;
  ticketItems: TicketItemRow[];
  merchClaims: MerchClaimRow[];
  orderId: string;
  statusKey: string;
  createdAt: number;
  status: 'pending' | 'paid';
}

interface PaidOrderResult {
  ticketId: string;
  ticketCodes: string[];
  storedIn: string;
  statusKey: string;
}

const pendingOrders = new Map<number, PendingOrder>();
const paidOrders = new Map<number, PaidOrderResult>();
const DATA_DIR = path.resolve('server', 'data');
const PAYOS_STATE_PATH = path.join(DATA_DIR, 'payos-orders.json');

function loadOrderState() {
  try {
    if (!fs.existsSync(PAYOS_STATE_PATH)) return;
    const raw = fs.readFileSync(PAYOS_STATE_PATH, 'utf-8');
    const state = JSON.parse(raw || '{}');

    for (const [orderCode, order] of Object.entries<PendingOrder>(state.pendingOrders || {})) {
      pendingOrders.set(Number(orderCode), order);
    }
    for (const [orderCode, result] of Object.entries<PaidOrderResult>(state.paidOrders || {})) {
      paidOrders.set(Number(orderCode), result);
    }
  } catch (err) {
    console.error('[PayOS] Failed to load saved order state:', err);
  }
}

function persistOrderState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PAYOS_STATE_PATH, JSON.stringify({
      pendingOrders: Object.fromEntries(pendingOrders),
      paidOrders: Object.fromEntries(paidOrders),
    }, null, 2));
  } catch (err) {
    console.error('[PayOS] Failed to persist order state:', err);
  }
}

loadOrderState();

export function storePendingOrder(
  orderCode: number,
  orderData: PayOSOrderData,
  ticketItems: TicketItemRow[],
  merchClaims: MerchClaimRow[],
  orderId: string,
  statusKey: string,
) {
  pendingOrders.set(orderCode, {
    data: orderData,
    ticketItems,
    merchClaims,
    orderId,
    statusKey,
    createdAt: Date.now(),
    status: 'pending',
  });
  persistOrderState();
}

export function getPendingOrder(orderCode: number): PendingOrder | undefined {
  return pendingOrders.get(orderCode);
}

export function markOrderPaid(orderCode: number) {
  const order = pendingOrders.get(orderCode);
  if (order) {
    order.status = 'paid';
    persistOrderState();
  }
}

export function storePaidResult(
  orderCode: number,
  result: PaidOrderResult,
) {
  paidOrders.set(orderCode, result);
  persistOrderState();
}

export function getPaidResult(orderCode: number) {
  return paidOrders.get(orderCode);
}

export async function createPaymentLink(
  orderData: PayOSOrderData,
  orderCode: number,
): Promise<{ checkoutUrl: string; qrCode: string; paymentLinkId: string }> {
  const payos = getPayOS();
  if (!payos) {
    throw new Error('PayOS is not configured');
  }

  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const returnParams = new URLSearchParams({
    payosOrder: String(orderCode),
  });

  const paymentItems = [
    {
      name: orderData.ticketQuantity > 0 ? "YEP'26 Order" : "YEP'26 Merchandise",
      quantity: 1,
      price: orderData.totalAmount,
    },
  ];

  const result = await payos.paymentRequests.create({
    orderCode,
    amount: orderData.totalAmount,
    description: `YEP26 - ${orderData.fullName}`.slice(0, 25),
    cancelUrl: `${baseUrl}/yep26/checkout`,
    returnUrl: `${baseUrl}/yep26/success?${returnParams.toString()}`,
    buyerName: orderData.fullName,
    buyerEmail: orderData.email,
    buyerPhone: orderData.phone,
    items: paymentItems,
    expiredAt: Math.floor(Date.now() / 1000) + 900,
  });

  return {
    checkoutUrl: result.checkoutUrl,
    qrCode: result.qrCode,
    paymentLinkId: result.paymentLinkId,
  };
}

export function generateOrderCode(): number {
  return Date.now() * 100 + crypto.randomInt(100);
}

export function generateStatusKey(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function checkPaymentStatus(orderCode: number): Promise<boolean> {
  const payos = getPayOS();
  if (!payos) return false;
  try {
    const paymentLink = await payos.paymentRequests.get(orderCode);
    return paymentLink.status === 'PAID';
  } catch {
    return false;
  }
}

export async function verifyWebhook(webhook: Webhook): Promise<{ verified: boolean; data?: WebhookData; error?: string }> {
  const payos = getPayOS();
  if (!payos) return { verified: false, error: 'PayOS not configured' };

  try {
    const data = await payos.webhooks.verify(webhook);
    return { verified: true, data };
  } catch (err: any) {
    return { verified: false, error: err.message || 'Webhook verification failed' };
  }
}

export async function confirmWebhook(appUrl: string): Promise<boolean> {
  const payos = getPayOS();
  if (!payos) return false;
  try {
    const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/payos/webhook`;
    await payos.webhooks.confirm(webhookUrl);
    console.log(`[PayOS] Webhook registered: ${webhookUrl}`);
    return true;
  } catch (err: any) {
    console.error('[PayOS] Failed to register webhook:', err.message || err);
    return false;
  }
}

export function isPayOSConfigured(): boolean {
  return getPayOS() !== null;
}
