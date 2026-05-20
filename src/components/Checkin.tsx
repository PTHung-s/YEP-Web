import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Lock, RotateCw, StopCircle, XCircle } from 'lucide-react';
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
  success?: boolean;
  error?: string;
}

function getTicketFromUrl(): string {
  return new URLSearchParams(window.location.search).get('ticket') || '';
}

function playTone(type: 'success' | 'warning' | 'error') {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const frequencies = type === 'success' ? [660, 880] : type === 'warning' ? [440, 330] : [220, 180];

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startsAt = context.currentTime + index * 0.12;
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    gain.gain.setValueAtTime(0.001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.08, startsAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startsAt + 0.11);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + 0.12);
  });
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
  const [continuousScan, setContinuousScan] = useState(() => sessionStorage.getItem('yep-continuous-scan') !== 'off');
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const scannerRef = useRef<any>(null);
  const scanInFlightRef = useRef(false);
  const scanCooldownRef = useRef<number | null>(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const expireSession = () => {
    sessionStorage.removeItem('yep-admin-token');
    setToken('');
    setResult(null);
    setMessage('Session expired. Please enter admin passcode again.');
  };

  const fetchRecentCheckins = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch('/api/checkin/recent', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        expireSession();
        return;
      }
      if (res.ok && Array.isArray(data.checkins)) {
        setRecentCheckins(data.checkins);
      }
    } catch {
      // Recent check-ins are a convenience panel, so failures should not block gate work.
    }
  }, [token]);

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

  const checkInTicket = useCallback(async (value = query) => {
    const ticketCode = value.trim();
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

      if (res.status === 401) {
        expireSession();
        return;
      }

      setResult(data);
      setQuery(data.ticket?.ticketCode || ticketCode);

      if (res.status === 409) {
        setMessage('Ticket was already checked in.');
        playTone('warning');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Cannot check in');
      setMessage('Checked in successfully.');
      if (data.checkedIn) {
        setRecentCheckins(current => [data.checkedIn, ...current.filter(item => item.ticketCode !== data.checkedIn.ticketCode)].slice(0, 10));
      }
      playTone('success');
    } catch (err: any) {
      setResult(current => current?.ticket ? current : { error: err.message || 'Cannot check in' });
      setMessage(err.message || 'Cannot check in');
      playTone('error');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, query, staffName]);

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
          if (scanInFlightRef.current) return;
          scanInFlightRef.current = true;
          setQuery(decodedText);
          await checkInTicket(decodedText);

          if (continuousScan) {
            scanCooldownRef.current = window.setTimeout(() => {
              scanInFlightRef.current = false;
              scanCooldownRef.current = null;
            }, 1800);
            return;
          }

          await scanner.stop();
          scannerRef.current = null;
          setScannerActive(false);
          scanInFlightRef.current = false;
        },
        () => {},
      );
      setScannerActive(true);
    } catch (err: any) {
      setMessage(err.message || 'Cannot start camera scanner');
    }
  };

  const stopScanner = async () => {
    if (scanCooldownRef.current) {
      window.clearTimeout(scanCooldownRef.current);
      scanCooldownRef.current = null;
    }
    scanInFlightRef.current = false;
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    if (token && query) checkInTicket(query);
    if (token) fetchRecentCheckins();
    return () => {
      if (scanCooldownRef.current) window.clearTimeout(scanCooldownRef.current);
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
  const isSuccess = Boolean(result?.success);
  const hasError = Boolean(result?.error);
  const statusLabel = isSuccess ? 'Checked In' : isCheckedIn ? 'Already Checked In' : hasError ? 'Not Found' : scannerActive ? 'Scanning' : 'Ready';
  const statusClass = isSuccess
    ? 'bg-emerald-500 text-white'
    : isCheckedIn
      ? 'bg-amber-400 text-primary'
      : hasError
        ? 'bg-secondary text-white'
        : 'bg-primary-container text-primary';

  const statusPanel = (
    <div className={cn('border-4 border-primary p-4 md:p-5 text-center', statusClass)}>
      <span className="block font-display text-[10px] md:text-xs font-black uppercase tracking-widest">Status</span>
      <p className="font-display text-2xl md:text-4xl font-black uppercase leading-none mt-2">{statusLabel}</p>
    </div>
  );

  const resultPanel = (
    <>
      {!result && (
        <p className="font-body text-sm font-bold text-on-surface-variant">Scan a ticket to check in immediately.</p>
      )}

      {result?.error && !result.ticket && (
        <div className="space-y-3 md:space-y-4">
          <XCircle className="w-10 h-10 md:w-12 md:h-12 text-secondary" />
          <h2 className="font-display text-xl md:text-2xl font-black uppercase">Not Found</h2>
          <p className="font-body text-sm font-bold text-on-surface-variant">{result.error}</p>
        </div>
      )}

      {result?.ticket && (
        <div className="space-y-4 md:space-y-5">
          <div className={cn('border-4 border-primary p-4', isCheckedIn ? 'bg-secondary text-white' : 'bg-primary-container')}>
            <div className="flex items-center gap-3">
              {isCheckedIn ? <XCircle className="w-7 h-7 md:w-8 md:h-8 shrink-0" /> : <CheckCircle className="w-7 h-7 md:w-8 md:h-8 shrink-0" />}
              <div className="min-w-0">
                <span className="font-display text-[10px] md:text-xs font-black uppercase tracking-widest">
                  {result.success ? 'Checked In' : isCheckedIn ? 'Already Checked In' : 'Valid Ticket'}
                </span>
                <p className="font-display text-lg md:text-xl font-black uppercase">
                  {result.ticket.ticketNo}/{result.ticket.orderTicketQuantity}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
            <div className="sm:col-span-2 lg:col-span-1">
              <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Buyer</span>
              <p className="font-display text-xl md:text-base font-black uppercase leading-tight">{result.ticket.buyerName}</p>
            </div>
            <div>
              <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ticket Type</span>
              <p className="font-display font-black">{result.ticket.ticketType}</p>
            </div>
            <div>
              <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Contact</span>
              <p className="font-body font-bold break-all">{result.ticket.email}</p>
              <p className="font-body font-bold">{result.ticket.phone}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ticket Code</span>
              <p className="font-display text-xs md:text-sm font-black break-all">{result.ticket.ticketCode}</p>
            </div>
          </div>

          {isCheckedIn && result.checkedIn && (
            <div className="border-2 border-primary bg-background p-3">
              <span className="block font-display text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Previous Check-in</span>
              <p className="font-body text-sm font-bold">{result.checkedIn.checkedInAt}</p>
              <p className="font-body text-sm font-bold">By {result.checkedIn.checkedInBy}</p>
            </div>
          )}
          {isValid && (
            <div className="border-4 border-primary bg-primary-container p-4 font-display font-black uppercase tracking-wider">
              Ready for automatic check-in.
            </div>
          )}
        </div>
      )}
    </>
  );

  const recentPanel = recentCheckins.length > 0 && (
    <div className="border-t-4 border-primary pt-4 md:pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg md:text-xl font-black uppercase">Recent</h2>
        <button
          onClick={fetchRecentCheckins}
          className="border-2 border-primary px-3 py-2 md:py-1 font-display text-xs font-black uppercase hover:bg-primary-container"
        >
          Refresh
        </button>
      </div>
      <div className="max-h-64 md:max-h-none overflow-y-auto space-y-2 pr-1">
        {recentCheckins.slice(0, 8).map(item => (
          <div key={`${item.ticketCode}-${item.checkedInAt}`} className="border-2 border-primary bg-background p-3">
            <p className="font-display text-sm font-black uppercase leading-tight">{item.buyerName || 'Unknown'}</p>
            <p className="font-body text-xs font-bold text-on-surface-variant">{item.ticketType} - {item.checkedInAt}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-14">
      <div className="mb-5 md:mb-8">
        <span className="font-display text-xs font-black uppercase tracking-widest text-secondary">Gate Ops</span>
        <h1 className="font-display text-4xl md:text-7xl font-black uppercase tracking-tighter leading-none">Check-in</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-8">
        <section className="lg:col-span-3 bg-surface border-4 border-primary p-4 md:p-8 space-y-4 md:space-y-5">
          <div className="lg:hidden space-y-4">
            {statusPanel}
            {resultPanel}
          </div>

          <label className="block">
            <span className="block font-display text-xs font-black uppercase tracking-widest mb-2">Staff Name</span>
            <input
              value={staffName}
              onChange={event => setStaffName(event.target.value)}
              className="w-full bg-white border-2 border-primary px-4 py-3 font-display font-bold focus:outline-none focus:border-secondary"
            />
          </label>

          <label className="flex items-center justify-between gap-4 border-4 border-primary bg-background px-4 py-3">
            <div>
              <span className="block font-display text-xs font-black uppercase tracking-widest">Continuous Scan</span>
              <span className="hidden sm:block font-body text-xs font-bold text-on-surface-variant">Auto-ready for the next QR after each result.</span>
            </div>
            <input
              type="checkbox"
              checked={continuousScan}
              onChange={event => {
                setContinuousScan(event.target.checked);
                sessionStorage.setItem('yep-continuous-scan', event.target.checked ? 'on' : 'off');
              }}
              className="h-6 w-6 accent-current"
            />
          </label>

          <label className="block">
            <span className="block font-display text-xs font-black uppercase tracking-widest mb-2">Ticket Code / QR URL</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && checkInTicket()}
                placeholder="YEP-..."
                className="min-w-0 flex-1 bg-white border-2 border-primary px-3 md:px-4 py-3 font-display text-sm md:text-base font-bold focus:outline-none focus:border-secondary"
              />
              <button
                onClick={() => checkInTicket()}
                disabled={loading || !query.trim()}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white border-4 border-primary px-5 py-3 font-display font-black uppercase tracking-widest disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Check In
              </button>
            </div>
          </label>

          <div className="border-4 border-primary bg-background p-4">
            <div id="qr-reader" className={cn('overflow-hidden [&_video]:!w-full [&_video]:!max-h-[52vh] [&_video]:object-cover', scannerActive ? 'min-h-[260px] sm:min-h-[280px]' : 'min-h-0')} />
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <button
                onClick={scannerActive ? stopScanner : startScanner}
                className="inline-flex min-h-14 items-center justify-center gap-2 bg-surface border-4 border-primary px-5 py-3 font-display font-black uppercase tracking-widest hover:bg-primary-container"
              >
                {scannerActive ? <StopCircle className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {scannerActive ? 'Stop Scanner' : 'Scan QR'}
              </button>
              {!scannerActive && result && (
                <button
                  onClick={startScanner}
                  className="inline-flex min-h-14 items-center justify-center gap-2 bg-primary text-white border-4 border-primary px-5 py-3 font-display font-black uppercase tracking-widest"
                >
                  <RotateCw className="w-4 h-4" />
                  Scan Next
                </button>
              )}
            </div>
          </div>

          {message && (
            <div className={cn('border-4 border-primary p-3 md:p-4 font-display text-sm md:text-base font-black uppercase tracking-wider', message.includes('success') ? 'bg-primary-container' : 'bg-secondary text-white')}>
              {message}
            </div>
          )}

          <div className="lg:hidden">
            {recentPanel}
          </div>
        </section>

        <aside className="lg:col-span-2">
          <div className="hidden lg:block bg-surface border-4 border-primary p-6 md:p-8 sticky top-28 space-y-6">
            {statusPanel}
            {resultPanel}
            {recentPanel}
          </div>
        </aside>
      </div>
    </div>
  );
}
