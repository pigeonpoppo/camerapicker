// 動的AI診断機能
class CameraPickerAI {
  constructor() {
    this.cameraDatabase = null;
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
      const dataPath = `${basePath}camera.json`;
      
      console.log('データベースパス:', dataPath);
      const response = await fetch(dataPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.cameraDatabase = data || [];
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
      
      console.log(`✅ フォールバックデータ設定完了: ${this.cameraDatabase.length}台のカメラ`);
    }
  }

  // データベース読み込み待機
  async waitForDatabase(maxWaitTime = 10000) {
    const startTime = Date.now();
    console.log('データベース読み込み待機開始...');
    
    while (!this.cameraDatabase || this.cameraDatabase.length === 0) {
      if (Date.now() - startTime > maxWaitTime) {
        console.error('❌ データベース読み込みタイムアウト');
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

    console.log('📊 ユーザー設定:', userPreferences);

    // 各カメラにスコアを付与
    const scoredCameras = this.cameraDatabase.map(camera => {
      let score = 0;

      // 経験レベルマッチング（発売年から推測）
      const cameraYear = parseInt(camera['発売年']) || 2000;
      const currentYear = new Date().getFullYear();
      const cameraAge = currentYear - cameraYear;
      
      if (experience_level === 'beginner' && cameraAge <= 5) {
        score += 20; // 初心者には新しいカメラ
      } else if (experience_level === 'advanced' && cameraAge >= 3) {
        score += 15; // 上級者には安定したカメラ
      } else {
        score += 10;
      }

      // 予算マッチング
      const budgetValue = parseInt(budget_preference) || 15;
      const cameraPrice = parseInt(camera['新品価格']) || parseInt(camera['中古価格']) || 0;
      
      if (budgetValue <= 10 && cameraPrice <= 100000) {
        score += 15; // 低予算
      } else if (budgetValue >= 30 && cameraPrice >= 200000) {
        score += 15; // 高予算
      } else if (budgetValue >= 10 && budgetValue <= 30) {
        score += 10; // 中予算
      }

      // 撮影スタイルマッチング（カメラタイプから推測）
      const cameraType = camera['タイプ（レンズ交換式など）'] || '';
      if (shooting_style && shooting_style.length > 0) {
        if (shooting_style.includes('portrait') && cameraType.includes('一眼レフ')) {
          score += 10;
        } else if (shooting_style.includes('landscape') && cameraType.includes('ミラーレス')) {
          score += 10;
        } else if (shooting_style.includes('street') && cameraType.includes('コンパクト')) {
          score += 10;
        }
      }

      // 携帯性マッチング
      if (portability_importance === 'high' && cameraType.includes('コンパクト')) {
        score += 10;
      } else if (portability_importance === 'low' && cameraType.includes('一眼レフ')) {
        score += 5;
      }

      // データ品質ボーナス
      const qualityScore = parseInt(camera['データ品質スコア']) || 0;
      score += qualityScore * 2;

      return { ...camera, score };
    });

    // スコア順にソートして上位10台を返す
    return scoredCameras
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // ②のスワイプ履歴からユーザータイプを診断
  analyzeUserType(swipeHistory, userPreferences) {
    const analysis = {
      likes: swipeHistory.filter(item => item.action === 'like' || item.action === 'superlike'),
      dislikes: swipeHistory.filter(item => item.action === 'dislike'),
      superlikes: swipeHistory.filter(item => item.action === 'superlike')
    };

    // ユーザーの選択からキャラクターを動的生成
    const character = this.generateDynamicCharacter(userPreferences, analysis);
    
    return character;
  }

  // 動的キャラクター生成
  generateDynamicCharacter(userPreferences, analysis) {
    const traits = [];
    const characteristics = [];

    // 経験レベルから性格を推測
    if (userPreferences.experience_level === 'beginner') {
      traits.push('初心者');
      characteristics.push('学習意欲旺盛');
    } else if (userPreferences.experience_level === 'intermediate') {
      traits.push('中級者');
      characteristics.push('技術向上志向');
    } else if (userPreferences.experience_level === 'advanced') {
      traits.push('上級者');
      characteristics.push('専門性重視');
    }

    // 予算から性格を推測
    const budgetValue = parseInt(userPreferences.budget_preference) || 15;
    if (budgetValue <= 10) {
      traits.push('コスト意識');
      characteristics.push('効率重視');
    } else if (budgetValue >= 30) {
      traits.push('プレミアム志向');
      characteristics.push('品質重視');
    } else {
      traits.push('バランス重視');
      characteristics.push('実用性重視');
    }

    // 用途から性格を推測
    if (userPreferences.shooting_style) {
      if (userPreferences.shooting_style.includes('portrait')) {
        traits.push('人物重視');
        characteristics.push('表現力豊か');
      }
      if (userPreferences.shooting_style.includes('landscape')) {
        traits.push('風景愛好');
        characteristics.push('自然との調和');
      }
      if (userPreferences.shooting_style.includes('street')) {
        traits.push('ストリート');
        characteristics.push('瞬間の感性');
      }
      if (userPreferences.shooting_style.includes('sports')) {
        traits.push('アクション');
        characteristics.push('動きの追求');
      }
    }

    // 重視項目から性格を推測
    if (userPreferences.priorities) {
      if (userPreferences.priorities.includes('image-quality')) {
        traits.push('画質至上');
        characteristics.push('完璧主義');
      }
      if (userPreferences.priorities.includes('lightweight')) {
        traits.push('軽量化重視');
        characteristics.push('機動性重視');
      }
      if (userPreferences.priorities.includes('waterproof')) {
        traits.push('耐久性重視');
        characteristics.push('冒険心');
      }
    }

    // スワイプ履歴から性格を推測
    if (analysis.likes.length > analysis.dislikes.length) {
      traits.push('積極的');
      characteristics.push('好奇心旺盛');
    } else {
      traits.push('慎重');
      characteristics.push('選択眼が高い');
    }

    // キャラクター名を生成
    const characterName = this.generateCharacterName(traits);
    const characterDescription = this.generateCharacterDescription(characteristics);

    return {
      name: characterName,
      description: characterDescription,
      traits: traits,
      characteristics: characteristics,
      experience_level: userPreferences.experience_level
    };
  }

  // キャラクター名生成（仕様書に合わせて魅力的な名前）
  generateCharacterName(traits) {
    const nameTemplates = {
      '初心者': ['オシャレ探検家', '写真冒険者', 'カメラ探検隊', '撮影冒険家'],
      '中級者': ['技術向上マスター', '写真愛好家', 'カメラマニア', '撮影職人'],
      '上級者': ['プロフォトグラファー', 'カメラマスター', '写真職人', '撮影の達人'],
      'コスト意識': ['賢い選択者', 'コストパフォーマンスマスター', '効率追求者', 'お得探検家'],
      'プレミアム志向': ['プレミアムフォトグラファー', '品質追求者', '高級機愛好家', '贅沢撮影家'],
      '人物重視': ['ポートレートアーティスト', '人物写真家', '表情の探求者', '人を撮る職人'],
      '風景愛好': ['ランドスケープマスター', '自然写真家', '風景の詩人', '自然探検家'],
      'ストリート': ['ストリートフォトグラファー', '街の観察者', '瞬間の記録者', '街の探検家'],
      'アクション': ['アクションハンター', '動きの追求者', 'スポーツ写真家', '躍動感マスター'],
      '画質至上': ['画質マニア', '高解像度追求者', '完璧主義者', '画質の職人'],
      '軽量化重視': ['軽量機愛好家', '機動性重視者', 'コンパクト派', '軽やか撮影家'],
      '耐久性重視': ['冒険写真家', '耐久性重視者', 'アウトドア派', '冒険探検家'],
      '積極的': ['積極的探検家', '好奇心旺盛者', 'チャレンジャー', '冒険心マスター'],
      '慎重': ['慎重な選択者', '選択眼の高い人', 'じっくり派', '熟考探検家']
    };

    // 最も特徴的なトレイトを選択
    const primaryTrait = traits[0] || 'カジュアルフォトグラファー';
    const templates = nameTemplates[primaryTrait] || ['カメラ愛好家'];
    
    // ランダムに選択
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // キャラクター説明生成
  generateCharacterDescription(characteristics) {
    const descriptions = {
      '学習意欲旺盛': '新しい技術や知識を積極的に吸収し、写真の世界を探求するタイプです。',
      '技術向上志向': '常に技術の向上を目指し、より良い写真を撮るための努力を惜しまないタイプです。',
      '専門性重視': '特定の分野に特化し、専門的な知識と技術を追求するタイプです。',
      '効率重視': 'コストパフォーマンスを重視し、効率的な機材選びをするタイプです。',
      '品質重視': '最高品質を追求し、妥協のない機材選びをするタイプです。',
      '実用性重視': 'バランスの取れた選択をし、実用的な機材を選ぶタイプです。',
      '表現力豊か': '被写体の魅力を引き出し、豊かな表現力で写真を撮るタイプです。',
      '自然との調和': '自然の美しさを大切にし、風景との調和を重視するタイプです。',
      '瞬間の感性': '街の瞬間を捉え、感性豊かに写真を撮るタイプです。',
      '動きの追求': '動きのある被写体を捉え、躍動感のある写真を撮るタイプです。',
      '完璧主義': '最高品質を追求し、完璧な写真を目指すタイプです。',
      '機動性重視': '軽量で機動性の高い機材を好み、自由な撮影を楽しむタイプです。',
      '冒険心': 'アウトドアでの撮影を好み、冒険心旺盛なタイプです。',
      '好奇心旺盛': '新しいことに挑戦し、好奇心旺盛に写真を撮るタイプです。',
      '選択眼が高い': '慎重に機材を選び、高い選択眼を持つタイプです。'
    };

    // 主要な特徴から説明を生成
    const primaryCharacteristic = characteristics[0] || 'カメラ愛好家';
    return descriptions[primaryCharacteristic] || 'カメラを通じて世界を記録し、表現することを楽しむタイプです。';
  }

  // レベル別アドバイス生成
  generateLevelAdvice(experienceLevel, traits) {
    const advice = {
      immediate: [],
      long_term: []
    };

    // 経験レベル別の基本アドバイス
    if (experienceLevel === 'beginner') {
      advice.immediate.push('基本の露出（絞り・シャッタースピード・ISO）を理解しましょう');
      advice.immediate.push('構図の基本（三分割法）を練習しましょう');
      advice.long_term.push('撮影技術を向上させるために、定期的に練習を重ねましょう');
    } else if (experienceLevel === 'intermediate') {
      advice.immediate.push('レンズの特性を理解して、表現の幅を広げましょう');
      advice.immediate.push('新しいジャンルに挑戦して、技術を向上させましょう');
      advice.long_term.push('レンズ沼にハマって、より深い知識を身につけましょう');
    } else if (experienceLevel === 'advanced') {
      advice.immediate.push('変態的な機材に手を出して、新しい表現を追求しましょう');
      advice.immediate.push('説得力のある写真で、人を感動させましょう');
      advice.long_term.push('プロとしての技術と感性を磨き続けましょう');
    }

    // トレイト別の追加アドバイス
    if (traits.includes('人物重視')) {
      advice.immediate.push('自然光を活用したポートレート撮影を練習しましょう');
    }
    if (traits.includes('風景愛好')) {
      advice.immediate.push('光の質を観察して、ベストなタイミングを狙ってください');
    }
    if (traits.includes('ストリート')) {
      advice.immediate.push('街の光と影を意識して撮影しましょう');
    }
    if (traits.includes('画質至上')) {
      advice.immediate.push('構図の勉強を深めて、より芸術的な写真を目指しましょう');
    }

    // アドバイス数を制限（即座に実践できるアドバイス2個、長期的アドバイス1個）
    advice.immediate = advice.immediate.slice(0, 2);
    advice.long_term = advice.long_term.slice(0, 1);

    return advice;
  }

  // 診断結果の生成
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

    // レベル別アドバイスを生成
    const advice = this.generateLevelAdvice(userType.experience_level || 'intermediate', userType.traits || []);
    
    console.log('🔍 AI診断結果生成:', {
      userType,
      advice,
      scores,
      likedFeatures,
      dislikedFeatures
    });

    return {
      photographerType: userType,
      scores,
      likedFeatures,
      dislikedFeatures,
      recommendations,
      advice,
      userPreferences
    };
  }

  // 好みの特徴を分析
  analyzeLikedFeatures(likes) {
    const featureCounts = {};
    
    likes.forEach(like => {
      const camera = this.cameraDatabase.find(c => c['カメラ名'] === like.camera_name);
      if (camera) {
        // カメラタイプから特徴を推測
        const cameraType = camera['タイプ（レンズ交換式など）'] || '';
        if (cameraType.includes('一眼レフ')) {
          featureCounts['高画質'] = (featureCounts['高画質'] || 0) + 1;
        }
        if (cameraType.includes('ミラーレス')) {
          featureCounts['軽量'] = (featureCounts['軽量'] || 0) + 1;
        }
        if (cameraType.includes('コンパクト')) {
          featureCounts['携帯性'] = (featureCounts['携帯性'] || 0) + 1;
        }
        if (camera['4K対応']) {
          featureCounts['動画性能'] = (featureCounts['動画性能'] || 0) + 1;
        }
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
      const camera = this.cameraDatabase.find(c => c['カメラ名'] === dislike.camera_name);
      if (camera) {
        // カメラタイプから弱点を推測
        const cameraType = camera['タイプ（レンズ交換式など）'] || '';
        if (cameraType.includes('一眼レフ')) {
          featureCounts['重い'] = (featureCounts['重い'] || 0) + 1;
        }
        if (cameraType.includes('コンパクト')) {
          featureCounts['画質制限'] = (featureCounts['画質制限'] || 0) + 1;
        }
        if (!camera['4K対応']) {
          featureCounts['動画性能不足'] = (featureCounts['動画性能不足'] || 0) + 1;
        }
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
      const camera = this.cameraDatabase.find(c => c['カメラ名'] === like.camera_name);
      if (camera) {
        const cameraType = camera['タイプ（レンズ交換式など）'] || '';
        
        if (feature === 'image_quality' && cameraType.includes('一眼レフ')) {
          score += 10;
        } else if (feature === 'compact' && cameraType.includes('コンパクト')) {
          score += 10;
        } else if (feature === 'video_quality' && camera['4K対応']) {
          score += 10;
        }
      }
    });

    analysis.dislikes.forEach(dislike => {
      const camera = this.cameraDatabase.find(c => c['カメラ名'] === dislike.camera_name);
      if (camera) {
        const cameraType = camera['タイプ（レンズ交換式など）'] || '';
        
        if (feature === 'image_quality' && cameraType.includes('コンパクト')) {
          score += 5;
        } else if (feature === 'compact' && cameraType.includes('一眼レフ')) {
          score += 5;
        } else if (feature === 'video_quality' && !camera['4K対応']) {
          score += 5;
        }
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
      const camera = this.cameraDatabase.find(c => c['カメラ名'] === like.camera_name);
      if (camera) {
        const price = parseInt(camera['新品価格']) || parseInt(camera['中古価格']) || 0;
        if (price <= 100000) { // 10万円以下を予算重視とみなす
          budgetCount++;
        }
      }
    });

    if (totalCount > 0) {
      score = (budgetCount / totalCount) * 100;
    }

    return Math.round(score);
  }

  // おすすめ機材生成
  generateRecommendations(userType, scores, userPreferences) {
    console.log('🔍 おすすめ機材生成開始:', { userType, scores, userPreferences });
    
    const recommendations = {
      primary: null,
      alternatives: [],
      accessories: []
    };

    // データベースから適切なカメラを選定
    const primaryCandidates = this.cameraDatabase
      .filter(camera => {
        // 基本的なフィルタリング
        const hasName = camera['カメラ名'] && camera['カメラ名'].length > 0;
        const hasBrand = camera['メーカー'] && camera['メーカー'].length > 0;
        const hasYear = camera['発売年'] && parseInt(camera['発売年']) >= 2015; // 2015年以降
        
        return hasName && hasBrand && hasYear;
      })
      .map(camera => ({
        brand: camera['メーカー'] || 'ブランド不明',
        name: camera['カメラ名'] || 'カメラ名不明',
        price: parseInt(camera['新品価格']) || parseInt(camera['中古価格']) || 0,
        image: camera['画像URL'] || 'images/cameras/default-camera.svg',
        type: camera['タイプ（レンズ交換式など）'] || '',
        year: camera['発売年'] || '',
        megapixels: camera['画素数'] || '',
        sensor: camera['撮像素子'] || '',
        mount: camera['レンズマウント'] || '',
        features: [
          camera['タイプ（レンズ交換式など）'],
          camera['画素数'] ? `${camera['画素数']}画素` : '',
          camera['撮像素子'] || '',
          camera['4K対応'] || ''
        ].filter(Boolean)
      }))
      .sort((a, b) => b.price - a.price) // 価格の高い順
      .slice(0, 3);

    console.log('📋 候補カメラ:', primaryCandidates);

    if (primaryCandidates.length > 0) {
      recommendations.primary = primaryCandidates[0];
      recommendations.alternatives = primaryCandidates.slice(1);
    }

    // アクセサリー推奨
    recommendations.accessories = this.recommendAccessories(userType, scores);

    console.log('✅ おすすめ機材生成完了:', recommendations);
    return recommendations;
  }

  // ユーザータイプマッチングチェック（簡略化）
  checkUserTypeMatch(camera, userType) {
    // 基本的なマッチングのみ実装
    return true; // デフォルトでマッチ
  }

  // スコアマッチングチェック（簡略化）
  checkScoreMatch(camera, scores) {
    // 基本的なマッチングのみ実装
    return true; // デフォルトでマッチ
  }

  // アクセサリー推奨
  recommendAccessories(userType, scores) {
    const accessories = [];

    // 基本的なアクセサリー推奨
    if (userType.traits && userType.traits.length > 0) {
      if (userType.traits.includes('人物重視')) {
        accessories.push('85mm f/1.4 ポートレートレンズ');
        accessories.push('外付けストロボ');
      } else if (userType.traits.includes('風景愛好')) {
        accessories.push('広角ズームレンズ (16-35mm)');
        accessories.push('軽量三脚');
        accessories.push('NDフィルター・PLフィルター');
      } else if (userType.traits.includes('アクション')) {
        accessories.push('望遠ズームレンズ (70-200mm)');
      }
    }

    // デフォルトアクセサリー
    if (accessories.length === 0) {
      accessories.push('標準ズームレンズ (24-70mm)');
      accessories.push('軽量三脚');
    }

    return accessories;
  }
}

// グローバルインスタンス
window.cameraPickerAI = new CameraPickerAI();
