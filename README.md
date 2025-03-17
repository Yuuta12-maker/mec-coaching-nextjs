# マインドエンジニアリング・コーチング管理システム（Next.js版）

マインドエンジニアリング・コーチング業務管理のためのウェブアプリケーションです。Next.jsとGoogle Sheets APIを使用し、クライアント管理、セッション予約、支払い記録などの機能を提供します。

## 機能

- ユーザー認証（Google認証）
- ダッシュボード（今日のセッション、クライアント状況）
- クライアント管理（一覧表示、詳細表示、編集）
- セッション管理（予約、詳細表示、編集）
- 支払い管理（記録、入金確認）
- Google Sheets との連携（データストア）
- Google Meet リンクの自動生成
- Google Calendar との連携
- レスポンシブデザイン（スマートフォン・PC対応）

## 技術スタック

- **フロントエンド**: Next.js、React、Tailwind CSS
- **認証**: NextAuth.js（Google OAuth）
- **データストア**: Google Sheets API
- **API連携**: Google Calendar API、Gmail API
- **デプロイ**: Vercel

## 環境のセットアップ

### 前提条件

- Node.js 14.x 以上
- npm または yarn
- Google Cloud Platformのアカウント

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/Yuuta12-maker/mec-coaching-nextjs.git
cd mec-coaching-nextjs
```

2. 依存パッケージをインストール
```bash
npm install
# または
yarn install
```

3. 環境変数の設定
`.env.example` ファイルを `.env.local` としてコピーし、必要な環境変数を設定します。

```bash
cp .env.example .env.local
```

4. Google Cloud Platformの設定
   - プロジェクトを作成
   - 必要なAPIを有効化（Google Sheets API、Google Calendar API、Gmail API）
   - OAuthクライアントの設定
   - サービスアカウントの作成とキーのダウンロード

5. 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
```

6. ブラウザでアクセス: [http://localhost:3000](http://localhost:3000)

## デプロイ

Vercelへのデプロイは以下の手順で行います：

1. [Vercel](https://vercel.com) でアカウント作成（またはログイン）
2. 「New Project」をクリック
3. GitHub連携を設定し、このリポジトリを選択
4. 環境変数を設定
5. 「Deploy」をクリック

## プロジェクト構造

```
mec-coaching-nextjs/
├── components/       # 再利用可能なUIコンポーネント
├── lib/              # 共通ライブラリ
├── pages/            # ページコンポーネント
│   ├── api/          # APIエンドポイント
│   └── auth/         # 認証関連ページ
├── public/           # 静的ファイル
└── styles/           # スタイルシート
```

## ライセンス

このプロジェクトはプライベートであり、森山雄太の許可なく再配布・使用することはできません。

Copyright © 2025 マインドエンジニアリング・コーチング. All rights reserved.