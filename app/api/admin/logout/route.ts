import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "ログアウトしました",
    })

    // 認証Cookieを削除
    response.cookies.delete("admin-auth")

    return response
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
