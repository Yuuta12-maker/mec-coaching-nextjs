# デプロイ手順

このドキュメントでは、マインドエンジニアリング・コーチングアプリケーションをFirebase（Firestore）とVercelを使用してデプロイする手順を説明します。

## 前提条件

1. Googleアカウント
2. Firebaseプロジェクト
3. Vercelアカウント
4. GitHubリポジトリ

## 1. Firebaseプロジェクトの設定

### 1.1. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名に「mec-coaching-app」を入力
4. Googleアナリティクスを有効にするかどうかを選択（任意）
5. 「プロジェクトを作成」をクリック
6. プロジェクトが作成されるまで待機

### 1.2. Firestoreデータベースの設定

1. 左側のメニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 「本番環境モード」を選択して「次へ」
4. リージョンを「asia-northeast1」（東京）を選択
5. 「有効にする」をクリック
6. データベースが作成されるまで待機

### 1.3. Webアプリの登録

1. プロジェクトのホーム画面で「