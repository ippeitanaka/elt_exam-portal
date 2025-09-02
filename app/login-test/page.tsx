'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function LoginTest() {
  const [studentId, setStudentId] = useState('223002') // デフォルトでテスト用ID
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const supabase = createClientComponentClient()

  const testLogin = async () => {
    setLoading(true)
    setResult(null)
    setError('')

    try {
      console.log('=== ログインテスト開始 ===')
      console.log('学生ID:', studentId)
      
      // 1. 学生データを取得
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', studentId)

      console.log('学生データクエリ結果:', { studentData, studentError })

      if (studentError) {
        throw new Error(`学生データ取得エラー: ${studentError.message}`)
      }

      if (!studentData || studentData.length === 0) {
        throw new Error('学生IDが見つかりません')
      }

      const student = studentData[0]
      console.log('取得した学生情報:', {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        passwordType: student.password?.startsWith('$2a$') ? 'ハッシュ化' : '平文',
        passwordLength: student.password?.length
      })

      // 2. パスワード検証
      let authenticated = false
      let verificationMethod = ''

      if (!student.password?.startsWith('$2a$')) {
        // 平文パスワードの場合
        authenticated = student.password === password
        verificationMethod = '平文比較'
        console.log('平文パスワード比較:', {
          storedPassword: student.password,
          inputPassword: password,
          match: authenticated
        })
      } else {
        // ハッシュ化パスワードの場合
        const { data: verifyData, error: verifyError } = await supabase.rpc('verify_password', {
          stored_hash: student.password,
          password: password
        })

        if (verifyError) {
          throw new Error(`パスワード検証エラー: ${verifyError.message}`)
        }

        authenticated = verifyData
        verificationMethod = 'bcryptハッシュ検証'
        console.log('ハッシュパスワード検証:', {
          result: authenticated,
          verifyData
        })
      }

      // 3. 結果を表示
      setResult({
        success: authenticated,
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          passwordType: student.password?.startsWith('$2a$') ? 'ハッシュ化' : '平文'
        },
        verificationMethod,
        timestamp: new Date().toLocaleString('ja-JP')
      })

      if (authenticated) {
        console.log('=== ログイン成功 ===')
        // localStorage に保存（実際のログインと同じ処理）
        const studentDataToStore = {
          ...student,
          password: undefined
        }
        localStorage.setItem('currentStudent', JSON.stringify(studentDataToStore))
      } else {
        console.log('=== ログイン失敗：パスワード不一致 ===')
      }

    } catch (error) {
      console.error('ログインテストエラー:', error)
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const checkStoredData = () => {
    const stored = localStorage.getItem('currentStudent')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setResult((prev: any) => ({
          ...prev,
          storedData: parsed
        }))
      } catch (e) {
        setError('localStorage のデータが破損しています')
      }
    } else {
      setError('localStorage にデータが保存されていません')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>ログイン機能テスト</CardTitle>
            <CardDescription>
              ログイン問題のデバッグ用ページです
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="testStudentId">学生ID</Label>
                <Input
                  id="testStudentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="例: 223002"
                />
              </div>
              <div>
                <Label htmlFor="testPassword">パスワード</Label>
                <Input
                  id="testPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={testLogin} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      テスト中...
                    </>
                  ) : (
                    'ログインテスト実行'
                  )}
                </Button>
                <Button onClick={checkStoredData} variant="outline">
                  保存データ確認
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className={`text-${result.success ? 'green' : 'red'}-600`}>
                    {result.success ? '✅ ログイン成功' : '❌ ログイン失敗'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>検証方法:</strong> {result.verificationMethod}</p>
                    <p><strong>学生情報:</strong></p>
                    <div className="ml-4 space-y-1">
                      <p>• ID: {result.student.id}</p>
                      <p>• 学生ID: {result.student.student_id}</p>
                      <p>• 氏名: {result.student.name}</p>
                      <p>• パスワード形式: {result.student.passwordType}</p>
                    </div>
                    {result.storedData && (
                      <>
                        <p><strong>localStorage保存データ:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(result.storedData, null, 2)}
                        </pre>
                      </>
                    )}
                    <p><strong>テスト実行時刻:</strong> {result.timestamp}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>テスト用アカウント例:</strong></p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>学生ID: 223002 (石崎　誓也)</li>
                    <li>学生ID: 223012 (坂井　真梨奈)</li>
                    <li>学生ID: 223042 (山田　大雅)</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">
                    パスワードが分からない場合は、データベースで確認してください。
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
