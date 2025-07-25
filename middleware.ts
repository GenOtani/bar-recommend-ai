import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// このミドルウェアは、管理者ページへのアクセスを制限します
export function middleware(request: NextRequest) {
  // 管理者認証の確認
  const adminAuth = request.cookies.get("admin-auth")?.value

  // 認証情報がない場合はトップページにリダイレクト
  if (!adminAuth) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  try {
    // 認証情報を検証
    const authData = JSON.parse(adminAuth)
    const isAuthenticated = authData.authenticated === true
    const authTimestamp = authData.timestamp || 0
    const currentTime = Date.now()
    const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24時間（ミリ秒）

    // 認証が有効かつセッションがタイムアウトしていない場合
    if (isAuthenticated && currentTime - authTimestamp < SESSION_TIMEOUT) {
      return NextResponse.next()
    }
  } catch (error) {
    // JSON解析エラーなど
    console.error("認証情報の検証中にエラーが発生しました:", error)
  }

  // 認証が無効またはタイムアウトした場合はトップページにリダイレクト
  const url = request.nextUrl.clone()
  url.pathname = "/"
  return NextResponse.redirect(url)
}

// 管理者ページのパスに対してのみミドルウェアを適用
export const config = {
  matcher: "/admin/:path*",
}
