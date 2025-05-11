import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types/order-types"

interface OrderState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: "提供済み" | "キャンセル") => void
  clearOrders: () => void
  syncOrders: (orders: Order[]) => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => {
        set((state) => {
          const newOrders = [...state.orders, order]
          // localStorageに直接保存して他のタブに通知
          localStorage.setItem(
            "order-sync-event",
            JSON.stringify({
              type: "add-order",
              timestamp: new Date().getTime(),
              order,
            }),
          )
          return { orders: newOrders }
        })
      },
      updateOrderStatus: (orderId, status) =>
        set((state) => {
          const updatedOrders = state.orders.map((order) => (order.id === orderId ? { ...order, status } : order))
          // localStorageに直接保存して他のタブに通知
          localStorage.setItem(
            "order-sync-event",
            JSON.stringify({
              type: "update-status",
              timestamp: new Date().getTime(),
              orderId,
              status,
            }),
          )
          return { orders: updatedOrders }
        }),
      clearOrders: () => {
        set({ orders: [] })
        // localStorageに直接保存して他のタブに通知
        localStorage.setItem(
          "order-sync-event",
          JSON.stringify({
            type: "clear-orders",
            timestamp: new Date().getTime(),
          }),
        )
      },
      syncOrders: (orders) => set({ orders }),
    }),
    {
      name: "order-storage", // localStorageのキー名
      partialize: (state) => ({ orders: state.orders }), // 永続化する状態の一部を選択
    },
  ),
)
