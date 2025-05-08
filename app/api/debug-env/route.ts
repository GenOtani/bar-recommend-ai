import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 環境変数の状態を確認（実際の値は表示しない）
    const envStatus = {
      GOOGLE_SHEET_ID: {
        exists: !!process.env.GOOGLE_SHEET_ID,
        value: process.env.GOOGLE_SHEET_ID ? `${process.env.GOOGLE_SHEET_ID.substring(0, 5)}...` : null,
      },
      GOOGLE_CLIENT_EMAIL: {
        exists: !!process.env.GOOGLE_CLIENT_EMAIL,
        value: process.env.GOOGLE_CLIENT_EMAIL ? `${process.env.GOOGLE_CLIENT_EMAIL.substring(0, 5)}...` : null,
      },
      GOOGLE_PRIVATE_KEY: {
        exists: !!process.env.GOOGLE_PRIVATE_KEY,
        length: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0,
        format: process.env.GOOGLE_PRIVATE_KEY
          ? process.env.GOOGLE_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----")
          : false,
        sample: process.env.GOOGLE_PRIVATE_KEY ? `${process.env.GOOGLE_PRIVATE_KEY.substring(0, 20)}...` : null,
      },
    }

    return NextResponse.json({
      success: true,
      envStatus,
      message: "環境変数の状態を確認しました",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "不明なエラー",
        message: "環境変数の確認中にエラーが発生しました",
      },
      { status: 500 },
    )
  }
}
