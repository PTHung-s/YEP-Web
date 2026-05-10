import React, { useEffect } from 'react';
import { CheckCircle, Mail, MapPin, ArrowRight, Ticket } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../store/CartContext';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

export function Success() {
  const { state, dispatch, getTotal } = useCart();
  const location = useLocation();
  const total = getTotal();
  const ticketId = (location.state as any)?.ticketId || 'N/A';
  const storedIn = (location.state as any)?.storedIn || 'csv';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hasMerch = state.merch.some(m => m.quantity > 0);

  return (
    <div className="w-full max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24 text-center">
      {/* Success Icon */}
      <div className="mb-8">
        <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-primary-container border-4 border-primary rounded-full flex items-center justify-center neo-shadow">
          <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-primary" strokeWidth={2.5} />
        </div>
      </div>

      <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
        THANK YOU! <br />
        <span className="text-secondary">ORDER CONFIRMED</span>
      </h1>

      <p className="font-body text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed max-w-xl mx-auto mb-12">
        Your payment has been processed successfully. You're all set for YEP VinUni 2024!
      </p>

      {/* Order Recap */}
      <div className="bg-surface border-4 border-primary p-6 md:p-8 text-left mb-10">
        <h3 className="font-display text-xl md:text-2xl font-black uppercase mb-6 border-b-4 border-primary pb-3">
          ORDER RECAP
        </h3>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm font-display font-bold uppercase tracking-wider">
            <span>{state.userType === 'vinnunian' ? 'VINNUNIAN' : 'NON-VINNUNIAN'} TICKET ×{state.ticketQuantity}</span>
            <span>{formatVND(state.userType === 'vinnunian' ? 250000 : 450000)}</span>
          </div>
          {state.merch.filter(m => m.quantity > 0).map(m => (
            <div key={m.id} className="flex justify-between text-sm font-display font-bold">
              <span className="uppercase tracking-wider">{m.name} ×{m.quantity}</span>
              <span>{formatVND(m.price * m.quantity)}</span>
            </div>
          ))}
          <div className="border-t-2 border-primary pt-3 flex justify-between text-sm font-display font-black uppercase tracking-widest">
            <span>TOTAL PAID</span>
            <span>{formatVND(total)}</span>
          </div>
        </div>

        {/* Ticket ID */}
        <div className="border-2 border-dashed border-primary p-4 mb-6 flex items-center gap-3 bg-primary-container/50">
          <Ticket className="w-6 h-6 shrink-0 text-primary" />
          <div className="text-left">
            <span className="font-display text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">TICKET ID</span>
            <span className="font-display text-lg md:text-xl font-black tracking-tighter">{ticketId}</span>
          </div>
        </div>

        {storedIn === 'csv' && (
          <div className="bg-primary-container/50 border-2 border-primary p-3 mb-6 text-left">
            <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Data saved locally (CSV). To enable Google Sheets cloud storage, configure GOOGLE_SHEETS_* in .env
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-primary-container border-4 border-primary p-6 text-left flex items-start gap-4">
          <Mail className="w-8 h-8 shrink-0 text-primary mt-1" />
          <div>
            <h4 className="font-display text-lg font-black uppercase tracking-wider mb-2">E-TICKET DELIVERY</h4>
            <p className="font-body text-sm font-medium leading-relaxed">
              Vé điện tử sẽ được gửi về địa chỉ <span className="font-display font-bold">{state.email}</span> trong vòng 24 giờ.
              Vui lòng kiểm tra cả hộp thư Spam nếu không thấy.
            </p>
          </div>
        </div>
        <div className="bg-primary-container border-4 border-primary p-6 text-left flex items-start gap-4">
          <MapPin className="w-8 h-8 shrink-0 text-primary mt-1" />
          <div>
            <h4 className="font-display text-lg font-black uppercase tracking-wider mb-2">MERCH PICKUP</h4>
            <p className="font-body text-sm font-medium leading-relaxed">
              {hasMerch
                ? 'Mang theo Email xác nhận hoặc Student ID đến Booth Merch tại sự kiện để nhận vật phẩm.'
                : 'Bạn không đặt mua Merch. Nếu đổi ý, có thể mua trực tiếp tại Booth sự kiện.'}
            </p>
          </div>
        </div>
      </div>

      <Link
        to="/"
        onClick={() => dispatch({ type: 'RESET' })}
        className="inline-flex items-center gap-2 bg-primary text-background border-4 border-primary px-8 py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-background hover:text-primary transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none"
      >
        BACK TO HOME
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
