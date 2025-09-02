import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
