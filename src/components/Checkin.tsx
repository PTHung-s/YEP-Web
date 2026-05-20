import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Lock, Search, StopCircle, XCircle } from 'lucide-react';
import { cn } from './Layout';

interface TicketItem {
  ticketCode: string;
  orderId: string;
  buyerName: string;
  email: string;
  phone: string;
  ticketType: string;
  ticketNo: string;
  orderTicketQuantity: string;
}

interface CheckinRecord {
  ticketCode: string;
  orderId: string;
  buyerName: string;
  email: string;
  phone: string;
  ticketType: string;
  checkedInAt: string;
  checkedInBy: string;
}

interface CheckinResult {
  ticket?: TicketItem;
  status?: 'valid' | 'checked_in';
  checkedIn?: CheckinRecord;
  error?: string;
}

function getTicketFromUrl(): string {
  return new URLSearchParams(window.location.search).get('ticket') || '';
}

export function Checkin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('yep-admin-token') || '');
  const [passcode, setPasscode] = useState('');
  const [staffName, setStaffName] = useState(() => sessionStorage.getItem('yep-checkin-staff') || 'Gate Staff');
  const [query, setQuery] = useState(getTicketFromUrl());
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Cannot sign in');
      sessionStorage.setItem('yep-admin-token', data.token);
      setToken(data.token);
      setPasscode('');
    } catch (err: any) {
      setMessage(err.message || 'Cannot sign in');
    } finally {
      setLoading(false);
    }
  };

  const searchTicket = async (value = query) => {
    const code = value.trim();
    if (!code) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/checkin/search?q=${encodeURIComponent(code)}`, { headers: authHeaders });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Ticket not found');
      setResult(data);
      setQuery(data.ticket?.ticketCode || code);
    } catch (err: any) {
      setResult({ error: err.message || 'Ticket not found' });
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    const ticketCode = result?.ticket?.ticketCode || query.trim();
    if (!ticketCode) return;
    sessionStorage.setItem('yep-checkin-staff', staffName);
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ticketCode, checkedInBy: staffName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult(data);
        throw new Error(data.error || 'Cannot check in');
      }
      setResult(data);
      setMessage('Checked in successfully.');
    } catch (err: any) {
      setMessage(err.message || 'Cannot check in');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setMessage('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText: string) => {
          setQuery(decodedText);
          await scanner.stop();
          scannerRef.current = null;
          setScannerActive(false);
          searchTicket(decodedText);
        },
        () => {},
      );
      setScannerActive(true);
    } catch (err: any) {
      setMessage(err.message || 'Cannot start camera scanner');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    if (token && query) searchTicket(query);
    return () => {
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  }, [token]);

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto px-6 py-20">
        <form onSubmit={login} className="bg-surface border-4 border-primary p-8 neo-shadow space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight">Check-in</h1>
          </div>
          <input
            type="password"
            value={passcode}
            onChange={event => setPasscode(event.target.value)}
            placeholder="Admin passcode"
            className="w-full bg-white border-2 border-primary px-4 py-3 font-display font-bold focus:outline-none focus:border-secondary"
          />
          {message && <p className="font-body text-sm font-bold text-secondary">{message}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full bg-primary text-white border-4 border-primary py-3 font-display font-black uppercase tracking-widest disabled:bg-surface-dim disabled:text-on-surface-variant"
          >
            {loading ? 'Signing in...' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  const isCheckedIn = result?.status === 'checked_in';
  const isValid = result?.status === 'valid';

  return (
    <div className="w-full max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-14">
      <div className="mb-8">
        <span className="font-display text-xs font-black uppercase tracking-widest text-secondary">Gate Ops</span>
        <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">Check-in</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <section className="lg:col-span-3 bg-surface border-4 border-primary p-6 md:p-8 space-y-5">
          <label className="block">
            <span className="block font-display text-xs font-black uppercase tracking-widest mb-2">Staff Name</span>
            <input
              value={staffName}
              onChange={event => setStaffName(event.target.value)}
              className="w-full bg-white border-2 border-primary px-4 py-3 font-display font-bold focus:outline-none focus:border-secondary"
            />
          </label>

          <label className="block">
            <span className="block font-display text-xs font-black uppercase tracking-widest mb-2">Ticket Code / QR URL</span>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && searchTicket()}
                placeholder="YEP-..."
                className="flex-1 bg-white border-2 border-primary px-4 py-3 font-display font-bold focus:outline-none focus:border-secondary"
              />
              <button
                onClick={() => searchTicket()}
                disabled={loading || !query.trim()}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white border-4 border-primary px-5 py-3 font-display font-black uppercase tracking-widest disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </label>

          <div className="border-4 border-primary bg-background p-4">
            <div id="qr-reader" className={cn('overflow-hidden', scannerActive ? 'min-h-[280px]' : 'min-h-0')} />
            <button
              onClick={scannerActive ? stopScanner : startScanner}
              className="mt-3 inline-flex items-center gap-2 bg-surface border-4 border-primary px-5 py-3 font-display font-black uppercase tracking-widest hover:bg-primary-container"
            >
              {scannerActive ? <StopCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              {scannerActive ? 'Stop Scanner' : 'Scan QR'}
            </button>
          </div>

          {message && (
            <div className={cn('border-4 border-primary p-4 font-display font-black uppercase tracking-wider', message.includes('success') ? 'bg-primary-container' : 'bg-secondary text-white')}>
              {message}
            </div>
          )}
        </section>

        <aside className="lg:col-span-2">
          <div className="bg-surface border-4 border-primary p-6 md:p-8 sticky top-28">
            {!result && (
              <p className="font-body text-sm font-bold text-on-surface-variant">Search or scan a ticket to see check-in status.</p>
            )}

            {result?.error && (
              <div className="space-y-4">
                <XCircle className="w-12 h-12 text-secondary" />
                <h2 className="font-display text-2xl font-black uppercase">Not Found</h2>
                <p className="font-body text-sm font-bold text-on-surface-variant">{result.error}</p>
              </div>
            )}

            {result?.ticket && (
              <div className="space-y-5">
                <div className={cn('border-4 border-primary p-4', isCheckedIn ? 'bg-secondary text-white' : 'bg-primary-container')}>
                  <div className="flex items-center gap-3">
                    {isCheckedIn ? <XCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                    <div>
                      <span className="font-display text-xs font-black uppercase tracking-widest">
                        {isCheckedIn ? 'Already Checked In' : 'Valid Ticket'}
                      </span>
                      <p className="font-display text-xl font-black uppercase">
                        {result.ticket.ticketNo}/{result.ticket.orderTicketQuantity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ticket Code</span>
                    <p className="font-display font-black break-all">{result.ticket.ticketCode}</p>
                  </div>
                  <div>
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Buyer</span>
                    <p className="font-display font-black uppercase">{result.ticket.buyerName}</p>
                  </div>
                  <div>
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Contact</span>
                    <p className="font-body font-bold">{result.ticket.email}</p>
                    <p className="font-body font-bold">{result.ticket.phone}</p>
                  </div>
                  <div>
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ticket Type</span>
                    <p className="font-display font-black">{result.ticket.ticketType}</p>
                  </div>
                </div>

                {isCheckedIn && result.checkedIn && (
                  <div className="border-2 border-primary bg-background p-3">
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Previous Check-in</span>
                    <p className="font-body text-sm font-bold">{result.checkedIn.checkedInAt}</p>
                    <p className="font-body text-sm font-bold">By {result.checkedIn.checkedInBy}</p>
                  </div>
                )}

                <button
                  onClick={checkIn}
                  disabled={!isValid || loading}
                  className={cn(
                    'w-full border-4 border-primary py-4 font-display font-black uppercase tracking-widest transition-all',
                    isValid ? 'bg-primary text-white hover:bg-secondary' : 'bg-surface-dim text-on-surface-variant cursor-not-allowed',
                  )}
                >
                  {loading ? 'Processing...' : 'Check In'}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
