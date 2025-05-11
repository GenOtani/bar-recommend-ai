"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { UserInterface } from "@/components/user-interface"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function TablePage() {
  const router = useRouter()
  const params = useParams()
  const [tableNumber, setTableNumber] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // URLパラメータからテーブル番号を取得
    const tableParam = params.tableNumber as string

    // テーブル番号が有効かチェック（1〜9の数字のみ）
    if (tableParam && /^[1-9]$/.test(tableParam)) {
      setTableNumber(tableParam)
      toast({
        title: "テーブル番号を設定しました",
        description: `テーブル番号: ${tableParam}`,
      })
    } else {
      // 無効なテーブル番号の場合はトップページにリダイレクト
      router.push("/")
      toast({
        title: "無効なテーブル番号です",
        description: "テーブル番号選択画面に戻ります",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }, [params, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-amber-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-4 flex flex-col items-center">
      <header className="w-full max-w-2xl text-center mb-6 relative flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => router.push("/admin")}
          >
            <User className="h-4 w-4 mr-2" />
            管理者ログイン
          </Button>
          <h1 className="text-3xl font-bold text-amber-400">バーテンダーAI</h1>
          <div className="w-[100px]"></div> {/* 右側のスペース確保 */}
        </div>
        <p className="text-zinc-400">あなたの好みに合わせたカクテルをご提案します</p>
        <div className="mt-2 bg-amber-600/20 px-3 py-1 rounded-full">
          <p className="text-amber-400">テーブル番号: {tableNumber}</p>
        </div>
      </header>

      {/* テーブル番号が有効な場合のみUserInterfaceを表示 */}
      {tableNumber && <UserInterface tableNumber={tableNumber} />}

      <footer className="text-center text-zinc-500 text-sm mt-4">
        <p>カクテルの種類や好みを話しかけてみてください</p>
        <p className="mt-1">例: 「爽やかなカクテルが飲みたい」「ジンベースのおすすめは？」「学割について教えて」</p>
      </footer>

      <Toaster />
    </div>
  )
}
