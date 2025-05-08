import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types/order-types"

interface OrderState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: "提供済み" | "キャンセル") => void
  clearOrders: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
        })),
      clearOrders: () => set({ orders: [] }),
    }),
    {
      name: "order-storage", // localStorageのキー名
      partialize: (state) => ({ orders: state.orders }), // 永続化する状態の一部を選択
    },
  ),
)
