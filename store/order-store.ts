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
  forceUpdate: () => boolean
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      lastUpdated: Date.now(),

      addOrder: (order) => {
        set((state) => {
          // 既存の注文と重複しないか確認
          const existingOrderIndex = state.orders.findIndex((o) => o.id === order.id)
          let newOrders = [...state.orders]

          if (existingOrderIndex >= 0) {
            // 既存の注文を更新
            newOrders[existingOrderIndex] = order
          } else {
            // 新しい注文を追加
            newOrders = [...state.orders, order]
          }

          // デバッグログ
          console.log("注文を追加しました:", order.id)
          console.log("現在の注文数:", newOrders.length)

          // localStorageに直接保存して他のタブに通知
          try {
            localStorage.setItem(
              "order-sync-event",
              JSON.stringify({
                type: "add-order",
                timestamp: Date.now(),
                order,
              }),
            )
          } catch (error) {
            console.error("同期イベントの保存に失敗しました:", error)
          }

          return { orders: newOrders, lastUpdated: Date.now() }
        })
      },

      updateOrderStatus: (orderId, status) =>
        set((state) => {
          const updatedOrders = state.orders.map((order) => (order.id === orderId ? { ...order, status } : order))

          // localStorageに直接保存して他のタブに通知
          try {
            localStorage.setItem(
              "order-sync-event",
              JSON.stringify({
                type: "update-status",
                timestamp: Date.now(),
                orderId,
                status,
              }),
            )
          } catch (error) {
            console.error("同期イベントの保存に失敗しました:", error)
          }

          return { orders: updatedOrders, lastUpdated: Date.now() }
        }),

      clearOrders: () => {
        set({ orders: [], lastUpdated: Date.now() })

        // localStorageに直接保存して他のタブに通知
        try {
          localStorage.setItem(
            "order-sync-event",
            JSON.stringify({
              type: "clear-orders",
              timestamp: Date.now(),
            }),
          )
        } catch (error) {
          console.error("同期イベントの保存に失敗しました:", error)
        }
      },

      syncOrders: (orders) => set({ orders, lastUpdated: Date.now() }),

      getOrders: () => get().orders,

      // 強制的に更新を行うメソッド - 修正版
      forceUpdate: () => {
        try {
          const orderStorageData = localStorage.getItem("order-storage")
          if (orderStorageData) {
            const parsedData = JSON.parse(orderStorageData)
            if (parsedData.state && Array.isArray(parsedData.state.orders)) {
              // デバッグログ
              console.log("forceUpdate: 注文データを読み込みました", parsedData.state.orders.length)

              set({
                orders: parsedData.state.orders,
                lastUpdated: Date.now(),
              })
              return true
            } else {
              console.warn("forceUpdate: 注文データの形式が不正です", parsedData)
            }
          } else {
            console.warn("forceUpdate: localStorage に注文データがありません")
          }
        } catch (error) {
          console.error("注文データの同期中にエラーが発生しました:", error)
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
  try {
    // 現在のタブのデータを更新
    const store = useOrderStore.getState()
    const success = store.forceUpdate()
    console.log("syncOrdersAcrossTabs: 同期結果", success)

    // 他のタブに通知
    localStorage.setItem(
      "order-sync-event",
      JSON.stringify({
        type: "force-sync",
        timestamp: Date.now(),
      }),
    )
    return success
  } catch (error) {
    console.error("タブ間同期中にエラーが発生しました:", error)
    return false
  }
}
