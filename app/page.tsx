"use client"

import { useState } from "react"
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
import { useRouter } from "next/navigation"

export default function CocktailChatbot() {
  const router = useRouter()

  // テーブル番号入力ダイアログの状態
  const [tableInputDialogOpen, setTableInputDialogOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState("")
  const [isRedirecting, setIsRedirecting] = useState(false)

  // テーブル番号確定時の処理
  const handleTableConfirm = () => {
    if (tableNumber) {
      setIsRedirecting(true)

      // テーブル番号が選択されたら、対応するURLにリダイレクト
      router.push(`/table/${tableNumber}`)

      // ダイアログを閉じる
      setTableInputDialogOpen(false)
    } else {
      toast({
        title: "テーブル番号を選択してください",
        variant: "destructive",
      })
    }
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
      </header>

      {/* テーブル番号選択ダイアログ */}
      <Dialog
        open={tableInputDialogOpen}
        onOpenChange={(open) => {
          // リダイレクト中はダイアログを閉じられないようにする
          if (isRedirecting && !open) {
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
              onClick={handleTableConfirm}
              disabled={!tableNumber || isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  移動中...
                </>
              ) : (
                "確定"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* メインコンテンツ */}
      <div className="w-full max-w-2xl text-center">
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">ようこそ！</h2>
          <p className="text-zinc-300 mb-6">
            バーテンダーAIへようこそ。テーブル番号を選択して、カクテル注文やチャットをお楽しみください。
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700 w-full text-lg py-6"
            onClick={() => setTableInputDialogOpen(true)}
          >
            テーブル番号を選択する
          </Button>
        </div>

        <div className="mt-8 bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6">
          <h3 className="text-xl font-medium text-amber-400 mb-3">ご利用方法</h3>
          <ol className="text-left text-zinc-300 space-y-2 list-decimal list-inside">
            <li>上のボタンをタップしてテーブル番号を選択</li>
            <li>AIバーテンダーとチャットでカクテルについて相談</li>
            <li>メニューから好みの飲み物や食べ物を注文</li>
            <li>注文履歴でステータスを確認</li>
          </ol>
        </div>
      </div>

      <footer className="text-center text-zinc-500 text-sm mt-8">
        <p>カクテルの種類や好みを話しかけてみてください</p>
        <p className="mt-1">例: 「爽やかなカクテルが飲みたい」「ジンベースのおすすめは？」「学割について教えて」</p>
      </footer>

      <Toaster />
    </div>
  )
}
