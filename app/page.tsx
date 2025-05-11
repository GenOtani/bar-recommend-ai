"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { UserInterface } from "@/components/user-interface"
import { useRouter } from "next/navigation"

export default function CocktailChatbot() {
  const router = useRouter()

  // テーブル番号入力ダイアログの状態
  const [tableInputDialogOpen, setTableInputDialogOpen] = useState(true)
  const [tableNumber, setTableNumber] = useState("")

  useEffect(() => {
    // コンポーネントマウント時にテーブル番号ダイアログを表示
    if (!tableNumber) {
      setTableInputDialogOpen(true)
    }
  }, [tableNumber])

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
      </header>

      {/* テーブル番号選択ダイアログ */}
      <Dialog
        open={tableInputDialogOpen}
        onOpenChange={(open) => {
          // テーブル番号が選択されていない場合はダイアログを閉じられないようにする
          if (!tableNumber && !open) {
            return
          }
          setTableInputDialogOpen(open)
        }}
      >
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">テーブル番号を選択してください</DialogTitle>
            <DialogDescription className="text-zinc-400">
              注文や履歴確認のためにテーブル番号が必要です
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={tableNumber} onValueChange={setTableNumber} className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <div key={num} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={num.toString()}
                    id={`table-${num}`}
                    className="text-amber-400 border-amber-400"
                  />
                  <Label htmlFor={`table-${num}`} className="text-white">
                    テーブル {num}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (tableNumber) {
                  setTableInputDialogOpen(false)
                  toast({
                    title: "テーブル番号を設定しました",
                    description: `テーブル番号: ${tableNumber}`,
                  })
                } else {
                  toast({
                    title: "テーブル番号を選択してください",
                    variant: "destructive",
                  })
                }
              }}
              disabled={!tableNumber}
            >
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ユーザーインターフェース */}
      <UserInterface tableNumber={tableNumber} />

      <footer className="text-center text-zinc-500 text-sm mt-4">
        <p>カクテルの種類や好みを話しかけてみてください</p>
        <p className="mt-1">例: 「爽やかなカクテルが飲みたい」「ジンベースのおすすめは？」「学割について教えて」</p>
      </footer>

      <Toaster />
    </div>
  )
}
