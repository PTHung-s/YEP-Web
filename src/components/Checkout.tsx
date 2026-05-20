import React, { useState } from 'react';
import { CreditCard, Landmark, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
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
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: state.fullName,
          email: state.email,
          phone: state.phone,
          userType: state.userType,
          userCategory: state.userCategory,
          studentId: state.studentId,
          workplace: state.workplace,
          ticketQuantity: state.ticketQuantity,
          ticketPrice: ticketPrice,
          merchItems: merchData.join('; '),
          merchTotal,
          totalAmount: total,
          ticketBulkDiscount,
          merchBulkDiscount,
          paymentMethod: state.paymentMethod,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment failed');
      }

      const data = await res.json();
      navigate('/success', { state: { ticketId: data.ticketId, ticketCodes: data.ticketCodes || [], storedIn: data.storedIn } });
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || 'Cannot connect to server. Make sure API server is running.');
      setProcessing(false);
    }
  };

  const hasCardInfo = state.paymentMethod === 'credit';

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
              i <= 5 ? 'bg-primary text-background' : 'bg-surface text-primary'
            )}>
              ✓
            </span>
            {i < 5 && <div className="h-0.5 w-8 md:w-12 bg-primary" />}
          </React.Fragment>
        ))}
        <span className="hidden md:block font-display text-xs font-bold uppercase tracking-widest text-primary ml-2">
          PAYMENT
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">
        {/* Left: Payment Method */}
        <div className="lg:col-span-3 space-y-8">
          <section className="bg-surface p-6 md:p-10 border-4 border-primary neo-shadow">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
              <span className="bg-primary text-background w-10 h-10 flex items-center justify-center font-bold text-xl">05</span>
              PAYMENT METHOD
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={state.paymentMethod === 'credit'}
                  onChange={() => dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'credit' })}
                />
                <div className={cn(
                  "border-4 border-primary p-6 flex flex-col items-center gap-4 transition-all duration-200",
                  state.paymentMethod === 'credit' ? "bg-primary-container neo-shadow-sm -translate-y-1" : "bg-white hover:bg-surface-container"
                )}>
                  <CreditCard className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="font-display text-lg font-black uppercase tracking-widest">CREDIT CARD</span>
                </div>
              </label>
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  className="hidden"
                  checked={state.paymentMethod === 'bank'}
                  onChange={() => dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'bank' })}
                />
                <div className={cn(
                  "border-4 border-primary p-6 flex flex-col items-center gap-4 transition-all duration-200",
                  state.paymentMethod === 'bank' ? "bg-primary-container neo-shadow-sm -translate-y-1" : "bg-white hover:bg-surface-container"
                )}>
                  <Landmark className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="font-display text-lg font-black uppercase tracking-widest">BANK TRANSFER</span>
                </div>
              </label>
            </div>

            {state.paymentMethod === 'credit' && (
              <div className="space-y-6 md:space-y-8">
                <div className="space-y-3">
                  <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">CARD NUMBER</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-xl md:text-2xl text-center tracking-[0.2em] focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/20 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">EXP DATE</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg text-center focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">CVV</label>
                    <input
                      type="text"
                      placeholder="000"
                      className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg text-center focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">CARDHOLDER NAME</label>
                  <input
                    type="text"
                    placeholder={state.fullName || 'FULL NAME'}
                    className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                  />
                </div>
              </div>
            )}

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

              <div className="bg-primary-container border-3 border-primary p-4 flex justify-between items-end mb-6">
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
                disabled={!state.paymentMethod || processing}
                className={cn(
                  'w-full flex items-center justify-center gap-2 border-4 border-primary py-4 font-display font-black text-xl md:text-2xl uppercase tracking-widest transition-all mb-6',
                  state.paymentMethod && !processing
                    ? 'bg-secondary text-white hover:bg-primary hover:text-background neo-shadow-sm active:translate-y-1 active:shadow-none animate-pulse'
                    : 'bg-surface-dim text-on-surface-variant cursor-not-allowed'
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    PROCESSING...
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
                  {state.paymentMethod === 'credit'
                    ? 'Thanh toán qua thẻ tín dụng. Vé sẽ được gửi về email sau khi giao dịch thành công.'
                    : state.paymentMethod === 'bank'
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
