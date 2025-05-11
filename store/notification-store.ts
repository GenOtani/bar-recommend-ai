import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order } from "@/types/order-types"

export type Notification = {
  id: string
  type: "order" | "system"
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      addNotification: (notification) => {
        const newNotification: Notification = {
          id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date(),
          read: false,
          ...notification,
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      },
      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          )
          const unreadCount = updatedNotifications.filter((notification) => !notification.read).length
          return { notifications: updatedNotifications, unreadCount }
        })
      },
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
          unreadCount: 0,
        }))
      },
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 })
      },
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({ notifications: state.notifications }),
    },
  ),
)

// 注文から通知を作成するヘルパー関数
export const createOrderNotification = (order: Order): Omit<Notification, "id" | "timestamp" | "read"> => {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)

  return {
    type: "order",
    title: `新規注文: テーブル${order.tableNumber}`,
    message: `${itemCount}点の注文が入りました。合計金額: ${order.totalAmount}円`,
    data: order,
  }
}
