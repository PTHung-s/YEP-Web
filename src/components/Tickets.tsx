import React, { useEffect, useRef, useState } from 'react';
import { School, Users, CheckCircle, ArrowRight, ArrowLeft, Ticket, Shirt, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, type UserType, type UserCategory } from '../store/CartContext';
import { useEventConfig } from '../store/EventConfigContext';
import { cn } from './Layout';
import { yepAsset } from '../lib/assets';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

function StepIndicator({ current }: { current: number }) {
  const steps = ['TICKET TYPE', 'YOUR INFO', 'QUANTITY & MERCH'];
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-10">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary flex items-center justify-center font-display font-black text-sm',
              i + 1 <= current ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant'
            )}>
              {i + 1 < current ? '✓' : i + 1}
            </span>
            <span className={cn(
              'hidden md:block font-display text-xs font-bold uppercase tracking-widest',
              i + 1 <= current ? 'text-on-surface-variant' : 'text-on-surface-variant'
            )}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('h-0.5 w-8 md:w-12', i + 1 < current ? 'bg-primary' : 'bg-outline-variant')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function Tickets() {
  const { state, dispatch, getTicketBulkDiscount, getMerchBulkDiscount } = useCart();
  const { config } = useEventConfig();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const fullNameRef = useRef<HTMLInputElement | null>(null);

  const isLocked = config.salesStatus === 'sold_out' || config.salesStatus === 'not_started';
  const effectiveTicketPrice = (userType: UserType): number => {
    if (config.earlyBirdEnabled && userType === 'vinnunian') return config.prices.earlyBird;
    if (userType === 'vinnunian') return config.prices.vinnunian;
    return config.prices.guest;
  };

  const ticketPrice = effectiveTicketPrice(state.userType);
  const ticketBulkDiscount = getTicketBulkDiscount();
  const merchBulkDiscount = getMerchBulkDiscount();
  const isEarlyBirdOrder = state.userType === 'vinnunian' && config.earlyBirdEnabled;

  const canNextStep1 = state.userType !== null && !isLocked;
  const canNextStep2 = (() => {
    if (isLocked) return false;
    if (!state.fullName.trim() || !state.email.trim() || !state.phone.trim()) return false;
    if (state.userType === 'vinnunian') {
      if (!state.userCategory) return false;
      if (!state.email.toLowerCase().endsWith('@vinuni.edu.vn')) return false;
    } else {
      if (!state.workplace.trim()) return false;
      if (state.upcomingStudent && !state.applicationId.trim()) return false;
    }
    return true;
  })();
  const canNextStep3 = state.ticketQuantity >= 1 && !isLocked;

  const nextStep = () => {
    if (step === 1 && !canNextStep1) return;
    if (step === 2 && !canNextStep2) return;
    if (step === 3 && !canNextStep3) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigate('/confirmation');
    }
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    if (step !== 2) return;
    if (fullNameRef.current) {
      fullNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fullNameRef.current.focus();
    }
  }, [step]);

  const handleUserTypeSelect = (type: UserType) => {
    if (isLocked) return;
    dispatch({ type: 'SET_USER_TYPE', payload: type });
    setStep(2);
    window.scrollTo(0, 0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="relative mb-8 md:mb-12 border-4 border-primary overflow-hidden bg-primary text-white p-6 md:p-10 min-h-[320px] flex flex-col justify-end">
        <img
          src={yepAsset('background-kaleido.webp')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <div className="relative z-10">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-4">
          SELECT YOUR <br /> ACCESS LEVEL.
        </h1>
        <p className="font-body text-lg md:text-xl max-w-2xl text-white/80 font-medium leading-relaxed">
          Secure your entry to the most anticipated year-end party at VinUni.
        </p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* Empty State Banners */}
      {config.salesStatus === 'sold_out' && (
        <div className="bg-secondary text-white border-4 border-primary p-4 md:p-6 mb-8 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
          <div>
            <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-wider">SOLD OUT</h3>
            <p className="font-body text-sm font-bold uppercase tracking-wider opacity-90">All tickets have been sold. Thank you for your overwhelming support!</p>
          </div>
        </div>
      )}

      {config.salesStatus !== 'sold_out' && config.salesStatus === 'not_started' && (
        <div className="bg-[#0c1016]/95 text-white border-4 border-[#2c3a4f] p-4 md:p-6 mb-8 flex items-center gap-4">
          <Clock className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
          <div>
            <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-wider">SALES NOT OPEN YET</h3>
            <p className="font-body text-sm font-bold uppercase tracking-wider text-[#cbd6e4]/80">
              Ticket sales start on {new Date(config.salesStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Come back then!
            </p>
          </div>
        </div>
      )}

      {step === 1 && !isLocked && config.earlyBirdEnabled && (
        <div className="bg-primary-container border-4 border-primary p-4 md:p-6 mb-8 flex items-center gap-4">
          <Zap className="w-8 h-8 md:w-10 md:h-10 shrink-0 text-secondary" />
          <div className="flex-1">
            <h3 className="font-display text-xl md:text-2xl font-black uppercase tracking-wider flex items-center gap-3">
              🎟 EARLY BIRD ACTIVE
              <span className="bg-secondary text-white px-2 py-0.5 text-xs font-black tracking-widest border-2 border-primary">LIMITED</span>
            </h3>
            <p className="font-body text-sm font-bold uppercase tracking-wider text-on-surface-variant mt-1">
              VinUnian tickets only {formatVND(config.prices.earlyBird)}! Exclusive for VinUni community.
            </p>
          </div>
        </div>
      )}

      {!isLocked && !config.earlyBirdEnabled && (
        <div className="bg-surface border-4 border-primary p-4 mb-8 flex items-center gap-4">
          <Clock className="w-6 h-6 shrink-0" />
          <p className="font-body text-sm font-bold uppercase tracking-wider">Regular pricing. Tickets available for both VinUnian and Non-VinUnian.</p>
        </div>
      )}

      <div className="max-w-5xl">
        {/* Main content */}
        <div className="space-y-8">

          {/* ===== STEP 1: User Type Selection ===== */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
                <span className="bg-primary text-white w-10 h-10 flex items-center justify-center font-bold text-xl">01</span>
                SELECT YOUR IDENTITY
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleUserTypeSelect('vinnunian')}
                  disabled={isLocked}
                  className={cn(
                    'relative border-4 border-primary p-6 md:p-8 text-left transition-all duration-300',
                    isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:-translate-y-1',
                    state.userType === 'vinnunian'
                      ? 'bg-primary-container neo-shadow'
                      : 'bg-surface hover:bg-surface-container'
                  )}
                >
                  {config.earlyBirdEnabled && (
                    <div className="absolute -top-4 -right-4 z-10 -rotate-12 bg-secondary text-white px-3 py-1.5 border-2 border-primary neo-shadow-sm">
                      <span className="font-display font-black text-sm tracking-tighter italic uppercase">EARLY BIRD</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight">VINUNIAN</h4>
                    <School className="w-7 h-7" />
                  </div>
                  <div className="mb-3">
                    <span className="font-display text-4xl md:text-5xl font-black tracking-tighter">
                      {config.earlyBirdEnabled ? formatVND(config.prices.earlyBird) : formatVND(config.prices.vinnunian)}
                    </span>
                    {config.earlyBirdEnabled && (
                      <span className="ml-2 text-sm font-display font-bold text-on-surface-variant line-through">{formatVND(config.prices.vinnunian)}</span>
                    )}
                  </div>
                  <p className="font-display text-xs font-black uppercase tracking-widest text-secondary">
                    STUDENTS · FACULTY · STAFF · ALUMNI
                  </p>
                </button>

                <button
                  onClick={() => handleUserTypeSelect('non-vinnunian')}
                  disabled={!config.allowGuests || isLocked}
                  className={cn(
                    'border-4 border-primary p-6 md:p-8 text-left transition-all duration-300',
                    (!config.allowGuests || isLocked)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:-translate-y-1',
                    state.userType === 'non-vinnunian'
                      ? 'bg-primary-container neo-shadow'
                      : 'bg-surface hover:bg-surface-container'
                  )}
                >
                  {!config.allowGuests && (
                    <div className="absolute -top-4 -right-4 z-10 bg-surface-dim border-2 border-primary px-3 py-1.5">
                      <span className="font-display font-black text-xs text-on-surface-variant tracking-tighter uppercase">LOCKED</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-display text-xl md:text-2xl font-black uppercase tracking-tight">NON-VINUNIAN</h4>
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="mb-3">
                    <span className="font-display text-4xl md:text-5xl font-black tracking-tighter">{formatVND(config.prices.guest)}</span>
                  </div>
                  <p className="font-display text-xs font-black uppercase tracking-widest text-on-surface-variant">
                    GUEST ENTRANCE PASS
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Personal Information ===== */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
                <span className="bg-primary text-white w-10 h-10 flex items-center justify-center font-bold text-xl">02</span>
                ATTENDEE INFORMATION
              </h3>

              <div className="bg-surface border-4 border-primary p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">FULL NAME *</label>
                  <input
                    type="text"
                    value={state.fullName}
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'fullName', value: e.target.value })}
                    ref={fullNameRef}
                    placeholder="NGUYEN VAN A"
                    className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">
                      EMAIL *
                      {state.userType === 'vinnunian' && <span className="text-secondary ml-1">(@vinuni.edu.vn)</span>}
                    </label>
                    <input
                      type="email"
                      value={state.email}
                      onChange={e => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                      placeholder={state.userType === 'vinnunian' ? 'name@vinuni.edu.vn' : 'email@example.com'}
                      className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                    />
                    {state.userType === 'vinnunian' && state.email && !state.email.toLowerCase().endsWith('@vinuni.edu.vn') && (
                      <p className="text-secondary font-display text-xs font-bold uppercase tracking-wider">
                        Email must end with @vinuni.edu.vn
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">PHONE NUMBER *</label>
                    <input
                      type="tel"
                      value={state.phone}
                      onChange={e => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
                      placeholder="0123 456 789"
                      className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                    />
                  </div>
                </div>

                {state.userType === 'vinnunian' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">CATEGORY *</label>
                      <div className="relative">
                        <select
                          value={state.userCategory || ''}
                          onChange={e => dispatch({ type: 'SET_USER_CATEGORY', payload: (e.target.value || null) as UserCategory })}
                          className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg font-bold focus:outline-none focus:border-secondary transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">-- SELECT --</option>
                          <option value="student">STUDENT</option>
                          <option value="faculty">FACULTY</option>
                          <option value="staff">STAFF</option>
                          <option value="alumni">ALUMNI</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none border-l-2 border-primary bg-surface">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">STUDENT ID</label>
                      <input
                        type="text"
                        value={state.studentId}
                        onChange={e => dispatch({ type: 'SET_FIELD', field: 'studentId', value: e.target.value })}
                        placeholder="2004XXXX"
                        className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                      />
                    </div>
                  </div>
                )}

                {state.userType === 'non-vinnunian' && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">WORKPLACE / ADDRESS *</label>
                      <input
                        type="text"
                        value={state.workplace}
                        onChange={e => dispatch({ type: 'SET_FIELD', field: 'workplace', value: e.target.value })}
                        placeholder="ABC Company / 123 Nguyen Trai, District 1..."
                        className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                      />
                    </div>

                    <label className="flex items-start gap-3 border-2 border-primary p-3 bg-surface">
                      <input
                        type="checkbox"
                        checked={state.upcomingStudent}
                        onChange={e => dispatch({ type: 'SET_UPCOMING_STUDENT', payload: e.target.checked })}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                      />
                      <span>
                        <span className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">
                          Upcoming student
                        </span>
                        <span className="mt-1 block font-body text-[11px] md:text-xs font-bold leading-relaxed text-on-surface-variant">
                          Cohort 7 students who have received an offer can register to receive merch.
                        </span>
                      </span>
                    </label>

                    {state.upcomingStudent && (
                      <div className="space-y-3">
                        <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-on-surface-variant">APPLICATION ID *</label>
                        <input
                          type="text"
                          value={state.applicationId}
                          onChange={e => dispatch({ type: 'SET_FIELD', field: 'applicationId', value: e.target.value })}
                          placeholder="Application ID"
                          className="w-full bg-white text-background border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                        />
                        <p className="text-on-surface-variant font-display text-xs font-bold uppercase tracking-wider">
                          Please bring your offer letter to receive merch on D-Day.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-primary-container border-4 border-primary p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
                  <p className="font-body text-xs md:text-sm font-bold uppercase tracking-wider leading-relaxed">
                    Vé sẽ được gửi về email của bạn. Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Ticket Quantity & Merch ===== */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl md:text-3xl font-black uppercase flex items-center gap-3">
                <span className="bg-primary text-white w-10 h-10 flex items-center justify-center font-bold text-xl">03</span>
                QUANTITY & MERCH
              </h3>

              <div className="bg-surface border-4 border-primary p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-secondary" />
                  <h4 className="font-display text-lg font-black uppercase tracking-wider">AUTO DISCOUNTS</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.discounts.ticketBulk.enabled && config.discounts.ticketBulk.tiers.length > 0 && (
                    <div className="border-2 border-primary bg-primary-container/50 p-4">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-tertiary" />
                        <span className="font-display text-sm font-black uppercase tracking-widest">Bulk Tickets</span>
                      </div>
                      <div className="mt-3 space-y-1 font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {config.discounts.ticketBulk.tiers.map(tier => (
                          <div key={tier.minQty}>
                            {Math.round(tier.rate * 100)}% OFF{' '}
                            <span className="normal-case">for</span>{' '}
                            {tier.minQty}+ tickets
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {config.discounts.merchBundle.enabled && (
                    <div className="border-2 border-primary bg-primary-container/50 p-4">
                      <div className="flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-secondary" />
                        <span className="font-display text-sm font-black uppercase tracking-widest">Merch Bundle</span>
                      </div>
                      <p className="mt-3 font-body text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        {Math.round(config.discounts.merchBundle.rate * 100)}% OFF merch{' '}
                        <span className="normal-case">for</span>{' '}
                        {config.discounts.merchBundle.minTickets}+ tickets
                      </p>
                    </div>
                  )}

                  {!config.discounts.ticketBulk.enabled && !config.discounts.merchBundle.enabled && (
                    <div className="border-2 border-primary bg-primary-container/50 p-4">
                      <span className="font-display text-sm font-black uppercase tracking-widest">No vouchers available</span>
                    </div>
                  )}
                </div>

                {isEarlyBirdOrder && (
                  <p className="font-body text-xs font-bold uppercase tracking-wider text-secondary">
                    Early Bird tickets are not eligible{' '}
                    <span className="normal-case">for</span>{' '}
                    bulk ticket discounts.
                  </p>
                )}
              </div>

              {/* Ticket Quantity */}
              <div className="bg-surface border-4 border-primary p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Ticket className="w-6 h-6" />
                  <h4 className="font-display text-xl font-black uppercase tracking-tight">
                    {state.userType === 'vinnunian' ? 'VINUNIAN TICKET' : 'NON-VINUNIAN TICKET'}
                  </h4>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="font-display text-3xl font-black tracking-tighter">{formatVND(ticketPrice)}</p>
                    <p className="font-body text-sm text-on-surface-variant font-medium mt-1">per ticket</p>
                  </div>
                  <div className="grid w-full max-w-[260px] grid-cols-3 border-4 border-primary bg-background md:w-auto">
                    <button
                      onClick={() => dispatch({ type: 'SET_TICKET_QUANTITY', payload: state.ticketQuantity - 1 })}
                      className="h-12 w-full hover:bg-primary-container transition-colors border-r-4 border-primary font-display font-black text-lg md:h-14 md:px-4 md:text-xl"
                    >
                      -
                    </button>
                    <span className="flex h-12 items-center justify-center px-3 font-display font-black text-lg md:h-14 md:min-w-[60px] md:px-6 md:text-xl">{state.ticketQuantity}</span>
                    <button
                      onClick={() => dispatch({ type: 'SET_TICKET_QUANTITY', payload: state.ticketQuantity + 1 })}
                      className="h-12 w-full hover:bg-primary-container transition-colors border-l-4 border-primary font-display font-black text-lg md:h-14 md:px-4 md:text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
                {ticketBulkDiscount > 0 && (
                  <div className="bg-primary-container border-2 border-primary p-3">
                    <p className="font-body text-xs font-bold uppercase tracking-wider text-secondary">
                      Bulk ticket discount applied: -{formatVND(ticketBulkDiscount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Merch Selection */}
              <div className="bg-primary text-white border-4 border-primary p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shirt className="w-6 h-6 text-white" />
                  <h4 className="font-display text-xl font-black uppercase tracking-tight">EXCLUSIVE MERCH</h4>
                </div>
                <p className="font-body text-xs font-bold uppercase tracking-wider opacity-80">
                  Nhận merch tại booth của VinUni Student Council hoặc nhận trực tiếp trong sự kiện.
                </p>
                {state.ticketQuantity >= 3 && (
                  <div className="bg-surface text-on-surface-variant border-2 border-primary px-3 py-2 inline-flex items-center">
                    <span className="font-display text-xs font-black uppercase tracking-wider">
                      Merch discount active: -{formatVND(merchBulkDiscount)}
                    </span>
                  </div>
                )}

                {state.merch.map(item => (
                  <div key={item.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-surface border-4 border-primary">
                    <div className="flex-grow text-center md:text-left">
                      <h5 className="font-display font-black uppercase text-lg tracking-tight">{item.name}</h5>
                      <p className="font-display text-xl font-black mt-1">{formatVND(item.price)}</p>
                    </div>
                    <div className="grid w-full max-w-[220px] grid-cols-3 border-4 border-primary bg-background md:w-auto">
                      <button
                        onClick={() => dispatch({ type: 'SET_MERCH_QUANTITY', id: item.id, quantity: item.quantity - 1 })}
                        className="h-11 w-full hover:bg-primary-container transition-colors border-r-4 border-primary font-display font-black text-base md:h-12 md:px-3 md:text-lg"
                      >
                        -
                      </button>
                      <span className="flex h-11 items-center justify-center px-3 font-display font-black text-base md:h-12 md:min-w-[50px] md:px-5 md:text-lg">{item.quantity}</span>
                      <button
                        onClick={() => dispatch({ type: 'SET_MERCH_QUANTITY', id: item.id, quantity: item.quantity + 1 })}
                        className="h-11 w-full hover:bg-primary-container transition-colors border-l-4 border-primary font-display font-black text-base md:h-12 md:px-3 md:text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 sm:gap-4">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap bg-surface border-4 border-primary px-3 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-colors sm:flex-none sm:px-6 sm:text-lg"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                BACK
              </button>
            ) : (
              <Link
                to="/"
                className="flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap bg-surface border-4 border-primary px-3 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary-container transition-colors sm:flex-none sm:px-6 sm:text-lg"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                HOME
              </Link>
            )}

            <button
              onClick={nextStep}
              disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2) || (step === 3 && !canNextStep3)}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap border-4 border-primary px-3 py-3 font-display font-black text-sm uppercase tracking-widest transition-all sm:flex-none sm:px-6 sm:text-lg',
                ((step === 1 && canNextStep1) || (step === 2 && canNextStep2) || (step === 3 && canNextStep3))
                  ? 'bg-primary text-white hover:bg-background hover:text-primary neo-shadow-sm active:translate-y-1 active:shadow-none'
                  : 'bg-surface-dim text-on-surface-variant cursor-not-allowed'
              )}
            >
              {step === 3 ? 'REVIEW ORDER' : 'NEXT STEP'}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
