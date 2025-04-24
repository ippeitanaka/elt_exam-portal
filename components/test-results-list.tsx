"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpDown, Calendar, Users } from "lucide-react"

// 成績データの型定義
type TestScore = {
  id: string
  student_id: string
  name?: string
  test_name: string
  test_date: string
  section_a?: number
  section_b?: number
  section_c?: number
  section_d?: number
  section_ad?: number
  section_bc?: number
  total_score?: number
}

// テスト情報の型定義
type TestInfo = {
  test_name: string
  test_date: string
  displayName: string
}

interface TestResultsListProps {
  scores: TestScore[]
}

export default function TestResultsList({ scores }: TestResultsListProps) {
  // 並べ替えオプション
  const [sortOption, setSortOption] = useState<string>("student_id")

  // テスト情報を抽出
  const testInfos = useMemo(() => {
    const uniqueTests = new Map<string, TestInfo>()

    scores.forEach((score) => {
      const key = `${score.test_name}_${score.test_date}`
      if (!uniqueTests.has(key)) {
        uniqueTests.set(key, {
          test_name: score.test_name,
          test_date: score.test_date,
          displayName: `${score.test_name} (${new Date(score.test_date).toLocaleDateString("ja-JP")})`,
        })
      }
    })

    // 日付の新しい順に並べ替え
    return Array.from(uniqueTests.values()).sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
    )
  }, [scores])

  // テストごとにスコアをグループ化
  const groupedScores = useMemo(() => {
    const grouped = new Map<string, TestScore[]>()

    testInfos.forEach((testInfo) => {
      const key = `${testInfo.test_name}_${testInfo.test_date}`
      const testScores = scores.filter(
        (score) => score.test_name === testInfo.test_name && score.test_date === testInfo.test_date,
      )
      grouped.set(key, testScores)
    })

    return grouped
  }, [scores, testInfos])

  // 並べ替え関数
  const sortScores = (scores: TestScore[], option: string) => {
    return [...scores].sort((a, b) => {
      if (option === "student_id") {
        return a.student_id.localeCompare(b.student_id)
      } else if (option === "section_ad") {
        const adA = a.section_ad || 0
        const adB = b.section_ad || 0
        return adB - adA // 降順（高い順）
      } else if (option === "section_bc") {
        const bcA = a.section_bc || 0
        const bcB = b.section_bc || 0
        return bcB - bcA // 降順（高い順）
      } else if (option === "total_score") {
        const totalA = a.total_score || 0
        const totalB = b.total_score || 0
        return totalB - totalA // 降順（高い順）
      }
      return 0
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">{testInfos.length}個のテストが登録されています</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">並べ替え:</span>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="並べ替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student_id">学生ID順</SelectItem>
              <SelectItem value="section_ad">AD問題点数順</SelectItem>
              <SelectItem value="section_bc">BC問題点数順</SelectItem>
              <SelectItem value="total_score">合計点数順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {testInfos.map((testInfo) => {
          const key = `${testInfo.test_name}_${testInfo.test_date}`
          const testScores = groupedScores.get(key) || []
          const sortedScores = sortScores(testScores, sortOption)
          const studentCount = testScores.length

          // 平均点を計算
          const averages = {
            section_a: testScores.reduce((sum, score) => sum + (score.section_a || 0), 0) / studentCount,
            section_b: testScores.reduce((sum, score) => sum + (score.section_b || 0), 0) / studentCount,
            section_c: testScores.reduce((sum, score) => sum + (score.section_c || 0), 0) / studentCount,
            section_d: testScores.reduce((sum, score) => sum + (score.section_d || 0), 0) / studentCount,
            section_ad: testScores.reduce((sum, score) => sum + (score.section_ad || 0), 0) / studentCount,
            section_bc: testScores.reduce((sum, score) => sum + (score.section_bc || 0), 0) / studentCount,
            total_score: testScores.reduce((sum, score) => sum + (score.total_score || 0), 0) / studentCount,
          }

          return (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:bg-muted/50 px-4 py-2 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-left">
                  <span className="font-medium">{testInfo.test_name}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(testInfo.test_date).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{studentCount}名</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="mt-2">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium">平均点</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-sm">
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">A問題</div>
                        <div className="font-medium">{averages.section_a.toFixed(1)}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">B問題</div>
                        <div className="font-medium">{averages.section_b.toFixed(1)}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">C問題</div>
                        <div className="font-medium">{averages.section_c.toFixed(1)}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">D問題</div>
                        <div className="font-medium">{averages.section_d.toFixed(1)}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">AD問題</div>
                        <div className="font-medium">{averages.section_ad.toFixed(1)}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">BC問題</div>
                        <div className="font-medium">{averages.section_bc.toFixed(1)}</div>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground">合計</div>
                        <div className="font-medium">{averages.total_score.toFixed(1)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="overflow-x-auto mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("student_id")}
                          >
                            学生ID
                            {sortOption === "student_id" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead>学生名</TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_a")}
                          >
                            A問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_b")}
                          >
                            B問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_c")}
                          >
                            C問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_d")}
                          >
                            D問題
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_ad")}
                          >
                            AD問題
                            {sortOption === "section_ad" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("section_bc")}
                          >
                            BC問題
                            {sortOption === "section_bc" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 -ml-3 font-medium"
                            onClick={() => setSortOption("total_score")}
                          >
                            合計
                            {sortOption === "total_score" && <ArrowUpDown className="h-3 w-3" />}
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedScores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell className="font-medium">{score.student_id}</TableCell>
                          <TableCell>{score.name || "名前なし"}</TableCell>
                          <TableCell className="text-right">{score.section_a || "-"}</TableCell>
                          <TableCell className="text-right">{score.section_b || "-"}</TableCell>
                          <TableCell className="text-right">{score.section_c || "-"}</TableCell>
                          <TableCell className="text-right">{score.section_d || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{score.section_ad || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{score.section_bc || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{score.total_score || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
