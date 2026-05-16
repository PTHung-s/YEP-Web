import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Ticket, Percent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { cn } from './Layout';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

const VALID_DISCOUNTS: Record<string, { amount: number; label: string }> = {
  'VINUNI_YEP_26': { amount: 50000, label: "YEP'26 Welcome Discount" },
  'EARLYBIRD': { amount: 100000, label: 'Early Bird 100K Off' },
};

export function Confirmation() {
  const { state, dispatch, getTicketPrice, getServiceFee, getTotal, getTicketBulkDiscount, getMerchBulkDiscount } = useCart();
  const navigate = useNavigate();
  const [discountInput, setDiscountInput] = useState(state.discountCode);
  const [discountError, setDiscountError] = useState('');
  const [emailConfirm, setEmailConfirm] = useState(state.email);

  const ticketPrice = getTicketPrice();
  const serviceFee = getServiceFee();
  const total = getTotal();
  const ticketBulkDiscount = getTicketBulkDiscount();
  const merchBulkDiscount = getMerchBulkDiscount();

  const applyDiscount = () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) {
      dispatch({ type: 'APPLY_DISCOUNT', code: '', amount: 0 });
      setDiscountError('');
      return;
    }
    const match = VALID_DISCOUNTS[code];
    if (match) {
      dispatch({ type: 'APPLY_DISCOUNT', code, amount: match.amount });
      setDiscountError('');
    } else {
      setDiscountError('Invalid discount code');
    }
  };

  const emailMismatch = emailConfirm.trim().toLowerCase() !== state.email.trim().toLowerCase();

  const canProceed = state.userType
    && state.fullName.trim()
    && state.email.trim()
    && state.phone.trim()
    && state.ticketQuantity >= 1
    && !emailMismatch;

  const handleProceed = () => {
    if (!canProceed) return;
    navigate('/checkout');
    window.scrollTo(0, 0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="mb-8 md:mb-12">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
          CONFIRM <br /> YOUR ORDER.
        </h1>
        <p className="font-body text-lg md:text-xl max-w-2xl text-on-surface-variant font-medium leading-relaxed">
          Review your details. Apply a discount code. Then proceed to payment.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-10">
        {[1, 2, 3, 4].map(i => (
          <React.Fragment key={i}>
            <span className={cn(
              'w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary flex items-center justify-center font-display font-black text-sm',
              i <= 4 ? 'bg-primary text-background' : 'bg-surface text-primary'
            )}>
              ✓
            </span>
            {i < 4 && <div className="h-0.5 w-8 md:w-12 bg-primary" />}
          </React.Fragment>
        ))}
        <span className="hidden md:block font-display text-xs font-bold uppercase tracking-widest text-primary ml-2">
          CONFIRMATION
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
        {/* Left: Order Details + Discount */}
        <div className="lg:col-span-3 space-y-8">
          {/* Attendee Info Summary */}
          <div className="bg-surface border-4 border-primary p-6 md:p-8">
            <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <Ticket className="w-6 h-6" />
              ATTENDEE DETAILS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Name</span>
                <span className="font-display font-black text-lg uppercase">{state.fullName || '---'}</span>
              </div>
              <div>
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</span>
                <span className="font-display font-black text-lg">{state.email || '---'}</span>
              </div>
              <div>
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Phone</span>
                <span className="font-display font-black text-lg">{state.phone || '---'}</span>
              </div>
              <div>
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Type</span>
                <span className="font-display font-black text-lg uppercase">
                  {state.userType === 'vinnunian' ? `VINNUNIAN · ${state.userCategory?.toUpperCase() || ''}` : 'NON-VINNUNIAN'}
                </span>
              </div>
              {state.userType === 'vinnunian' && state.studentId && (
                <div>
                  <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Student ID</span>
                  <span className="font-display font-black text-lg">{state.studentId}</span>
                </div>
              )}
              {state.userType === 'non-vinnunian' && state.workplace && (
                <div>
                  <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Workplace</span>
                  <span className="font-display font-black text-lg">{state.workplace}</span>
                </div>
              )}
            </div>

            {/* Email re-confirmation */}
            <div className="mt-6 pt-6 border-t-2 border-primary">
              <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary mb-3">
                CONFIRM EMAIL ADDRESS *
              </label>
              <input
                type="email"
                value={emailConfirm}
                onChange={e => setEmailConfirm(e.target.value)}
                placeholder="Re-enter your email address"
                className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
              />
              {emailMismatch && emailConfirm && (
                <p className="text-secondary font-display text-xs font-bold uppercase tracking-wider mt-2">
                  Email addresses do not match
                </p>
              )}
            </div>
          </div>

          {/* Discount Code */}
          <div className="bg-surface border-4 border-primary p-6 md:p-8">
            <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <Percent className="w-6 h-6" />
              DISCOUNT CODE
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={discountInput}
                onChange={e => setDiscountInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                placeholder="Enter code..."
                className="flex-grow bg-white border-2 border-primary py-3 px-4 font-display text-lg font-bold focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 uppercase"
              />
              <button
                onClick={applyDiscount}
                className="bg-primary text-background border-4 border-primary px-6 py-3 font-display font-black text-lg uppercase tracking-widest hover:bg-background hover:text-primary transition-colors"
              >
                APPLY
              </button>
            </div>
            {discountError && (
              <p className="text-secondary font-display text-xs font-bold uppercase tracking-wider mt-2">{discountError}</p>
            )}
            {state.discountAmount > 0 && (
              <div className="mt-4 bg-primary-container border-3 border-primary p-3 flex justify-between items-center">
                <div>
                  <span className="font-display text-sm font-black uppercase tracking-wider">{state.discountCode}</span>
                  <p className="font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {VALID_DISCOUNTS[state.discountCode]?.label || 'Discount applied'}
                  </p>
                </div>
                <span className="font-display text-lg font-black text-secondary">-{formatVND(state.discountAmount)}</span>
              </div>
            )}
            <p className="font-body text-xs text-on-surface-variant font-medium mt-3">
              Try codes: <span className="font-display font-bold">VINUNI_YEP_26</span> (50K off) or <span className="font-display font-bold">EARLYBIRD</span> (100K off)
            </p>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-surface border-4 border-primary p-6 md:p-8">
              <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 border-b-4 border-primary pb-3 flex items-center justify-between">
                ORDER SUMMARY
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm font-display font-bold uppercase tracking-wider">
                  <span>{state.userType === 'vinnunian' ? 'VINNUNIAN' : 'NON-VINNUNIAN'} TICKET ×{state.ticketQuantity}</span>
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

                {state.discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-secondary">
                    <span>DISCOUNT</span>
                    <span>-{formatVND(state.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="bg-primary-container border-3 border-primary p-4 flex justify-between items-end mb-8">
                <span className="font-display font-black text-lg uppercase tracking-widest">TOTAL DUE</span>
                <span className="font-display text-2xl md:text-3xl font-black tracking-tighter">
                  {formatVND(total)}
                </span>
              </div>

              <button
                onClick={handleProceed}
                disabled={!canProceed}
                className={cn(
                  'w-full flex items-center justify-center gap-2 border-4 border-primary py-4 font-display font-black text-xl uppercase tracking-widest transition-all mb-4',
                  canProceed
                    ? 'bg-tertiary text-white hover:bg-primary hover:text-background neo-shadow-sm active:translate-y-1 active:shadow-none'
                    : 'bg-surface-dim text-on-surface-variant cursor-not-allowed'
                )}
              >
                PROCEED TO PAYMENT
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="bg-primary-container border-4 border-primary p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-wider leading-relaxed">
                  Vé điện tử sẽ được gửi về email {state.email || 'của bạn'} sau khi thanh toán thành công. Nhận merch tại booth của VinUni Student Council hoặc nhận trực tiếp trong sự kiện.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/tickets"
                className="flex items-center gap-2 bg-surface border-4 border-primary px-6 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                EDIT ORDER
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
