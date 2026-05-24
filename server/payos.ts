import { PayOS } from '@payos/node';
import type { Webhook, WebhookData } from '@payos/node';
import type { TicketItemRow } from './sheets';

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
  ticketQuantity: number;
  ticketPrice: number;
  merchItems: string;
  merchTotal: number;
  totalAmount: number;
  ticketBulkDiscount: number;
  merchBulkDiscount: number;
  paymentMethod: string;
  appUrl: string;
}

interface PendingOrder {
  data: PayOSOrderData;
  ticketItems: TicketItemRow[];
  orderId: string;
  createdAt: number;
  status: 'pending' | 'paid';
}

const pendingOrders = new Map<number, PendingOrder>();
const paidOrders = new Map<number, { ticketId: string; ticketCodes: string[]; storedIn: string }>();

export function storePendingOrder(
  orderCode: number,
  orderData: PayOSOrderData,
  ticketItems: TicketItemRow[],
  orderId: string,
) {
  pendingOrders.set(orderCode, {
    data: orderData,
    ticketItems,
    orderId,
    createdAt: Date.now(),
    status: 'pending',
  });
}

export function getPendingOrder(orderCode: number): PendingOrder | undefined {
  return pendingOrders.get(orderCode);
}

export function markOrderPaid(orderCode: number) {
  const order = pendingOrders.get(orderCode);
  if (order) {
    order.status = 'paid';
  }
}

export function storePaidResult(
  orderCode: number,
  result: { ticketId: string; ticketCodes: string[]; storedIn: string },
) {
  paidOrders.set(orderCode, result);
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

  const baseUrl = orderData.appUrl || process.env.APP_URL || 'http://localhost:3000';

  const result = await payos.paymentRequests.create({
    orderCode,
    amount: orderData.totalAmount,
    description: `YEP26 Ticket - ${orderData.fullName}`,
    cancelUrl: `${baseUrl}/yep26/checkout`,
    returnUrl: `${baseUrl}/yep26/success?payosOrder=${orderCode}`,
    buyerName: orderData.fullName,
    buyerEmail: orderData.email,
    buyerPhone: orderData.phone,
    items: [
      {
        name: `YEP'26 Ticket x${orderData.ticketQuantity}`,
        quantity: orderData.ticketQuantity,
        price: orderData.ticketPrice,
      },
    ],
    expiredAt: Math.floor(Date.now() / 1000) + 900,
  });

  return {
    checkoutUrl: result.checkoutUrl,
    qrCode: result.qrCode,
    paymentLinkId: result.paymentLinkId,
  };
}

export function generateOrderCode(): number {
  return Math.floor(Date.now() / 1000) * 100 + Math.floor(Math.random() * 100);
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
