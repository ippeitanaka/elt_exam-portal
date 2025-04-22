import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define protected routes that require authentication
  const isAdminPath = path.startsWith("/admin")
  const isDashboardPath = path.startsWith("/dashboard")
  const isApiPath = path.startsWith("/api") && !path.startsWith("/api/login") && !path.startsWith("/api/logout")

  // クライアントサイドの認証情報はミドルウェアからアクセスできないため、
  // 認証が必要なAPIエンドポイントには追加の保護が必要
  if (isApiPath) {
    // APIリクエストにはRefererヘッダーを確認
    const referer = request.headers.get("referer") || ""
    const host = request.headers.get("host") || ""

    // 同一オリジンからのリクエストかチェック
    if (!referer.includes(host) && process.env.NODE_ENV === "production") {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  // Continue to the destination
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"],
}
