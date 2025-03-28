// Prismaスタブ実装
// 現在はGoogle Sheets APIを使用しており、Prismaはシンプルな実装に置き換えています

// ダミーPrismaクライアント
const dummyPrismaClient = {
  // 汎用的なメソッド
  receipt: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data) => data.data,
    update: async (data) => data.data,
    delete: async () => ({}),
  },
  client: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data) => data.data,
    update: async (data) => data.data,
    delete: async () => ({}),
  },
  session: {
    findUnique: async () => null,
    findMany: async () => [],
    create: async (data) => data.data,
    update: async (data) => data.data,
    delete: async () => ({}),
  },
  // 他にも必要なモデルがあれば追加
};

// 実際にはGoogle Sheets APIなどを使用
// この実装は現在の機能を損なわずにビルドを通すための対応
export default dummyPrismaClient;