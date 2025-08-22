# Camera Picker Backend Server

Camera PickerのバックエンドAPIサーバーです。GPT APIを安全に処理し、フロントエンドにアドバイスを提供します。

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
cd server
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の内容を設定してください：

```env
# OpenAI API設定
OPENAI_API_KEY=sk-your-openai-api-key-here

# サーバー設定
PORT=3000

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:5000
```

### 3. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/api-keys)にアクセス
2. アカウントを作成またはログイン
3. APIキーを生成
4. `.env`ファイルに設定

### 4. サーバーの起動

```bash
# 開発モード（自動再起動）
npm run dev

# 本番モード
npm start
```

サーバーが起動すると、以下のメッセージが表示されます：
```
🚀 サーバーが起動しました: http://localhost:3000
📝 APIキー設定状況: ✅ 設定済み
```

## 🔧 API エンドポイント

### ヘルスチェック
```
GET /api/health
```

### GPTアドバイス生成
```
POST /api/generate-advice
Content-Type: application/json

{
  "diagnosisData": {
    "photographerType": {...},
    "scores": {...},
    "likedFeatures": [...],
    "dislikedFeatures": [...],
    "userPreferences": {...}
  }
}
```

## 🔒 セキュリティ

- APIキーは環境変数で管理
- CORS設定でフロントエンドからのアクセスのみ許可
- エラーハンドリングでフォールバック機能を提供

## 🛠️ 開発

### ファイル構成
```
server/
├── app.js          # メインサーバーファイル
├── package.json    # 依存関係
├── env.example     # 環境変数設定例
└── README.md       # このファイル
```

### ログ
サーバーの動作状況はコンソールに出力されます：
- サーバー起動状況
- APIキー設定状況
- リクエスト処理状況
- エラー情報

## 🚀 デプロイ

### Heroku
```bash
# Heroku CLIでログイン
heroku login

# アプリを作成
heroku create your-app-name

# 環境変数を設定
heroku config:set OPENAI_API_KEY=your-api-key
heroku config:set FRONTEND_URL=https://your-frontend-url.com

# デプロイ
git push heroku main
```

### Vercel
```bash
# Vercel CLIでログイン
vercel login

# デプロイ
vercel
```

## 🔧 トラブルシューティング

### サーバーが起動しない
- Node.js 16以上がインストールされているか確認
- 依存関係が正しくインストールされているか確認
- ポート3000が使用されていないか確認

### APIキーエラー
- `.env`ファイルが正しく設定されているか確認
- APIキーが有効か確認
- OpenAIの利用制限に達していないか確認

### CORSエラー
- `FRONTEND_URL`が正しく設定されているか確認
- フロントエンドのURLが許可されているか確認


