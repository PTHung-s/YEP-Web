import React, { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';

export interface TicketBulkDiscountTier {
  minQty: number;
  rate: number;
}

export interface EventConfigState {
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

export const defaultEventConfig: EventConfigState = {
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

type ConfigAction =
  | { type: 'SET_CONFIG'; payload: EventConfigState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

function configReducer(
  state: { config: EventConfigState; loading: boolean; error: string },
  action: ConfigAction,
) {
  switch (action.type) {
    case 'SET_CONFIG':
      return { config: action.payload, loading: false, error: '' };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface EventConfigContextValue {
  config: EventConfigState;
  loading: boolean;
  error: string;
  refreshConfig: () => Promise<void>;
}

const EventConfigContext = createContext<EventConfigContextValue | null>(null);

export function EventConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configReducer, {
    config: defaultEventConfig,
    loading: true,
    error: '',
  });

  const refreshConfig = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Cannot load event config');
      const config = await res.json();
      dispatch({ type: 'SET_CONFIG', payload: config });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Cannot load event config' });
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <EventConfigContext.Provider value={{ ...state, refreshConfig }}>
      {children}
    </EventConfigContext.Provider>
  );
}

export function useEventConfig() {
  const ctx = useContext(EventConfigContext);
  if (!ctx) throw new Error('useEventConfig must be used within EventConfigProvider');
  return ctx;
}
