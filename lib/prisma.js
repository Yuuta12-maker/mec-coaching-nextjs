import { PrismaClient } from '@prisma/client';

// PrismaClient インスタンスをグローバルに保存して再利用
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // 開発環境では同じPrismaClientインスタンスを再利用
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;