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
      const response = await fetch('data/camera-database.json');
      const data = await response.json();
      this.cameraDatabase = data.cameras;
      this.photographerTypes = data.photographer_types;
    } catch (error) {
      console.error('データベース読み込みエラー:', error);
    }
  }

  // ①の選択内容に基づいてカメラを選定
  selectCamerasForUser(userPreferences) {
    if (!this.cameraDatabase) return [];

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

    // 即座に実践できるアドバイス
    if (userType.typeKey === 'portrait_artist') {
      advice.immediate.push('自然光を活用したポートレート撮影を練習しましょう');
      advice.immediate.push('被写体との距離感を意識して撮影してください');
    } else if (userType.typeKey === 'street_photographer') {
      advice.immediate.push('街の光と影を意識して撮影しましょう');
      advice.immediate.push('瞬間を捉える練習を重ねてください');
    }

    // 長期的な成長アドバイス
    if (scores.image_quality > 80) {
      advice.long_term.push('構図の勉強を深めて、より芸術的な写真を目指しましょう');
    }
    if (scores.video_capability > 70) {
      advice.long_term.push('動画編集スキルを身につけて、ストーリーテリングを向上させましょう');
    }

    // 技術的アドバイス
    if (userPreferences.experience_level === 'beginner') {
      advice.technique.push('基本の露出（絞り・シャッタースピード・ISO）を理解しましょう');
      advice.technique.push('構図の基本（三分割法など）を練習してください');
    } else if (userPreferences.experience_level === 'intermediate') {
      advice.technique.push('より高度な構図テクニックを学びましょう');
      advice.technique.push('ライティングの知識を深めてください');
    }

    return advice;
  }
}

// グローバルインスタンス
window.cameraPickerAI = new CameraPickerAI();
