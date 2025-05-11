"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

export function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [slackEnabled, setSlackEnabled] = useState(false)
  const [lineEnabled, setLineEnabled] = useState(false)
  const [emailSettings, setEmailSettings] = useState({
    recipientEmail: "",
  })
  const [slackSettings, setSlackSettings] = useState({
    webhookUrl: "",
  })
  const [lineSettings, setLineSettings] = useState({
    token: "",
  })

  const saveSettings = () => {
    // ここで設定を保存する処理を実装
    // 実際のアプリケーションでは、APIエンドポイントを呼び出して設定を保存する

    localStorage.setItem(
      "notificationSettings",
      JSON.stringify({
        email: {
          enabled: emailEnabled,
          recipientEmail: emailSettings.recipientEmail,
        },
        slack: {
          enabled: slackEnabled,
          webhookUrl: slackSettings.webhookUrl,
        },
        line: {
          enabled: lineEnabled,
          token: lineSettings.token,
        },
      }),
    )

    toast({
      title: "設定を保存しました",
      description: "通知設定が更新されました。",
    })
  }

  // テスト通知を送信
  const sendTestNotification = async () => {
    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailEnabled ? emailSettings : null,
          slack: slackEnabled ? slackSettings : null,
          line: lineEnabled ? lineSettings : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "テスト通知を送信しました",
          description: "設定した通知先にテストメッセージが送信されました。",
        })
      } else {
        toast({
          title: "テスト通知の送信に失敗しました",
          description: data.message || "エラーが発生しました。設定を確認してください。",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "通知の送信中にエラーが発生しました。",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-amber-400">通知設定</CardTitle>
        <CardDescription className="text-zinc-400">新しい注文があった際の通知設定を行います</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="email">メール通知</TabsTrigger>
            <TabsTrigger value="slack">Slack通知</TabsTrigger>
            <TabsTrigger value="line">LINE通知</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled" className="text-white">
                メール通知を有効にする
              </Label>
              <Switch id="email-enabled" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
            </div>

            {emailEnabled && (
              <div className="space-y-2">
                <Label htmlFor="recipient-email">通知先メールアドレス</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="example@example.com"
                  value={emailSettings.recipientEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, recipientEmail: e.target.value })}
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
                <p className="text-xs text-zinc-400">注文があった際に、このメールアドレスに通知が送信されます。</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="slack" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="slack-enabled" className="text-white">
                Slack通知を有効にする
              </Label>
              <Switch id="slack-enabled" checked={slackEnabled} onCheckedChange={setSlackEnabled} />
            </div>

            {slackEnabled && (
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Incoming Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="text"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackSettings.webhookUrl}
                  onChange={(e) => setSlackSettings({ ...slackSettings, webhookUrl: e.target.value })}
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
                <p className="text-xs text-zinc-400">
                  Slackの「Incoming Webhooks」を設定し、そのURLを入力してください。
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="line" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="line-enabled" className="text-white">
                LINE通知を有効にする
              </Label>
              <Switch id="line-enabled" checked={lineEnabled} onCheckedChange={setLineEnabled} />
            </div>

            {lineEnabled && (
              <div className="space-y-2">
                <Label htmlFor="line-token">LINE Notify トークン</Label>
                <Input
                  id="line-token"
                  type="text"
                  placeholder="LINE Notifyのトークン"
                  value={lineSettings.token}
                  onChange={(e) => setLineSettings({ ...lineSettings, token: e.target.value })}
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
                <p className="text-xs text-zinc-400">
                  LINE Notifyのトークンを入力してください。LINE Notifyのウェブサイトから取得できます。
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-4 mt-6">
          <Button className="bg-amber-600 hover:bg-amber-700 flex-1" onClick={saveSettings}>
            設定を保存
          </Button>
          <Button variant="outline" className="flex-1" onClick={sendTestNotification}>
            テスト通知を送信
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
