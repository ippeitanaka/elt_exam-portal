'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, TrendingUp, TrendingDown, Target, Award, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QyanCharacter from '@/components/ui/qyan-character';
import axios from 'axios';

interface AIAnalysisProps {
  student: {
    name: string;
    student_id: string;
  };
  scores: Array<{
    test_name: string;
    test_date: string;
    total_score: number;
    section_a: number;
    section_b: number;
    section_c: number;
    section_d: number;
    section_ad: number;
    section_bc: number;
    rank: number;
    avg_total_score: number;
  }>;
}

export default function AIAnalysisTab({ student, scores }: AIAnalysisProps) {
  const [qyanAnalysis, setQyanAnalysis] = useState<string>('');
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [isLoadingQyan, setIsLoadingQyan] = useState(false);
  const [isLoadingML, setIsLoadingML] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleQyanAnalysis = async () => {
    setIsLoadingQyan(true);
    try {
      const response = await axios.post('/api/qyan-analysis', {
        student: {
          name: student.name,
          id: student.student_id
        },
        scores: scores.slice(0, 5) // 最新5回分
      });

      if (response.data.success) {
        setQyanAnalysis(response.data.analysis);
      } else {
        setQyanAnalysis(response.data.fallbackMessage || 'エラーが発生しました');
      }
      setShowAnalysis(true);
    } catch (error) {
      console.error('Qyan analysis error:', error);
      setQyanAnalysis('ごめんやで〜、Qやんがちょっと疲れてるねん。でも君の頑張りはちゃんと見てるからな！');
      setShowAnalysis(true);
    } finally {
      setIsLoadingQyan(false);
    }
  };

  const handleMLPrediction = async () => {
    setIsLoadingML(true);
    try {
      // TensorFlow.jsをデフォルトで使用
      const response = await axios.post('/api/tensorflow-prediction', {
        scores: scores.map(score => ({
          test_date: score.test_date,
          total_score: score.total_score,
          section_ad: score.section_ad,
          section_bc: score.section_bc,
          rank: score.rank,
          avg_total_score: score.avg_total_score
        })),
        studentInfo: {
          enrollmentDate: '2024-04-01', // 仮の値
          currentGrade: 2
        }
      });

      // APIレスポンスの成功確認
      if (response.data.success) {
        setMlPrediction(response.data);
      } else {
        console.warn('TensorFlow.js API returned failure response:', response.data);
        setMlPrediction(response.data); // 失敗レスポンスも表示（フォールバック情報含む）
      }
    } catch (error) {
      console.error('ML prediction error:', error);
    } finally {
      setIsLoadingML(false);
    }
  };

  React.useEffect(() => {
    // TensorFlow.js機械学習予測を自動で実行
    if (scores.length > 0) {
      handleMLPrediction();
    }
  }, []);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600';
    if (probability >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProbabilityBg = (probability: number) => {
    if (probability >= 0.7) return 'bg-green-100 border-green-200';
    if (probability >= 0.5) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Qやんによる成績分析 */}
      <Card className="overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <QyanCharacter width={40} height={40} />
            <div>
              <h3 className="text-lg">Qやんによる成績分析</h3>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleQyanAnalysis}
              disabled={isLoadingQyan}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              {isLoadingQyan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Qやんが分析中やで〜
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Qやんに分析してもらう
                </>
              )}
            </Button>

            <AnimatePresence>
              {showAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-white border-orange-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <QyanCharacter width={24} height={24} />
                        <h4 className="font-medium">Qやんからのメッセージ</h4>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {qyanAnalysis}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* 機械学習による予測 */}
      <Card className="overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            AI予測分析
          </CardTitle>
          <CardDescription>
            AIが卒業確率と合格確率を予測します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingML ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">分析中...</span>
            </div>
          ) : mlPrediction?.graduationProbability !== undefined ? (
            <div className="space-y-6">
              {/* 予測結果 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`${getProbabilityBg(mlPrediction.graduationProbability)}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Award className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium mb-2">卒業確率</h3>
                      <div className={`text-3xl font-bold ${getProbabilityColor(mlPrediction.graduationProbability)}`}>
                        {(mlPrediction.graduationProbability * 100).toFixed(1)}%
                      </div>
                      <Progress 
                        value={mlPrediction.graduationProbability * 100} 
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className={`${getProbabilityBg(mlPrediction.nationalExamProbability)}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium mb-2">国家試験合格確率</h3>
                      <div className={`text-3xl font-bold ${getProbabilityColor(mlPrediction.nationalExamProbability)}`}>
                        {(mlPrediction.nationalExamProbability * 100).toFixed(1)}%
                      </div>
                      <Progress 
                        value={mlPrediction.nationalExamProbability * 100} 
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 信頼度 */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">予測の信頼度</span>
                    <Badge variant="outline">
                      {(mlPrediction.confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={mlPrediction.confidence * 100} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {mlPrediction.modelType === 'tensorflow' ? 'TensorFlow.js機械学習モデル' : '統計モデル'}
                  </p>
                </CardContent>
              </Card>

              {/* ポジティブ要因 */}
              {mlPrediction.factors?.positive?.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      強み・ポジティブ要因
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mlPrediction.factors.positive.map((factor: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ネガティブ要因 */}
              {mlPrediction.factors?.negative?.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      改善が必要な要因
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mlPrediction.factors.negative.map((factor: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 推奨事項 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    学習アドバイス
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mlPrediction.recommendations?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 免責事項 */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-600">
                    ※ この予測は過去のデータに基づく参考値です。実際の結果を保証するものではありません。
                    継続的な学習と努力が最も重要です。
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                成績データが不足しています。模擬試験を受けてデータを蓄積しましょう。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
