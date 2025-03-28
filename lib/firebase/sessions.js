// ダミー実装: ビルドエラー回避用
export const getSessions = async () => [];
export const getSessionById = async () => null;
export const createSession = async (data) => ({ id: 'dummy-id', ...data });
export const updateSession = async (id, data) => ({ id, ...data });
export const deleteSession = async () => ({ success: true });