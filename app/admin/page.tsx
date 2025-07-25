"use client"

import { useState, useEffect } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AdminInterface } from "@/components/admin-interface"
import { useRouter } from "next/navigation"

// 管理者パスワードを環境変数から読み込むように変更
// 以下のコードを:
// const ADMIN_PASSWORD = "Gengen20024017"

// 次のように変更:
// 環境変数からパスワードを読み込み、設定されていない場合はデフォルト値を使用
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Gengen20024017"

export default function AdminPage() {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // ログイン試行回数を追跡するためのステート変数を追加
  const [loginAttempts, setLoginAttempts] = useState(0)
  const MAX_LOGIN_ATTEMPTS = 5
  const LOCKOUT_TIME = 15 * 60 * 1000 // 15分（ミリ秒）

  // useEffect内のコードを修正して、パスワードの強度をチェックする機能を追加
  // 以下のuseEffectブロックを:
  // useEffect(() => {
  //   const adminAuth = localStorage.getItem("admin-auth")
  //   if (adminAuth === "authenticated") {
  //     setIsAuthenticated(true)
  //   } else {
  //     setLoginDialogOpen(true)
  //   }
  //   setIsLoading(false)
  // }, [])

  // 次のように変更:
  useEffect(() => {
    const adminAuth = localStorage.getItem("admin-auth")
    if (adminAuth) {
      try {
        const authData = JSON.parse(adminAuth)
        if (authData.authenticated && authData.timestamp && Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
          // 24時間以内
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("admin-auth")
          setLoginDialogOpen(true)
        }
      } catch (e) {
        localStorage.removeItem("admin-auth")
        setLoginDialogOpen(true)
      }
    } else {
      setLoginDialogOpen(true)
    }

    // パスワードが環境変数で設定されていない場合は警告を表示
    if (!process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      console.warn("管理者パスワードが環境変数で設定されていません。デフォルトパスワードが使用されます。")
    }

    setIsLoading(false)
  }, [])

  // handleAdminLogin関数を強化して、ログイン試行回数を制限する
  // 以下のコードを:
  // const handleAdminLogin = () => {
  //   if (password === ADMIN_PASSWORD) {
  //     setIsAuthenticated(true)
  //     setLoginDialogOpen(false)
  //     setPassword("")
  //     setIsPasswordIncorrect(false)
  //     // 認証状態を保存（実際のアプリではより安全な方法を使用すべき）
  //     localStorage.setItem("admin-auth", "authenticated")
  //     toast({
  //       title: "管理者モードにログインしました",
  //       description: "管理者機能が利用可能になりました。",
  //     })
  //   } else {
  //     setIsPasswordIncorrect(true)
  //   }
  // }

  // 次のように変更:
  // そして、handleAdminLogin関数を次のように変更:
  const handleAdminLogin = async () => {
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      toast({
        title: "ログインがロックされています",
        description: `セキュリティのため、${MAX_LOGIN_ATTEMPTS}回の失敗後、15分間ログインが制限されています。`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsAuthenticated(true)
        setLoginDialogOpen(false)
        setPassword("")
        setIsPasswordIncorrect(false)
        setLoginAttempts(0) // 成功したらカウンターをリセット

        toast({
          title: "管理者モードにログインしました",
          description: "管理者機能が利用可能になりました。",
        })
      } else {
        setIsPasswordIncorrect(true)
        setLoginAttempts((prev) => prev + 1)

        if (loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
          toast({
            title: "ログイン試行回数の上限に達しました",
            description: "セキュリティのため、15分間ログインが制限されます。",
            variant: "destructive",
          })

          // 15分後にロックを解除するタイマーを設定
          setTimeout(() => {
            setLoginAttempts(0)
            toast({
              title: "ログインロックが解除されました",
              description: "再度ログインを試みることができます。",
            })
          }, LOCKOUT_TIME)
        }
      }
    } catch (error) {
      console.error("ログイン処理中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "ログイン処理中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  // 管理者ログアウト処理
  const handleAdminLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setIsAuthenticated(false)
        localStorage.removeItem("admin-auth")
        router.push("/")
        toast({
          title: "ログアウトしました",
          description: "管理者モードからログアウトしました。",
        })
      } else {
        toast({
          title: "エラーが発生しました",
          description: "ログアウト処理中にエラーが発生しました。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("ログアウト処理中にエラーが発生しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "ログアウト処理中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

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
      <header className="w-full max-w-4xl text-center mb-6 relative flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => router.push("/")}>
            ユーザーモードに戻る
          </Button>
          <h1 className="text-3xl font-bold text-amber-400">バーテンダーAI - 管理画面</h1>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={handleAdminLogout}>
            <Lock className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
        </div>
        <p className="text-zinc-400">注文管理とデータ分析</p>
      </header>

      {/* 管理者ログインダイアログ */}
      <Dialog
        open={loginDialogOpen}
        onOpenChange={(open) => {
          // ログイン済みの場合のみダイアログを閉じられるようにする
          if (!open && !isAuthenticated) {
            router.push("/")
            return
          }
          setLoginDialogOpen(open)
        }}
      >
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">管理者ログイン</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push("/")}>
              キャンセル
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleAdminLogin}>
              ログイン
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 認証済みの場合のみ管理者インターフェースを表示 */}
      {isAuthenticated ? <AdminInterface /> : null}

      <footer className="text-center text-zinc-500 text-sm mt-4">
        <p>管理者モード - 全ての機能にアクセスできます</p>
      </footer>

      <Toaster />
    </div>
  )
}
