class GPTClient {
  constructor() {
    // GitHub Pages環境の検出
    const isGitHubPages = window.location.hostname.includes('github.io');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isGitHubPages) {
      // GitHub Pages環境ではバックエンドサーバーを使用しない
      this.serverURL = null;
      this.isServerAvailable = false;
      console.log('🌐 GitHub Pages環境を検出: フォールバックモードで動作します');
    } else if (isLocalhost) {
      // ローカル開発環境
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      this.serverURL = `${protocol}//localhost:3000`;
      this.isServerAvailable = false;
      this.checkServerHealth();
    } else {
      // その他の本番環境
      this.serverURL = 'https://your-production-domain.com'; // 本番環境のドメインに変更
      this.isServerAvailable = false;
      this.checkServerHealth();
    }
  }

  // サーバーの健康状態をチェック
  async checkServerHealth() {
    // serverURLがnullの場合はチェックをスキップ
    if (!this.serverURL) {
      console.log('🌐 サーバーURLが設定されていないため、ヘルスチェックをスキップします');
      return;
    }

    try {
      const response = await fetch(`${this.serverURL}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });
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
    // GitHub Pages環境またはサーバーが利用できない場合はフォールバック
    if (!this.serverURL || !this.isServerAvailable) {
      console.log('📝 フォールバックアドバイスを生成します');
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
    
    // フォトグラファータイプに基づいた具体的なアドバイス
    const typeSpecificAdvice = {
      portrait_artist: {
        immediate: [
          'ポートレート撮影では、被写体との信頼関係を築くことが最も重要です',
          '自然光を活用し、窓際での撮影から始めてみましょう',
          '背景をシンプルにし、被写体に集中した構図を心がけてください'
        ],
        technique: [
          '絞り値をF2.8〜F4に設定して、美しいボケ効果を活用しましょう',
          '被写体の目にピントを合わせ、表情を重視した撮影をしてください',
          'カメラの高さを被写体の目線に合わせ、自然な角度で撮影しましょう'
        ]
      },
      street_photographer: {
        immediate: [
          '街の日常を観察し、興味深い瞬間を見つける練習をしましょう',
          'カメラを目立たないように持ち、自然な表情を捉えることを心がけてください',
          '光と影の変化に敏感になり、ドラマチックな瞬間を探してみましょう'
        ],
        technique: [
          '絞り優先モードでF8〜F11を使用し、被写界深度を確保してください',
          'ISO感度を400〜800に設定し、手ブレを防ぎながら撮影しましょう',
          '構図の三分割法を基本とし、動きのある被写体を画面の端に配置してください'
        ]
      },
      landscape_master: {
        immediate: [
          '日の出・日の入りの時間帯を狙い、美しい光を捉えましょう',
          '三脚を使用し、長時間露光で水の流れや雲の動きを表現してください',
          '前景・中景・後景の3つの要素を意識した構図を作りましょう'
        ],
        technique: [
          '絞り値をF8〜F16に設定し、全体にピントが合うようにしてください',
          'ISO感度は100〜200に設定し、ノイズの少ない高画質を追求しましょう',
          'NDフィルターを使用し、長時間露光で動きのある表現を試してください'
        ]
      }
    };

    const typeAdvice = typeSpecificAdvice[photographerType.type] || {
      immediate: [
        'まずは基本的な撮影技法をマスターしましょう',
        'お気に入りのカメラ機能を3つ見つけて、それらを徹底的に使いこなしてください',
        '毎日10分でも撮影時間を作り、継続的な練習を心がけましょう'
      ],
      technique: [
        '適切なISO設定と絞り値の組み合わせを学びましょう',
        '被写体の動きに合わせたフォーカスモードの使い分けを練習してください',
        '構図の基本原則を理解し、意図的な画面構成を心がけましょう'
      ]
    };

    return {
      immediate: typeAdvice.immediate,
      long_term: [
        '半年ごとに撮影スタイルを見直し、新しい技法に挑戦してください',
        '同じ被写体を異なるアプローチで撮影し、表現の幅を広げましょう',
        '他のフォトグラファーの作品を研究し、インスピレーションを得てください',
        '定期的に作品を振り返り、自分の成長を確認しましょう'
      ],
      technique: typeAdvice.technique
    };
  }
}

// グローバルインスタンス
window.gptClient = new GPTClient();
