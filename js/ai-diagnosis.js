// AI診断機能
class CameraPickerAI {
  constructor() {
    this.cameraDatabase = null;
    this.photographerTypes = null;
    this.loadDatabase();
  }

  // データベース読み込み
  async loadDatabase() {
    try {
      console.log('カメラデータベースを読み込み中...');
      
      // GitHub Pages対応のパス構築
      const basePath = window.location.pathname.includes('/camerapicker/') 
        ? '/camerapicker/' 
        : '/';
      const dataPath = `${basePath}data/camera-database.json`;
      
      console.log('データベースパス:', dataPath);
      const response = await fetch(dataPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.cameraDatabase = data.cameras;
      this.photographerTypes = data.photographer_types;
      console.log(`✅ カメラデータベース読み込み完了: ${this.cameraDatabase.length}台のカメラ`);
    } catch (error) {
      console.error('❌ データベース読み込みエラー:', error);
      console.log('フォールバックデータを使用します...');
      
      // フォールバックデータを設定
      this.cameraDatabase = [
        {
          id: "sony-a7iv",
          brand: "Sony",
          name: "α7 IV",
          price: 298000,
          price_range: "high",
          sensor_size: "full_frame",
          megapixels: 33,
          features: ["4k_video", "ibis", "weather_sealed", "dual_sd"],
          strengths: ["hybrid_shooting", "autofocus", "image_quality"],
          weaknesses: ["battery_life", "menu_complexity"],
          best_for: ["portrait", "wedding", "commercial", "hybrid"],
          experience_level: ["intermediate", "advanced"],
          budget_friendly: false,
          compact: false,
          image: "https://via.placeholder.com/400x300?text=Sony+α7+IV",
          specs: "有効約3300万画素、ISO 100-51200、ボディ内手ブレ補正5軸"
        },
        {
          id: "canon-r6ii",
          brand: "Canon",
          name: "EOS R6 Mark II",
          price: 348000,
          price_range: "high",
          sensor_size: "full_frame",
          megapixels: 24,
          features: ["4k_video", "ibis", "weather_sealed", "dual_sd"],
          strengths: ["autofocus", "burst_speed", "low_light"],
          weaknesses: ["megapixels", "price"],
          best_for: ["sports", "wildlife", "action", "low_light"],
          experience_level: ["intermediate", "advanced"],
          budget_friendly: false,
          compact: false,
          image: "https://via.placeholder.com/400x300?text=Canon+EOS+R6+Mark+II",
          specs: "有効約2420万画素、ISO 100-102400、最高約40コマ/秒"
        },
        {
          id: "fujifilm-xt5",
          brand: "Fujifilm",
          name: "X-T5",
          price: 248000,
          price_range: "medium",
          sensor_size: "aps_c",
          megapixels: 40,
          features: ["4k_video", "ibis", "weather_sealed", "film_simulation"],
          strengths: ["image_quality", "color_science", "build_quality"],
          weaknesses: ["autofocus", "battery_life"],
          best_for: ["street", "portrait", "landscape", "artistic"],
          experience_level: ["beginner", "intermediate", "advanced"],
          budget_friendly: true,
          compact: true,
          image: "https://via.placeholder.com/400x300?text=Fujifilm+X-T5",
          specs: "有効約4020万画素、ISO 125-12800、5軸手ブレ補正"
        }
      ];
      
      this.photographerTypes = {
        portrait_artist: {
          name: "ポートレートアーティスト",
          description: "人物撮影に特化した美しい写真を追求するタイプ",
          camera_preferences: ["image_quality", "color_science", "bokeh"],
          strengths: ["構図", "ライティング", "被写体とのコミュニケーション"],
          weaknesses: ["動体撮影", "風景写真"]
        },
        street_photographer: {
          name: "ストリートフォトグラファー",
          description: "街の瞬間を捉えることを得意とするタイプ",
          camera_preferences: ["compact", "discrete", "quick_af"],
          strengths: ["瞬間の判断", "街の観察力", "自然な表情の撮影"],
          weaknesses: ["スタジオ撮影", "大規模なセットアップ"]
        },
        landscape_master: {
          name: "ランドスケープマスター",
          description: "自然の美しさを表現することを追求するタイプ",
          camera_preferences: ["dynamic_range", "resolution", "weather_sealed"],
          strengths: ["構図", "光の理解", "忍耐力"],
          weaknesses: ["動体撮影", "人物撮影"]
        }
      };
      
      console.log(`✅ フォールバックデータ設定完了: ${this.cameraDatabase.length}台のカメラ`);
      console.log('📋 フォールバックデータ詳細:', {
        cameras: this.cameraDatabase.length,
        types: Object.keys(this.photographerTypes).length
      });
    }
  }

  // データベース読み込み待機
  async waitForDatabase(maxWaitTime = 10000) {
    const startTime = Date.now();
    console.log('データベース読み込み待機開始...');
    
    while (!this.cameraDatabase || this.cameraDatabase.length === 0) {
      if (Date.now() - startTime > maxWaitTime) {
        console.error('❌ データベース読み込みタイムアウト');
        console.log('🔄 フォールバックデータの設定を確認中...');
        
        // フォールバックデータが設定されているかチェック
        if (this.cameraDatabase && this.cameraDatabase.length > 0) {
          console.log('✅ フォールバックデータが利用可能です');
          return true;
        }
        
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('✅ データベース読み込み完了');
    return true;
  }

  // ①の選択内容に基づいてカメラを選定
  async selectCamerasForUser(userPreferences) {
    console.log('🔍 カメラ選択開始 - データベース状態:', {
      hasDatabase: !!this.cameraDatabase,
      databaseLength: this.cameraDatabase ? this.cameraDatabase.length : 0
    });

    // データベースが読み込まれるまで待機
    if (!this.cameraDatabase || this.cameraDatabase.length === 0) {
      console.log('データベース読み込み待機中...');
      await this.waitForDatabase();
    }

    console.log('📊 データベース読み込み後の状態:', {
      hasDatabase: !!this.cameraDatabase,
      databaseLength: this.cameraDatabase ? this.cameraDatabase.length : 0
    });

    if (!this.cameraDatabase || this.cameraDatabase.length === 0) {
      console.error('❌ カメラデータベースが利用できません');
      return [];
    }

    const {
      experience_level,
      mode, // body, lens, combo
      budget_preference,
      shooting_style,
      portability_importance
    } = userPreferences;

    // スコアリングシステム
    const scoredCameras = this.cameraDatabase.map(camera => {
      let score = 0;

      // 経験レベルマッチング
      if (camera.experience_level.includes(experience_level)) {
        score += 20;
      }

      // 予算マッチング
      if (budget_preference === 'low' && camera.budget_friendly) {
        score += 15;
      } else if (budget_preference === 'medium' && camera.price_range === 'medium') {
        score += 15;
      } else if (budget_preference === 'high' && camera.price_range === 'high') {
        score += 15;
      }

      // 撮影スタイルマッチング
      if (shooting_style && camera.best_for.some(style => 
        shooting_style.includes(style))) {
        score += 10;
      }

      // 携帯性マッチング
      if (portability_importance === 'high' && camera.compact) {
        score += 10;
      } else if (portability_importance === 'low' && !camera.compact) {
        score += 5;
      }

      // 汎用性ボーナス
      if (camera.best_for.length > 3) {
        score += 5;
      }

      return { ...camera, score };
    });

    // スコア順にソートして上位10台を返す
    return scoredCameras
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // ②のスワイプ履歴からユーザータイプを診断
  analyzeUserType(swipeHistory, userPreferences) {
    if (!this.photographerTypes) return null;

    const analysis = {
      likes: swipeHistory.filter(item => item.action === 'like' || item.action === 'superlike'),
      dislikes: swipeHistory.filter(item => item.action === 'dislike'),
      superlikes: swipeHistory.filter(item => item.action === 'superlike')
    };

    // 各タイプとの適合度を計算
    const typeScores = Object.keys(this.photographerTypes).map(typeKey => {
      const type = this.photographerTypes[typeKey];
      let score = 0;

      // 好みのカメラ特徴からスコア計算
      analysis.likes.forEach(like => {
        const camera = this.cameraDatabase.find(c => c.id === like.camera_id);
        if (camera) {
          // カメラの特徴とタイプの好みを比較
          if (type.camera_preferences.some(pref => 
            camera.strengths.includes(pref) || 
            camera.features.includes(pref))) {
            score += 5;
          }
        }
      });

      // ユーザー設定からスコア計算
      if (userPreferences.shooting_style) {
        const styleMatch = this.getStyleTypeMatch(userPreferences.shooting_style, typeKey);
        score += styleMatch * 10;
      }

      return { typeKey, type, score };
    });

    // 最高スコアのタイプを返す
    const bestMatch = typeScores.sort((a, b) => b.score - a.score)[0];
    return bestMatch;
  }

  // 撮影スタイルとタイプのマッチング
  getStyleTypeMatch(shootingStyle, typeKey) {
    const styleTypeMap = {
      'portrait': ['portrait_artist'],
      'street': ['street_photographer'],
      'landscape': ['landscape_master'],
      'sports': ['action_hunter'],
      'video': ['vlog_creator'],
      'budget': ['budget_conscious']
    };

    let match = 0;
    shootingStyle.forEach(style => {
      if (styleTypeMap[style] && styleTypeMap[style].includes(typeKey)) {
        match += 1;
      }
    });

    return match;
  }

  // 診断結果の生成（ハイブリッド方式）
  async generateDiagnosisResult(userType, swipeHistory, userPreferences) {
    const analysis = {
      likes: swipeHistory.filter(item => item.action === 'like' || item.action === 'superlike'),
      dislikes: swipeHistory.filter(item => item.action === 'dislike'),
      superlikes: swipeHistory.filter(item => item.action === 'superlike')
    };

    // 好みの特徴を分析
    const likedFeatures = this.analyzeLikedFeatures(analysis.likes);
    const dislikedFeatures = this.analyzeDislikedFeatures(analysis.dislikes);

    // スコア計算
    const scores = {
      image_quality: this.calculateFeatureScore('image_quality', analysis),
      autofocus: this.calculateFeatureScore('autofocus', analysis),
      video_capability: this.calculateFeatureScore('video_quality', analysis),
      portability: this.calculateFeatureScore('compact', analysis),
      budget_consciousness: this.calculateBudgetScore(analysis)
    };

    // おすすめ機材を選定
    const recommendations = this.generateRecommendations(userType, scores, userPreferences);

    // 基本診断データを構築
    const diagnosisData = {
      photographerType: userType,
      scores,
      likedFeatures,
      dislikedFeatures,
      recommendations,
      userPreferences
    };

    // GPT APIで詳細なアドバイスを生成
    let advice;
    if (window.gptClient) {
      try {
        advice = await window.gptClient.generateAdvice(diagnosisData);
      } catch (error) {
        console.warn('GPT APIでのアドバイス生成に失敗、フォールバックを使用:', error);
        advice = this.generateAdvice(userType, scores, userPreferences);
      }
    } else {
      advice = this.generateAdvice(userType, scores, userPreferences);
    }

    return {
      ...diagnosisData,
      advice
    };
  }

  // 好みの特徴を分析
  analyzeLikedFeatures(likes) {
    const featureCounts = {};
    
    likes.forEach(like => {
      const camera = this.cameraDatabase.find(c => c.id === like.camera_id);
      if (camera) {
        camera.strengths.forEach(strength => {
          featureCounts[strength] = (featureCounts[strength] || 0) + 1;
        });
      }
    });

    return Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([feature, count]) => feature);
  }

  // 嫌いな特徴を分析
  analyzeDislikedFeatures(dislikes) {
    const featureCounts = {};
    
    dislikes.forEach(dislike => {
      const camera = this.cameraDatabase.find(c => c.id === dislike.camera_id);
      if (camera) {
        camera.weaknesses.forEach(weakness => {
          featureCounts[weakness] = (featureCounts[weakness] || 0) + 1;
        });
      }
    });

    return Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([feature, count]) => feature);
  }

  // 特徴スコア計算
  calculateFeatureScore(feature, analysis) {
    let score = 50; // ベーススコア

    analysis.likes.forEach(like => {
      const camera = this.cameraDatabase.find(c => c.id === like.camera_id);
      if (camera && camera.strengths.includes(feature)) {
        score += 10;
      }
    });

    analysis.dislikes.forEach(dislike => {
      const camera = this.cameraDatabase.find(c => c.id === dislike.camera_id);
      if (camera && camera.weaknesses.includes(feature)) {
        score += 5;
      }
    });

    return Math.min(100, Math.max(0, score));
  }

  // 予算意識スコア計算
  calculateBudgetScore(analysis) {
    let score = 50;
    let budgetCount = 0;
    let totalCount = analysis.likes.length + analysis.dislikes.length;

    analysis.likes.forEach(like => {
      const camera = this.cameraDatabase.find(c => c.id === like.camera_id);
      if (camera && camera.budget_friendly) {
        budgetCount++;
      }
    });

    if (totalCount > 0) {
      score = (budgetCount / totalCount) * 100;
    }

    return Math.round(score);
  }

  // おすすめ機材生成
  generateRecommendations(userType, scores, userPreferences) {
    const recommendations = {
      primary: null,
      alternatives: [],
      accessories: []
    };

    // プライマリーカメラ選定
    const primaryCandidates = this.cameraDatabase
      .filter(camera => {
        // ユーザータイプに合致
        const typeMatch = userType.type.camera_preferences.some(pref => 
          camera.strengths.includes(pref) || camera.features.includes(pref));
        
        // スコアに合致
        const scoreMatch = this.checkScoreMatch(camera, scores);
        
        return typeMatch && scoreMatch;
      })
      .sort((a, b) => b.price - a.price)
      .slice(0, 3);

    if (primaryCandidates.length > 0) {
      recommendations.primary = primaryCandidates[0];
      recommendations.alternatives = primaryCandidates.slice(1);
    }

    // アクセサリー推奨
    recommendations.accessories = this.recommendAccessories(userType, scores);

    return recommendations;
  }

  // スコアマッチングチェック
  checkScoreMatch(camera, scores) {
    // 高解像度重視
    if (scores.image_quality > 70 && camera.megapixels > 30) {
      return true;
    }
    
    // 動画重視
    if (scores.video_capability > 70 && camera.features.includes('4k_video')) {
      return true;
    }
    
    // 予算重視
    if (scores.budget_consciousness > 70 && camera.budget_friendly) {
      return true;
    }

    return true; // デフォルトでマッチ
  }

  // アクセサリー推奨
  recommendAccessories(userType, scores) {
    const accessories = [];

    // レンズ推奨
    if (userType.typeKey === 'portrait_artist') {
      accessories.push('85mm f/1.4 ポートレートレンズ');
    } else if (userType.typeKey === 'landscape_master') {
      accessories.push('広角ズームレンズ (16-35mm)');
    } else if (userType.typeKey === 'action_hunter') {
      accessories.push('望遠ズームレンズ (70-200mm)');
    }

    // 三脚
    if (userType.typeKey === 'landscape_master' || scores.image_quality > 80) {
      accessories.push('軽量三脚');
    }

    // ストロボ
    if (userType.typeKey === 'portrait_artist') {
      accessories.push('外付けストロボ');
    }

    // フィルター
    if (userType.typeKey === 'landscape_master') {
      accessories.push('NDフィルター・PLフィルター');
    }

    return accessories;
  }

  // アドバイス生成
  generateAdvice(userType, scores, userPreferences) {
    const advice = {
      immediate: [],
      long_term: [],
      technique: []
    };

    // 即座に実践できるアドバイス（最大2個）
    if (userType.typeKey === 'portrait_artist') {
      advice.immediate.push('自然光を活用したポートレート撮影を練習しましょう');
      advice.immediate.push('被写体との距離感を意識して撮影してください');
    } else if (userType.typeKey === 'street_photographer') {
      advice.immediate.push('街の光と影を意識して撮影しましょう');
      advice.immediate.push('瞬間を捉える練習を重ねてください');
    } else if (userType.typeKey === 'landscape_master') {
      advice.immediate.push('構図の基本（三分割法）を意識して撮影しましょう');
      advice.immediate.push('光の質を観察して、ベストなタイミングを狙ってください');
    } else {
      advice.immediate.push('基本の露出（絞り・シャッタースピード・ISO）を理解しましょう');
      advice.immediate.push('構図の基本を練習してください');
    }

    // 長期的な成長アドバイス（最大1個）
    if (scores.image_quality > 80) {
      advice.long_term.push('構図の勉強を深めて、より芸術的な写真を目指しましょう');
    } else if (scores.video_capability > 70) {
      advice.long_term.push('動画編集スキルを身につけて、ストーリーテリングを向上させましょう');
    } else {
      advice.long_term.push('撮影技術を向上させるために、定期的に練習を重ねましょう');
    }

    // アドバイス数を制限（合計3個まで）
    const allAdvice = [...advice.immediate, ...advice.long_term];
    if (allAdvice.length > 3) {
      advice.immediate = advice.immediate.slice(0, 2);
      advice.long_term = advice.long_term.slice(0, 1);
    }

    return advice;
  }
}

// グローバルインスタンス
window.cameraPickerAI = new CameraPickerAI();
