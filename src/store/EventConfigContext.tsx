import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

export interface EventConfigState {
  earlyBirdEnabled: boolean;
  earlyBirdPrice: number;
  soldOut: boolean;
  salesNotStarted: boolean;
  salesStartDate: string;
}

const initialState: EventConfigState = {
  earlyBirdEnabled: true,
  earlyBirdPrice: 250000,
  soldOut: false,
  salesNotStarted: false,
  salesStartDate: '2024-12-01T00:00:00',
};

type ConfigAction =
  | { type: 'TOGGLE_EARLY_BIRD' }
  | { type: 'TOGGLE_SOLD_OUT' }
  | { type: 'TOGGLE_SALES_NOT_STARTED' }
  | { type: 'SET_EARLY_BIRD_PRICE'; payload: number };

function configReducer(state: EventConfigState, action: ConfigAction): EventConfigState {
  switch (action.type) {
    case 'TOGGLE_EARLY_BIRD':
      return { ...state, earlyBirdEnabled: !state.earlyBirdEnabled };
    case 'TOGGLE_SOLD_OUT':
      return { ...state, soldOut: !state.soldOut };
    case 'TOGGLE_SALES_NOT_STARTED':
      return { ...state, salesNotStarted: !state.salesNotStarted };
    case 'SET_EARLY_BIRD_PRICE':
      return { ...state, earlyBirdPrice: action.payload };
    default:
      return state;
  }
}

interface EventConfigContextValue {
  config: EventConfigState;
  dispatch: React.Dispatch<ConfigAction>;
}

const EventConfigContext = createContext<EventConfigContextValue | null>(null);

export function EventConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(configReducer, initialState);

  return (
    <EventConfigContext.Provider value={{ config, dispatch }}>
      {children}
    </EventConfigContext.Provider>
  );
}

export function useEventConfig() {
  const ctx = useContext(EventConfigContext);
  if (!ctx) throw new Error('useEventConfig must be used within EventConfigProvider');
  return ctx;
}
