import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Ticket, Loader2, Tag, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { cn } from './Layout';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

export function Confirmation() {
  const { state, dispatch, getTicketPrice, getServiceFee, getTotal, getTicketBulkDiscount, getTicketDiscount, getMerchBulkDiscount } = useCart();
  const navigate = useNavigate();
  const [emailConfirm, setEmailConfirm] = useState(state.email);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountMessage, setDiscountMessage] = useState('');
  const [discountToast, setDiscountToast] = useState('');

  const ticketPrice = getTicketPrice();
  const serviceFee = getServiceFee();
  const total = getTotal();
  const ticketBulkDiscount = getTicketBulkDiscount();
  const ticketDiscount = getTicketDiscount();
  const merchBulkDiscount = getMerchBulkDiscount();
  const merchTotal = state.merch.reduce((sum, m) => sum + m.price * m.quantity, 0);
  const hasPurchases = state.ticketQuantity > 0 || merchTotal > 0;

  const emailMismatch = emailConfirm.trim().toLowerCase() !== state.email.trim().toLowerCase();

  const canProceed = state.userType
    && state.fullName.trim()
    && state.email.trim()
    && state.phone.trim()
    && state.ageConfirmed
    && hasPurchases
    && !(state.userType === 'non-vinnunian' && state.upcomingStudent && !state.applicationId.trim())
    && !emailMismatch
    && !processing;

  const handleProceed = async () => {
    if (!canProceed) return;
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
          ageConfirmed: state.ageConfirmed,
          userType: state.userType,
          userCategory: state.userCategory,
          studentId: state.studentId,
          workplace: state.workplace,
          upcomingStudent: state.upcomingStudent,
          applicationId: state.applicationId,
          ticketQuantity: state.ticketQuantity,
          ticketPrice,
          merchItems: merchData.join('; '),
          merchTotal,
          totalAmount: total,
          ticketBulkDiscount,
          ticketDiscount,
          merchBulkDiscount,
          discountCodes: state.appliedDiscounts.map(item => item.code),
          appUrl: window.location.origin,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment failed');
      }

      const data = await res.json();
      if (data.payos) {
        if (data.orderCode && data.statusKey) {
          sessionStorage.setItem(`yep-payos-status:${data.orderCode}`, data.statusKey);
        }
        window.location.href = data.checkoutUrl;
      } else {
        navigate('/success', { state: { ticketId: data.ticketId, ticketCodes: data.ticketCodes || [], storedIn: data.storedIn } });
      }
    } catch (err: any) {
      setError(err.message || 'Cannot connect to server.');
      setProcessing(false);
    }
  };

  const handleApplyDiscount = async () => {
    const code = discountInput.trim().toUpperCase();
    setDiscountMessage('');
    setDiscountToast('');

    if (!code) {
      setDiscountMessage('Enter a discount code.');
      return;
    }

    if (state.appliedDiscounts.some(item => item.code === code)) {
      setDiscountMessage('Code already applied.');
      return;
    }

    setDiscountLoading(true);
    try {
      const res = await fetch('/api/discount/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discountCode: code,
          discountCodes: state.appliedDiscounts.map(item => item.code),
          userType: state.userType,
          ticketQuantity: state.ticketQuantity,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || data.error || 'Invalid discount code');
      }

      dispatch({
        type: 'ADD_APPLIED_DISCOUNT',
        payload: {
          code: data.code,
          name: data.name,
          type: data.type,
          rate: Number(data.rate) || 0,
        },
      });
      setDiscountInput('');
      setDiscountMessage(data.message || 'Discount code applied.');
      if (data.capped) {
        setDiscountToast('Discount applied, but total ticket discount cannot exceed 15%.');
      }
    } catch (err: any) {
      setDiscountMessage(err.message || 'Invalid discount code');
    } finally {
      setDiscountLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="mb-8 md:mb-12">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
          CONFIRM <br /> YOUR ORDER.
        </h1>
        <p className="font-body text-lg md:text-xl max-w-2xl text-on-surface-variant font-medium leading-relaxed">
          Review your details. Then proceed to payment via PayOS.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-4 mb-10">
        {[
          ['TICKET TYPE', true],
          ['YOUR INFO', true],
          ['QUANTITY', true],
          ['PAYMENT', false],
        ].map(([label, done], i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary flex items-center justify-center font-display font-black text-sm',
                done ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant'
              )}>
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden md:block font-display text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
            </div>
            {i < 3 && <div className={cn('h-0.5 w-8 md:w-12', done ? 'bg-primary' : 'bg-outline-variant')} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-surface border-4 border-primary p-6 md:p-8">
            <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 flex items-center gap-3">
              <Ticket className="w-6 h-6" />ATTENDEE DETAILS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Name</span><span className="font-display font-black text-lg uppercase">{state.fullName || '---'}</span></div>
              <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Email</span><span className="font-display font-black text-lg">{state.email || '---'}</span></div>
              <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Phone</span><span className="font-display font-black text-lg">{state.phone || '---'}</span></div>
              <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Type</span><span className="font-display font-black text-lg uppercase">{state.userType === 'vinnunian' ? `VINUNIAN · ${state.userCategory?.toUpperCase() || ''}` : 'NON-VINUNIAN'}</span></div>
              {state.userType === 'vinnunian' && state.studentId && <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Student ID</span><span className="font-display font-black text-lg">{state.studentId}</span></div>}
              {state.userType === 'non-vinnunian' && state.workplace && <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Workplace</span><span className="font-display font-black text-lg">{state.workplace}</span></div>}
              {state.userType === 'non-vinnunian' && state.upcomingStudent && (
                <>
                  <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Upcoming Student</span><span className="font-display font-black text-lg">YES</span></div>
                  {state.applicationId && <div><span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Application ID</span><span className="font-display font-black text-lg">{state.applicationId}</span></div>}
                </>
              )}
            </div>
            <div className="mt-6 pt-6 border-t-2 border-primary">
              <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant mb-3">CONFIRM EMAIL ADDRESS *</label>
              <input type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)} placeholder="Re-enter your email address" className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold" />
              {emailMismatch && emailConfirm && <p className="text-secondary font-display text-xs font-bold uppercase tracking-wider mt-2">Email addresses do not match</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-32 space-y-6">
            <div className="bg-surface border-4 border-primary p-6 md:p-8">
              <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 border-b-4 border-primary pb-3">ORDER SUMMARY</h3>
              <div className="space-y-3 mb-6">
                {state.ticketQuantity > 0 && (
                  <div className="flex justify-between text-sm font-display font-bold uppercase tracking-wider"><span>{state.userType === 'vinnunian' ? 'VINUNIAN' : 'NON-VINUNIAN'} TICKET ×{state.ticketQuantity}</span><span>{formatVND(ticketPrice * state.ticketQuantity)}</span></div>
                )}
                {state.merch.filter(m => m.quantity > 0).map(m => <div key={m.id} className="flex justify-between text-sm font-display font-bold"><span className="uppercase tracking-wider">{m.name} ×{m.quantity}</span><span>{formatVND(m.price * m.quantity)}</span></div>)}
                {serviceFee > 0 && <div className="border-t-2 border-primary pt-3 flex justify-between text-xs font-display font-bold uppercase tracking-widest text-on-surface-variant"><span>SERVICE FEE (3%)</span><span>{formatVND(serviceFee)}</span></div>}
                {ticketDiscount > 0 && <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-secondary"><span>{state.appliedDiscounts.length > 0 ? 'TICKET DISCOUNT' : 'TICKET BULK DISCOUNT'}</span><span>-{formatVND(ticketDiscount)}</span></div>}
                {merchBulkDiscount > 0 && <div className="flex justify-between text-xs font-display font-bold uppercase tracking-widest text-secondary"><span>MERCH BUNDLE DISCOUNT</span><span>-{formatVND(merchBulkDiscount)}</span></div>}
              </div>

              <div className="mb-6 border-4 border-primary bg-primary-container p-4">
                <label className="mb-3 flex items-center gap-2 font-display text-xs font-black uppercase tracking-widest text-on-surface-variant">
                  <Tag className="h-4 w-4" />
                  Discount / referral code
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={discountInput}
                    onChange={event => setDiscountInput(event.target.value.toUpperCase())}
                    className="min-w-0 flex-1 border-2 border-primary bg-white px-3 py-3 font-display text-sm font-black uppercase tracking-widest text-background focus:outline-none focus:border-secondary"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={discountLoading}
                    className="border-2 border-primary bg-primary px-4 py-3 font-display text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-secondary disabled:opacity-60"
                  >
                    {discountLoading ? 'Checking...' : 'Apply'}
                  </button>
                  {state.appliedDiscounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'CLEAR_APPLIED_DISCOUNTS' });
                        setDiscountInput('');
                        setDiscountMessage('Discount codes removed.');
                        setDiscountToast('');
                      }}
                      className="border-2 border-primary bg-surface px-3 py-3 text-primary transition-colors hover:bg-white"
                      aria-label="Remove all discount codes"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {discountMessage && (
                  <p className="mt-3 font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {discountMessage}
                  </p>
                )}
                {state.appliedDiscounts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {state.appliedDiscounts.map(discount => (
                      <button
                        key={discount.code}
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'REMOVE_APPLIED_DISCOUNT', payload: discount.code });
                          setDiscountMessage(`${discount.code} removed.`);
                          setDiscountToast('');
                        }}
                        className="inline-flex items-center gap-2 border-2 border-secondary bg-secondary/10 px-3 py-2 font-display text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-secondary hover:text-white"
                      >
                        {discount.code}{discount.rate > 0 ? ` · ${Math.round(discount.rate * 100)}%` : ''}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {discountToast && (
                <div className="mb-6 border-4 border-secondary bg-secondary/10 p-4">
                  <p className="font-body text-xs font-black uppercase tracking-wider text-secondary">
                    {discountToast}
                  </p>
                </div>
              )}

              <div className="bg-primary-container border-4 border-primary p-4 flex justify-between items-end mb-6"><span className="font-display font-black text-lg uppercase tracking-widest">TOTAL DUE</span><span className="font-display text-2xl md:text-3xl font-black tracking-tighter">{formatVND(total)}</span></div>
              {error && <div className="bg-secondary/10 border-4 border-secondary p-4 mb-4 flex items-start gap-3"><p className="font-body text-xs font-bold uppercase tracking-wider text-secondary leading-relaxed">{error}</p></div>}
              <button onClick={handleProceed} disabled={!canProceed} className={cn('w-full flex items-center justify-center gap-2 border-4 border-primary py-4 font-display font-black text-xl uppercase tracking-widest transition-all mb-4', canProceed ? 'bg-tertiary text-background hover:bg-primary hover:text-white neo-shadow-sm active:translate-y-1 active:shadow-none' : 'bg-surface-dim text-on-surface-variant cursor-not-allowed')}>
                {processing ? <><Loader2 className="w-5 h-5 animate-spin" />REDIRECTING TO PAYOS...</> : <>PROCEED TO PAYMENT<ArrowRight className="w-5 h-5" /></>}
              </button>
              <div className="bg-primary-container border-4 border-primary p-4 flex items-start gap-3"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /><p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-wider leading-relaxed">You will be redirected to PayOS to complete payment. E-tickets will be sent to {state.email || 'your email'} after confirmed payment.</p></div>
            </div>
            <Link to="/tickets" className="flex items-center gap-2 bg-surface border-4 border-primary px-6 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-colors"><ArrowLeft className="w-4 h-4" />EDIT ORDER</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
