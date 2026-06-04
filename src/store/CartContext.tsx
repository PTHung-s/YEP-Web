import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import { useEventConfig, type EventConfigState } from './EventConfigContext';

export type UserType = 'vinnunian' | 'non-vinnunian' | null;
export type UserCategory = 'student' | 'faculty' | 'staff' | 'alumni' | null;
export type DiscountCodeType = 'GAME_5' | 'GAME_10' | 'VIP_20' | 'KPI' | 'REFERRAL';

export interface AppliedDiscount {
  code: string;
  name: string;
  type: DiscountCodeType;
  rate: number;
}

export interface MerchItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  userType: UserType;
  userCategory: UserCategory;
  fullName: string;
  email: string;
  phone: string;
  ageConfirmed: boolean;
  studentId: string;
  workplace: string;
  upcomingStudent: boolean;
  applicationId: string;
  ticketQuantity: number;
  merch: MerchItem[];
  paymentMethod: 'credit' | 'bank' | 'payos' | null;
  appliedDiscount: AppliedDiscount | null;
}

const INITIAL_MERCH: MerchItem[] = [
  { id: 'kaleido-lanyard-yoyo', name: 'COMBO LANYARD + YOYO KALEIDO', price: 69000, quantity: 0 },
  { id: 'kaleido-badana', name: 'BADANA KALEIDO', price: 129000, quantity: 0 },
];

const initialState: CartState = {
  userType: null,
  userCategory: null,
  fullName: '',
  email: '',
  phone: '',
  ageConfirmed: false,
  studentId: '',
  workplace: '',
  upcomingStudent: false,
  applicationId: '',
  ticketQuantity: 1,
  merch: INITIAL_MERCH,
  paymentMethod: null,
  appliedDiscount: null,
};

type CartAction =
  | { type: 'SET_USER_TYPE'; payload: UserType }
  | { type: 'SET_USER_CATEGORY'; payload: UserCategory }
  | { type: 'SET_FIELD'; field: keyof CartState; value: string }
  | { type: 'SET_AGE_CONFIRMED'; payload: boolean }
  | { type: 'SET_UPCOMING_STUDENT'; payload: boolean }
  | { type: 'SET_TICKET_QUANTITY'; payload: number }
  | { type: 'SET_MERCH_QUANTITY'; id: string; quantity: number }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'credit' | 'bank' | 'payos' }
  | { type: 'SET_APPLIED_DISCOUNT'; payload: AppliedDiscount | null }
  | { type: 'RESET' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_USER_TYPE':
      return {
        ...state,
        userType: action.payload,
        userCategory: null,
        workplace: '',
        studentId: '',
        upcomingStudent: false,
        applicationId: '',
      };
    case 'SET_USER_CATEGORY':
      return { ...state, userCategory: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_AGE_CONFIRMED':
      return { ...state, ageConfirmed: action.payload };
    case 'SET_UPCOMING_STUDENT':
      return {
        ...state,
        upcomingStudent: action.payload,
        applicationId: action.payload ? state.applicationId : '',
      };
    case 'SET_TICKET_QUANTITY':
      return { ...state, ticketQuantity: Math.max(0, action.payload) };
    case 'SET_MERCH_QUANTITY':
      return {
        ...state,
        merch: state.merch.map(m => m.id === action.id ? { ...m, quantity: Math.max(0, action.quantity) } : m),
      };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'SET_APPLIED_DISCOUNT':
      return { ...state, appliedDiscount: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function getTicketPrice(state: CartState, config: EventConfigState): number {
  if (state.userType === null) return 0;
  if (state.userType === 'vinnunian') {
    return config.earlyBirdEnabled ? config.prices.earlyBird : config.prices.vinnunian;
  }
  return config.prices.guest;
}

function getMerchTotal(state: CartState): number {
  return state.merch.reduce((sum, m) => sum + m.price * m.quantity, 0);
}

function getTicketBulkDiscount(state: CartState, config: EventConfigState): number {
  if (!config.discounts.ticketBulk.enabled) return 0;
  if (state.userType === 'vinnunian' && config.earlyBirdEnabled) return 0;
  const tier = config.discounts.ticketBulk.tiers.find(item => state.ticketQuantity >= item.minQty);
  if (!tier) return 0;
  const ticketSubtotal = getTicketPrice(state, config) * state.ticketQuantity;
  return Math.round(ticketSubtotal * tier.rate);
}

function getTicketDiscount(state: CartState, config: EventConfigState): number {
  const ticketSubtotal = getTicketPrice(state, config) * state.ticketQuantity;
  if (ticketSubtotal <= 0) return 0;

  const bulkDiscount = getTicketBulkDiscount(state, config);
  const applied = state.appliedDiscount;
  if (!applied) return bulkDiscount;

  if (applied.type === 'REFERRAL') return bulkDiscount;
  if (applied.type === 'VIP_20') return Math.round(ticketSubtotal * applied.rate);

  const bulkRate = bulkDiscount / ticketSubtotal;
  const finalRate = Math.min(0.15, bulkRate + applied.rate);
  return Math.round(ticketSubtotal * finalRate);
}

function isDiscountCapped(state: CartState, config: EventConfigState): boolean {
  const ticketSubtotal = getTicketPrice(state, config) * state.ticketQuantity;
  const applied = state.appliedDiscount;
  if (!applied || ticketSubtotal <= 0 || applied.type === 'REFERRAL' || applied.type === 'VIP_20') return false;

  return (getTicketBulkDiscount(state, config) / ticketSubtotal) + applied.rate > 0.15;
}

function getMerchBulkDiscount(state: CartState, config: EventConfigState): number {
  const rule = config.discounts.merchBundle;
  if (!rule.enabled || state.ticketQuantity < rule.minTickets) return 0;
  return Math.round(getMerchTotal(state) * rule.rate);
}

function getSubtotal(state: CartState, config: EventConfigState): number {
  return getTicketPrice(state, config) * state.ticketQuantity + getMerchTotal(state);
}

function getServiceFee(state: CartState, config: EventConfigState): number {
  if (!config.discounts.serviceFee.enabled) return 0;
  return Math.round(getSubtotal(state, config) * config.discounts.serviceFee.rate);
}

function getTotal(state: CartState, config: EventConfigState): number {
  const autoDiscount = getTicketDiscount(state, config) + getMerchBulkDiscount(state, config);
  return Math.max(0, getSubtotal(state, config) + getServiceFee(state, config) - autoDiscount);
}

interface CartContextValue {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  getTicketPrice: () => number;
  getMerchTotal: () => number;
  getSubtotal: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
  getTicketBulkDiscount: () => number;
  getTicketDiscount: () => number;
  isDiscountCapped: () => boolean;
  getMerchBulkDiscount: () => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { config } = useEventConfig();

  const value: CartContextValue = {
    state,
    dispatch,
    getTicketPrice: () => getTicketPrice(state, config),
    getMerchTotal: () => getMerchTotal(state),
    getSubtotal: () => getSubtotal(state, config),
    getServiceFee: () => getServiceFee(state, config),
    getTotal: () => getTotal(state, config),
    getTicketBulkDiscount: () => getTicketBulkDiscount(state, config),
    getTicketDiscount: () => getTicketDiscount(state, config),
    isDiscountCapped: () => isDiscountCapped(state, config),
    getMerchBulkDiscount: () => getMerchBulkDiscount(state, config),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
