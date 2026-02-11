"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Download } from "lucide-react"
import type { Order } from "@/types/order-types"

interface SimpleExportProps {
  orders: Order[]
}

export function SimpleExport({ orders }: SimpleExportProps) {
  const [isExporting, setIsExporting] = useState(false)

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
            "", // 注��日時
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
  const handleExport = () => {
    if (orders.length === 0) {
      toast({
        title: "注文履歴がありません",
        description: "エクスポートするデータがありません。",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
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
    } catch (error) {
      console.error("エクスポート中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "CSVファイルの生成中にエラーが発生しました。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || orders.length === 0}
      className="w-full bg-green-700 hover:bg-green-800"
    >
      <Download className="h-4 w-4 mr-2" />
      CSVエクスポート
    </Button>
  )
}
