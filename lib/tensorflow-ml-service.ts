import * as tf from '@tensorflow/tfjs';

// 学生の成績データからトレーニングデータを生成
export interface StudentRecord {
  scores: Array<{
    total_score: number;
    section_ad: number;
    section_bc: number;
    rank: number;
    avg_total_score: number;
    test_date: string;
  }>;
  outcome: {
    graduated: boolean;
    nationalExamPassed: boolean;
  };
}

// 特徴量エンジニアリング
export function extractFeatures(scores: any[]): number[] {
  if (scores.length === 0) return new Array(15).fill(0);

  const recentScores = scores.slice(0, Math.min(5, scores.length));
  const latest = recentScores[0];
  
  // 基本統計量
  const avgTotal = recentScores.reduce((sum, s) => sum + s.total_score, 0) / recentScores.length;
  const avgAD = recentScores.reduce((sum, s) => sum + s.section_ad, 0) / recentScores.length;
  const avgBC = recentScores.reduce((sum, s) => sum + s.section_bc, 0) / recentScores.length;
  const avgRank = recentScores.reduce((sum, s) => sum + s.rank, 0) / recentScores.length;
  
  // 成績推移
  const scoreProgression = recentScores.length > 1 ? 
    (recentScores[0].total_score - recentScores[recentScores.length - 1].total_score) / (recentScores.length - 1) : 0;
  
  // 安定性（標準偏差）
  const totalStd = Math.sqrt(recentScores.reduce((sum, s) => 
    sum + Math.pow(s.total_score - avgTotal, 2), 0) / recentScores.length);
  
  // 合格率
  const passRate = recentScores.filter(s => s.section_ad >= 132 && s.section_bc >= 44).length / recentScores.length;
  
  // 平均との比較率
  const aboveAvgRate = recentScores.filter(s => s.total_score >= s.avg_total_score).length / recentScores.length;
  
  // 最新成績の特徴
  const latestNormalized = {
    total: latest.total_score / 200,
    ad: latest.section_ad / 150,
    bc: latest.section_bc / 50,
    rank: Math.max(0, 1 - (latest.rank / 100)), // 順位を逆転（高いほど良い）
    vsAvg: (latest.total_score - latest.avg_total_score) / 100
  };

  return [
    // 正規化された特徴量 (15次元)
    avgTotal / 200,           // 0: 平均総合点 (正規化)
    avgAD / 150,              // 1: 平均AD点 (正規化)
    avgBC / 50,               // 2: 平均BC点 (正規化)
    Math.max(0, 1 - avgRank / 100), // 3: 平均順位 (逆転正規化)
    scoreProgression / 50,    // 4: 成績推移 (正規化)
    Math.min(1, totalStd / 50), // 5: 成績安定性
    passRate,                 // 6: 合格率
    aboveAvgRate,            // 7: 平均超過率
    latestNormalized.total,   // 8: 最新総合点
    latestNormalized.ad,      // 9: 最新AD点
    latestNormalized.bc,      // 10: 最新BC点
    latestNormalized.rank,    // 11: 最新順位
    latestNormalized.vsAvg,   // 12: 最新成績の平均との差
    recentScores.length / 10, // 13: データ量 (正規化)
    Math.min(1, scores.length / 20) // 14: 総データ量 (正規化)
  ];
}

// モック訓練データ生成（実際のデータがある場合は置き換え）
export function generateMockTrainingData(numSamples: number = 1000): { features: number[][], labels: number[][] } {
  const features: number[][] = [];
  const labels: number[][] = [];

  for (let i = 0; i < numSamples; i++) {
    // ランダムな学生成績を生成
    const baseAbility = Math.random(); // 0-1の基本能力
    const consistency = 0.5 + Math.random() * 0.5; // 0.5-1の一貫性
    
    const mockScores = [];
    for (let j = 0; j < Math.floor(3 + Math.random() * 7); j++) {
      const noise = (Math.random() - 0.5) * 0.4 * (1 - consistency);
      const ability = Math.max(0, Math.min(1, baseAbility + noise));
      
      mockScores.push({
        total_score: Math.floor(80 + ability * 120),
        section_ad: Math.floor(60 + ability * 90),
        section_bc: Math.floor(25 + ability * 25),
        rank: Math.floor((1 - ability) * 80 + Math.random() * 20),
        avg_total_score: 140 + Math.random() * 20,
        test_date: new Date().toISOString()
      });
    }

    const feature = extractFeatures(mockScores);
    features.push(feature);

    // ラベル生成（卒業確率、国家試験確率）
    const graduationProb = Math.min(0.95, Math.max(0.05, 
      0.3 + baseAbility * 0.6 + consistency * 0.1 + Math.random() * 0.2));
    const nationalExamProb = Math.min(0.95, Math.max(0.05, 
      graduationProb * 0.8 + Math.random() * 0.1));

    labels.push([graduationProb, nationalExamProb]);
  }

  return { features, labels };
}

// ニューラルネットワークモデルの構築
export function createMLModel(): tf.LayersModel {
  // モデル作成前に既存の変数をクリア
  tf.disposeVariables();
  
  const model = tf.sequential({
    layers: [
      // 入力層 (15次元特徴量)
      tf.layers.dense({
        inputShape: [15],
        units: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        name: `dense_input_${Date.now()}`
      }),
      
      // ドロップアウト層（過学習防止）
      tf.layers.dropout({ rate: 0.3 }),
      
      // 隠れ層1
      tf.layers.dense({
        units: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        name: `dense_hidden1_${Date.now()}`
      }),
      
      // ドロップアウト層
      tf.layers.dropout({ rate: 0.2 }),
      
      // 隠れ層2
      tf.layers.dense({
        units: 8,
        activation: 'relu',
        kernelInitializer: 'heNormal',
        name: `dense_hidden2_${Date.now()}`
      }),
      
      // 出力層 (2次元: 卒業確率, 国家試験確率)
      tf.layers.dense({
        units: 2,
        activation: 'sigmoid', // 0-1の確率出力
        name: `dense_output_${Date.now()}`
      })
    ]
  });

  // モデルコンパイル
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mse', 'mae']
  });

  return model;
}

// モデル訓練
export async function trainModel(model: tf.LayersModel, features: number[][], labels: number[][]): Promise<tf.History> {
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(labels);

  console.log('🤖 機械学習モデル訓練開始...');
  console.log(`データ数: ${features.length}, 特徴量: ${features[0].length}`);

  const history = await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 20 === 0) {
          console.log(`Epoch ${epoch}: loss=${logs?.loss?.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}`);
        }
      }
    }
  });

  // メモリ解放
  xs.dispose();
  ys.dispose();

  console.log('✅ モデル訓練完了!');
  return history;
}

// 予測実行
export function predict(model: tf.LayersModel, studentScores: any[]): { graduationProb: number, nationalExamProb: number, confidence: number } {
  const features = extractFeatures(studentScores);
  const input = tf.tensor2d([features]);
  
  const prediction = model.predict(input) as tf.Tensor;
  const probabilities = prediction.dataSync();
  
  // メモリ解放
  input.dispose();
  prediction.dispose();

  // 信頼度計算（データ量と特徴量の質に基づく）
  const dataQuality = Math.min(1, studentScores.length / 10);
  const featureQuality = features.reduce((sum, f) => sum + (isNaN(f) ? 0 : 1), 0) / features.length;
  const confidence = (dataQuality + featureQuality) / 2;

  return {
    graduationProb: probabilities[0],
    nationalExamProb: probabilities[1],
    confidence: confidence
  };
}

// モデルの保存
export async function saveModel(model: tf.LayersModel, path: string): Promise<void> {
  await model.save(`file://${path}`);
  console.log(`✅ モデルを保存しました: ${path}`);
}

// モデルの読み込み
export async function loadModel(path: string): Promise<tf.LayersModel> {
  const model = await tf.loadLayersModel(`file://${path}`);
  console.log(`✅ モデルを読み込みました: ${path}`);
  return model;
}
