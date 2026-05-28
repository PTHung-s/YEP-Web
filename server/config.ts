import fs from 'fs/promises';
import path from 'path';

export interface TicketBulkDiscountTier {
  minQty: number;
  rate: number;
}

export interface AppConfig {
  salesStatus: 'not_started' | 'open' | 'sold_out';
  earlyBirdEnabled: boolean;
  allowGuests: boolean;
  salesStartDate: string;
  prices: {
    earlyBird: number;
    vinnunian: number;
    guest: number;
  };
  limits: {
    earlyBird: number;
    vinnunian: number;
    guest: number;
  };
  merchLimits: {
    kaleidoLanyardYoyo: number;
    kaleidoBadana: number;
  };
  discounts: {
    ticketBulk: {
      enabled: boolean;
      tiers: TicketBulkDiscountTier[];
    };
    merchBundle: {
      enabled: boolean;
      minTickets: number;
      rate: number;
    };
    serviceFee: {
      enabled: boolean;
      rate: number;
    };
  };
  top8Enabled: boolean;
}

const DATA_DIR = path.resolve('server', 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

export const defaultConfig: AppConfig = {
  salesStatus: 'open',
  earlyBirdEnabled: true,
  allowGuests: false,
  salesStartDate: '2026-05-28T00:00:00',
  prices: {
    earlyBird: 250000,
    vinnunian: 300000,
    guest: 400000,
  },
  limits: {
    earlyBird: 100,
    vinnunian: 400,
    guest: 200,
  },
  merchLimits: {
    kaleidoLanyardYoyo: 9999,
    kaleidoBadana: 9999,
  },
  discounts: {
    ticketBulk: {
      enabled: true,
      tiers: [
        { minQty: 5, rate: 0.1 },
        { minQty: 3, rate: 0.05 },
      ],
    },
    merchBundle: {
      enabled: true,
      minTickets: 3,
      rate: 0.1,
    },
    serviceFee: {
      enabled: false,
      rate: 0.03,
    },
  },
  top8Enabled: false,
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function clampRate(value: unknown, fallback: number): number {
  if (!isFiniteNumber(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function clampMoney(value: unknown, fallback: number): number {
  if (!isFiniteNumber(value)) return fallback;
  return Math.max(0, Math.round(value));
}

function clampCount(value: unknown, fallback: number): number {
  if (!isFiniteNumber(value)) return fallback;
  return Math.max(0, Math.round(value));
}

export function normalizeConfig(input: Partial<AppConfig> | null | undefined): AppConfig {
  const source = input || {};
  const salesStatus = ['not_started', 'open', 'sold_out'].includes(String(source.salesStatus))
    ? source.salesStatus as AppConfig['salesStatus']
    : defaultConfig.salesStatus;

  const ticketBulk = source.discounts?.ticketBulk;
  const tiers = Array.isArray(ticketBulk?.tiers)
    ? ticketBulk.tiers
        .map(tier => ({
          minQty: clampCount(tier.minQty, 0),
          rate: clampRate(tier.rate, 0),
        }))
        .filter(tier => tier.minQty > 0 && tier.rate > 0)
        .sort((a, b) => b.minQty - a.minQty)
    : defaultConfig.discounts.ticketBulk.tiers;

  return {
    salesStatus,
    earlyBirdEnabled: Boolean(source.earlyBirdEnabled ?? defaultConfig.earlyBirdEnabled),
    allowGuests: Boolean(source.allowGuests ?? defaultConfig.allowGuests),
    salesStartDate: source.salesStartDate || defaultConfig.salesStartDate,
    prices: {
      earlyBird: clampMoney(source.prices?.earlyBird, defaultConfig.prices.earlyBird),
      vinnunian: clampMoney(source.prices?.vinnunian, defaultConfig.prices.vinnunian),
      guest: clampMoney(source.prices?.guest, defaultConfig.prices.guest),
    },
    limits: {
      earlyBird: clampCount(source.limits?.earlyBird, defaultConfig.limits.earlyBird),
      vinnunian: clampCount(source.limits?.vinnunian, defaultConfig.limits.vinnunian),
      guest: clampCount(source.limits?.guest, defaultConfig.limits.guest),
    },
    merchLimits: {
      kaleidoLanyardYoyo: clampCount(source.merchLimits?.kaleidoLanyardYoyo, defaultConfig.merchLimits.kaleidoLanyardYoyo),
      kaleidoBadana: clampCount(source.merchLimits?.kaleidoBadana, defaultConfig.merchLimits.kaleidoBadana),
    },
    discounts: {
      ticketBulk: {
        enabled: Boolean(ticketBulk?.enabled ?? defaultConfig.discounts.ticketBulk.enabled),
        tiers,
      },
      merchBundle: {
        enabled: Boolean(source.discounts?.merchBundle?.enabled ?? defaultConfig.discounts.merchBundle.enabled),
        minTickets: clampCount(source.discounts?.merchBundle?.minTickets, defaultConfig.discounts.merchBundle.minTickets),
        rate: clampRate(source.discounts?.merchBundle?.rate, defaultConfig.discounts.merchBundle.rate),
      },
      serviceFee: {
        enabled: Boolean(source.discounts?.serviceFee?.enabled ?? defaultConfig.discounts.serviceFee.enabled),
        rate: clampRate(source.discounts?.serviceFee?.rate, defaultConfig.discounts.serviceFee.rate),
      },
    },
    top8Enabled: Boolean(source.top8Enabled ?? defaultConfig.top8Enabled),
  };
}

export async function readConfig(): Promise<AppConfig> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return normalizeConfig(JSON.parse(raw));
  } catch (err: any) {
    if (err?.code !== 'ENOENT') {
      console.error('[Config] Failed to read config. Using defaults:', err);
    }
    await writeConfig(defaultConfig);
    return defaultConfig;
  }
}

export async function writeConfig(config: AppConfig): Promise<AppConfig> {
  await ensureDataDir();
  const normalized = normalizeConfig(config);
  await fs.writeFile(CONFIG_PATH, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

export function getTicketPriceForUser(config: AppConfig, userType: string): number {
  if (userType === 'vinnunian') {
    return config.earlyBirdEnabled ? config.prices.earlyBird : config.prices.vinnunian;
  }
  return config.prices.guest;
}

export function calculateTicketBulkDiscount(config: AppConfig, ticketSubtotal: number, ticketQuantity: number): number {
  if (!config.discounts.ticketBulk.enabled) return 0;
  const tier = config.discounts.ticketBulk.tiers.find(item => ticketQuantity >= item.minQty);
  if (!tier) return 0;
  return Math.round(ticketSubtotal * tier.rate);
}

export function calculateMerchBundleDiscount(config: AppConfig, merchTotal: number, ticketQuantity: number): number {
  const rule = config.discounts.merchBundle;
  if (!rule.enabled || ticketQuantity < rule.minTickets) return 0;
  return Math.round(merchTotal * rule.rate);
}

export function calculateServiceFee(config: AppConfig, subtotal: number): number {
  if (!config.discounts.serviceFee.enabled) return 0;
  return Math.round(subtotal * config.discounts.serviceFee.rate);
}
