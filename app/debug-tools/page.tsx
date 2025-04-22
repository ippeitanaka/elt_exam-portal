"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, AlertCircle, Search, User, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DebugTools() {
  const [studentId, setStudentId] = useState("")
  const [adminUsername, setAdminUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentData, setStudentData] = useState<any>(null)
  const [adminData, setAdminData] = useState<any>(null)
  const supabase = createClientComponentClient()

  const searchStudent = async () => {
    if (!studentId) {
      setError("学生IDを入力してください")
      return
    }

    setLoading(true)
    setError(null)
    setStudentData(null)

    try {
      // 学生データを検索
      const { data, error } = await supabase.from("students").select("*").eq("student_id", studentId)

      if (error) throw error

      if (data && data.length > 0) {
        setStudentData(data[0])
      } else {
        setError(`学生ID「${studentId}」は見つかりませんでした`)
      }
    } catch (err) {
      console.error("検索エラー:", err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const searchAdmin = async () => {
    if (!adminUsername) {
      setError("管理者ユーザー名を入力してください")
      return
    }

    setLoading(true)
    setError(null)
    setAdminData(null)

    try {
      // 管理者データを検索
      const { data, error } = await supabase.from("admin_users").select("*").eq("username", adminUsername)

      if (error) throw error

      if (data && data.length > 0) {
        setAdminData(data[0])
      } else {
        setError(`管理者ユーザー名「${adminUsername}」は見つかりませんでした`)
      }
    } catch (err) {
      console.error("検索エラー:", err)
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>デバッグツール</CardTitle>
            <CardDescription>ユーザーデータの確認</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="student">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">学生</TabsTrigger>
                <TabsTrigger value="admin">管理者</TabsTrigger>
              </TabsList>
              <TabsContent value="student" className="space-y-4 mt-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input placeholder="学生ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                  </div>
                  <Button onClick={searchStudent} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">検索</span>
                  </Button>
                </div>

                {error && studentData === null && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>エラー</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {studentData && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium text-lg mb-2 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      学生情報
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableCell>{studentData.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>学生ID</TableHead>
                          <TableCell>{studentData.student_id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>名前</TableHead>
                          <TableCell>{studentData.name || "名前なし"}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>パスワード</TableHead>
                          <TableCell>
                            {studentData.password.startsWith("$2a$") ? (
                              <span className="text-amber-600">ハッシュ化済み</span>
                            ) : (
                              <span className="text-green-600">平文</span>
                            )}
                            <span className="text-xs ml-2 text-gray-500">
                              {studentData.password.substring(0, 10)}...
                            </span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>作成日時</TableHead>
                          <TableCell>{new Date(studentData.created_at).toLocaleString("ja-JP")}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="admin" className="space-y-4 mt-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="管理者ユーザー名"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                    />
                  </div>
                  <Button onClick={searchAdmin} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">検索</span>
                  </Button>
                </div>

                {error && adminData === null && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>エラー</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {adminData && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-medium text-lg mb-2 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      管理者情報
                    </h3>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableCell>{adminData.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>ユーザー名</TableHead>
                          <TableCell>{adminData.username}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>パスワード</TableHead>
                          <TableCell>
                            {adminData.password.startsWith("$2a$") ? (
                              <span className="text-amber-600">ハッシュ化済み</span>
                            ) : (
                              <span className="text-green-600">平文</span>
                            )}
                            <span className="text-xs ml-2 text-gray-500">{adminData.password.substring(0, 10)}...</span>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableHead>作成日時</TableHead>
                          <TableCell>{new Date(adminData.created_at).toLocaleString("ja-JP")}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => window.history.back()}>
              戻る
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
