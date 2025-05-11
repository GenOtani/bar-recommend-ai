"use client"

import { useState, useEffect } from "react"
import { Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { UserInterface } from "@/components/user-interface"
import { AdminInterface } from "@/components/admin-interface"

// 管理者パスワード（実際のアプリでは環境変数や安全な認証システムを使用すべき）
const ADMIN_PASSWORD = "Gengen20024017"

export default function CocktailChatbot() {
  // 以下の変数定義の後に、テーブル番号入力ダイアログの状態を追加
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // 追加: テーブル番号入力ダイアログの状態
  const [tableInputDialogOpen, setTableInputDialogOpen] = useState(true)
  const [tableNumber, setTableNumber] = useState("")

  useEffect(() => {
    // コンポーネントマウント時にテーブル番号ダイアログを表示
    if (!tableNumber) {
      setTableInputDialogOpen(true)
    }
  }, [tableNumber])

  // 管理者ログイン処理
  const handleAdminLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setLoginDialogOpen(false)
      setPassword("")
      setIsPasswordIncorrect(false)
      toast({
        title: "管理者モードに切り替えました",
        description: "管理者機能が利用可能になりました。",
      })
    } else {
      setIsPasswordIncorrect(true)
    }
  }

  // 管理者ログアウト処理
  const handleAdminLogout = () => {
    setIsAdmin(false)
    setLoginDialogOpen(false)
    toast({
      title: "ユーザーモードに切り替えました",
      description: "通常の機能が利用可能になりました。",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white p-4 flex flex-col items-center">
      <header className="w-full max-w-2xl text-center mb-6 relative flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white"
            onClick={() => setLoginDialogOpen(true)}
          >
            {isAdmin ? <Lock className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
            {isAdmin ? "管理者モード" : "ユーザーモード"}
          </Button>
          <h1 className="text-3xl font-bold text-amber-400">バーテンダーAI</h1>
          <div className="w-[100px]"></div> {/* 右側のスペース確保 */}
        </div>
        <p className="text-zinc-400">
          {isAdmin ? "管理者モード - 注文管理とデータ分析" : "あなたの好みに合わせたカクテルをご提案します"}
        </p>
      </header>

      {/* 管理者ログインダイアログ */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {isAdmin ? "管理者モードからログアウト" : "管理者モードにログイン"}
            </DialogTitle>
          </DialogHeader>
          {isAdmin ? (
            <div className="py-4">
              <p className="text-zinc-300">管理者モードからログアウトしますか？</p>
            </div>
          ) : (
            <div className="py-4">
              <Label htmlFor="password" className="text-white">
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setIsPasswordIncorrect(false)
                }}
                className={`bg-zinc-700 border-zinc-600 text-white ${isPasswordIncorrect ? "border-red-500" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAdminLogin()
                  }
                }}
              />
              {isPasswordIncorrect && <p className="text-red-500 text-sm mt-1">パスワードが正しくありません</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              キャンセル
            </Button>
            {isAdmin ? (
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAdminLogout}>
                ログアウト
              </Button>
            ) : (
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAdminLogin}>
                ログイン
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* インターフェース切り替え */}
      {isAdmin ? <AdminInterface /> : <UserInterface tableNumber={tableNumber} />}

      <footer className="text-center text-zinc-500 text-sm mt-4">
        {isAdmin ? (
          <p>管理者モード - 全ての機能にアクセスできます</p>
        ) : (
          <>
            <p>カクテルの種類や好みを話しかけてみてください</p>
            <p className="mt-1">例: 「爽やかなカクテルが飲みたい」「ジンベースのおすすめは？」「学割について教えて」</p>
          </>
        )}
      </footer>

      <Toaster />
    </div>
  )
}
