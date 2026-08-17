import { create } from 'zustand'

interface CartState {
  items: number
  addItem: () => void
  removeItem: () => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: 0,
  addItem: () => set((state) => ({ items: state.items + 1 })),
  removeItem: () => set((state) => ({ items: Math.max(0, state.items - 1) })),
  clearCart: () => set({ items: 0 }),
}))
