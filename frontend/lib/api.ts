import axios from 'axios';

// 动态获取 API URL，保持与前端访问域名一致
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // 客户端：使用当前访问的 hostname
    const host = window.location.hostname;
    return `http://${host}:13001/api`;
  }
  // 服务端：默认使用 localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:13001/api';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加 JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authApi = {
  register: (email: string, username: string, password: string, nickname: string) =>
    api.post('/auth/register', { email, username, password, nickname }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// 钱包 API
export const walletApi = {
  getBalance: () => api.get('/wallets/balance'),
  deposit: (amount: number, description?: string) =>
    api.post('/wallets/deposit', { amount, description }),
  withdraw: (amount: number, address: string) =>
    api.post('/wallets/withdraw', { amount, address }),
  getTransactions: () => api.get('/wallets/transactions'),
};

// 物品 API
export const itemsApi = {
  getAll: (params?: {
    skip?: number;
    take?: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => api.get('/items', { params }),

  getOne: (id: string) => api.get(`/items/${id}`),
  create: (data: {
    title: string;
    description: string;
    images: string[];
    price: number;
    category: string;
    location?: string;
    serialNumber?: string;
  }) => api.post('/items', data),
  getMyItems: () => api.get('/items/my'),
  approve: (id: string) => api.post(`/items/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/items/${id}/reject`, { reason }),
  delete: (id: string) => api.delete(`/items/${id}`),
};

// 订单 API
export const ordersApi = {
  create: (itemId: string) => api.post('/orders', { itemId }),
  pay: (orderId: string) => api.post(`/orders/${orderId}/pay`),
  ship: (orderId: string, logisticsCompany: string, trackingNumber: string) =>
    api.post(`/orders/${orderId}/ship`, { logisticsCompany, trackingNumber }),
  confirm: (orderId: string) => api.post(`/orders/${orderId}/confirm`),
  cancel: (orderId: string) => api.post(`/orders/${orderId}/cancel`),
  dispute: (orderId: string, reason: string) =>
    api.post(`/orders/${orderId}/dispute`, { reason }),
  resolve: (orderId: string, refund: boolean) =>
    api.post(`/orders/${orderId}/resolve`, { refund }),
  getMyBuyOrders: () => api.get('/orders/my/buy'),
  getMySellOrders: () => api.get('/orders/my/sell'),
  getOne: (orderId: string) => api.get(`/orders/${orderId}`),
};

// 评价 API
export const reviewsApi = {
  create: (orderId: string, rating: number, comment?: string) =>
    api.post('/reviews', { orderId, rating, comment }),
};

// 用户 API
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: { nickname?: string; bio?: string; avatar?: string }) =>
    api.put('/users/me', data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/users/me/password', { oldPassword, newPassword }),
  getMyItems: () => api.get('/users/me/items'),
  getMyReviews: () => api.get('/users/me/reviews'),
  getPublicProfile: (userId: string) => api.get(`/users/${userId}/public`),
  getUserItems: (userId: string) => api.get(`/users/${userId}/items`),
  getUserReviews: (userId: string) => api.get(`/users/${userId}/reviews`),
};

// 管理后台 API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getOrders: (status?: string) => api.get('/admin/orders', { params: { status } }),
  getDisputedOrders: () => api.get('/admin/orders/disputed'),
  getUsers: () => api.get('/admin/users'),
  setUserRole: (userId: string, role: 'USER' | 'ADMIN') => api.put(`/admin/users/${userId}/role`, { role }),
  setUserReputation: (userId: string, reputation: number) => api.put(`/admin/users/${userId}/reputation`, { reputation }),
  getItemStats: () => api.get('/admin/items/stats'),
  getTransactions: () => api.get('/admin/transactions'),
};

// TRON充值 API
export const tronApi = {
  getDepositAddress: () => api.get('/tron/deposit-address'),
  setDepositAddress: (address: string) => api.post('/tron/deposit-address', { address }),
  getDepositBalance: () => api.get('/tron/deposit-balance'),
};

// 区块链多链 API
export const blockchainApi = {
  // 获取支持的网络和代币
  getNetworks: () => api.get('/blockchain/networks'),

  // 获取指定网络的代币列表
  getTokens: (network: string) => api.get(`/blockchain/networks/${network}/tokens`),

  // 获取链上余额
  getBalance: (address: string, network: string, token: string) =>
    api.get(`/blockchain/balance`, { params: { address, network, token } }),

  // 验证地址
  validateAddress: (address: string, network: string) =>
    api.post(`/blockchain/validate-address`, { address, network }),

  // 获取或设置钱包地址
  getWalletAddress: (network: string) => api.get(`/blockchain/wallet-address/${network}`),
  setWalletAddress: (network: string, address: string) =>
    api.post(`/blockchain/wallet-address`, { network, address }),

  // 托管订单操作
  createEscrow: (orderId: string, network: string, buyerAddress: string, sellerAddress: string, amount: string, token: string) =>
    api.post(`/blockchain/escrow/create`, { orderId, network, buyerAddress, sellerAddress, amount, token }),

  fundEscrow: (orderId: string, network: string, amount: string, token: string) =>
    api.post(`/blockchain/escrow/fund`, { orderId, network, amount, token }),

  getEscrowStatus: (orderId: string, network: string) =>
    api.get(`/blockchain/escrow/status`, { params: { orderId, network } }),
};

// 行情数据 API
export const marketApi = {
  // 获取价格
  getPrices: (symbols: string[]) => api.get('/market/prices', { params: { symbols } }),

  // 获取历史数据
  getHistory: (symbol: string, days: number) =>
    api.get('/market/history', { params: { symbol, days } }),

  // 获取 K线数据
  getKlines: (symbol: string, interval: string, limit: number) =>
    api.get('/market/klines', { params: { symbol, interval, limit } }),
};
