// ダミー実装: ビルドエラー回避用
export const getClients = async () => [];
export const getClientById = async () => null;
export const createClient = async (data) => ({ id: 'dummy-id', ...data });
export const updateClient = async (id, data) => ({ id, ...data });
export const deleteClient = async () => ({ success: true });