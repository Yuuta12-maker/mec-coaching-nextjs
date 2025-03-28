# マインドエンジニアリング・コーチング - 領収書自動生成機能

このドキュメントでは、マインドエンジニアリング・コーチング管理システムに追加された領収書自動生成機能の概要と使用方法について説明します。

## 機能概要

1. **領収書の自動生成**
   - コーポレートカラー(#c50502)を使用した美しいPDFフォーマット
   - トライアルセッション(6,000円)、継続セッション(214,000円)など自動計算
   - クライアント情報との連携
   - 社名、住所など詳細情報の設定

2. **プレビュー機能**
   - 領収書発行前の確認
   - リアルタイムプレビュー

3. **メール送信機能**
   - PDF添付による自動メール送信
   - カスタムテンプレートメール

4. **管理機能**
   - 発行済み領収書の一覧表示・検索・フィルタリング
   - 編集・再発行・削除

## セットアップ手順

### 1. 必要パッケージのインストール

```bash
npm install prisma @prisma/client sharp nodemailer formidable axios antd nanoid
npm install -D @prisma/client
```

### 2. Prismaのセットアップ

```bash
npx prisma db push
```

### 3. 環境変数の設定

`.env.local`ファイルに以下を追加:

```
# データベース接続情報
DATABASE_URL="postgresql://username:password@localhost:5432/mec_coaching"

# メール送信設定
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_SENDER=your-email@example.com
EMAIL_SENDER_NAME=MEC Coaching
```

## 使用方法

### 領収書の作成

1. 管理画面の「領収書」メニューをクリック
2. 「新規作成」ボタンをクリック
3. 必要情報を入力（クライアント選択で自動入力も可能）
4. 「PDF生成」ボタンをクリック
5. 「PDFをダウンロード」または「メールで送信」をクリック

### 領収書の管理

- 一覧画面で検索、フィルタリング
- 編集、削除、再発行が可能
- メール送信履歴の確認

## 技術仕様

- **フロントエンド**: React, Tailwind CSS, Ant Design
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL (Prisma ORM)
- **PDF生成**: pdf-lib
- **メール送信**: Nodemailer

## カスタマイズ

### 領収書テンプレートの変更

`pages/api/receipts/generate-pdf.js`と`pages/api/receipts/generate-preview.js`の内容を編集することで、領収書のデザインを変更できます。

### メールテンプレートの変更

`pages/api/receipts/send-email.js`と`pages/api/receipts/send-email/[id].js`の内容を編集することで、メールのデザインを変更できます。

## トラブルシューティング

**問題**: PDF生成に失敗する  
**解決策**: `sharp`パッケージが正しくインストールされているか確認してください。

**問題**: メール送信に失敗する  
**解決策**: 環境変数の設定が正しいか確認してください。特にSMTPの認証情報を確認してください。

**問題**: プレビューが表示されない  
**解決策**: ブラウザのコンソールでエラーを確認し、APIエンドポイントが正しく動作しているか確認してください。