"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_CART_QTY = 50;

export interface CartItem {
  /** Line identity — one line per product + option. See `cartLineKey`. */
  key: string;
  productId: string;
  variantId: string | null;
  variantName: string | null;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

/** Stable line key so the same option always lands on the same row. */
export function cartLineKey(productId: string, variantId: string | null = null) {
  return variantId ? `${productId}:${variantId}` : productId;
}

type NewCartItem = Omit<CartItem, "key" | "quantity" | "variantId" | "variantName"> &
  Partial<Pick<CartItem, "variantId" | "variantName">>;

interface CartState {
  items: CartItem[];
  addItem: (item: NewCartItem, quantity?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const clampQty = (quantity: number) => Math.min(quantity, MAX_CART_QTY);

/** Version 1 carts were keyed by product id alone, before options existed. */
interface LegacyCartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const variantId = item.variantId ?? null;
          const key = cartLineKey(item.productId, variantId);
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: clampQty(i.quantity + quantity) } : i,
              ),
            };
          }
          const line: CartItem = {
            ...item,
            key,
            variantId,
            variantName: item.variantName ?? null,
            quantity: clampQty(quantity),
          };
          return { items: [...state.items, line] };
        }),
      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) =>
                  i.key === key ? { ...i, quantity: clampQty(quantity) } : i,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "dl-cart",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { items?: LegacyCartItem[] };
        if (version >= 2 || !Array.isArray(state.items)) return persisted as CartState;
        return {
          ...state,
          items: state.items.map((i) => ({
            ...i,
            key: cartLineKey(i.productId),
            variantId: null,
            variantName: null,
          })),
        } as CartState;
      },
    },
  ),
);

/* Derived selectors — use these instead of recomputing in components. */
export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartSubtotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
/** Units of a product in the cart across all of its options. */
export const selectProductQuantity = (productId: string) => (s: CartState) =>
  s.items.reduce((sum, i) => (i.productId === productId ? sum + i.quantity : sum), 0);
