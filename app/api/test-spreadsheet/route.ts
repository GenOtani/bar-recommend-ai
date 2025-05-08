import { NextResponse } from "next/server"
import { google } from "googleapis"
import { JWT } from "google-auth-library"

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

// スプレッドシートの接続テスト
const testSpreadsheetConnection = async () => {
  try {
    if (!GOOGLE_SHEET_ID) {
      throw new Error("スプレッドシートIDが設定されていません")
    }

    const sheets = getGoogleSheetsClient()

    // スプレッドシートの情報を取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    })

    return {
      success: true,
      spreadsheetTitle: response.data.properties?.title,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}`,
    }
  } catch (error: any) {
    console.error("スプレッドシートへの接続テストに失敗しました:", error)
    return {
      success: false,
      error: error.message || "不明なエラー",
      details: error.toString(),
    }
  }
}

export async function GET() {
  try {
    // 環境変数のチェック
    const envCheck = {
      googleSheetId: !!GOOGLE_SHEET_ID,
      googleClientEmail: !!GOOGLE_CLIENT_EMAIL,
      googlePrivateKey: !!GOOGLE_PRIVATE_KEY,
      privateKeyFormat: GOOGLE_PRIVATE_KEY?.includes("-----BEGIN PRIVATE KEY-----"),
    }

    // 環境変数が設定されていない場合
    if (!envCheck.googleSheetId || !envCheck.googleClientEmail || !envCheck.googlePrivateKey) {
      return NextResponse.json({
        success: false,
        message: "環境変数が正しく設定されていません",
        envCheck,
      })
    }

    // スプレッドシートへの接続テスト
    const testResult = await testSpreadsheetConnection()

    return NextResponse.json({
      ...testResult,
      envCheck,
    })
  } catch (error: any) {
    console.error("エラーが発生しました:", error)
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
