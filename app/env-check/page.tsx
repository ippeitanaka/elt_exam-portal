'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase'

export default function EnvironmentCheck() {
  const [envStatus, setEnvStatus] = useState({
    supabaseUrl: false,
    supabaseKey: false,
    connection: false,
    tables: false
  })
  const [loading, setLoading] = useState(false)
  const [connectionTest, setConnectionTest] = useState<string>('')

  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setEnvStatus({
      supabaseUrl: !!supabaseUrl && supabaseUrl !== '',
      supabaseKey: !!supabaseKey && supabaseKey !== '',
      connection: false,
      tables: false
    })
  }

  const testConnection = async () => {
    setLoading(true)
    setConnectionTest('')

    try {
      const supabase = createClientComponentClient()
      
      // データベース接続テスト
      const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true })
      
      if (error) {
        setConnectionTest(`接続エラー: ${error.message}`)
        setEnvStatus(prev => ({ ...prev, connection: false, tables: false }))
      } else {
        setConnectionTest('データベース接続成功！')
        setEnvStatus(prev => ({ ...prev, connection: true, tables: true }))
      }
    } catch (error) {
      setConnectionTest(`予期しないエラー: ${error}`)
      setEnvStatus(prev => ({ ...prev, connection: false, tables: false }))
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              環境変数・接続診断
            </CardTitle>
            <CardDescription>
              ローカル開発環境の設定状況を確認します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 環境変数チェック */}
            <div>
              <h3 className="text-lg font-medium mb-4">環境変数設定状況</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
                    <p className="text-sm text-gray-600">Supabaseプロジェクトの URL</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={envStatus.supabaseUrl} />
                    <Badge variant={envStatus.supabaseUrl ? "default" : "destructive"}>
                      {envStatus.supabaseUrl ? "設定済み" : "未設定"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                    <p className="text-sm text-gray-600">Supabaseの匿名キー</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={envStatus.supabaseKey} />
                    <Badge variant={envStatus.supabaseKey ? "default" : "destructive"}>
                      {envStatus.supabaseKey ? "設定済み" : "未設定"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 接続テスト */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">データベース接続テスト</h3>
                <Button 
                  onClick={testConnection} 
                  disabled={loading || !envStatus.supabaseUrl || !envStatus.supabaseKey}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      テスト中...
                    </>
                  ) : (
                    '接続テスト実行'
                  )}
                </Button>
              </div>

              {connectionTest && (
                <Alert className={envStatus.connection ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription>{connectionTest}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* 設定手順 */}
            {(!envStatus.supabaseUrl || !envStatus.supabaseKey) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">環境変数の設定方法：</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>プロジェクトルートに <code className="bg-gray-100 px-1 rounded">.env.local</code> ファイルを作成</li>
                      <li>Vercelの Project Settings → Environment Variables から値をコピー</li>
                      <li>以下の形式で記述：</li>
                    </ol>
                    <pre className="bg-gray-100 p-3 rounded text-sm">
{`NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたの匿名キー`}
                    </pre>
                    <p className="text-sm text-gray-600">
                      ※ ファイル保存後、開発サーバーを再起動してください
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* デバッグ情報 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">デバッグ情報</h4>
              <div className="text-sm space-y-1">
                <p>URL設定: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 設定済み' : '✗ 未設定'}</p>
                <p>キー設定: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 設定済み' : '✗ 未設定'}</p>
                <p>現在時刻: {new Date().toLocaleString('ja-JP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
