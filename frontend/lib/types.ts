// Shared type definitions for frontend

// ========== User Types ==========

export interface User {
  id: string;
  email: string;
  username: string;
  nickname: string;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
  reputation: number;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  username: string;
  nickname: string;
  avatar: string | null;
  reputation: number;
  createdAt: string;
  stats?: UserStats;
}

export interface UserStats {
  itemsCount: number;
  buyOrdersCount: number;
  sellOrdersCount: number;
  totalOrders: number;
  reviewsReceivedCount: number;
  reviewsGivenCount: number;
  avgRating: number;
  goodRate: number;
}

// ========== Item Types ==========

export interface Item {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  location?: string;
  status?: ItemStatus;
  seller: {
    id: string;
    username: string;
    nickname: string;
    reputation: number;
  };
  createdAt: string;
}

export type ItemStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD';

// ========== Order Types ==========

export interface Order {
  id: string;
  price: number;
  status: OrderStatus;
  logisticsCompany?: string;
  trackingNumber?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
  item: {
    id: string;
    title: string;
    images: string[];
  };
  buyer?: {
    id: string;
    username: string;
    nickname: string;
  };
  seller?: {
    id: string;
    username: string;
    nickname: string;
  };
  review?: Review;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELED' | 'DISPUTED';

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  PENDING: '待支付',
  PAID: '已支付（托管中）',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  DISPUTED: '争议中',
};

// ========== Transaction Types ==========

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  description?: string;
  txHash?: string;
  createdAt: string;
  token?: {
    symbol: string;
    network: { name: string };
  };
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'ORDER_PAY' | 'ORDER_RELEASE' | 'ORDER_REFUND';

export const TRANSACTION_TYPE_MAP: Record<TransactionType, string> = {
  DEPOSIT: '充值',
  WITHDRAW: '提现',
  ORDER_PAY: '下单支付',
  ORDER_RELEASE: '订单放款',
  ORDER_REFUND: '订单退款',
};

// ========== Wallet Types ==========

export interface TokenBalance {
  id: string;
  symbol: string;
  network: string;
  balance: number;
  frozenBalance: number;
  decimals: number;
}

export interface NetworkInfo {
  id: string;
  name: string;
  displayName: string;
  tokens: TokenInfo[];
}

export interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}

// ========== Review Types ==========

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewer: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ========== Price Types ==========

export interface PriceData {
  price: number;
  change24h: number;
}

// ========== Admin Types ==========

export interface AdminStats {
  usersCount: number;
  itemsCount: number;
  ordersCount: number;
  transactionsCount: number;
  totalVolume: number;
  disputedOrders: number;
}