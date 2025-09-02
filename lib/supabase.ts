import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 環境変数のチェック
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。.env.localファイルを作成してください。')
}

// クライアントサイド用のSupabaseクライアント
export const createClientComponentClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // ダミークライアントを返して、ビルド時のエラーを避ける
    return createClient('https://dummy.supabase.co', 'dummy-key', {
      auth: {
        persistSession: false
      }
    })
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
}

// サーバーサイド用のSupabaseクライアント（Route Handlers用）
export const createRouteHandlerClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // ダミークライアントを返して、ビルド時のエラーを避ける
    return createClient('https://dummy.supabase.co', 'dummy-key', {
      auth: {
        persistSession: false
      }
    })
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  })
}
