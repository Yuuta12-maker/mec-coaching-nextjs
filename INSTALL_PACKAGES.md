# 領収書自動生成機能のための追加パッケージ

以下のコマンドを実行して、必要なパッケージをインストールしてください。

```bash
npm install prisma @prisma/client sharp nodemailer formidable axios antd nanoid
npm install -D @prisma/client
```

## パッケージの説明

- **prisma**: データベース操作のためのORM
- **@prisma/client**: Prismaクライアントのランタイム
- **sharp**: 画像処理（PDFプレビュー生成に使用）
- **nodemailer**: メール送信機能
- **formidable**: マルチパートフォームデータの解析（PDF添付など）
- **axios**: HTTPリクエスト用クライアント
- **antd**: Ant Design UIコンポーネントライブラリ
- **nanoid**: ID生成ユーティリティ

## Prismaの初期設定

パッケージをインストールした後、以下のコマンドでPrismaを初期化してください。

```bash
npx prisma db push
```

これにより、`prisma/schema.prisma`で定義されたデータベースのテーブルが作成されます。

## 環境変数の設定

`.env.local`ファイルに以下の環境変数を追加してください。

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

必要に応じて値を変更してください。
