import { NextResponse } from "next/server"
import { google } from "googleapis"
import { JWT } from "google-auth-library"
import type { Order } from "@/types/order-types"
import nodemailer from "nodemailer"

// Google Sheets APIの認証情報
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID

// Google Sheets APIクライアントの初期化
const getGoogleSheetsClient = () => {
  try {
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
      throw new Error("Google API認証情報が設定されていません")
    }

    const client = new JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    return google.sheets({ version: "v4", auth: client })
  } catch (error) {
    console.error("Google Sheets APIクライアントの初期化に失敗しました:", error)
    throw error
  }
}

// 注文データをスプレッドシートに追加する関数
const appendOrderToSheet = async (order: Order) => {
  try {
    if (!GOOGLE_SHEET_ID) {
      throw new Error("スプレッドシートIDが設定されていません")
    }

    const sheets = getGoogleSheetsClient()

    // 注文の各アイテムを行として追加
    const rows = order.items.map((item, index) => {
      const row = [
        index === 0 ? order.id : "", // 最初の行のみ注文IDを表示
        index === 0 ? order.tableNumber : "", // 最初の行のみテーブル番号を表示
        index === 0 ? new Date(order.timestamp).toLocaleString() : "", // 最初の行のみ日時を表示
        item.name,
        item.price,
        item.quantity.toString(),
        (item.priceValue * item.quantity).toString(),
        index === 0 ? order.totalAmount.toString() : "", // 最初の行のみ合計金額を表示
        index === 0 ? order.status : "", // 最初の行のみステータスを表示
      ]
      return { values: row.map((value) => ({ userEnteredValue: { stringValue: value } })) }
    })

    // 空行を追加して注文を区切る
    rows.push({
      values: Array(9).fill({ userEnteredValue: { stringValue: "" } }),
    })

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "シート1!A:I", // スプレッドシートの範囲
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows.map((row) => row.values.map((cell) => cell.userEnteredValue.stringValue)),
      },
    })

    return true
  } catch (error) {
    console.error("スプレッドシートへの書き込みに失敗しました:", error)
    return false
  }
}

// スプレッドシートの初期化（ヘッダー行の追加）
// initializeSpreadsheet 関数を修正
export const initializeSpreadsheet = async () => {
  try {
    if (!GOOGLE_SHEET_ID) {
      throw new Error("スプレッドシートIDが設定されていません")
    }

    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
      throw new Error("Google API認証情報が設定されていません")
    }

    console.log("Google Sheets クライアントを初期化中...")
    console.log("GOOGLE_SHEET_ID が設定されています:", !!GOOGLE_SHEET_ID)
    console.log("GOOGLE_CLIENT_EMAIL が設定されています:", !!GOOGLE_CLIENT_EMAIL)
    console.log("GOOGLE_PRIVATE_KEY が設定されています:", !!GOOGLE_PRIVATE_KEY)

    if (GOOGLE_PRIVATE_KEY) {
      console.log(
        "GOOGLE_PRIVATE_KEY の形式が正しいか確認:",
        GOOGLE_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----"),
      )
    }

    const sheets = getGoogleSheetsClient()

    // ヘッダー行の設定
    const headers = ["注文ID", "テーブル番号", "注文日時", "商品名", "単価", "数量", "小計", "合計金額", "ステータス"]

    console.log("スプレッドシートにヘッダーを追加中...")

    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: "シート1!A1:I1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    })

    console.log("ヘッダーの書式を設定中...")

    // ヘッダー行の書式設定（太字、背景色など）
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SHEET_ID,
      requestBody: {
        requests: [
          {
            updateCells: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 9,
              },
              rows: [
                {
                  values: headers.map((header) => ({
                    userEnteredValue: { stringValue: header },
                    userEnteredFormat: {
                      backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                      horizontalAlignment: "CENTER",
                      textFormat: { bold: true },
                    },
                  })),
                },
              ],
              fields: "userEnteredValue,userEnteredFormat",
            },
          },
        ],
      },
    })

    console.log("スプレッドシートの初期化が完了しました")
    return true
  } catch (error: any) {
    console.error("スプレッドシートの初期化に失敗しました:", error)
    throw error
  }
}

// 通知設定を取得する関数
const getNotificationSettings = () => {
  // 実際のアプリケーションでは、データベースやファイルから設定を読み込む
  // ここでは環境変数から読み込む例を示す
  return {
    email: {
      enabled: !!process.env.EMAIL_ENABLED && process.env.EMAIL_ENABLED === "true",
      recipientEmail: process.env.NOTIFICATION_EMAIL,
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
    },
    slack: {
      enabled: !!process.env.SLACK_ENABLED && process.env.SLACK_ENABLED === "true",
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    line: {
      enabled: !!process.env.LINE_ENABLED && process.env.LINE_ENABLED === "true",
      token: process.env.LINE_NOTIFY_TOKEN,
    },
  }
}

// 通知を送信する関数
const sendNotifications = async (order: Order) => {
  const settings = getNotificationSettings()
  const results = {
    email: false,
    slack: false,
    line: false,
  }

  // メール通知
  if (settings.email.enabled && settings.email.recipientEmail && settings.email.user && settings.email.password) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: settings.email.user,
          pass: settings.email.password,
        },
      })

      // 注文内容をテキスト形式に整形
      const orderItems = order.items.map((item) => `${item.name} x ${item.quantity} (${item.price})`).join("\n")

      const mailOptions = {
        from: settings.email.user,
        to: settings.email.recipientEmail,
        subject: `新規注文: テーブル${order.tableNumber} - ${order.id}`,
        text: `
新しい注文が入りました。

注文ID: ${order.id}
テーブル番号: ${order.tableNumber}
注文時間: ${new Date(order.timestamp).toLocaleString()}
合計金額: ${order.totalAmount}円

注文内容:
${orderItems}

スプレッドシートURL: https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}
        `,
      }

      await transporter.sendMail(mailOptions)
      console.log("通知メールを送信しました")
      results.email = true
    } catch (error) {
      console.error("メール送信エラー:", error)
    }
  }

  // Slack通知
  if (settings.slack.enabled && settings.slack.webhookUrl) {
    try {
      // 注文内容をテキスト形式に整形
      const orderItems = order.items.map((item) => `• ${item.name} x ${item.quantity} (${item.price})`).join("\n")

      // Slackメッセージの構造
      const message = {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🍸 新規注文: テーブル${order.tableNumber}`,
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*注文ID:*\n${order.id}`,
              },
              {
                type: "mrkdwn",
                text: `*時間:*\n${new Date(order.timestamp).toLocaleString()}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*注文内容:*\n${orderItems}`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*合計金額:*\n${order.totalAmount}円`,
              },
              {
                type: "mrkdwn",
                text: `*ステータス:*\n${order.status}`,
              },
            ],
          },
        ],
      }

      const response = await fetch(settings.slack.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })

      if (response.ok) {
        console.log("Slack通知を送信しました")
        results.slack = true
      } else {
        console.error("Slack通知の送信に失敗しました:", await response.text())
      }
    } catch (error) {
      console.error("Slack通知エラー:", error)
    }
  }

  // LINE通知
  if (settings.line.enabled && settings.line.token) {
    try {
      // 注文内容をテキスト形式に整形
      const orderItems = order.items.map((item) => `${item.name} x ${item.quantity} (${item.price})`).join("\n")

      // メッセージ本文
      const message = `
新規注文 (${order.id})
テーブル: ${order.tableNumber}
時間: ${new Date(order.timestamp).toLocaleString()}
合計: ${order.totalAmount}円

${orderItems}
`

      const params = new URLSearchParams()
      params.append("message", message)

      const response = await fetch("https://notify-api.line.me/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${settings.line.token}`,
        },
        body: params,
      })

      if (response.ok) {
        console.log("LINE通知を送信しました")
        results.line = true
      } else {
        console.error("LINE通知の送信に失敗しました:", await response.text())
      }
    } catch (error) {
      console.error("LINE通知エラー:", error)
    }
  }

  return results
}

export async function POST(request: Request) {
  try {
    const { order } = await request.json()

    if (!order) {
      return NextResponse.json({ success: false, message: "注文データが提供されていません" }, { status: 400 })
    }

    // 環境変数が設定されているか確認
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_SHEET_ID) {
      return NextResponse.json(
        {
          success: false,
          message: "Google Sheets API認証情報が設定されていません",
          mockSuccess: true, // 開発環境用のモックレスポンス
          order,
        },
        { status: 200 },
      )
    }

    const success = await appendOrderToSheet(order)

    // 通知を送信
    if (success || process.env.NODE_ENV === "development") {
      await sendNotifications(order)
    }

    if (success) {
      return NextResponse.json({ success: true, message: "注文がスプレッドシートに追加されました" })
    } else {
      return NextResponse.json(
        { success: false, message: "スプレッドシートへの書き込みに失敗しました" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("エラーが発生しました:", error)
    return NextResponse.json({ success: false, message: "サーバーエラーが発生しました" }, { status: 500 })
  }
}

// スプレッドシートの初期化用のエンドポイントを改善
// GET メソッドを修正
export async function GET() {
  try {
    console.log("スプレッドシート初期化 API が呼び出されました")

    // 環境変数の状態を確認
    const envStatus = {
      GOOGLE_SHEET_ID: !!GOOGLE_SHEET_ID,
      GOOGLE_CLIENT_EMAIL: !!GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!GOOGLE_PRIVATE_KEY,
      PRIVATE_KEY_FORMAT: GOOGLE_PRIVATE_KEY ? GOOGLE_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----") : false,
    }

    console.log("環境変数の状態:", envStatus)

    // 環境変数が設定されているか確認
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_SHEET_ID) {
      return NextResponse.json(
        {
          success: false,
          message: "Google Sheets API認証情報が設定されていません",
          mockSuccess: true, // 開発環境用のモックレスポンス
          envStatus,
          error: "環境変数が不足しています",
        },
        { status: 200 },
      )
    }

    try {
      const success = await initializeSpreadsheet()

      if (success) {
        return NextResponse.json({
          success: true,
          message: "スプレッドシートが初期化されました",
          envStatus,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "スプレッドシートの初期化に失敗しました",
            envStatus,
            error: "初期化処理が失敗しました",
          },
          { status: 500 },
        )
      }
    } catch (error: any) {
      console.error("スプレッドシート初期化中にエラーが発生:", error)
      return NextResponse.json(
        {
          success: false,
          message: "スプレッドシートの初期化に失敗しました",
          error: error.message || "不明なエラー",
          envStatus,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("API エンドポイントでエラーが発生:", error)
    return NextResponse.json(
      {
        success: false,
        message: "サーバーエラーが発生しました",
        error: error.message || "不明なエラー",
      },
      { status: 500 },
    )
  }
}
