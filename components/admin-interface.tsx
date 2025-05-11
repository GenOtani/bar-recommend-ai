"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Download, RefreshCw } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import { useOrderStore } from "@/store/order-store"
import { SpreadsheetSetup } from "@/components/spreadsheet-setup"
import { SimpleExport } from "@/components/simple-export"
import { NotificationCenter } from "@/components/notification-center"
import { useNotificationStore } from "@/store/notification-store"

export function AdminInterface() {
  const { orders, forceUpdate, syncOrders } = useOrderStore()
  const [activeTab, setActiveTab] = useState("orders")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59, 999)),
  })
  const { notifications } = useNotificationStore()
  const previousNotificationsLength = useRef(notifications.length)
  const ordersRef = useRef(orders)
  const [lastRefreshed, setLastRefreshed] = useState(Date.now())

  // 今日の注文のみをフィルタリング
  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.timestamp)
    return orderDate >= dateRange.start && orderDate <= dateRange.end
  })

  // 売上集計
  const totalSales = todayOrders.reduce((total, order) => total + order.totalAmount, 0)
  const totalItems = todayOrders.reduce(
    (total, order) => total + order.items.reduce((sum, item) => sum + item.quantity, 0),
    0,
  )

  // カテゴリー別売上
  const categorySales: Record<string, { count: number; amount: number }> = {}
  todayOrders.forEach((order) => {
    order.items.forEach((item) => {
      const category =
        item.id.includes("ハイボール") || item.id.includes("サワー")
          ? "ハイボールとサワー"
          : item.id.includes("梅酒") ||
              item.id.includes("カシス") ||
              item.id.includes("パッソア") ||
              item.id.includes("ピーチ")
            ? "果実酒とリキュール"
            : item.id.includes("ミルク")
              ? "ミルクカクテル"
              : item.id.includes("ノンアルコール") ||
                  item.id.includes("シンデレラ") ||
                  item.id.includes("シャーリー") ||
                  item.id.includes("ブルーラグーン") ||
                  item.id.includes("サラトガ")
                ? "ノンアルコール"
                : item.id.includes("ウーロン茶") ||
                    item.id.includes("緑茶") ||
                    item.id.includes("コーヒー") ||
                    item.id.includes("カルピス") ||
                    item.id.includes("コーラ") ||
                    item.id.includes("ジンジャー") ||
                    item.id.includes("オレンジ") ||
                    item.id.includes("パイナップル") ||
                    item.id.includes("グレープフルーツ")
                  ? "ソフトドリンク"
                  : item.id.includes("パスタ") ||
                      item.id.includes("じゃがバター") ||
                      item.id.includes("ホットサンド") ||
                      item.id.includes("日替わり")
                    ? "フード"
                    : "その他"

      if (!categorySales[category]) {
        categorySales[category] = { count: 0, amount: 0 }
      }
      categorySales[category].count += item.quantity
      categorySales[category].amount += item.priceValue * item.quantity
    })
  })

  // 注文データをCSV形式に変換
  const convertOrdersToCSV = () => {
    // CSVのヘッダー
    const headers = ["注文ID", "テーブル番号", "注文日時", "商品名", "単価", "数量", "小計", "合計金額", "ステータス"]

    // CSVの行データ
    const rows: string[][] = []

    orders.forEach((order) => {
      // 注文の各商品ごとに行を作成
      order.items.forEach((item, index) => {
        const subtotal = item.priceValue * item.quantity

        // 最初の商品の行には注文の基本情報も含める
        if (index === 0) {
          rows.push([
            order.id,
            order.tableNumber,
            new Date(order.timestamp).toLocaleString(),
            item.name,
            item.priceValue.toString(),
            item.quantity.toString(),
            subtotal.toString(),
            order.totalAmount.toString(),
            order.status,
          ])
        } else {
          // 2つ目以降の商品行は注文IDなどを空欄にする
          rows.push([
            "", // 注文ID
            "", // テーブル番号
            "", // 注文日時
            item.name,
            item.priceValue.toString(),
            item.quantity.toString(),
            subtotal.toString(),
            "", // 合計金額
            "", // ステータス
          ])
        }
      })

      // 注文ごとに空行を追加して見やすくする
      rows.push(Array(headers.length).fill(""))
    })

    // ヘッダーと行データを結合してCSV文字列を作成
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    return csvContent
  }

  // CSVファイルをダウンロード
  const downloadCSV = () => {
    if (orders.length === 0) {
      toast({
        title: "注文履歴がありません",
        description: "エクスポートするデータがありません。",
        variant: "destructive",
      })
      return
    }

    // CSVデータを生成
    const csvData = convertOrdersToCSV()

    // BOMを追加してExcelで文字化けしないようにする
    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const blob = new Blob([bom, csvData], { type: "text/csv;charset=utf-8;" })

    // ダウンロードリンクを作成
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `注文履歴_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)

    // リンクをクリックしてダウンロード開始
    link.click()

    // クリーンアップ
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "CSVファイルをダウンロードしました",
      description: "Googleスプレッドシートで開くことができます。",
    })

    setExportDialogOpen(false)
  }

  // 手動更新ハンドラー
  const handleManualRefresh = useCallback(() => {
    console.log("手動更新を実行します")

    // 直接 localStorage から読み込む
    try {
      const orderStorageData = localStorage.getItem("order-storage")
      if (orderStorageData) {
        const parsedData = JSON.parse(orderStorageData)
        if (parsedData.state && Array.isArray(parsedData.state.orders)) {
          console.log("localStorage から注文データを読み込みました:", parsedData.state.orders.length)

          // 注文データを更新
          syncOrders(parsedData.state.orders)
          setLastRefreshed(Date.now())

          toast({
            title: "データを更新しました",
            description: `${parsedData.state.orders.length}件の注文データを読み込みました`,
            duration: 2000,
          })

          return true
        } else {
          console.warn("localStorage の注文データの形式が不正です")
        }
      } else {
        console.warn("localStorage に注文データがありません")
      }
    } catch (error) {
      console.error("手動更新中にエラーが発生しました:", error)
    }

    // 通常の forceUpdate も試す
    const success = forceUpdate()
    setLastRefreshed(Date.now())

    if (success) {
      toast({
        title: "データを更新しました",
        description: "最新の注文データが表示されています",
        duration: 2000,
      })
      return true
    } else {
      toast({
        title: "データの更新に失敗しました",
        description: "注文データが見つからないか、形式が不正です",
        variant: "destructive",
        duration: 3000,
      })
      return false
    }
  }, [forceUpdate, syncOrders])

  // 通知が来たときに注文履歴を自動的に更新
  useEffect(() => {
    // 通知の数が増えた場合（新しい通知が来た場合）
    if (notifications.length > previousNotificationsLength.current) {
      // 新しい通知を取得
      const newNotifications = notifications.slice(0, notifications.length - previousNotificationsLength.current)

      // 注文タイプの通知があるか確認
      const hasOrderNotification = newNotifications.some((notification) => notification.type === "order")

      // 注文タイプの通知があれば、注文履歴タブに切り替えて強制更新
      if (hasOrderNotification) {
        setActiveTab("orders")
        forceUpdate()
        setLastRefreshed(Date.now())

        // トーストで通知
        toast({
          title: "新しい注文が追加されました",
          description: "注文履歴が自動的に更新されました。",
        })
      }
    }

    // 現在の通知数を保存
    previousNotificationsLength.current = notifications.length
  }, [notifications, forceUpdate])

  // 注文データが変更されたときの処理
  useEffect(() => {
    // 注文データが変更された場合
    if (orders !== ordersRef.current) {
      ordersRef.current = orders
      setLastRefreshed(Date.now())
    }
  }, [orders])

  // タブが切り替わったときに強制更新
  useEffect(() => {
    if (activeTab === "orders") {
      forceUpdate()
      setLastRefreshed(Date.now())
    }
  }, [activeTab, forceUpdate])

  // 定期的な更新（10秒ごと）
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (activeTab === "orders") {
        forceUpdate()
        setLastRefreshed(Date.now())
      }
    }, 10000)

    return () => clearInterval(intervalId)
  }, [activeTab, forceUpdate])

  return (
    <div className="w-full max-w-4xl">
      {/* エクスポートダイアログ */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">注文データのエクスポート</DialogTitle>
            <DialogDescription className="text-zinc-400">
              注文データをCSV形式でダウンロードし、Googleスプレッドシートにインポートできます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Googleスプレッドシートへのインポート方法:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-300">
                <li>下のボタンをクリックしてCSVファイルをダウンロードします</li>
                <li>Googleドライブにアクセスし、新規スプレッドシートを作成します</li>
                <li>「ファイル」→「インポート」を選択します</li>
                <li>「アップロード」タブを選択し、ダウンロードしたCSVファイルをアップロードします</li>
                <li>インポート設定で「現在のシートを置き換える」を選択します</li>
                <li>「インポート」ボタンをクリックします</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              キャンセル
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={downloadCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSVをダウンロード
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

      <div className="flex justify-between items-center mb-4">
        <div className="w-full">
          <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">注文履歴</TabsTrigger>
              <TabsTrigger value="analytics">売上分析</TabsTrigger>
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
                  <Button variant="outline" size="sm" onClick={handleManualRefresh} className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    更新
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px] p-4">
                    {orders.length === 0 ? (
                      <div className="py-6 text-center space-y-4">
                        <p className="text-zinc-400">注文履歴がありません</p>
                        <div className="bg-zinc-700 p-4 rounded-md text-xs text-zinc-400 text-left">
                          <p className="font-bold mb-2">デバッグ情報:</p>
                          <p>最終更新: {new Date(lastRefreshed).toLocaleTimeString()}</p>
                          <p>
                            localStorage 確認:{" "}
                            {typeof window !== "undefined" && localStorage.getItem("order-storage")
                              ? "データあり"
                              : "データなし"}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                              try {
                                const data = localStorage.getItem("order-storage")
                                if (data) {
                                  const parsed = JSON.parse(data)
                                  console.log("localStorage の注文データ:", parsed)
                                  toast({
                                    title: "localStorage データを確認",
                                    description: `${parsed.state?.orders?.length || 0}件の注文データがあります`,
                                  })
                                } else {
                                  console.log("localStorage に注文データがありません")
                                  toast({
                                    title: "localStorage データを確認",
                                    description: "注文データがありません",
                                    variant: "destructive",
                                  })
                                }
                              } catch (error) {
                                console.error("localStorage データの確認中にエラー:", error)
                              }
                            }}
                          >
                            localStorage データを確認
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((order, index) => {
                            // 最新の注文かどうかを判定（上位3件を「新着」とする）
                            const isNew =
                              index < 3 && new Date().getTime() - new Date(order.timestamp).getTime() < 3600000 // 1時間以内

                            return (
                              <div
                                key={order.id}
                                className={`bg-zinc-700 rounded-md p-4 transition-all ${
                                  isNew ? "border-l-4 border-amber-500 animate-pulse" : ""
                                }`}
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <div className="font-bold text-amber-400">
                                      {order.id}
                                      {isNew && (
                                        <span className="ml-2 text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full">
                                          新着
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-zinc-400">
                                      {new Date(order.timestamp).toLocaleString()} - テーブル {order.tableNumber}
                                    </div>
                                  </div>
                                  <Badge className={order.status === "提供済み" ? "bg-green-600" : "bg-red-600"}>
                                    {order.status}
                                  </Badge>
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
                            )
                          })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="w-full bg-zinc-800 border-zinc-700 mb-4">
                <CardHeader className="border-b border-zinc-700">
                  <CardTitle className="text-amber-400">売上分析</CardTitle>
                  <CardDescription className="text-zinc-400">カテゴリー別の売上データを確認できます</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">カテゴリー別売上</h3>
                      <div className="space-y-3">
                        {Object.entries(categorySales).map(([category, data]) => (
                          <div key={category} className="bg-zinc-700 p-3 rounded-md">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{category}</span>
                              <span className="font-bold">{data.amount.toLocaleString()}円</span>
                            </div>
                            <div className="w-full bg-zinc-600 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full"
                                style={{
                                  width: `${totalSales > 0 ? (data.amount / totalSales) * 100 : 0}%`,
                                }}
                              ></div>
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {data.count}点 ({totalItems > 0 ? Math.round((data.count / totalItems) * 100) : 0}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">時間帯別注文数</h3>
                      <div className="bg-zinc-700 p-4 rounded-md text-center">
                        <p className="text-zinc-400">グラフ表示は準備中です</p>
                      </div>
                    </div>
                  </div>
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
                          <Button className="bg-green-700 hover:bg-green-800" onClick={() => setExportDialogOpen(true)}>
                            <Download className="h-4 w-4 mr-2" />
                            データエクスポート
                          </Button>
                          <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-950">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            データリセット
                          </Button>
                        </div>
                        <SpreadsheetSetup />
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

        {/* 通知センターを追加 */}
        <div className="ml-4">
          <NotificationCenter />
        </div>
      </div>
    </div>
  )
}
