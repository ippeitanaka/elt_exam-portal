// 機械学習モデル用のサービス（将来的にTensorFlow.jsで実装）

export interface PredictionInput {
  scores: Array<{
    test_date: string;
    total_score: number;
    section_ad: number;
    section_bc: number;
    rank: number;
    avg_total_score: number;
  }>;
  studentInfo: {
    enrollmentDate: string;
    currentGrade: number;
  };
}

export interface PredictionResult {
  graduationProbability: number;
  nationalExamProbability: number;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
}

// 現在はルールベースの予測（将来的にMLモデルに置き換え）
export function predictStudentOutcomes(input: PredictionInput): PredictionResult {
  const { scores } = input;
  
  if (scores.length === 0) {
    return {
      graduationProbability: 0.5,
      nationalExamProbability: 0.5,
      confidence: 0.1,
      factors: {
        positive: [],
        negative: ['データ不足']
      },
      recommendations: ['まずは模擬試験を受けてデータを蓄積しましょう']
    };
  }

  // 最新3回の成績で分析
  const recentScores = scores.slice(0, Math.min(3, scores.length));
  const latestScore = recentScores[0];
  
  // 基本指標の計算
  const averageScore = recentScores.reduce((sum, s) => sum + s.total_score, 0) / recentScores.length;
  const averageRank = recentScores.reduce((sum, s) => sum + s.rank, 0) / recentScores.length;
  
  // 成績推移の計算
  let trendScore = 0;
  if (recentScores.length >= 2) {
    const trend = recentScores[0].total_score - recentScores[recentScores.length - 1].total_score;
    trendScore = trend / (recentScores.length - 1);
  }
  
  // 合格率の計算
  const passingTests = recentScores.filter(s => s.section_ad >= 132 && s.section_bc >= 44).length;
  const passingRate = passingTests / recentScores.length;
  
  // 平均との比較
  const aboveAverageRate = recentScores.filter(s => s.total_score >= s.avg_total_score).length / recentScores.length;
  
  // 卒業確率の計算（ルールベース）
  let graduationProbability = 0.5; // ベース確率
  
  // 成績が良好
  if (averageScore >= 180) graduationProbability += 0.3;
  else if (averageScore >= 150) graduationProbability += 0.2;
  else if (averageScore >= 120) graduationProbability += 0.1;
  else graduationProbability -= 0.2;
  
  // 合格率が高い
  if (passingRate >= 0.8) graduationProbability += 0.2;
  else if (passingRate >= 0.6) graduationProbability += 0.1;
  else if (passingRate < 0.3) graduationProbability -= 0.3;
  
  // 成績上昇傾向
  if (trendScore > 5) graduationProbability += 0.15;
  else if (trendScore < -5) graduationProbability -= 0.15;
  
  // 順位が良好
  if (averageRank <= 10) graduationProbability += 0.15;
  else if (averageRank <= 20) graduationProbability += 0.1;
  else if (averageRank > 50) graduationProbability -= 0.1;
  
  // 国家試験合格確率（卒業確率より少し厳しく）
  let nationalExamProbability = Math.max(0, graduationProbability - 0.1);
  
  // 最新の成績が特に良い場合は国家試験確率を上げる
  if (latestScore.section_ad >= 140 && latestScore.section_bc >= 47) {
    nationalExamProbability += 0.1;
  }
  
  // 確率を0-1の範囲に調整
  graduationProbability = Math.max(0, Math.min(1, graduationProbability));
  nationalExamProbability = Math.max(0, Math.min(1, nationalExamProbability));
  
  // 信頼度の計算（データ量と一貫性に基づく）
  const confidence = Math.min(0.9, 0.3 + (scores.length * 0.1));
  
  // ポジティブ・ネガティブ要因の特定
  const positive = [];
  const negative = [];
  
  if (averageScore >= 160) positive.push('総合成績が優秀');
  if (passingRate >= 0.7) positive.push('高い合格率を維持');
  if (trendScore > 3) positive.push('成績が上昇傾向');
  if (averageRank <= 15) positive.push('順位が上位をキープ');
  if (aboveAverageRate >= 0.7) positive.push('平均を上回る安定した成績');
  
  if (averageScore < 130) negative.push('総合成績の向上が必要');
  if (passingRate < 0.5) negative.push('合格率が低い');
  if (trendScore < -3) negative.push('成績が下降傾向');
  if (averageRank > 40) negative.push('順位の改善が必要');
  if (latestScore.section_bc < 40) negative.push('必修問題の強化が必要');
  if (latestScore.section_ad < 120) negative.push('一般問題の基礎力向上が必要');
  
  // 推奨事項
  const recommendations = [];
  
  if (latestScore.section_bc < 44) {
    recommendations.push('必修問題の徹底復習を行いましょう');
  }
  if (latestScore.section_ad < 132) {
    recommendations.push('一般問題の演習量を増やしましょう');
  }
  if (trendScore < 0) {
    recommendations.push('学習方法を見直し、苦手分野を特定しましょう');
  }
  if (averageRank > 30) {
    recommendations.push('定期的な模擬試験で実力確認を行いましょう');
  }
  if (passingRate < 0.6) {
    recommendations.push('基礎知識の定着を重点的に行いましょう');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('現在の学習ペースを維持しましょう');
  }
  
  return {
    graduationProbability,
    nationalExamProbability,
    confidence,
    factors: { positive, negative },
    recommendations
  };
}

// 将来的なMLモデル用のデータ前処理関数
export function preprocessDataForML(scores: any[]): number[][] {
  // 特徴量エンジニアリング
  return scores.map(score => [
    score.total_score / 200, // 正規化
    score.section_ad / 150,
    score.section_bc / 50,
    score.rank / 100,
    (score.total_score - score.avg_total_score) / 50, // 平均からの差
  ]);
}

// 予測結果の可視化用データ
export function generatePredictionVisualization(result: PredictionResult) {
  return {
    chartData: [
      {
        label: '卒業確率',
        value: result.graduationProbability * 100,
        color: result.graduationProbability >= 0.7 ? '#10B981' : result.graduationProbability >= 0.5 ? '#F59E0B' : '#EF4444'
      },
      {
        label: '国家試験合格確率',
        value: result.nationalExamProbability * 100,
        color: result.nationalExamProbability >= 0.7 ? '#10B981' : result.nationalExamProbability >= 0.5 ? '#F59E0B' : '#EF4444'
      }
    ],
    confidenceLevel: result.confidence * 100
  };
}
