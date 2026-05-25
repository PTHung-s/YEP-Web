import React, { useState } from 'react';
import { Landmark, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Loader2, QrCode, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { cn } from './Layout';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

export function Checkout() {
  const { state, dispatch, getTicketPrice, getMerchTotal, getServiceFee, getTotal, getTicketBulkDiscount, getMerchBulkDiscount } = useCart();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [payosData, setPayosData] = useState<{ checkoutUrl: string; qrCode: string; orderCode: number; statusKey?: string } | null>(null);

  const ticketPrice = getTicketPrice();
  const serviceFee = getServiceFee();
  const total = getTotal();
  const merchTotal = getMerchTotal();
  const ticketBulkDiscount = getTicketBulkDiscount();
  const merchBulkDiscount = getMerchBulkDiscount();

  const handlePay = async () => {
    if (processing || !state.paymentMethod) return;
    setProcessing(true);
    setError('');

    const merchData = state.merch
      .filter(m => m.quantity > 0)
      .map(m => `${m.name} x${m.quantity} (${m.price * m.quantity}VND)`);

    try {
      const body = {
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        userType: state.userType,
        userCategory: state.userCategory,
        studentId: state.studentId,
        workplace: state.workplace,
        upcomingStudent: state.upcomingStudent,
        applicationId: state.applicationId,
        ticketQuantity: state.ticketQuantity,
        ticketPrice: ticketPrice,
        merchItems: merchData.join('; '),
        merchTotal,
        totalAmount: total,
        ticketBulkDiscount,
        merchBulkDiscount,
        paymentMethod: state.paymentMethod,
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment failed');
      }

      const data = await res.json();

      if (data.payos) {
        setPayosData({ checkoutUrl: data.checkoutUrl, qrCode: data.qrCode, orderCode: data.orderCode, statusKey: data.statusKey });
        setProcessing(false);
        return;
      }

      navigate('/success', { state: { ticketId: data.ticketId, ticketCodes: data.ticketCodes || [], storedIn: data.storedIn } });
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || 'Cannot connect to server. Make sure API server is running.');
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="mb-8 md:mb-12">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
          PAYMENT <br /> CHECKOUT.
        </h1>
        <p className="font-body text-lg md:text-xl max-w-2xl text-on-surface-variant font-medium leading-relaxed">
          Complete your payment to secure your spot at YEP'26: The Kaleido Soul.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-10">
        {[1, 2, 3, 4, 5].map(i => (
          <React.Fragment key={i}>
            <span className={cn(
              'w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary flex items-center justify-center font-display font-black text-sm',
              i < 5 ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant'
            )}>
              {i < 5 ? '✓' : i}
            </span>
            {i < 5 && <div className="h-0.5 w-8 md:w-12 bg-primary" />}
          </React.Fragment>
        ))}
        <span className="hidden md:block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-2">
          PAYMENT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">
        {/* Left: Payment Method */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-surface p-6 md:p-10 border-4 border-primary neo-shadow">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
              <span className="bg-primary text-white w-10 h-10 flex items-center justify-center font-bold text-xl">05</span>
              PAYMENT METHOD
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={state.paymentMethod === 'bank'}
                  onChange={() => { dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'bank' }); setPayosData(null); }}
                />
                <div className={cn(
                  "border-4 border-primary p-6 flex flex-col items-center gap-4 transition-all duration-200",
                  state.paymentMethod === 'bank' ? "bg-primary-container neo-shadow-sm -translate-y-1" : "bg-white hover:bg-surface-container"
                )}>
                  <Landmark className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="font-display text-lg font-black uppercase tracking-widest text-background">BANK TRANSFER</span>
                </div>
              </label>

              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={state.paymentMethod === 'payos'}
                  onChange={() => { dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'payos' }); setPayosData(null); }}
                />
                <div className={cn(
                  "border-4 border-primary p-6 flex flex-col items-center gap-4 transition-all duration-200",
                  state.paymentMethod === 'payos' ? "bg-primary-container neo-shadow-sm -translate-y-1" : "bg-white hover:bg-surface-container"
                )}>
                  <QrCode className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="font-display text-lg font-black uppercase tracking-widest text-background">PAYOS QR</span>
                </div>
              </label>
            </div>

            {state.paymentMethod === 'bank' && (
              <div className="bg-primary-container border-4 border-primary p-6 text-center space-y-4">
                <Landmark className="w-12 h-12 mx-auto text-primary" />
                <div>
                  <p className="font-display font-black text-lg uppercase tracking-wider">Bank Transfer Details</p>
                  <p className="font-body text-sm font-medium mt-2">After clicking "PAY NOW", you will receive bank transfer instructions via email.</p>
                  <p className="font-body text-xs text-on-surface-variant mt-4 font-bold">YEP'26: THE KALEIDO SOUL · MB Bank · 0123456789 · Tran Ngoc Minh</p>
                </div>
              </div>
            )}

            {state.paymentMethod === 'payos' && payosData && (
              <div className="bg-primary-container border-4 border-primary p-6 text-center space-y-4">
                <p className="font-display font-black text-lg uppercase tracking-wider">Scan QR to Pay</p>
                <img src={payosData.qrCode} alt="PayOS QR Code" className="w-48 h-48 mx-auto border-4 border-primary bg-white" />
                <p className="font-body text-sm font-medium">Order Code: <span className="font-display font-bold">{payosData.orderCode}</span></p>
                <a
                  href={payosData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-secondary text-white border-4 border-primary px-6 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary transition-colors"
                >
                  Open PayOS Payment <ExternalLink className="w-4 h-4" />
                </a>
                <p className="font-body text-xs text-on-surface-variant font-medium">
                  After completing payment on PayOS, your tickets will be sent to your email.
                </p>
              </div>
            )}

            {state.paymentMethod === 'payos' && !payosData && !processing && (
              <div className="bg-primary-container border-4 border-primary p-6 text-center space-y-4">
                <QrCode className="w-12 h-12 mx-auto text-primary" />
                <div>
                  <p className="font-display font-black text-lg uppercase tracking-wider">PayOS QR Payment</p>
                  <p className="font-body text-sm font-medium mt-2">Pay securely via VietQR using the PayOS gateway. Click "PAY NOW" to generate your payment QR code.</p>
                </div>
              </div>
            )}
          </section>

          {!state.paymentMethod && (
            <div className="bg-primary-container border-4 border-primary p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-body text-xs font-bold uppercase tracking-wider leading-relaxed">
                Please select a payment method to continue.
              </p>
            </div>
          )}
        </div>

        {/* Right: Order Summary + Pay Button */}
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-surface border-4 border-primary p-6 md:p-8 neo-shadow">
              <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 border-b-4 border-primary pb-3 flex items-center justify-between">
                FINAL SUMMARY
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm font-display font-bold uppercase tracking-wider">
                  <span>{state.userType === 'vinnunian' ? 'VINNUNIAN' : 'NON-VINNUNIAN'} ×{state.ticketQuantity}</span>
                  <span>{formatVND(ticketPrice * state.ticketQuantity)}</span>
                </div>

                {state.merch.filter(m => m.quantity > 0).map(m => (
                  <div key={m.id} className="flex justify-between text-sm font-display font-bold">
                    <span className="uppercase tracking-wider">{m.name} ×{m.quantity}</span>
                    <span>{formatVND(m.price * m.quantity)}</span>
                  </div>
                ))}

                <div className="border-t-2 border-primary pt-3 flex justify-between text-xs font-display font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>SERVICE FEE (3%)</span>
                  <span>{formatVND(serviceFee)}</span>
                </div>

                {ticketBulkDiscount > 0 && (
                  <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-secondary">
                    <span>TICKET BULK DISCOUNT</span>
                    <span>-{formatVND(ticketBulkDiscount)}</span>
                  </div>
                )}

                {merchBulkDiscount > 0 && (
                  <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-secondary">
                    <span>MERCH BUNDLE DISCOUNT</span>
                    <span>-{formatVND(merchBulkDiscount)}</span>
                  </div>
                )}

              </div>

              <div className="bg-primary-container border-4 border-primary p-4 flex justify-between items-end mb-6">
                <span className="font-display font-black text-lg uppercase tracking-widest">TOTAL DUE</span>
                <span className="font-display text-2xl md:text-3xl font-black tracking-tighter">
                  {formatVND(total)}
                </span>
              </div>

              {error && (
                <div className="bg-secondary/10 border-4 border-secondary p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-secondary" />
                  <p className="font-body text-xs font-bold uppercase tracking-wider text-secondary leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={!state.paymentMethod || processing || (state.paymentMethod === 'payos' && payosData !== null)}
                className={cn(
                  'w-full flex items-center justify-center gap-2 border-4 border-primary py-4 font-display font-black text-xl md:text-2xl uppercase tracking-widest transition-all mb-6',
                  state.paymentMethod && !processing && !(state.paymentMethod === 'payos' && payosData !== null)
                    ? 'bg-secondary text-white hover:bg-primary hover:text-white neo-shadow-sm active:translate-y-1 active:shadow-none animate-pulse'
                    : 'bg-surface-dim text-on-surface-variant cursor-not-allowed'
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {state.paymentMethod === 'payos' ? 'GENERATING QR...' : 'PROCESSING...'}
                  </>
                ) : payosData ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    PAYOS QR GENERATED
                  </>
                ) : (
                  <>
                    {state.paymentMethod ? 'PAY NOW' : 'SELECT PAYMENT'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="bg-primary-container border-4 border-primary p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-wider leading-relaxed">
                  {state.paymentMethod === 'bank'
                    ? 'Bạn sẽ nhận hướng dẫn chuyển khoản qua email. Vé được gửi sau khi nhận thanh toán.'
                    : "BY CLICKING PAY, YOU AGREE TO THE YEP'26 TERMS OF ATTENDANCE."}
                </p>
              </div>
            </div>

            <Link
              to="/confirmation"
              className="flex items-center gap-2 bg-surface border-4 border-primary px-6 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              BACK TO CONFIRMATION
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
