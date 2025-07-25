import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // 認証Cookieを削除
    cookies().delete("admin-auth")

    return NextResponse.json({
      success: true,
      message: "ログアウトしました",
    })
  } catch (error) {
    console.error("ログアウト処理中にエラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        message: "ログアウト処理中にエラーが発生しました",
      },
      { status: 500 },
    )
  }
}
