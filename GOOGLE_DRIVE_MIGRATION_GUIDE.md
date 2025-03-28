# Google Drive移行ガイド

このドキュメントでは、マインドエンジニアリング・コーチング管理システムをFirebaseからGoogle Driveに移行するための手順を説明します。

## 概要

Firebase依存を取り除き、JSONファイルをGoogle Driveに直接保存する方式に移行します。これにより、データベース管理の複雑さを排除し、Google Driveの利便性（自動バックアップ、共有機能など）を活用できます。

## 前提条件

- Google アカウント
- Google Cloud Platform のプロジェクト作成権限
- Node.js と npm がインストールされている環境

## 1. Google Cloud Platform の設定

### 1.1 プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「新しいプロジェクト」を選択（右上のプロジェクト選択から）
3. プロジェクト名を「mec-coaching-system」などに設定して作成

### 1.2 Google Drive API の有効化

1. 左側メニューから「APIとサービス」→「ライブラリ」を選択
2. 検索バーに「Drive」と入力し、「Google Drive API」を選択
3. 「有効にする」ボタンをクリック

### 1.3 サービスアカウントの作成

1. 左側メニューから「IAMと管理」→「サービスアカウント」を選択
2. 「サービスアカウントを作成」をクリック
3. 以下の情報を入力:
   - サービスアカウント名: mec-receipts-service
   - サービスアカウントID: mec-receipts-service
   - 説明: MECアプリケーション用サービスアカウント
4. 「作成して続行」をクリック
5. 「ロールを選択」で「基本」→「編集者」を選択（Drive File作成権限のため）
6. 「完了」をクリック

### 1.4 サービスアカウントキーの作成

1. 作成したサービスアカウントの行でアクション（︙）をクリック
2. 「鍵を管理」を選択
3. 「鍵を追加」→「新しい鍵を作成」をクリック
4. 「JSON」を選択して「作成」をクリック
5. JSONキーファイルがダウンロードされます。安全に保管してください！

## 2. Google Drive のフォルダ設定

### 2.1 フォルダ作成

1. [Google Drive](https://drive.google.com/)にアクセス
2. 以下のフォルダ構造を作成:
   - MEC管理システム（親フォルダ）
     - 領収書データ
     - クライアントデータ
     - セッションデータ
     - 支払いデータ
     - メールログ

### 2.2 フォルダIDの取得

各フォルダのIDを取得します:

1. フォルダを開く
2. URLをチェック: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. `FOLDER_ID_HERE` の部分がフォルダIDです

### 2.3 サービスアカウントとの共有

各フォルダをサービスアカウントと共有:

1. フォルダを右クリック→「共有」を選択
2. サービスアカウントのメールアドレス（`xxx@xxx.iam.gserviceaccount.com`）を入力
3. 権限は「編集者」に設定
4. 「通知を送信」のチェックを外す
5. 「共有」をクリック

## 3. アプリケーションの設定

### 3.1 環境変数の設定

`.env.local` ファイルに以下の環境変数を追加:

```
# Google Drive API設定
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...} # JSONキーファイルの内容をここに貼り付け

# Google Driveフォルダ設定
GOOGLE_DRIVE_RECEIPTS_FOLDER_ID=your-receipts-folder-id
GOOGLE_DRIVE_CLIENTS_FOLDER_ID=your-clients-folder-id
GOOGLE_DRIVE_SESSIONS_FOLDER_ID=your-sessions-folder-id
GOOGLE_DRIVE_PAYMENTS_FOLDER_ID=your-payments-folder-id
GOOGLE_DRIVE_EMAIL_LOGS_FOLDER_ID=your-email-logs-folder-id
```

注意: JSONキーをそのまま貼り付けますが、フォーマットを崩さないようにしてください。全体を1行にする必要があります。

### 3.2 依存パッケージの確認

必要なパッケージが含まれているか確認:

```bash
npm install googleapis@128.0.0 nanoid@5.1.5
```

## 4. アプリケーションの実行

セットアップが完了したら、アプリケーションを起動:

```bash
npm run dev
```

## 5. 移行検証

以下の機能を検証して、正常に動作することを確認:

1. 領収書の作成・表示・編集・削除
2. メール送信
3. その他のGoogle Drive API関連機能

## 6. データ移行（既存データがある場合）

既存のFirebaseデータをGoogle Driveに移行する場合:

### 6.1 Firebase データのエクスポート

Firebaseコンソールからデータをエクスポートするか、API経由でJSONとして取得します。

### 6.2 Google Drive へのインポート

エクスポートしたデータをGoogle Driveの適切なフォルダにJSONファイルとしてアップロードします。

### 6.3 移行スクリプト（オプション）

より複雑な移行が必要な場合は、専用のスクリプトを作成することも検討してください。

## トラブルシューティング

### 認証エラー

- JSONキーファイルの形式が正しいか確認
- サービスアカウントに適切な権限があるか確認
- フォルダがサービスアカウントと共有されているか確認

### ファイルアクセスエラー

- フォルダIDが正しいか確認
- サービスアカウントにフォルダへのアクセス権があるか確認

### その他の問題

- コンソールログをチェック
- Googleの使用制限（クォータ）を超えていないか確認

## 結論

Firebase依存をGoogle Driveに移行することで、データ管理が簡素化され、Google Driveの強力な共有・バックアップ機能を活用できるようになります。小〜中規模のアプリケーションでは、この方法が効率的かつコスト効果の高いソリューションとなります。
