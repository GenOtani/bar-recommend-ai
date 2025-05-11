"use client"

import { useEffect, useRef, useState } from "react"
import { useOrderStore } from "@/store/order-store"
import { useNotificationStore, type Notification } from "@/store/notification-store"
import { toast } from "@/components/ui/use-toast"

export function TabSyncManager() {
  const { orders, syncOrders, forceUpdate } = useOrderStore()
  const { notifications, unreadCount, syncNotifications } = useNotificationStore()
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncTimeRef = useRef<number>(Date.now())
  const [debugInfo, setDebugInfo] = useState<{
    lastSyncAttempt: string
    lastSuccessfulSync: string
    syncCount: number
  }>({
    lastSyncAttempt: "なし",
    lastSuccessfulSync: "なし",
    syncCount: 0,
  })

  // 注文データの同期 - イベントベース
  useEffect(() => {
    const handleOrderStorageChange = (event: StorageEvent) => {
      if (event.key === "order-sync-event" && event.newValue) {
        try {
          const syncEvent = JSON.parse(event.newValue)
          const currentTime = Date.now()

          // デバッグ情報を更新
          setDebugInfo((prev) => ({
            ...prev,
            lastSyncAttempt: new Date().toLocaleTimeString(),
            syncCount: prev.syncCount + 1,
          }))

          // 最後の同期から100ms以上経過している場合のみ処理（連続イベントの防止）
          if (currentTime - lastSyncTimeRef.current > 100) {
            lastSyncTimeRef.current = currentTime

            console.log("同期イベントを受信しました:", syncEvent.type)

            // 最新のデータを取得
            const success = forceUpdate()

            if (success) {
              setDebugInfo((prev) => ({
                ...prev,
                lastSuccessfulSync: new Date().toLocaleTimeString(),
              }))

              // 新しい注文の場合、トースト通知
              if (syncEvent.type === "add-order") {
                // 管理者向けの詳細なトースト通知
                const order = syncEvent.order
                if (order) {
                  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)

                  toast({
                    title: `新規注文: テーブル${order.tableNumber}`,
                    description: `${itemCount}点の注文 - 合計: ${order.totalAmount}円`,
                    variant: "default",
                    duration: 5000, // 通知を長めに表示
                  })
                }
              }
            } else {
              console.warn("同期に失敗しました")
            }
          }
        } catch (error) {
          console.error("注文データの同期中にエラーが発生しました:", error)
        }
      }
    }

    window.addEventListener("storage", handleOrderStorageChange)

    // 初回マウント時に強制同期
    const initialSync = () => {
      const success = forceUpdate()
      console.log("初期同期結果:", success)
      if (success) {
        setDebugInfo((prev) => ({
          ...prev,
          lastSuccessfulSync: new Date().toLocaleTimeString(),
        }))
      }
    }

    // 少し遅延させて初期同期を実行（他のコンポーネントの初期化後）
    const initTimer = setTimeout(initialSync, 500)

    // 定期的なポーリングを設定（5秒ごと）
    syncIntervalRef.current = setInterval(() => {
      setDebugInfo((prev) => ({
        ...prev,
        lastSyncAttempt: new Date().toLocaleTimeString(),
      }))

      const success = forceUpdate()
      if (success) {
        setDebugInfo((prev) => ({
          ...prev,
          lastSuccessfulSync: new Date().toLocaleTimeString(),
          syncCount: prev.syncCount + 1,
        }))
      }
    }, 5000)

    return () => {
      window.removeEventListener("storage", handleOrderStorageChange)
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      clearTimeout(initTimer)
    }
  }, [forceUpdate])

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

                  // 注文データも同時に更新
                  forceUpdate()
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
  }, [syncNotifications, forceUpdate])

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log("TabSyncManager デバッグ情報:", debugInfo)
  }, [debugInfo])

  // このコンポーネントは何もレンダリングしない
  return null
}
