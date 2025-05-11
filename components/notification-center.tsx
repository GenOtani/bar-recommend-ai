"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotificationStore, type Notification } from "@/store/notification-store"
import { toast } from "@/components/ui/use-toast"

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const [sound, setSound] = useState<HTMLAudioElement | null>(null)

  // 通知音の初期化
  useEffect(() => {
    // ブラウザ環境でのみ実行
    if (typeof window !== "undefined") {
      const audio = new Audio("/notification-sound.mp3")
      setSound(audio)
    }
  }, [])

  // 通知をクリックしたときの処理
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // 注文通知の場合、注文詳細を表示するなどの処理を追加できます
    if (notification.type === "order" && notification.data) {
      // 例: 注文詳細を表示するトーストを表示
      toast({
        title: `注文詳細: ${notification.data.id}`,
        description: `テーブル${notification.data.tableNumber}からの注文です。合計: ${notification.data.totalAmount}円`,
      })
    }

    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-500 text-white border-none">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-zinc-800 border-zinc-700 text-white p-0">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-medium text-amber-400">通知</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => markAllAsRead()}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => clearNotifications()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">通知はありません</div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors ${
                    !notification.read ? "bg-zinc-700/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-amber-400">{notification.title}</h4>
                    <span className="text-xs text-zinc-400">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
