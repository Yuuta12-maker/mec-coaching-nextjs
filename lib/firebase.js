// このファイルはFirebaseからGoogle Driveへの移行時に
// ビルドエラーを回避するためのダミー実装です

import { dummyFirebase } from './googleDrive';

// ダミーのFirebaseインスタンス
const app = dummyFirebase.app || {};
const db = dummyFirebase.db || {};
const auth = dummyFirebase.auth || {};

export { app, db, auth };
