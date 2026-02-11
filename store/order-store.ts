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

          // 同期イベントを発火する前に、まず状態を更新
          const newState = { orders: newOrders, lastUpdated: Date.now() }

          // 同期イベントを発火（非同期で）
          setTimeout(() => {
            try {
              localStorage.setItem(
                "order-sync-event",
                JSON.stringify({
                  type: "add-order",
                  timestamp: Date.now(),
                  order,
                }),
              )
              logDebug(`同期イベント発火: add-order ${order.id}`)
            } catch (error) {
              console.error("同期イベントの保存に失敗しました:", error)
            }
          }, 100)

          return newState
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

          // 同期イベントを発火（非同期で）
          setTimeout(() => {
            try {
              localStorage.setItem(
                "order-sync-event",
                JSON.stringify({
                  type: "update-status",
                  timestamp: Date.now(),
                  orderId,
                  status,
                  order: updatedOrder,
                }),
              )
              logDebug(`同期イベント発火: update-status ${orderId} -> ${status}`)
            } catch (error) {
              console.error("同期イベントの保存に失敗しました:", error)
            }
          }, 100)

          return { orders: updatedOrders, lastUpdated: Date.now() }
        })
      },

      clearOrders: () => {
        set({ orders: [], lastUpdated: Date.now() })

        // 同期イベントを発火（非同期で）
        setTimeout(() => {
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
        }, 100)
      },

      syncOrders: (orders) => {
        logDebug(`syncOrders 呼び出し: ${orders.length}件の注文で同期`)
        set({ orders, lastUpdated: Date.now() })
      },

      getOrders: () => get().orders,

      // 強制的に更新を行うメソッド - 修正版
      forceUpdate: () => {
        try {
          logDebug("forceUpdate 呼び出し")
          const orderStorageData = localStorage.getItem("order-storage")
          if (orderStorageData) {
            const parsedData = JSON.parse(orderStorageData)
            if (parsedData.state && Array.isArray(parsedData.state.orders)) {
              logDebug(`forceUpdate: 注文データを読み込みました (${parsedData.state.orders.length}件)`)

              // 現在の状態と比較して変更があるか確認
              const currentOrders = get().orders
              const newOrders = parsedData.state.orders

              // 注文数が異なる場合は更新
              if (currentOrders.length !== newOrders.length) {
                logDebug(`注文数が変更されました: ${currentOrders.length} -> ${newOrders.length}`)
                set({
                  orders: newOrders,
                  lastUpdated: Date.now(),
                })
                return true
              }

              // 注文IDを比較して変更があるか確認
              const currentIds = new Set(currentOrders.map((o) => o.id))
              const hasNewOrders = newOrders.some((o) => !currentIds.has(o.id))

              if (hasNewOrders) {
                logDebug("新しい注文が見つかりました")
                set({
                  orders: newOrders,
                  lastUpdated: Date.now(),
                })
                return true
              }

              // ステータスの変更を確認
              const hasStatusChanges = newOrders.some((newOrder) => {
                const currentOrder = currentOrders.find((o) => o.id === newOrder.id)
                return currentOrder && currentOrder.status !== newOrder.status
              })

              if (hasStatusChanges) {
                logDebug("注文ステータスの変更が見つかりました")
                set({
                  orders: newOrders,
                  lastUpdated: Date.now(),
                })
                return true
              }

              logDebug("注文データに変更はありません")
              return false
            } else {
              logDebug("forceUpdate: 注文データの形式が不正です", parsedData)
            }
          } else {
            logDebug("forceUpdate: localStorage に注文データがありません")
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
    logDebug("syncOrdersAcrossTabs 呼び出し")

    // 現在のタブのデータを更新
    const store = useOrderStore.getState()
    const success = store.forceUpdate()
    logDebug(`syncOrdersAcrossTabs: 同期結果 ${success ? "成功" : "変更なし"}`)

    // 他のタブに通知（非同期で）
    setTimeout(() => {
      localStorage.setItem(
        "order-sync-event",
        JSON.stringify({
          type: "force-sync",
          timestamp: Date.now(),
        }),
      )
      logDebug("force-sync イベント発火")
    }, 100)

    return success
  } catch (error) {
    console.error("タブ間同期中にエラーが発生しました:", error)
    return false
  }
}
