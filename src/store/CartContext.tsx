import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

export type UserType = 'vinnunian' | 'non-vinnunian' | null;
export type UserCategory = 'student' | 'faculty' | 'staff' | 'alumni' | null;

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
  studentId: string;
  workplace: string;
  ticketQuantity: number;
  merch: MerchItem[];
  discountCode: string;
  discountAmount: number;
  paymentMethod: 'credit' | 'bank' | null;
  effectiveTicketPrice: number;
}

const TICKET_PRICE_EARLY = 250000;
const TICKET_PRICE_VINNUNIAN = 300000;
const TICKET_PRICE_NON_VINNUNIAN = 400000;
const SERVICE_FEE_RATE = 0.03;
const BULK_TICKET_DISCOUNT_TIERS = [
  { minQty: 5, rate: 0.1 },
  { minQty: 3, rate: 0.05 },
] as const;
const MERCH_DISCOUNT_MIN_TICKETS = 3;
const MERCH_DISCOUNT_RATE = 0.1;

const INITIAL_MERCH: MerchItem[] = [
  { id: 'rebels-tee', name: '"REBELS" OVERSIZED TEE', price: 200000, quantity: 0 },
  { id: 'trucker-cap', name: 'VINUNI TRUCKER CAP', price: 150000, quantity: 0 },
];

const initialState: CartState = {
  userType: null,
  userCategory: null,
  fullName: '',
  email: '',
  phone: '',
  studentId: '',
  workplace: '',
  ticketQuantity: 1,
  merch: INITIAL_MERCH,
  discountCode: '',
  discountAmount: 0,
  paymentMethod: null,
  effectiveTicketPrice: TICKET_PRICE_VINNUNIAN,
};

type CartAction =
  | { type: 'SET_USER_TYPE'; payload: UserType }
  | { type: 'SET_USER_TYPE_PRICE'; userType: UserType; ticketPrice: number }
  | { type: 'SET_USER_CATEGORY'; payload: UserCategory }
  | { type: 'SET_FIELD'; field: keyof CartState; value: string }
  | { type: 'SET_TICKET_QUANTITY'; payload: number }
  | { type: 'SET_MERCH_QUANTITY'; id: string; quantity: number }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'credit' | 'bank' }
  | { type: 'APPLY_DISCOUNT'; code: string; amount: number }
  | { type: 'RESET' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_USER_TYPE':
      return { ...state, userType: action.payload, userCategory: null, workplace: '', studentId: '' };
    case 'SET_USER_TYPE_PRICE':
      return { ...state, userType: action.userType, effectiveTicketPrice: action.ticketPrice, userCategory: null, workplace: '', studentId: '' };
    case 'SET_USER_CATEGORY':
      return { ...state, userCategory: action.payload };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_TICKET_QUANTITY':
      return { ...state, ticketQuantity: Math.max(1, action.payload) };
    case 'SET_MERCH_QUANTITY':
      return {
        ...state,
        merch: state.merch.map(m => m.id === action.id ? { ...m, quantity: Math.max(0, action.quantity) } : m),
      };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'APPLY_DISCOUNT':
      return { ...state, discountCode: action.code, discountAmount: action.amount };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function getTicketPrice(state: CartState): number {
  if (state.userType === null) return 0;
  return state.effectiveTicketPrice;
}

function getMerchTotal(state: CartState): number {
  return state.merch.reduce((sum, m) => sum + m.price * m.quantity, 0);
}

function getTicketBulkDiscount(state: CartState): number {
  const tier = BULK_TICKET_DISCOUNT_TIERS.find(item => state.ticketQuantity >= item.minQty);
  if (!tier) return 0;
  const ticketSubtotal = getTicketPrice(state) * state.ticketQuantity;
  return Math.round(ticketSubtotal * tier.rate);
}

function getMerchBulkDiscount(state: CartState): number {
  if (state.ticketQuantity < MERCH_DISCOUNT_MIN_TICKETS) return 0;
  return Math.round(getMerchTotal(state) * MERCH_DISCOUNT_RATE);
}

function getSubtotal(state: CartState): number {
  return getTicketPrice(state) * state.ticketQuantity + getMerchTotal(state);
}

function getServiceFee(state: CartState): number {
  return Math.round(getSubtotal(state) * SERVICE_FEE_RATE);
}

function getTotal(state: CartState): number {
  const autoDiscount = getTicketBulkDiscount(state) + getMerchBulkDiscount(state);
  return Math.max(0, getSubtotal(state) + getServiceFee(state) - state.discountAmount - autoDiscount);
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
  getMerchBulkDiscount: () => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const value: CartContextValue = {
    state,
    dispatch,
    getTicketPrice: () => getTicketPrice(state),
    getMerchTotal: () => getMerchTotal(state),
    getSubtotal: () => getSubtotal(state),
    getServiceFee: () => getServiceFee(state),
    getTotal: () => getTotal(state),
    getTicketBulkDiscount: () => getTicketBulkDiscount(state),
    getMerchBulkDiscount: () => getMerchBulkDiscount(state),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export { TICKET_PRICE_EARLY, TICKET_PRICE_VINNUNIAN, TICKET_PRICE_NON_VINNUNIAN, SERVICE_FEE_RATE };
