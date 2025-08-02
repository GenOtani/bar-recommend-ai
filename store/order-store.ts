import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types/order-types"

interface OrderState {
  orders: Order[]
  lastUpdated: number
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: "未提供" | "提供済み" | "キャンセル") => void
  clearOrders: () => void
  syncOrders: (orders: Order[]) => void
  getOrders: () => Order[]
  forceUpdate: () => boolean
}

// デバッグ用のログ関数
const logDebug = (message: string, data?: any) => {
  console.log(`[OrderStore] ${message}`, data || "")
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      lastUpdated: Date.now(),

      addOrder: (order) => {
        logDebug(`注文追加開始: ${order.id}`)

        set((state) => {
          // 既存の注文と重複しないか確認
          const existingOrderIndex = state.orders.findIndex((o) => o.id === order.id)
          let newOrders = [...state.orders]

          if (existingOrderIndex >= 0) {
            // 既存の注文を更新
            logDebug(`既存の注文を更新: ${order.id}`)
            newOrders[existingOrderIndex] = order
          } else {
            // 新しい注文を追加
            logDebug(`新しい注文を追加: ${order.id}`)
            newOrders = [...state.orders, order]
          }

          // 更新後の注文数をログ
          logDebug(`現在の注文数: ${newOrders.length}`)

          // APIに注文を送信
          fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ order }),
          }).catch((error) => {
            console.error("注文の送信に失敗しました:", error)
          })

          return { orders: newOrders, lastUpdated: Date.now() }
        })
      },

      updateOrderStatus: (orderId, status) => {
        logDebug(`注文ステータス更新開始: ${orderId} -> ${status}`)

        set((state) => {
          // 対象の注文を見つける
          const orderIndex = state.orders.findIndex((order) => order.id === orderId)

          if (orderIndex === -1) {
            logDebug(`注文が見つかりません: ${orderId}`)
            return state
          }

          // 注文のコピーを作成して更新
          const updatedOrder = { ...state.orders[orderIndex], status }
          const updatedOrders = [...state.orders]
          updatedOrders[orderIndex] = updatedOrder

          logDebug(`注文ステータスを更新しました: ${orderId} -> ${status}`)

          // APIにステータス更新を送信
          fetch("/api/orders", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId, status }),
          }).catch((error) => {
            console.error("ステータス更新の送信に失敗しました:", error)
          })

          return { orders: updatedOrders, lastUpdated: Date.now() }
        })
      },

      clearOrders: () => {
        set({ orders: [], lastUpdated: Date.now() })
      },

      syncOrders: (orders) => {
        logDebug(`syncOrders 呼び出し: ${orders.length}件の注文で同期`)
        set({ orders, lastUpdated: Date.now() })
      },

      getOrders: () => get().orders,

      // 強制的に更新を行うメソッド
      forceUpdate: () => {
        try {
          logDebug("forceUpdate 呼び出し")

          // APIから最新の注文データを取得
          fetch("/api/orders")
            .then((response) => response.json())
            .then((data) => {
              if (data.orders) {
                const currentOrders = get().orders
                if (currentOrders.length !== data.orders.length) {
                  logDebug(`注文数が変更されました: ${currentOrders.length} -> ${data.orders.length}`)
                  set({
                    orders: data.orders,
                    lastUpdated: Date.now(),
                  })
                  return true
                }
              }
              return false
            })
            .catch((error) => {
              console.error("注文データの取得に失敗しました:", error)
            })

          return true
        } catch (error) {
          console.error("注文データの同期中にエラーが発生しました:", error)
          return false
        }
      },
    }),
    {
      name: "order-storage",
      partialize: (state) => ({ orders: state.orders, lastUpdated: state.lastUpdated }),
    },
  ),
)
