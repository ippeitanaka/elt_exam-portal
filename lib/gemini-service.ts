import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API用の設定
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface StudentAnalysisData {
  student: {
    name: string;
    id: string;
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

export async function generateQyanAnalysis(data: StudentAnalysisData): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // データの分析
  const { student, scores } = data;
  const latestScore = scores[0];
  const previousScore = scores[1];
  
  // 成績の変化を計算
  const totalChange = previousScore ? latestScore.total_score - previousScore.total_score : 0;
  const adChange = previousScore ? latestScore.section_ad - previousScore.section_ad : 0;
  const bcChange = previousScore ? latestScore.section_bc - previousScore.section_bc : 0;
  
  // 合格判定
  const adPassing = latestScore.section_ad >= 132;
  const bcPassing = latestScore.section_bc >= 44;
  const isPassing = adPassing && bcPassing;
  
  // 平均との比較
  const totalAboveAverage = latestScore.total_score - latestScore.avg_total_score;
  
  // 順位の動向
  const rankImprovement = previousScore ? previousScore.rank - latestScore.rank : 0;

  // 弱点と強み分析
  const sectionAnalysis = {
    strongest: '',
    weakest: '',
    adStatus: latestScore.section_ad >= 132 ? '合格' : `不合格（あと${132 - latestScore.section_ad}点）`,
    bcStatus: latestScore.section_bc >= 44 ? '合格' : `不合格（あと${44 - latestScore.section_bc}点）`
  };

  // 最も良い分野と悪い分野を特定
  const sections = [
    { name: 'A問題', score: latestScore.section_a, max: 60 },
    { name: 'B問題', score: latestScore.section_b, max: 40 },
    { name: 'C問題', score: latestScore.section_c, max: 20 },
    { name: 'D問題', score: latestScore.section_d, max: 80 }
  ];
  
  const sectionPercentages = sections.map(s => ({
    ...s,
    percentage: (s.score / s.max) * 100
  })).sort((a, b) => b.percentage - a.percentage);

  sectionAnalysis.strongest = sectionPercentages[0].name;
  sectionAnalysis.weakest = sectionPercentages[sectionPercentages.length - 1].name;

  const prompt = `
あなたは救急救命士養成学科のマスコット「Qやん」です。関西弁で学生にやる気を出させる分析をしてください。

【${student.name}さんの成績】
・総合点: ${latestScore.total_score}点（平均${latestScore.avg_total_score.toFixed(1)}点より${totalAboveAverage >= 0 ? '+' : ''}${totalAboveAverage.toFixed(1)}点）
・AD問題: ${latestScore.section_ad}点 ${sectionAnalysis.adStatus}
・BC問題: ${latestScore.section_bc}点 ${sectionAnalysis.bcStatus}
・順位: ${latestScore.rank}位${previousScore ? (rankImprovement > 0 ? `（${rankImprovement}位アップ！）` : rankImprovement < 0 ? `（${Math.abs(rankImprovement)}位ダウン）` : '（変動なし）') : ''}

【変化】
${previousScore ? `前回より総合点${totalChange > 0 ? '+' : ''}${totalChange}点、AD${adChange > 0 ? '+' : ''}${adChange}点、BC${bcChange > 0 ? '+' : ''}${bcChange}点` : '初回受験'}

【分野別】
・得意: ${sectionAnalysis.strongest}（${sectionPercentages[0].percentage.toFixed(0)}%）
・苦手: ${sectionAnalysis.weakest}（${sectionPercentages[3].percentage.toFixed(0)}%）

以下の構成で300字程度の関西弁アドバイス：
1. 現状の評価（褒める/励ます）
2. 具体的な強みと弱み
3. 次回に向けた学習アドバイス
4. やる気の出る締めの言葉

※関西弁で親しみやすく、でも的確に！
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // より具体的なフォールバック
    let fallbackMessage = `${student.name}ちゃん、お疲れさん！\n\n`;
    
    if (isPassing) {
      fallbackMessage += `やったな！合格ラインクリアしとるやん。総合${latestScore.total_score}点は${totalAboveAverage >= 0 ? '平均超え' : 'もうちょいやけど'}やな。`;
    } else {
      fallbackMessage += `総合${latestScore.total_score}点、`;
      if (!adPassing) fallbackMessage += `AD問題あと${132 - latestScore.section_ad}点、`;
      if (!bcPassing) fallbackMessage += `BC問題あと${44 - latestScore.section_bc}点`;
      fallbackMessage += `で合格やで！`;
    }
    
    fallbackMessage += `\n\n${sectionAnalysis.strongest}は得意やから、${sectionAnalysis.weakest}をもうちょい頑張ったらええ感じになるで！`;
    
    if (rankImprovement > 0) {
      fallbackMessage += `\n順位も${rankImprovement}位上がっとるし、調子ええやん！`;
    }
    
    fallbackMessage += `\n次も頑張ろな〜、応援しとるで！💪`;
    
    return fallbackMessage;
  }
}
