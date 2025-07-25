import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // 環境変数から管理者パスワードを取得
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    // パスワードが設定されていない場合のデフォルト値（本番環境では使用すべきではない）
    const defaultPassword = "Gengen20024017"

    // パスワードの検証
    const isValidPassword = adminPassword ? password === adminPassword : password === defaultPassword

    if (isValidPassword) {
      // 認証成功
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
      }

      // HTTPのみのCookieを設定（本番環境ではSecure: trueを使用すべき）
      cookies().set({
        name: "admin-auth",
        value: JSON.stringify(authData),
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, // 24時間
        sameSite: "strict",
      })

      return NextResponse.json({
        success: true,
        message: "認証に成功しました",
      })
    } else {
      // 認証失敗
      return NextResponse.json(
        {
          success: false,
          message: "パスワードが正しくありません",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("管理者ログイン処理中にエラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        message: "サーバーエラーが発生しました",
      },
      { status: 500 },
    )
  }
}
