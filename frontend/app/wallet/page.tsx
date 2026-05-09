'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi, tronApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  description: string;
  createdAt: string;
}

const TRANSACTION_TYPE_MAP: Record<string, string> = {
  DEPOSIT: '充值',
  WITHDRAW: '提现',
  ORDER_PAY: '下单支付',
  ORDER_RELEASE: '订单放款',
  ORDER_REFUND: '订单退款',
};

// SVG Icons
const WalletIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="8" width="24" height="18" rx="2" />
    <path d="M4 12h24M20 18h6" />
  </svg>
);

const LockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="6" y="14" width="20" height="14" rx="2" />
    <path d="M11 14v-4a5 5 0 0110 0v4" />
    <circle cx="16" cy="21" r="2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="16" cy="16" r="12" />
    <path d="M16 8v8l6 4" />
  </svg>
);

const ChartIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 28V12l8 8 8-12 8 8v12H4z" />
    <path d="M12 20l8-12 8 8" />
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1" />
    <path d="M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 4v16M6 10l6-6 6 6" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 9s2-5 8-5 8 5 8 5-2 5-8 5-8-5-8-5z" />
    <circle cx="9" cy="9" r="2" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 2l14 14M6 4c-3 1-5 5-5 5s2 5 8 5c2 0 4-1 5-2" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="4" width="12" height="12" rx="2" />
    <path d="M2 12V2a2 2 0 012-2h10" />
  </svg>
);

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState({ balance: 0, frozenBalance: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [tronAddressInput, setTronAddressInput] = useState('');
  const [settingAddress, setSettingAddress] = useState(false);
  const [showDepositAddress, setShowDepositAddress] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
    loadTronData();
  }, [isAuthenticated, router]);

  const loadData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(),
      ]);
      setBalance(balanceRes.data);
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTronData = async () => {
    try {
      const [addressRes, pendingRes] = await Promise.all([
        tronApi.getDepositAddress(),
        tronApi.getDepositBalance(),
      ]);
      setDepositAddress(addressRes.data.address);
      setPendingBalance(pendingRes.data.balance);
    } catch (error) {
      console.error('Failed to load TRON data:', error);
    }
  };

  const handleSetDepositAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tronAddressInput) return;

    setSettingAddress(true);
    try {
      await tronApi.setDepositAddress(tronAddressInput);
      alert('充值地址设置成功');
      setTronAddressInput('');
      loadTronData();
    } catch (err: any) {
      alert(err.response?.data?.message || '设置失败');
    } finally {
      setSettingAddress(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(withdrawAmount) <= 0 || !withdrawAddress) return;

    setProcessing(true);
    try {
      await walletApi.withdraw(parseFloat(withdrawAmount), withdrawAddress);
      alert('提现申请已提交');
      setWithdrawAmount('');
      setWithdrawAddress('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || '提现失败');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--canvas)]">
        <div className="skeleton w-32 h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] py-8 bg-[var(--canvas)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text)]">
            我的钱包
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">管理你的 USDT 资产</p>
        </div>

        {/* Balance Cards - Asymmetric Bento Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 stagger-container">
          {/* Available Balance */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">可用余额</p>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <WalletIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--accent)] font-mono">
              {Number(balance.balance).toLocaleString()}
              <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
            </p>
          </div>

          {/* Frozen Balance */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">冻结余额</p>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <LockIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-600 font-mono">
              {Number(balance.frozenBalance).toLocaleString()}
              <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
            </p>
            <p className="text-xs text-[var(--text-subtle)] mt-2">订单进行中</p>
          </div>

          {/* Pending */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">待入账</p>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                <ClockIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-yellow-600 font-mono">
              {Number(pendingBalance).toLocaleString()}
              <span className="text-sm font-medium text-[var(--text-muted)] ml-1">USDT</span>
            </p>
            <p className="text-xs text-[var(--text-subtle)] mt-2">链上充值待确认</p>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] p-6 rounded-2xl shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/80">总资产</p>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <ChartIcon />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {Number(balance.total + pendingBalance).toLocaleString()}
              <span className="text-sm font-medium text-white/80 ml-1">USDT</span>
            </p>
          </div>
        </div>

        {/* TRON Deposit & Withdraw */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* TRON Deposit */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <LinkIcon />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)]">TRON 链上充值</h2>
            </div>

            {depositAddress && depositAddress.startsWith('T') ? (
              <div className="space-y-4">
                <div className="bg-[var(--canvas)] p-4 rounded-xl">
                  <p className="text-sm text-[var(--text-muted)] mb-2">你的专属充值地址 (TRC-20 USDT)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-[var(--accent)] font-mono text-sm break-all flex-1">
                      {showDepositAddress ? depositAddress : 'T••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowDepositAddress(!showDepositAddress)}
                      className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-muted)]"
                    >
                      {showDepositAddress ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(depositAddress)}
                      className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-muted)]"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    转账 USDT (TRC-20) 到上述地址，系统将自动入账
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    仅支持 TRON 网络 USDT，请勿转账其他币种
                  </p>
                </div>

                <a
                  href={`https://tronscan.org/#/address/${depositAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm transition-colors"
                >
                  在 TronScan 查看地址交易记录
                  <ArrowUpIcon />
                </a>
              </div>
            ) : (
              <form onSubmit={handleSetDepositAddress} className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">请设置你的 TRON 钱包地址作为充值地址</p>
                  <p className="text-xs text-yellow-600">地址格式：以 T 开头，长度 34 位</p>
                </div>
                <input
                  type="text"
                  value={tronAddressInput}
                  onChange={(e) => setTronAddressInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="例如: TJx2hy4...（你的TRON地址）"
                  pattern="^T[A-Za-z1-9]{33}$"
                />
                <button
                  type="submit"
                  disabled={settingAddress}
                  className="w-full py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
                >
                  {settingAddress ? '设置中...' : '设置充值地址'}
                </button>
              </form>
            )}
          </div>

          {/* Withdraw */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <ArrowUpIcon />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)]">提现</h2>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">提现地址 (TRON)</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="输入 TRON 地址"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--text)]">提现金额 (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder="0.00"
                />
                <p className="text-xs text-[var(--text-muted)]">可用: {Number(balance.balance).toLocaleString()} USDT</p>
              </div>
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
              >
                {processing ? '处理中...' : '提现'}
              </button>
            </form>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-6">交易记录</h2>

          {transactions.length === 0 ? (
            <p className="text-[var(--text-muted)] text-center py-12">暂无交易记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">类型</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">金额</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">交易前</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">交易后</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">描述</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--text-muted)]">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'DEPOSIT' || tx.type === 'ORDER_RELEASE' || tx.type === 'ORDER_REFUND'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {TRANSACTION_TYPE_MAP[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold font-mono ${
                        tx.type === 'DEPOSIT' || tx.type === 'ORDER_RELEASE' || tx.type === 'ORDER_REFUND'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'ORDER_RELEASE' || tx.type === 'ORDER_REFUND' ? '+' : '-'}
                        {Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-[var(--text-muted)] font-mono">
                        {Number(tx.balanceBefore).toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold font-mono">
                        {Number(tx.balanceAfter).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{tx.description}</td>
                      <td className="text-right py-3 px-4 text-sm text-[var(--text-subtle)]">
                        {new Date(tx.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}