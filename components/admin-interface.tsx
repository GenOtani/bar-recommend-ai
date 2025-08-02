"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOrderStore } from "@/store/order-store"
import { SimpleExport } from "@/components/simple-export"
import type { Order } from "@/types/order-types"

export function AdminInterface() {
  const { orders, forceUpdate, updateOrderStatus } = useOrderStore()
  const [activeTab, setActiveTab] = useState("orders")
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<"提供済み" | "キャンセル">("提供済み")
  const [lastRefreshed, setLastRefreshed] = useState(Date.now())

  // 今日の注文のみをフィルタリング
  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.timestamp)
    const today = new Date()
    return orderDate.toDateString() === today.toDateString()
  })

  // 売上集計
  const totalSales = todayOrders.reduce((total, order) => total + order.totalAmount, 0)
  const totalItems = todayOrders.reduce(
    (total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  )

  // 手動更新ハンドラー
  const handleManualRefresh = () => {
    console.log("手動更新を実行します")
    const success = forceUpdate()
    setLastRefreshed(Date.now())

    if (success) {
      alert("データを更新しました")
    } else {
      alert("データの更新に失敗しました")
    }
  }

  // 注文ステータス変更ダイアログを開く
  const openStatusDialog = (order: Order, status: "提供済み" | "キャンセル") => {
    setSelectedOrder(order)
    setNewStatus(status)
    setStatusDialogOpen(true)
  }

  // 注文ステータスを変更する
  const handleStatusChange = () => {
    if (!selectedOrder) return

    // ステータスを更新
    updateOrderStatus(selectedOrder.id, newStatus)

    // 成功メッセージ
    alert(`注文 ${selectedOrder.id} のステータスを「${newStatus}」に変更しました`)

    // ダイアログを閉じる
    setStatusDialogOpen(false)
    setSelectedOrder(null)
  }

  // タブが切り替わったときに強制更新
  useEffect(() => {
    if (activeTab === "orders") {
      forceUpdate()
      setLastRefreshed(Date.now())
    }
  }, [activeTab, forceUpdate])

  return (
    <div className="w-full max-w-4xl">
      {/* ステータス変更ダイアログ */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">注文ステータスの変更</DialogTitle>
            <DialogDescription className="text-zinc-400">
              注文のステータスを「{newStatus}」に変更します。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-zinc-700 p-3 rounded-md">
                  <div className="font-medium text-amber-400 mb-1">注文情報</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">注文ID:</span>
                      <span>{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">テーブル番号:</span>
                      <span>{selectedOrder.tableNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">注文時間:</span>
                      <span>{new Date(selectedOrder.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">合計金額:</span>
                      <span>{selectedOrder.totalAmount}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">現在のステータス:</span>
                      <span>
                        <Badge
                          className={
                            selectedOrder.status === "提供済み"
                              ? "bg-green-600"
                              : selectedOrder.status === "キャンセル"
                                ? "bg-red-600"
                                : "bg-amber-500"
                          }
                        >
                          {selectedOrder.status}
                        </Badge>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              className={newStatus === "提供済み" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              onClick={handleStatusChange}
            >
              {newStatus === "提供済み" ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
              {newStatus}に変更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-400">本日の売上</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSales.toLocaleString()}円</div>
            <p className="text-zinc-400 text-sm mt-1">注文数: {todayOrders.length}件</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-400">販売点数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}点</div>
            <p className="text-zinc-400 text-sm mt-1">
              平均: {todayOrders.length > 0 ? (totalItems / todayOrders.length).toFixed(1) : 0}点/注文
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-400">データ管理</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleExport orders={orders} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">注文履歴</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="w-full bg-zinc-800 border-zinc-700 mb-4">
            <CardHeader className="border-b border-zinc-700 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-amber-400">注文履歴</CardTitle>
                <CardDescription className="text-zinc-400">
                  全ての注文履歴を確認できます
                  <br />
                  <span className="text-xs">最終更新: {new Date(lastRefreshed).toLocaleTimeString()}</span>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="flex items-center gap-1 bg-transparent"
              >
                <RefreshCw className="h-3 w-3" />
                更新
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-4">
                {orders.length === 0 ? (
                  <div className="py-6 text-center space-y-4">
                    <p className="text-zinc-400">注文履歴がありません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((order) => (
                        <div key={order.id} className="bg-zinc-700 rounded-md p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <div className="font-bold text-amber-400">{order.id}</div>
                              <div className="text-sm text-zinc-400">
                                {new Date(order.timestamp).toLocaleString()} - テーブル {order.tableNumber}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  order.status === "提供済み"
                                    ? "bg-green-600"
                                    : order.status === "キャンセル"
                                      ? "bg-red-600"
                                      : "bg-amber-500"
                                }
                              >
                                {order.status}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => openStatusDialog(order, "提供済み")}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => openStatusDialog(order, "キャンセル")}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 mt-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {item.name} × {item.quantity}
                                </span>
                                <span>{item.price}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-zinc-600 mt-3 pt-3 flex justify-between font-bold">
                            <span>合計</span>
                            <span>{order.totalAmount}円</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="w-full bg-zinc-800 border-zinc-700 mb-4">
            <CardHeader className="border-b border-zinc-700">
              <CardTitle className="text-amber-400">システム設定</CardTitle>
              <CardDescription className="text-zinc-400">システムの設定を変更できます</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">データ管理</h3>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SimpleExport orders={orders} />
                      <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-950 bg-transparent">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        データリセット
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">システム情報</h3>
                  <div className="bg-zinc-700 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-zinc-400">バージョン:</div>
                      <div>1.0.0</div>
                      <div className="text-zinc-400">最終更新日:</div>
                      <div>{new Date().toLocaleDateString()}</div>
                      <div className="text-zinc-400">注文データ数:</div>
                      <div>{orders.length}件</div>
                      <div className="text-zinc-400">最終同期:</div>
                      <div>{new Date(lastRefreshed).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
