# Google Drive 統合セットアップガイド

このドキュメントでは、マインドエンジニアリング・コーチング管理システムをGoogle Driveと統合して、領収書データをJSONファイルとして保存する方法について説明します。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 画面上部のプロジェクト選択ドロップダウンをクリック
3. 「新しいプロジェクト」を選択
4. プロジェクト名として「mec-coaching-system」を入力
5. 「作成」をクリック

### 1.2 Google Drive APIの有効化

1. 左側のナビゲーションメニューから「APIとサービス」→「ライブラリ」を選択
2. 検索ボックスに「Drive」と入力
3. 「Google Drive API」をクリック
4. 「有効にする」ボタンをクリック

### 1.3 サービスアカウントの作成

1. 左側のナビゲーションメニューから「IAMと管理」→「サービスアカウント」を選択
2. 「サービスアカウントを作成」ボタンをクリック
3. サービスアカウント名:「mec-receipts-service」
4. サービスアカウントの説明:「MEC領収書管理用サービスアカウント」
5. 「作成して続行」をクリック
6. 「役割」で「Drive File作成者」を選択
7. 「完了」をクリック

### 1.4 サービスアカウントキーの作成

1. 作成したサービスアカウントの行で右側の「アクション」メニュー（3つの点）をクリック
2. 「鍵を管理」を選択
3. 「鍵を追加」→「新しい鍵を作成」を選択
4. キーのタイプとして「JSON」を選択
5. 「作成」をクリックすると、JSONキーファイルがダウンロードされます

## 2. Google Drive側の設定

### 2.1 領収書保存用フォルダの作成

1. [Google Drive](https://drive.google.com/)にアクセス
2. 「新規」→「フォルダ」をクリック
3. フォルダ名として「MEC領収書データ」を入力
4. 「作成」をクリック

### 2.2 フォルダIDの取得

1. 作成したフォルダを開きます
2. URLを確認します。以下のような形式になっています：
   `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. `FOLDER_ID_HERE`の部分がフォルダIDです。このIDをコピーします。

### 2.3 サービスアカウントとの共有設定

1. フォルダを右クリックして「共有」を選択
2. サービスアカウントのメールアドレス（`mec-receipts-service@your-project-id.iam.gserviceaccount.com`）を入力
3. 権限を「編集者」に設定
4. 「通知を送信」のチェックを外す
5. 「共有」をクリック

## 3. アプリケーションの設定

### 3.1 環境変数の設定

`.env.local`ファイルに以下の環境変数を追加します：

```
# Google Drive API（領収書システム用）
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...} # JSONファイルの内容をここに貼り付け

# 領収書保存用のGoogle DriveフォルダID
GOOGLE_DRIVE_RECEIPTS_FOLDER_ID=your-folder-id-here
```

ダウンロードしたJSONキーファイルの内容全体を`GOOGLE_SERVICE_ACCOUNT_KEY`の値として設定します。改行を含む形式になっているので、すべての改行を削除して1行のJSONにして貼り付けます。

### 3.2 依存パッケージのインストール

アプリケーションが必要なパッケージを持っているか確認します。もし不足している場合は以下のコマンドでインストールします：

```bash
npm install googleapis
```

## 4. 動作確認

1. アプリケーションを再起動します：
   ```bash
   npm run dev
   ```

2. 以下のエンドポイントがGoogleDriveヘルパーを使用して正しく動作することを確認します：
   - `/api/receipts` (GET): 全ての領収書を取得
   - `/api/receipts/save-record` (POST): 新しい領収書を保存
   - `/api/receipts/[id]` (GET/PUT/DELETE): 特定の領収書の取得/更新/削除

3. 管理画面の領収書セクションにアクセスし、領収書の作成、表示、編集、削除の機能が正常に動作することを確認します。

## 5. トラブルシューティング

### 5.1 認証エラー

- サービスアカウントのJSONキーが正しく設定されているか確認します
- サービスアカウントにフォルダへのアクセス権が付与されているか確認します

### 5.2 ファイル操作エラー

- フォルダIDが正しく設定されているか確認します
- サービスアカウントに適切な権限（Drive File作成者）が付与されているか確認します

### 5.3 コンソールでのデバッグ

- サーバーコンソールでエラーメッセージを確認します
- `googleDrive.js`の各関数に`console.log`を追加して詳細なデバッグ情報を出力します

## 6. バックアップと復元

Google Drive上のデータは自動的にGoogleによってバックアップされますが、手動でのエクスポート機能を実装することもできます。

### 6.1 手動バックアップ

全ての領収書データをエクスポートするエンドポイントを作成することを検討します：

```javascript
// /api/receipts/export
export default async function handler(req, res) {
  try {
    const allReceipts = await getAllReceiptsData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=mec-receipts-backup.json');
    res.status(200).json(allReceipts);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
}
```

### 6.2 データの復元

バックアップしたJSONファイルからデータを復元する機能も必要に応じて実装します。

## 7. 注意事項

- サービスアカウントのJSONキーは機密情報です。`.env.local`ファイルを安全に管理し、リポジトリにコミットしないようにしてください。
- 本番環境では環境変数はVercelのダッシュボードなど、安全な場所で管理してください。
- Google Drive APIには使用制限（クォータ）があります。大量のリクエストを行う場合は注意が必要です。
