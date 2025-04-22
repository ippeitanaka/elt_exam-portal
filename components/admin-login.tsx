"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { ParamedicMascot } from "@/components/paramedic-mascot"

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setDebugInfo(null)

    try {
      console.log("管理者ログイン試行:", { username }) // パスワードはログに出力しない

      // まず管理者データを取得
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username)

      if (adminError) {
        throw adminError
      }

      // デバッグ情報を設定
      setDebugInfo({
        method: "管理者データ検索",
        hasData: adminData && adminData.length > 0,
        passwordType:
          adminData && adminData.length > 0
            ? adminData[0].password.startsWith("$2a$")
              ? "ハッシュ化"
              : "平文"
            : "不明",
        error: adminError ? adminError.message : null,
      })

      if (!adminData || adminData.length === 0) {
        setError("ユーザー名が見つかりません。")
        return
      }

      const admin = adminData[0]

      // パスワードの検証
      let authenticated = false

      // 平文パスワードの場合は直接比較
      if (!admin.password.startsWith("$2a$")) {
        authenticated = admin.password === password
      } else {
        // ハッシュ化されたパスワードの場合はRPCを使用
        const { data: verifyData, error: verifyError } = await supabase.rpc("verify_password", {
          stored_hash: admin.password,
          password: password,
        })

        if (verifyError) {
          throw verifyError
        }

        authenticated = verifyData
      }

      // 認証結果を更新
      setDebugInfo((prev) => ({
        ...prev,
        authenticated,
        verificationMethod: !admin.password.startsWith("$2a$") ? "直接比較" : "ハッシュ検証",
      }))

      if (authenticated) {
        // 認証成功
        localStorage.setItem("adminAuthenticated", "true")
        toast({
          title: "ログイン成功",
          description: "管理者ページにアクセスできます",
        })
        onLogin()
      } else {
        setError("パスワードが正しくありません。")
      }
    } catch (error) {
      console.error("ログインエラー:", error)
      setError("ログインに失敗しました。もう一度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <ParamedicMascot width={60} height={60} type="firefighter" />
        </div>
        <CardTitle>管理者ログイン</CardTitle>
        <CardDescription>管理者アカウントでログインしてください</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {debugInfo && (
            <div className="text-xs bg-gray-100 p-2 rounded-md">
              <p>デバッグ情報:</p>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              "ログイン"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
