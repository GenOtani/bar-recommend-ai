import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// このミドルウェアは、管理者ページへのアクセスを制限します
export function middleware(request: NextRequest) {
  // 実際のアプリケーションでは、ここでJWTトークンの検証などを行うべきです
  // この簡易実装では、クライアントサイドの認証に依存しています

  // 本番環境では、より堅牢な認証システムを実装することをお勧めします
  return NextResponse.next()
}

// 管理者ページのパスに対してのみミドルウェアを適用
export const config = {
  matcher: "/admin/:path*",
}
