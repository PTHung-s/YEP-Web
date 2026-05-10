import React, { useState } from 'react';
import { CreditCard, Landmark, ShoppingBag, UserPlus, Info } from 'lucide-react';
import { cn } from './Layout';

export function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'bank'>('credit');

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.8] tracking-tighter mb-6 text-primary">
          BOOKING<br />& MERCH
        </h2>
        <div className="h-1 lg:h-2 w-24 md:w-32 bg-secondary"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Form & Merch */}
        <div className="xl:col-span-7 space-y-10">
          
          {/* Checkout Form Container */}
          <section className="bg-surface p-6 md:p-10 border-4 border-primary neo-shadow">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
              <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
              ATTENDEE INFORMATION
            </h3>
            
            <form className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">FULL NAME</label>
                <input 
                  type="text" 
                  placeholder="BAUHAUS DESIGNER" 
                  className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">STUDENT ID</label>
                  <input 
                    type="text" 
                    placeholder="2004XXXX" 
                    className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">UNIVERSITY EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="DESIGNER@VINUNI.EDU.VN" 
                    className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg focus:outline-none focus:ring-0 focus:border-secondary transition-colors placeholder-primary/30 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block font-display text-xs md:text-sm font-black uppercase tracking-widest text-primary">TICKET TYPE</label>
                <div className="relative">
                  <select className="w-full bg-white border-2 border-primary py-3 px-4 font-display text-lg font-bold focus:outline-none focus:ring-0 focus:border-secondary transition-colors appearance-none cursor-pointer">
                    <option>GENERAL ADMISSION - FREE</option>
                    <option>VIP LOUNGE ACCESS - $45</option>
                    <option>BACKSTAGE PASS - $120</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none border-l-2 border-primary bg-surface">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </form>
          </section>

          {/* Payment Section */}
          <section className="bg-surface p-6 md:p-10 border-4 border-primary neo-shadow">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
               <span className="bg-primary text-background w-10 h-10 flex items-center justify-center font-bold text-xl">02</span>
               PAYMENT METHOD
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <label className="cursor-pointer group">
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
                <div className={cn(
                  "border-4 border-primary p-6 flex flex-col items-center gap-4 transition-all duration-200",
                  paymentMethod === 'credit' ? "bg-primary-container neo-shadow-sm -translate-y-1" : "bg-white hover:bg-surface-container"
                )}>
                  <CreditCard className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="font-display text-lg font-black uppercase tracking-widest">CREDIT CARD</span>
                </div>
              </label>
              <label className="cursor-pointer group">
                <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                <div className={cn(
                  "border-4 border-primary p-6 flex flex-col items-center gap-4 transition-all duration-200",
                  paymentMethod === 'bank' ? "bg-primary-container neo-shadow-sm -translate-y-1" : "bg-white hover:bg-surface-container"
                )}>
                  <Landmark className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="font-display text-lg font-black uppercase tracking-widest">BANK TRANSFER</span>
                </div>
              </label>
            </div>

             {paymentMethod === 'credit' && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
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
              </div>
            )}
          </section>

          {/* Merch Section */}
          <section className="bg-primary text-background p-6 md:p-10 border-4 border-primary neo-shadow">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-8 flex items-center gap-3 tracking-tight">
              <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-background" />
              EXCLUSIVE MERCH
            </h3>
            
            <div className="space-y-6">
              {/* Merch Item 1 */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 md:px-6 bg-surface text-primary border-4 border-primary relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white shrink-0 border-4 border-primary relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500" alt="T-Shirt" className="w-full h-full object-cover grayscale mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-grow text-center md:text-left space-y-1">
                  <h4 className="font-display font-black uppercase text-xl tracking-tight">"REBELS" OVERSIZED TEE</h4>
                  <p className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant">Heavy cotton / Screen printed</p>
                </div>
                <div className="flex flex-col items-center gap-2 md:gap-4 md:items-end">
                  <div className="font-display font-black text-2xl">$35.00</div>
                  <div className="flex items-center border-4 border-primary bg-background">
                    <button className="px-3 py-1.5 md:px-4 md:py-2 hover:bg-primary-container transition-colors border-r-4 border-primary font-display font-black text-lg hover:text-primary">-</button>
                    <span className="px-4 py-1.5 md:px-5 md:py-2 font-display font-black text-lg">1</span>
                    <button className="px-3 py-1.5 md:px-4 md:py-2 hover:bg-primary-container transition-colors border-l-4 border-primary font-display font-black text-lg hover:text-primary">+</button>
                  </div>
                </div>
              </div>

               {/* Merch Item 2 */}
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 md:px-6 bg-surface text-primary border-4 border-primary relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white shrink-0 border-4 border-primary relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=500" alt="Cap" className="w-full h-full object-cover grayscale mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-grow text-center md:text-left space-y-1">
                  <h4 className="font-display font-black uppercase text-xl tracking-tight">VINUNI TRUCKER CAP</h4>
                  <p className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant">Embroidered logo / Adjustable</p>
                </div>
                <div className="flex flex-col items-center gap-2 md:gap-4 md:items-end">
                  <div className="font-display font-black text-2xl">$20.00</div>
                  <div className="flex items-center border-4 border-primary bg-background">
                    <button className="px-3 py-1.5 md:px-4 md:py-2 hover:bg-primary-container transition-colors border-r-4 border-primary font-display font-black text-lg hover:text-primary">-</button>
                    <span className="px-4 py-1.5 md:px-5 md:py-2 font-display font-black text-lg">0</span>
                    <button className="px-3 py-1.5 md:px-4 md:py-2 hover:bg-primary-container transition-colors border-l-4 border-primary font-display font-black text-lg hover:text-primary">+</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Order Summary */}
        <aside className="xl:col-span-5 relative mt-12 xl:mt-0">
          <div className="xl:sticky xl:top-32 space-y-8">
            
            {/* Summary Card */}
            <div className="bg-surface border-4 border-primary p-6 md:p-10 neo-shadow">
              <h3 className="font-display text-3xl font-black uppercase mb-8 border-b-4 border-primary pb-4 flex items-center justify-between">
                ORDER SUMMARY
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-base md:text-lg font-display font-bold uppercase tracking-wider">
                  <span>1X GENERAL TICKET</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg font-display font-bold uppercase tracking-wider">
                  <span>1X "REBELS" TEE</span>
                  <span>$35.00</span>
                </div>
                <div className="flex justify-between items-center text-base md:text-lg font-display font-bold uppercase tracking-wider text-primary/50">
                  <span>2X CANVAS TOTE</span>
                  <span className="line-through">$30.00</span>
                </div>
                
                <div className="pt-4 border-t-2 border-primary flex justify-between items-center text-xs font-display font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>TAXES & PROCESSING</span>
                  <span>$4.50</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8 bg-primary-container p-4 md:p-6 border-4 border-primary">
                <span className="font-display font-black text-xl md:text-2xl uppercase tracking-widest">TOTAL DUE</span>
                <span className="font-display text-4xl md:text-5xl font-black tracking-tighter leading-none">$69.50</span>
              </div>
              
              <button className="w-full bg-tertiary text-white py-4 md:py-5 border-4 border-primary font-display font-black text-xl md:text-2xl uppercase tracking-widest hover:bg-primary hover:text-background transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none mb-6">
                 CONFIRM ORDER
              </button>
              
              <p className="font-body text-[10px] md:text-xs text-center uppercase font-bold tracking-wider text-on-surface-variant leading-relaxed">
                BY CLICKING CONFIRM, YOU AGREE TO THE<br />VINUNI YEP 2024 TERMS OF ATTENDANCE.
              </p>
            </div>

            {/* Promo Alert */}
            <div className="bg-primary-container border-4 border-primary p-6 neo-shadow-sm">
              <div className="flex gap-4 items-start">
                <Info className="w-8 h-8 shrink-0 text-primary" strokeWidth={2.5} />
                <div className="space-y-2">
                  <h4 className="font-display text-lg font-black uppercase tracking-widest">FLASH SALE ACTIVE</h4>
                  <p className="font-body text-xs font-bold uppercase tracking-wider leading-relaxed text-on-surface-variant">
                    EARLY BIRD MERCH PRICING IS AVAILABLE UNTIL OCT 15TH. STUDENT DISCOUNT AUTOMATICALLY APPLIED TO YOUR ID.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </aside>
      </div>
    </div>
  );
}
