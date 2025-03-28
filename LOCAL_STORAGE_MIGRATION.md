# ローカルストレージ方式への移行ガイド

このドキュメントでは、マインドエンジニアリング・コーチング管理システムの領収書機能を「ローカル保存方式」に移行する手順について説明します。

## 概要

Firebase/Google Driveからローカルストレージ方式に移行することで、以下のメリットが得られます：

- **シンプルな構成**: クラウドストレージやデータベースに依存しない
- **パフォーマンス向上**: API通信の削減によりレスポンスが向上
- **セキュリティ向上**: PDFはローカルにのみ保存され、クラウド上に保持されない
- **依存関係の削減**: Firebaseなどの外部サービスへの依存がなくなる
- **コスト削減**: クラウドストレージや追加APIのコストが不要

## 実装の変更点

### 1. 領収書PDFの生成・保存フロー

**変更前:**
1. フォーム入力
2. PDFを生成
3. PDFとメタデータをFirebase/Google Driveに保存
4. ブラウザでダウンロード

**変更後:**
1. フォーム入力
2. PDFを生成
3. メタデータのみをGoogle Sheetsに保存
4. PDFをブラウザで直接ダウンロード
5. メール送信（オプション）

### 2. 変更されたファイル

- `components/receipts/ReceiptGenerator.js`: クライアント側で直接PDFを保存するよう修正
- `pages/api/receipts/save-metadata.js`: PDFはストレージに保存せず、メタデータのみをGoogle Sheetsに保存
- `pages/api/receipts/send-email.js`: メール送信後のログをFirebaseではなくGoogle Sheetsに記録

### 3. 削除されたファイル

- `lib/firebase.js`
- `lib/firebase/*` (すべてのFirebase関連ファイル)
- `lib/googleDrive.js`
- `pages/api/receipts/save-record.js` (メタデータ保存用の新しいAPIに置き換え)

## セットアップ手順

### 1. 環境変数の設定

`.env.local` ファイルに以下の環境変数が必要です：

```
# Google Sheets API
SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...} # JSONキーファイルの内容をここに貼り付け

# メール送信設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=mindengineeringcoaching@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_SENDER=mindengineeringcoaching@gmail.com
EMAIL_SENDER_NAME=マインドエンジニアリング・コーチング

# NextAuth認証設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. Google Sheetsの設定

領収書管理用に以下のシートを作成します：

#### 領収書管理シート
以下のヘッダー行を設定：
- id
- receiptNumber
- issueDate
- recipientName
- recipientAddress
- email
- description
- amount
- taxRate
- paymentMethod
- issuerName
- clientId
- createdBy
- createdAt

#### メールログシート
以下のヘッダー行を設定：
- id
- type
- sendDate
- recipientEmail
- recipientName
- subject
- status
- relatedId
- receiptNumber
- createdBy

### 3. 依存パッケージの整理

Firebase関連の依存パッケージを削除します：

```bash
npm uninstall firebase
```

### 4. アプリケーションの実行

セットアップが完了したら、アプリケーションを起動：

```bash
npm run dev
```

## 移行時の注意点

### 既存データについて

既存のFirebaseやGoogle Driveに保存されているデータは移行されません。必要な場合は以下の手順で移行してください：

1. 既存データのエクスポート
2. エクスポートしたデータからメタデータだけをGoogle Sheetsにインポート
3. 過去の領収書PDFは別途保管

### ユーザー操作の変更点

ユーザーは以下の点に注意する必要があります：

- 領収書PDFはブラウザで直接ダウンロードされるため、適切に保存する必要があります
- 領収書作成時には毎回「PDF生成と保存」ボタンをクリックする必要があります
- PDFの保存先はユーザーが自身で管理します

## トラブルシューティング

### PDFが生成されない場合

- ブラウザのダウンロード設定を確認
- コンソールログでエラーを確認
- 一時ファイルのパーミッションを確認

### Google Sheetsにデータが保存されない場合

- 環境変数が正しく設定されているか確認
- サービスアカウントの権限を確認
- シートの構造が正しいか確認

## 結論

ローカルストレージ方式への移行により、領収書機能がよりシンプルで信頼性の高いものになります。クラウド依存のない設計により、将来的な外部サービスの変更に影響されにくい構成になりました。
