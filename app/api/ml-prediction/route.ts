import { NextResponse } from 'next/server';
import { predictStudentOutcomes, generatePredictionVisualization, type PredictionInput } from '@/lib/ml-prediction-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input: PredictionInput = body;

    // 入力検証
    if (!input.scores || !Array.isArray(input.scores)) {
      return NextResponse.json(
        { error: 'Invalid scores data' },
        { status: 400 }
      );
    }

    // 予測の実行
    const prediction = predictStudentOutcomes(input);
    
    // 可視化用データの生成
    const visualization = generatePredictionVisualization(prediction);

    return NextResponse.json({
      success: true,
      prediction,
      visualization,
      metadata: {
        dataPoints: input.scores.length,
        timestamp: new Date().toISOString(),
        modelVersion: '1.0.0-rule-based'
      }
    });

  } catch (error) {
    console.error('ML prediction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Prediction generation failed',
        message: 'システムエラーが発生しました。しばらく時間をおいて再度お試しください。'
      },
      { status: 500 }
    );
  }
}
