'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi, tronApi, blockchainApi, marketApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ChainSelector from '@/components/ChainSelector';

interface TokenBalance {
  id: string;
  symbol: string;
  network: string;
  balance: number;
  frozenBalance: number;
  decimals: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  description: string;
  createdAt: string;
  token?: { symbol: string; network: { name: string } };
}

interface NetworkInfo {
  id: string;
  name: string;
  displayName: string;
  tokens: { id: string; symbol: string; name: string; decimals: number }[];
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
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, { price: number; change24h: number }>>({});

  const [selectedNetwork, setSelectedNetwork] = useState('TRON');
  const [networks, setNetworks] = useState<NetworkInfo[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [onchainBalances, setOnchainBalances] = useState<Record<string, number>>({});
  const [addressInput, setAddressInput] = useState('');
  const [settingAddress, setSettingAddress] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadData();
    loadNetworks();
    loadPrices();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (selectedNetwork) {
      loadWalletAddress();
    }
  }, [selectedNetwork]);

  const loadData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(),
      ]);
      setBalances(balanceRes.data.balances || []);
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNetworks = async () => {
    try {
      const res = await blockchainApi.getNetworks();
      setNetworks(res.data || []);
    } catch (error) {
      console.error('Failed to load networks:', error);
    }
  };

  const loadPrices = async () => {
    try {
      const res = await marketApi.getPrices(['USDT', 'TRX', 'BNB', 'ETH', 'BTC']);
      setPrices(res.data || {});
    } catch (error) {
      console.error('Failed to load prices:', error);
    }
  };

  const loadWalletAddress = async () => {
    try {
      const res = await blockchainApi.getWalletAddress(selectedNetwork);
      setWalletAddress(res.data.address || null);

      if (res.data.address) {
        const balanceRes = await blockchainApi.getDepositBalance(selectedNetwork);
        setOnchainBalances(balanceRes.data.balances || {});
      } else {
        setOnchainBalances({});
      }
    } catch (error) {
      console.error('Failed to load wallet address:', error);
    }
  };

  const handleSetAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput) return;

    setSettingAddress(true);
    try {
      await blockchainApi.setWalletAddress(selectedNetwork, addressInput);
      alert('钱包地址设置成功');
      setAddressInput('');
      loadWalletAddress();
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

  // Calculate totals for current network
  const networkBalances = balances.filter((b) => b.network === selectedNetwork);
  const totalBalance = networkBalances.reduce((sum, b) => sum + b.balance, 0);
  const totalFrozen = networkBalances.reduce((sum, b) => sum + b.frozenBalance, 0);

  // Get price for token
  const getTokenPrice = (symbol: string) => {
    return prices[symbol]?.price || 0;
  };

  // Calculate USD value
  const calculateUsdValue = (amount: number, symbol: string) => {
    const price = getTokenPrice(symbol);
    return amount * price;
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
          <p className="mt-2 text-[var(--text-muted)]">多链多币种资产管理</p>
        </div>

        {/* Chain Selector */}
        <div className="mb-6">
          <ChainSelector
            selectedChain={selectedNetwork}
            onChainChange={setSelectedNetwork}
          />
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">可用余额</p>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <WalletIcon />
              </div>
            </div>
            <div className="space-y-2">
              {networkBalances.map((b) => (
                <div key={b.id} className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">{b.symbol}</span>
                  <span className="font-bold text-[var(--accent)] font-mono">
                    {Number(b.balance).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Frozen Balance */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">冻结余额</p>
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <LockIcon />
              </div>
            </div>
            <div className="space-y-2">
              {networkBalances.map((b) => (
                b.frozenBalance > 0 && (
                  <div key={b.id} className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">{b.symbol}</span>
                    <span className="font-bold text-orange-600 font-mono">
                      {Number(b.frozenBalance).toLocaleString()}
                    </span>
                  </div>
                )
              ))}
            </div>
            <p className="text-xs text-[var(--text-subtle)] mt-2">订单进行中</p>
          </div>

          {/* Onchain Balance */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[var(--text-muted)]">链上余额</p>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                <ClockIcon />
              </div>
            </div>
            {walletAddress ? (
              <div className="space-y-2">
                {Object.entries(onchainBalances).map(([symbol, balance]) => (
                  <div key={symbol} className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">{symbol}</span>
                    <span className="font-bold text-yellow-600 font-mono">
                      {Number(balance).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">请先设置钱包地址</p>
            )}
          </div>

          {/* USD Value */}
          <div className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] p-6 rounded-2xl shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/80">总估值 (USD)</p>
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              $
              {networkBalances.reduce((sum, b) => sum + calculateUsdValue(b.balance + b.frozenBalance, b.symbol), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Deposit & Withdraw */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Deposit */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                <LinkIcon />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {selectedNetwork} 链上充值
              </h2>
            </div>

            {walletAddress && (selectedNetwork === 'TRON' ? walletAddress.startsWith('T') : walletAddress.startsWith('0x')) ? (
              <div className="space-y-4">
                <div className="bg-[var(--canvas)] p-4 rounded-xl">
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    你的充值地址 ({selectedNetwork === 'TRON' ? 'TRC-20' : 'BEP-20'})
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-[var(--accent)] font-mono text-sm break-all flex-1">
                      {showAddress ? walletAddress : (selectedNetwork === 'TRON' ? 'T••••••••••••••••••••••••' : '0x••••••••••••••••••••••••••••••••••••••••')}
                    </code>
                    <button
                      onClick={() => setShowAddress(!showAddress)}
                      className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-muted)]"
                    >
                      {showAddress ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(walletAddress)}
                      className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-muted)]"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    转账到上述地址，系统将自动入账
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    仅支持 {selectedNetwork} 网络，请勿转账其他币种
                  </p>
                </div>

                <a
                  href={selectedNetwork === 'TRON'
                    ? `https://tronscan.org/#/address/${walletAddress}`
                    : `https://bscscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent-hover)] text-sm transition-colors"
                >
                  在 {selectedNetwork === 'TRON' ? 'TronScan' : 'BscScan'} 查看地址
                  <ArrowUpIcon />
                </a>
              </div>
            ) : (
              <form onSubmit={handleSetAddress} className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 mb-2">请设置你的钱包地址作为充值地址</p>
                  <p className="text-xs text-yellow-600">
                    {selectedNetwork === 'TRON' ? '地址格式：以 T 开头，长度 34 位' : '地址格式：以 0x 开头，长度 42 位'}
                  </p>
                </div>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder={selectedNetwork === 'TRON' ? 'TJx2hy4...（TRON地址）' : '0x1234...（BSC地址）'}
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
                <label className="block text-sm font-medium text-[var(--text)]">
                  提现地址 ({selectedNetwork})
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--canvas)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)] transition-all duration-150"
                  placeholder={selectedNetwork === 'TRON' ? 'TRON 地址' : 'BSC 地址'}
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
                <p className="text-xs text-[var(--text-muted)]">
                  可用: {Number(networkBalances.find(b => b.symbol === 'USDT')?.balance || 0).toLocaleString()} USDT
                </p>
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
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-[var(--text-muted)]">暂无交易记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">类型</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">代币</th>
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
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--text-muted)]">
                          {tx.token ? `${tx.token.symbol} (${tx.token.network.name})` : 'USDT'}
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