// ダミーのFirebaseインスタンス
const app = {};
const db = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: false,
        data: () => ({}),
      }),
      set: async () => ({}),
    }),
    add: async () => ({ id: 'dummy-id' })
  })
};
const auth = {};

export { app, db, auth };