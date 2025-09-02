import { NextResponse } from 'next/server';
import { generateQyanAnalysis, type StudentAnalysisData } from '@/lib/gemini-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student, scores }: StudentAnalysisData = body;

    console.log('=== Qyan Analysis API ===');
    console.log('Student:', student);
    console.log('Scores count:', scores?.length);
    console.log('Has API key:', !!process.env.GEMINI_API_KEY);
    console.log('API key prefix:', process.env.GEMINI_API_KEY?.substring(0, 10));

    // 入力検証
    if (!student || !scores || scores.length === 0) {
      console.log('Invalid input data');
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      console.log('No API key configured');
      return NextResponse.json(
        { 
          error: 'API key not configured',
          fallbackMessage: `ごめんやで〜、Qやんの調子がちょっと悪いねん。でも${student.name}ちゃんの成績はちゃんと見てるからな！がんばってるのはわかるで〜`
        },
        { status: 500 }
      );
    }

    console.log('Calling generateQyanAnalysis...');
    
    // Qやんの分析を生成
    const analysis = await generateQyanAnalysis({ student, scores });
    
    console.log('Analysis generated successfully');
    console.log('Analysis length:', analysis?.length);

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== Qyan Analysis Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('============================');
    
    return NextResponse.json(
      { 
        error: 'Analysis generation failed',
        fallbackMessage: 'ごめんやで〜、Qやんがちょっと疲れてるねん。でも君の頑張りはちゃんと見てるからな！',
        debug: {
          errorType: typeof error,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
}
