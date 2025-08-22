class GPTClient {
  constructor() {
    this.serverURL = 'http://localhost:3000'; // バックエンドサーバーのURL
    this.isServerAvailable = false;
    this.checkServerHealth();
  }

  // サーバーの健康状態をチェック
  async checkServerHealth() {
    try {
      const response = await fetch(`${this.serverURL}/api/health`);
      const data = await response.json();
      this.isServerAvailable = data.status === 'ok';
      console.log('サーバー状態:', this.isServerAvailable ? '✅ 利用可能' : '❌ 利用不可');
    } catch (error) {
      console.warn('バックエンドサーバーに接続できません:', error);
      this.isServerAvailable = false;
    }
  }

  // GPT APIにリクエストを送信（バックエンド経由）
  async generateAdvice(diagnosisData) {
    if (!this.isServerAvailable) {
      console.warn('バックエンドサーバーが利用できません');
      return this.generateFallbackAdvice(diagnosisData);
    }

    try {
      const response = await fetch(`${this.serverURL}/api/generate-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diagnosisData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.fallback) {
          console.warn('GPT APIが利用できません、フォールバックを使用:', errorData.error);
          return this.generateFallbackAdvice(diagnosisData);
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      return data.advice;

    } catch (error) {
      console.error('バックエンドAPI呼び出しエラー:', error);
      return this.generateFallbackAdvice(diagnosisData);
    }
  }



  // フォールバックアドバイス（APIが使えない場合）
  generateFallbackAdvice(diagnosisData) {
    const { photographerType, scores } = diagnosisData;
    
    return {
      immediate: [
        `${photographerType.type.name}として、まずは基本的な撮影技法をマスターしましょう`,
        'お気に入りのカメラ機能を3つ見つけて、それらを徹底的に使いこなしてください',
        '毎日10分でも撮影時間を作り、継続的な練習を心がけましょう'
      ],
      long_term: [
        '半年ごとに撮影スタイルを見直し、新しい技法に挑戦してください',
        '同じ被写体を異なるアプローチで撮影し、表現の幅を広げましょう',
        '他のフォトグラファーの作品を研究し、インスピレーションを得てください'
      ],
      technique: [
        `画質重視度が${scores.image_quality}なので、適切なISO設定と絞り値の組み合わせを学びましょう`,
        'AF性能を活かすため、被写体の動きに合わせたフォーカスモードの使い分けを練習してください',
        '構図の基本原則を理解し、意図的な画面構成を心がけましょう'
      ]
    };
  }
}

// グローバルインスタンス
window.gptClient = new GPTClient();
