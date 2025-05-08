import { NextResponse } from "next/server"
import { google } from "googleapis"
import { JWT } from "google-auth-library"
import type { Order } from "@/types/order-types"

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
      range: "Sheet1!A:I", // スプレッドシートの範囲
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows.map((row) => row.values.map((cell) => cell.userEnteredValue.stringValue)),
      },
    })

    return true
  } catch (error) {
    console.error("スプレッドシートへの書き込みに失敗しました:", error)
    throw error
  }
}

export async function GET() {
  try {
    // テスト用の注文データを作成
    const testOrder: Order = {
      id: `test-order-${Date.now()}`,
      tableNumber: "1",
      timestamp: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "ハイボール",
          price: "500円",
          quantity: 2,
          priceValue: 500,
        },
        {
          id: "test-item-2",
          name: "レモンサワー",
          price: "500円",
          quantity: 1,
          priceValue: 500,
        },
      ],
      totalAmount: 1500,
      status: "提供済み",
    }

    // 環境変数が設定されているか確認
    if (!GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL || !GOOGLE_SHEET_ID) {
      return NextResponse.json(
        {
          success: false,
          message: "Google Sheets API認証情報が設定されていません",
          mockSuccess: true, // 開発環境用のモックレスポンス
          testOrder,
        },
        { status: 200 },
      )
    }

    // スプレッドシートにテスト注文データを追加
    await appendOrderToSheet(testOrder)

    return NextResponse.json({
      success: true,
      message: "テスト注文がスプレッドシートに追加されました",
      testOrder,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}`,
    })
  } catch (error: any) {
    console.error("エラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        message: "テスト注文の送信に失敗しました",
        error: error.message || "不明なエラー",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
