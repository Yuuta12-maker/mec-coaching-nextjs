# Firebase 移行ガイド

## 目的

このガイドでは、PostgreSQLデータベースからFirebase（Firestore）への移行手順について説明します。領収書自動生成機能などのデータの保存と取得をFirebaseを通じて行うよう変更しました。

## インストール手順

以下のコマンドを実行して、必要なFirebaseパッケージをインストールします：

```bash
npm install firebase
```

## Firebase プロジェクト設定

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名に「mec-coaching-app」と入力し、続行
4. Googleアナリティクスの設定を選択（オプション）し、プロジェクトを作成
5. プロジェクトが作成されたら、Webアプリを追加（「</>」アイコンをクリック）
6. アプリのニックネームを「mec-coaching-nextjs」として登録
7. 表示された設定情報をコピーして、`.env.local`と`.env`ファイルに追加します

## 環境変数の設定

`.env.local`および`.env`ファイルに以下の環境変数を追加してください：

```
# Firebaseの設定情報（Firebaseコンソールからコピー）
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# メール送信設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mindengineeringcoaching@gmail.com
SMTP_PASSWORD=  # Gmailのアプリパスワードを設定
EMAIL_SENDER=mindengineeringcoaching@gmail.com
EMAIL_SENDER_NAME=マインドエンジニアリング・コーチング

# 認証情報
NEXTAUTH_SECRET=  # 適切なシークレットを設定
NEXTAUTH_URL=  # 本番環境URLまたはhttp://localhost:3000
```

## Firebaseの初期化

Firebaseの初期化は、アプリケーションの起動時に自動的に行われます。また、初期セットアップを手動で行うには、以下のAPIエンドポイントを呼び出します：

```
POST /api/init-firebase
```

これにより、必要なコレクションとドキュメントが作成されます。

## 変更点

### 主要なディレクトリ構造

```
/lib
  /firebase.js         - Firebase初期化
  /firebase
    /clients.js        - クライアントデータ管理
    /sessions.js       - セッションデータ管理
    /receipts.js       - 領収書データ管理
    /emailLogs.js      - メールログデータ管理
    /init.js           - Firestore初期化
```

### APIエンドポイントの変更

1. `/api/clients/*` - クライアント管理API
2. `/api/receipts/*` - 領収書関連API
3. `/api/sessions/*` - セッション管理API

### 領収書自動生成機能

領収書自動生成機能は以下のAPIエンドポイントを使用します：

1. `/api/receipts/generate-pdf` - PDF生成
2. `/api/receipts/generate-preview` - プレビュー生成
3. `/api/receipts/save-record` - 領収書データ保存
4. `/api/receipts/send-email` - メール送信

## Firebase Indexesとセキュリティルール

`firestore.indexes.json`と`firestore.rules`ファイルが作成されています。これらは、Firebaseコンソールでの設定や、Firebase CLIを使用してデプロイできます：

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules,firestore:indexes
```

## Vercel環境設定

Vercelにデプロイする場合は、Vercelダッシュボードで以下の環境変数を設定してください：

1. 「Settings」→「Environment Variables」を開く
2. 上記の環境変数を追加する
3. プロジェクトを再デプロイする

## 注意事項

1. Firebase Authentication は使用せず、NextAuth.jsによる認証を継続して使用しています
2. 本番環境では、適切なFirebase料金プランを選択してください
3. Firestoreのセキュリティルールは、必要に応じて調整してください
