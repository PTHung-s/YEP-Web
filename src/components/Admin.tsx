import React, { useEffect, useState } from 'react';
import { Download, Lock, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { defaultEventConfig, type EventConfigState, type TicketBulkDiscountTier } from '../store/EventConfigContext';
import { cn } from './Layout';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' VND';
}

function toPercent(rate: number): number {
  return Math.round(rate * 10000) / 100;
}

function fromPercent(value: number): number {
  return Math.max(0, value) / 100;
}

function numberValue(value: string): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'h-8 w-14 border-2 border-primary p-1 transition-colors',
        checked ? 'bg-primary' : 'bg-surface-dim',
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          'block h-full aspect-square bg-background border-2 border-primary transition-transform',
          checked ? 'translate-x-6' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('yep-admin-token') || '');
  const [passcode, setPasscode] = useState('');
  const [config, setConfig] = useState<EventConfigState>(defaultEventConfig);
  const [summary, setSummary] = useState<{ ticketCount?: number; registrationCount?: number; source?: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadAdminData = async (authToken = token) => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [configRes, summaryRes] = await Promise.all([
        fetch('/api/admin/config', { headers }),
        fetch('/api/admin/summary', { headers }),
      ]);
      if (!configRes.ok) throw new Error('Cannot load admin config');
      setConfig(await configRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
    } catch (err: any) {
      setError(err.message || 'Cannot load admin data');
      sessionStorage.removeItem('yep-admin-token');
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAdminData(token);
  }, [token]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid passcode');
      }
      const data = await res.json();
      sessionStorage.setItem('yep-admin-token', data.token);
      setToken(data.token);
      setPasscode('');
    } catch (err: any) {
      setError(err.message || 'Cannot sign in');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    setSavedMessage('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Cannot save config');
      setConfig(await res.json());
      setSavedMessage('Changes saved.');
    } catch (err: any) {
      setError(err.message || 'Cannot save config');
    } finally {
      setSaving(false);
    }
  };

  const exportTickets = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/tickets', { headers: authHeaders });
      if (!res.ok) throw new Error('Cannot export tickets');
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'yep-tickets-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Cannot export tickets');
    }
  };

  const updateConfig = (patch: Partial<EventConfigState>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const updatePrices = (key: keyof EventConfigState['prices'], value: number) => {
    setConfig(prev => ({ ...prev, prices: { ...prev.prices, [key]: Math.max(0, Math.round(value)) } }));
  };

  const updateLimits = (key: keyof EventConfigState['limits'], value: number) => {
    setConfig(prev => ({ ...prev, limits: { ...prev.limits, [key]: Math.max(0, Math.round(value)) } }));
  };

  const updateTier = (index: number, patch: Partial<TicketBulkDiscountTier>) => {
    setConfig(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        ticketBulk: {
          ...prev.discounts.ticketBulk,
          tiers: prev.discounts.ticketBulk.tiers.map((tier, i) => i === index ? { ...tier, ...patch } : tier),
        },
      },
    }));
  };

  const removeTier = (index: number) => {
    setConfig(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        ticketBulk: {
          ...prev.discounts.ticketBulk,
          tiers: prev.discounts.ticketBulk.tiers.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const addTier = () => {
    setConfig(prev => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        ticketBulk: {
          ...prev.discounts.ticketBulk,
          tiers: [...prev.discounts.ticketBulk.tiers, { minQty: 10, rate: 0.15 }],
        },
      },
    }));
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto px-6 py-20">
        <form onSubmit={login} className="bg-surface border-4 border-primary p-8 neo-shadow space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight">YEP Admin</h1>
          </div>
          <input
            type="password"
            value={passcode}
            onChange={event => setPasscode(event.target.value)}
            placeholder="Admin passcode"
            className="w-full bg-white border-2 border-primary px-4 py-3 font-display font-bold focus:outline-none focus:border-secondary"
          />
          {error && <p className="font-body text-sm font-bold text-secondary">{error}</p>}
          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full bg-primary text-background border-4 border-primary py-3 font-display font-black uppercase tracking-widest disabled:bg-surface-dim disabled:text-on-surface-variant"
          >
            {loading ? 'Signing in...' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <span className="font-display text-xs font-black uppercase tracking-widest text-secondary">Control Room</span>
          <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">Admin</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => loadAdminData()} className="inline-flex items-center gap-2 bg-surface border-4 border-primary px-4 py-3 font-display font-black uppercase tracking-widest">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportTickets} className="inline-flex items-center gap-2 bg-surface border-4 border-primary px-4 py-3 font-display font-black uppercase tracking-widest">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={saveConfig} disabled={saving} className="inline-flex items-center gap-2 bg-primary text-background border-4 border-primary px-5 py-3 font-display font-black uppercase tracking-widest disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving' : 'Save'}
          </button>
        </div>
      </div>

      {(error || savedMessage) && (
        <div className={cn('border-4 border-primary p-4 mb-8 font-display font-black uppercase tracking-wider', error ? 'bg-secondary text-white' : 'bg-primary-container')}>
          {error || savedMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          ['Orders', String(summary.ticketCount ?? 0)],
          ['Registrations', String(summary.registrationCount ?? 0)],
          ['Source', String(summary.source || 'local')],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface border-4 border-primary p-5">
            <span className="font-display text-xs font-black uppercase tracking-widest text-on-surface-variant">{label}</span>
            <p className="font-display text-3xl font-black uppercase tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-surface border-4 border-primary p-6 md:p-8 space-y-6">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">Ticket Sales</h2>

          <div>
            <label className="block font-display text-xs font-black uppercase tracking-widest mb-2">Sales Status</label>
            <div className="grid grid-cols-3 border-4 border-primary">
              {[
                ['not_started', 'Not Started'],
                ['open', 'Open'],
                ['sold_out', 'Sold Out'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateConfig({ salesStatus: value as EventConfigState['salesStatus'] })}
                  className={cn('py-3 font-display text-xs md:text-sm font-black uppercase tracking-widest border-r-4 border-primary last:border-r-0', config.salesStatus === value ? 'bg-primary text-background' : 'bg-background')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between gap-4 border-2 border-primary p-4">
              <span className="font-display font-black uppercase tracking-widest text-sm">Early Bird</span>
              <Toggle checked={config.earlyBirdEnabled} onChange={earlyBirdEnabled => updateConfig({ earlyBirdEnabled })} />
            </label>
            <label className="flex items-center justify-between gap-4 border-2 border-primary p-4">
              <span className="font-display font-black uppercase tracking-widest text-sm">Guest Tickets</span>
              <Toggle checked={config.allowGuests} onChange={allowGuests => updateConfig({ allowGuests })} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['earlyBird', 'Early Bird'],
              ['vinnunian', 'VinUnian'],
              ['guest', 'Guest'],
            ].map(([key, label]) => (
              <label key={key} className="space-y-2">
                <span className="block font-display text-xs font-black uppercase tracking-widest">{label} Price</span>
                <input
                  type="number"
                  value={config.prices[key as keyof EventConfigState['prices']]}
                  onChange={event => updatePrices(key as keyof EventConfigState['prices'], numberValue(event.target.value))}
                  className="w-full bg-white border-2 border-primary px-3 py-3 font-display font-black focus:outline-none"
                />
                <span className="block font-body text-xs font-bold text-on-surface-variant">{formatVND(config.prices[key as keyof EventConfigState['prices']])}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['earlyBird', 'Early Limit'],
              ['vinnunian', 'VinUnian Limit'],
              ['guest', 'Guest Limit'],
            ].map(([key, label]) => (
              <label key={key} className="space-y-2">
                <span className="block font-display text-xs font-black uppercase tracking-widest">{label}</span>
                <input
                  type="number"
                  value={config.limits[key as keyof EventConfigState['limits']]}
                  onChange={event => updateLimits(key as keyof EventConfigState['limits'], numberValue(event.target.value))}
                  className="w-full bg-white border-2 border-primary px-3 py-3 font-display font-black focus:outline-none"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="bg-surface border-4 border-primary p-6 md:p-8 space-y-6">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">Discounts & Fees</h2>

          <div className="border-2 border-primary p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-black uppercase tracking-widest">Ticket Bulk</h3>
              <Toggle
                checked={config.discounts.ticketBulk.enabled}
                onChange={enabled => setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, ticketBulk: { ...prev.discounts.ticketBulk, enabled } } }))}
              />
            </div>
            <div className="space-y-3">
              {config.discounts.ticketBulk.tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <label>
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest mb-1">Min Tickets</span>
                    <input type="number" value={tier.minQty} onChange={event => updateTier(index, { minQty: numberValue(event.target.value) })} className="w-full bg-white border-2 border-primary px-3 py-2 font-display font-black" />
                  </label>
                  <label>
                    <span className="block font-display text-[10px] font-black uppercase tracking-widest mb-1">Percent Off</span>
                    <input type="number" value={toPercent(tier.rate)} onChange={event => updateTier(index, { rate: fromPercent(numberValue(event.target.value)) })} className="w-full bg-white border-2 border-primary px-3 py-2 font-display font-black" />
                  </label>
                  <button onClick={() => removeTier(index)} className="h-11 w-11 border-2 border-primary bg-background flex items-center justify-center" aria-label="Remove tier">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addTier} className="inline-flex items-center gap-2 border-2 border-primary px-3 py-2 font-display text-xs font-black uppercase tracking-widest">
              <Plus className="w-4 h-4" />
              Add Tier
            </button>
          </div>

          <div className="border-2 border-primary p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-black uppercase tracking-widest">Merch Bundle</h3>
              <Toggle
                checked={config.discounts.merchBundle.enabled}
                onChange={enabled => setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, merchBundle: { ...prev.discounts.merchBundle, enabled } } }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="block font-display text-[10px] font-black uppercase tracking-widest mb-1">Min Tickets</span>
                <input type="number" value={config.discounts.merchBundle.minTickets} onChange={event => setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, merchBundle: { ...prev.discounts.merchBundle, minTickets: numberValue(event.target.value) } } }))} className="w-full bg-white border-2 border-primary px-3 py-2 font-display font-black" />
              </label>
              <label>
                <span className="block font-display text-[10px] font-black uppercase tracking-widest mb-1">Percent Off</span>
                <input type="number" value={toPercent(config.discounts.merchBundle.rate)} onChange={event => setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, merchBundle: { ...prev.discounts.merchBundle, rate: fromPercent(numberValue(event.target.value)) } } }))} className="w-full bg-white border-2 border-primary px-3 py-2 font-display font-black" />
              </label>
            </div>
          </div>

          <div className="border-2 border-primary p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-black uppercase tracking-widest">Service Fee</h3>
              <Toggle
                checked={config.discounts.serviceFee.enabled}
                onChange={enabled => setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, serviceFee: { ...prev.discounts.serviceFee, enabled } } }))}
              />
            </div>
            <label>
              <span className="block font-display text-[10px] font-black uppercase tracking-widest mb-1">Percent Fee</span>
              <input type="number" value={toPercent(config.discounts.serviceFee.rate)} onChange={event => setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, serviceFee: { ...prev.discounts.serviceFee, rate: fromPercent(numberValue(event.target.value)) } } }))} className="w-full bg-white border-2 border-primary px-3 py-2 font-display font-black" />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
