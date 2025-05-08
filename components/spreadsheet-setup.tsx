"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function SpreadsheetSetup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // 非同期処理を同期的に扱うラッパー関数
  const handleInitializeClick = (e: React.MouseEvent) => {
    e.preventDefault() // デフォルトの動作を防止
    console.log("初期化ボタンがクリックされました")

    // 非同期処理を開始
    initializeSpreadsheet()
      .then(() => console.log("初期化処理が完了しました"))
      .catch((err) => console.error("初期化処理でエラーが発生しました:", err))
  }

  // 実際の非同期処理を行う関数
  const initializeSpreadsheet = async () => {
    if (!spreadsheetUrl) {
      toast({
        title: "スプレッドシートURLを入力してください",
        variant: "destructive",
      })
      return
    }

    // スプレッドシートIDを抽出
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match || !match[1]) {
      toast({
        title: "無効なスプレッドシートURLです",
        description: "正しいGoogleスプレッドシートのURLを入力してください",
        variant: "destructive",
      })
      return
    }

    setIsInitializing(true)
    setErrorMessage(null)
    setDebugInfo(null)

    try {
      console.log("スプレッドシートの初期化を開始します...")

      // スプレッドシートの初期化APIを呼び出す
      const response = await fetch("/api/spreadsheet", {
        method: "GET",
      })

      console.log("API レスポンス:", response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API レスポンスデータ:", data)

      setDebugInfo(data)

      if (data.success || data.mockSuccess) {
        toast({
          title: "スプレッドシートの設定が完了しました",
          description: data.mockSuccess
            ? "デモモード: 実際のスプレッドシートは更新されていません。環境変数を設定してください。"
            : "スプレッドシートが初期化され、注文データの受け取り準備ができました",
        })
        setIsOpen(false)

        // ローカルストレージに保存
        localStorage.setItem("spreadsheetUrl", spreadsheetUrl)
      } else {
        setErrorMessage(data.message || "スプレッドシートの初期化に失敗しました")
        toast({
          title: "エラーが発生しました",
          description: data.message || "スプレッドシートの初期化に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("スプレッドシート初期化エラー:", error)
      setErrorMessage(error.message || "不明なエラーが発生しました")
      toast({
        title: "エラーが発生しました",
        description: error.message || "サーバーとの通信に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // 直接 API を呼び出す代替方法
  const handleDirectApiCall = () => {
    // 新しいタブで API を直接呼び出す
    window.open("/api/spreadsheet", "_blank")
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        Googleスプレッドシートの設定
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Googleスプレッドシートの設定</DialogTitle>
            <DialogDescription className="text-zinc-400">
              注文データを自動的にGoogleスプレッドシートに送信するための設定を行います。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheet-url">Googleスプレッドシート URL</Label>
              <Input
                id="spreadsheet-url"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="bg-zinc-700 border-zinc-600"
              />
              <p className="text-sm text-zinc-400">
                新しいGoogleスプレッドシートを作成し、そのURLをここに貼り付けてください。
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">設定手順:</h4>
              <ol className="space-y-2 text-sm text-zinc-300 list-decimal list-inside">
                <li>新しいGoogleスプレッドシートを作成します</li>
                <li>スプレッドシートのURLをコピーして上のフィールドに貼り付けます</li>
                <li>スプレッドシートの共有設定で、サービスアカウントのメールアドレスに編集権限を付与します</li>
                <li>「初期化」ボタンをクリックして設定を完了します</li>
              </ol>
              <p className="text-sm text-amber-400 mt-2">
                注: 実際の環境では、Google Cloud Platformでの設定と環境変数の設定が必要です。
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-md">
              <h4 className="font-medium text-red-400">エラーが発生しました:</h4>
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          {debugInfo && (
            <div className="mt-4 p-3 bg-zinc-900/30 border border-zinc-700 rounded-md">
              <h4 className="font-medium text-zinc-400">デバッグ情報:</h4>
              <pre className="text-xs text-zinc-500 mt-1 overflow-auto max-h-32">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleInitializeClick}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isInitializing}
            >
              {isInitializing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              初期化
            </Button>
            <Button variant="secondary" onClick={handleDirectApiCall} className="bg-zinc-700 hover:bg-zinc-600">
              API を直接呼び出す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
