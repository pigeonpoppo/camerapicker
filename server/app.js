const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
  credentials: true
}));
app.use(express.json());

// 環境変数からAPIキーを取得
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// GPT APIエンドポイント
app.post('/api/generate-advice', async (req, res) => {
  try {
    const { diagnosisData } = req.body;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI APIキーが設定されていません',
        fallback: true
      });
    }

    // プロンプトを構築
    const prompt = buildPrompt(diagnosisData);

    // OpenAI APIを呼び出し
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは写真撮影の専門家で、カメラ機材選びのアドバイザーです。ユーザーの撮影スタイルと好みに基づいて、具体的で実用的なアドバイスを提供してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0].message.content;
    const advice = parseResponse(content);

    res.json({ advice });

  } catch (error) {
    console.error('GPT API呼び出しエラー:', error);
    
    // エラーレスポンスを返す（フロントエンドでフォールバック処理）
    res.status(500).json({
      error: 'GPT API呼び出しに失敗しました',
      fallback: true
    });
  }
});

// プロンプトを構築
function buildPrompt(diagnosisData) {
  const { photographerType, scores, likedFeatures, dislikedFeatures, userPreferences } = diagnosisData;
  
  return `
以下のユーザーの診断結果に基づいて、具体的で実用的なアドバイスを提供してください：

【フォトグラファータイプ】
${photographerType.type.name}
${photographerType.type.description}

【スコア分析】
- 画質重視度: ${scores.image_quality}/100
- AF性能重視度: ${scores.autofocus}/100
- 動画性能重視度: ${scores.video_capability}/100
- 携帯性重視度: ${scores.portability}/100

【好みの特徴】
${likedFeatures.join(', ')}

【避けたい特徴】
${dislikedFeatures.join(', ')}

【ユーザー設定】
- 経験レベル: ${userPreferences.experience_level}
- 探しているもの: ${userPreferences.mode}
- 予算感: ${userPreferences.budget_preference}

以下の形式でアドバイスを提供してください：

1. 【即座に実践できるアドバイス】（3つ）
2. 【長期的な成長アドバイス】（3つ）
3. 【技術的アドバイス】（3つ）

各アドバイスは具体的で実践的であること。日本語で回答してください。
  `;
}

// レスポンスを解析
function parseResponse(content) {
  const advice = {
    immediate: [],
    long_term: [],
    technique: []
  };

  const lines = content.split('\n');
  let currentSection = null;

  for (const line of lines) {
    if (line.includes('即座に実践できるアドバイス')) {
      currentSection = 'immediate';
    } else if (line.includes('長期的な成長アドバイス')) {
      currentSection = 'long_term';
    } else if (line.includes('技術的アドバイス')) {
      currentSection = 'technique';
    } else if (line.match(/^\d+\./) && currentSection) {
      const adviceText = line.replace(/^\d+\.\s*/, '').trim();
      if (adviceText) {
        advice[currentSection].push(adviceText);
      }
    }
  }

  return advice;
}

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasApiKey: !!OPENAI_API_KEY
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`📝 APIキー設定状況: ${OPENAI_API_KEY ? '✅ 設定済み' : '❌ 未設定'}`);
});

module.exports = app;


