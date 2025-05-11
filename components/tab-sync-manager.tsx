"use client"

import { useEffect } from "react"
import { useOrderStore } from "@/store/order-store"
import { useNotificationStore, type Notification } from "@/store/notification-store"
import { toast } from "@/components/ui/use-toast"

export function TabSyncManager() {
  const { orders, syncOrders } = useOrderStore()
  const { notifications, unreadCount, syncNotifications } = useNotificationStore()

  // 注文データの同期
  useEffect(() => {
    const handleOrderStorageChange = (event: StorageEvent) => {
      if (event.key === "order-sync-event" && event.newValue) {
        try {
          const syncEvent = JSON.parse(event.newValue)

          // 最新のデータを取得
          const orderStorageData = localStorage.getItem("order-storage")
          if (orderStorageData) {
            const parsedData = JSON.parse(orderStorageData)
            if (parsedData.state && Array.isArray(parsedData.state.orders)) {
              syncOrders(parsedData.state.orders)

              // 新しい注文の場合、トーストで通知
              if (syncEvent.type === "add-order") {
                // 管理者向けの詳細なトースト通知
                const order = syncEvent.order
                const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)

                toast({
                  title: `新規注文: テーブル${order.tableNumber}`,
                  description: `${itemCount}点の注文 - 合計: ${order.totalAmount}円`,
                  variant: "default",
                  duration: 5000, // 通知を長めに表示
                })
              }
            }
          }
        } catch (error) {
          console.error("注文データの同期中にエラーが発生しました:", error)
        }
      }
    }

    window.addEventListener("storage", handleOrderStorageChange)
    return () => {
      window.removeEventListener("storage", handleOrderStorageChange)
    }
  }, [syncOrders])

  // 通知データの同期
  useEffect(() => {
    const handleNotificationStorageChange = (event: StorageEvent) => {
      if (event.key === "notification-sync-event" && event.newValue) {
        try {
          const syncEvent = JSON.parse(event.newValue)

          // 最新のデータを取得
          const notificationStorageData = localStorage.getItem("notification-storage")
          if (notificationStorageData) {
            const parsedData = JSON.parse(notificationStorageData)
            if (parsedData.state && Array.isArray(parsedData.state.notifications)) {
              // 未読カウントを計算
              const newUnreadCount = parsedData.state.notifications.filter(
                (notification: Notification) => !notification.read,
              ).length

              syncNotifications(parsedData.state.notifications, newUnreadCount)

              // 新しい通知の場合、サウンドを再生
              if (syncEvent.type === "add-notification" && typeof window !== "undefined") {
                try {
                  const audio = new Audio("/notification-sound.mp3")
                  audio.play().catch((err) => console.log("通知音の再生に失敗しました:", err))
                } catch (error) {
                  console.error("通知音の再生中にエラーが発生しました:", error)
                }
              }
            }
          }
        } catch (error) {
          console.error("通知データの同期中にエラーが発生しました:", error)
        }
      }
    }

    window.addEventListener("storage", handleNotificationStorageChange)
    return () => {
      window.removeEventListener("storage", handleNotificationStorageChange)
    }
  }, [syncNotifications])

  // このコンポーネントは何もレンダリングしない
  return null
}
