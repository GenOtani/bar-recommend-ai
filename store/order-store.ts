import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types/order-types"

interface OrderState {
  orders: Order[]
  lastUpdated: number
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: "提供済み" | "キャンセル") => void
  clearOrders: () => void
  syncOrders: (orders: Order[]) => void
  getOrders: () => Order[]
  forceUpdate: () => void
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      lastUpdated: Date.now(),

      addOrder: (order) => {
        set((state) => {
          const newOrders = [...state.orders, order]
          // localStorageに直接保存して他のタブに通知
          localStorage.setItem(
            "order-sync-event",
            JSON.stringify({
              type: "add-order",
              timestamp: Date.now(),
              order,
            }),
          )
          return { orders: newOrders, lastUpdated: Date.now() }
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
              timestamp: Date.now(),
              orderId,
              status,
            }),
          )
          return { orders: updatedOrders, lastUpdated: Date.now() }
        }),

      clearOrders: () => {
        set({ orders: [], lastUpdated: Date.now() })
        // localStorageに直接保存して他のタブに通知
        localStorage.setItem(
          "order-sync-event",
          JSON.stringify({
            type: "clear-orders",
            timestamp: Date.now(),
          }),
        )
      },

      syncOrders: (orders) => set({ orders, lastUpdated: Date.now() }),

      getOrders: () => get().orders,

      // 強制的に更新を行うメソッド
      forceUpdate: () => {
        const orderStorageData = localStorage.getItem("order-storage")
        if (orderStorageData) {
          try {
            const parsedData = JSON.parse(orderStorageData)
            if (parsedData.state && Array.isArray(parsedData.state.orders)) {
              set({
                orders: parsedData.state.orders,
                lastUpdated: Date.now(),
              })
              return true
            }
          } catch (error) {
            console.error("注文データの同期中にエラーが発生しました:", error)
          }
        }
        return false
      },
    }),
    {
      name: "order-storage", // localStorageのキー名
      partialize: (state) => ({ orders: state.orders, lastUpdated: state.lastUpdated }), // 永続化する状態の一部を選択
    },
  ),
)

// 注文データを強制的に同期するヘルパー関数
export const syncOrdersAcrossTabs = () => {
  // 現在のタブのデータを更新
  const store = useOrderStore.getState()
  store.forceUpdate()

  // 他のタブに通知
  localStorage.setItem(
    "order-sync-event",
    JSON.stringify({
      type: "force-sync",
      timestamp: Date.now(),
    }),
  )
}
