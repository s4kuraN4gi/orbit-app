
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Supabaseのセッション情報を更新しつつ取得
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除外して、それ以外すべてのリクエストで実行する:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /login (ログインページ自体はループ回避のため除外)
     * - /auth (認証用API)
     * - images など静的ファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
