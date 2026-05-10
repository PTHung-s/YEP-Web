import React from 'react';
import { School, Users, CheckCircle, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Tickets() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-24">
      
      {/* Header */}
      <div className="mb-12 md:mb-16">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
          SELECT YOUR <br /> ACCESS LEVEL.
        </h1>
        <p className="font-body text-lg md:text-xl max-w-2xl text-on-surface-variant font-medium leading-relaxed">
          Secure your entry to the most anticipated year-end party at VinUni. Choose between our student and guest packages.
        </p>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mb-24 lg:mb-32">
        
        {/* VINNUNIAN CARD */}
        <div className="relative group perspective">
          {/* Early Bird Stamp */}
          <div className="absolute -top-6 -right-4 md:-right-8 z-10 -rotate-12 bg-secondary text-white px-4 py-2 border-2 border-primary neo-shadow">
             <span className="font-display font-black text-xl tracking-tighter italic uppercase">EARLY BIRD</span>
          </div>
          
          <div className="bg-surface-container-low border-4 border-primary p-6 md:p-10 neo-shadow h-full flex flex-col transition-transform duration-300 hover:-translate-y-2">
            <div className="flex justify-between items-start mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight uppercase">VINNUNIAN</h2>
              <School className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl md:text-7xl font-black tracking-tighter">250K</span>
                <span className="font-display text-xl font-bold uppercase text-on-surface-variant tracking-widest">VND</span>
              </div>
              <p className="font-display text-xs font-black uppercase tracking-widest mt-2 text-secondary">
                EXCLUSIVE RATE FOR STUDENTS & ALUMNI
              </p>
            </div>
            
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-base font-medium">Full venue access including VIP lounge</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-base font-medium">2 Complimentary drink vouchers</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-base font-medium">Commemorative YEP Wristband</span>
              </li>
            </ul>
            
            <button className="w-full bg-primary-container text-primary border-2 md:border-4 border-primary py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-primary hover:text-background transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none">
              SELECT VINNUNIAN
            </button>
          </div>
        </div>

        {/* NON-VINNUNIAN CARD */}
        <div className="bg-surface-container-high border-4 border-primary p-6 md:p-10 neo-shadow h-full flex flex-col transition-transform duration-300 hover:-translate-y-2">
           <div className="flex justify-between items-start mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight uppercase">NON-VINNUNIAN</h2>
              <Users className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl md:text-7xl font-black tracking-tighter">450K</span>
                <span className="font-display text-xl font-bold uppercase text-on-surface-variant tracking-widest">VND</span>
              </div>
              <p className="font-display text-xs font-black uppercase tracking-widest mt-2 text-on-surface-variant">
                GUEST ENTRANCE PASS
              </p>
            </div>
            
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-base font-medium">Full venue access</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-base font-medium">1 Complimentary drink voucher</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-base font-medium">YEP Attendee Wristband</span>
              </li>
            </ul>
            
            <button className="w-full bg-background text-primary border-2 md:border-4 border-primary py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-primary hover:text-background transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none">
              SELECT NON-VINNUNIAN
            </button>
        </div>
      </div>

      {/* Price Breakdown Table */}
      <div className="mb-16 lg:mb-24">
        <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-8 flex items-center gap-4">
          <span className="w-12 h-2 bg-primary block"></span>
          PRICE BREAKDOWN
        </h3>
        
        <div className="border-4 border-primary overflow-x-auto neo-shadow bg-surface">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-primary text-background font-display text-base uppercase tracking-wider">
                <th className="p-4 border-r-2 border-background">ITEM DESCRIPTION</th>
                <th className="p-4 border-r-2 border-background text-center w-24">QTY</th>
                <th className="p-4 text-right w-48">UNIT PRICE</th>
              </tr>
            </thead>
            <tbody className="font-body text-base">
              <tr className="border-b-2 border-primary">
                <td className="p-4 border-r-2 border-primary font-bold uppercase">VINNUNIAN EARLY BIRD ACCESS</td>
                <td className="p-4 border-r-2 border-primary text-center font-bold">01</td>
                <td className="p-4 text-right font-display text-lg font-bold tracking-tight">250,000 VND</td>
              </tr>
              <tr className="border-b-2 border-primary bg-surface-container">
                <td className="p-4 border-r-2 border-primary font-bold uppercase">SERVICE FEE (3%)</td>
                <td className="p-4 border-r-2 border-primary text-center font-bold">01</td>
                <td className="p-4 text-right font-display text-lg font-bold tracking-tight">7,500 VND</td>
              </tr>
              <tr>
                <td className="p-4 border-r-2 border-primary italic text-on-surface-variant font-medium">Applied discount code: VINUNI_YEP_2024</td>
                <td className="p-4 border-r-2 border-primary text-center font-bold text-on-surface-variant">—</td>
                <td className="p-4 text-right text-secondary font-display text-lg font-bold tracking-tight">- 0 VND</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-primary-container border-t-4 border-primary">
                <td colSpan={2} className="p-4 border-r-2 border-primary font-display text-2xl font-black uppercase tracking-widest text-right">
                  TOTAL
                </td>
                <td className="p-4 text-right font-display text-3xl font-black tracking-tighter">
                  257,500 VND
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Promotion Banner */}
      <div className="relative h-[300px] md:h-[400px] border-4 border-primary overflow-hidden mb-16 lg:mb-24 neo-shadow group">
        <img 
          src="https://images.unsplash.com/photo-1540039155732-d6741b687f88?q=80&w=1974&auto=format&fit=crop" 
          alt="Concert crowd" 
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-primary/50 mix-blend-multiply"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 z-10">
          <h4 className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-background uppercase tracking-tighter mb-6 leading-[0.9]">
            LAST 150 <br className="md:hidden" /> TICKETS LEFT
          </h4>
          <p className="font-display text-lg md:text-xl text-background font-black uppercase tracking-widest bg-secondary px-6 py-3 border-2 border-white neo-shadow-red animate-pulse">
            PHASE 01 CLOSING SOON
          </p>
        </div>
      </div>

      {/* Checkout Action */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8 border-t-4 border-primary pt-12">
        <div className="flex items-center gap-6 w-full lg:w-auto">
          <div className="w-16 h-16 border-4 border-primary flex items-center justify-center bg-white neo-shadow shrink-0">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-display text-xs md:text-sm uppercase tracking-widest text-secondary font-black mb-1">READY TO PARTY?</p>
            <p className="font-display text-xl md:text-2xl font-bold tracking-tight">Proceed to secure your payment method</p>
          </div>
        </div>
        
        <Link to="/checkout" className="w-full lg:w-auto bg-primary text-background border-4 border-primary px-8 py-5 font-display text-xl md:text-2xl font-black uppercase tracking-widest hover:bg-background hover:text-primary transition-colors text-center shadow-[6px_6px_0px_0px_rgba(26,26,26,0.1)] active:translate-y-1 active:shadow-none">
          PROCEED TO CHECKOUT
        </Link>
      </div>

    </div>
  );
}
