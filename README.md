# マインドエンジニアリング・コーチング管理システム（Next.js版）

マインドエンジニアリング・コーチング業務管理のためのウェブアプリケーションです。Next.jsとGoogle Sheets APIを使用し、クライアント管理、セッション予約、支払い記録などの機能を提供します。

## 実装状況（2025年3月19日現在）

### 完了した機能
- ✅ ダッシュボード（今日のセッション、クライアント状況の概要表示）
- ✅ クライアント一覧表示と検索・フィルタリング
- ✅ クライアント詳細表示と編集機能
- ✅ クライアントの支払い履歴とセッション履歴表示
- ✅ セッション一覧表示（リスト形式とカレンダー形式）
- ✅ セッション詳細表示と編集機能
- ✅ 新規セッション登録機能
- ✅ Google Meet URLの自動生成

### 進行中の機能
- 🚧 支払い管理（記録、入金確認）
- 🚧 Google Calendar との連携

### 未実装の機能
- 📝 セッションリマインダーメール送信機能
- 📝 セッション分析・レポート機能
- 📝 請求書自動生成

## 機能詳細

### クライアント管理
- クライアント情報の一覧表示、検索、フィルタリング
- クライアント詳細情報の表示と編集
- クライアントごとのセッション履歴表示
- クライアントごとの支払い履歴表示

### セッション管理
- セッション一覧のリスト表示とカレンダー表示
- セッション詳細表示と編集
- ステータス管理（予定、実施済み、キャンセル）
- 新規セッション登録（クライアント選択、日時指定など）
- GoogleMeetリンクの自動生成

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
│   ├── clients/      # クライアント関連コンポーネント
│   └── sessions/     # セッション関連コンポーネント
├── lib/              # 共通ライブラリ
├── pages/            # ページコンポーネント
│   ├── api/          # APIエンドポイント
│   ├── auth/         # 認証関連ページ
│   ├── clients/      # クライアント関連ページ
│   └── sessions/     # セッション関連ページ
├── public/           # 静的ファイル
└── styles/           # スタイルシート
```

## 次のマイルストーン

1. 支払い管理機能の完全実装
2. セッションリマインダーメール送信機能
3. Google Calendarとの完全連携
4. モバイル操作性の向上

## 最近の更新（2025年3月19日）

- コードの最適化とバグ修正
- 正規表現のエスケープ処理を修正
- JSXでのエンティティエスケープを修正

## ライセンス

このプロジェクトはプライベートであり、森山雄太の許可なく再配布・使用することはできません。

Copyright © 2025 マインドエンジニアリング・コーチング. All rights reserved.