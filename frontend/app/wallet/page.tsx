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

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState({ balance: 0, frozenBalance: 0, total: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // TRON充值相关
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [tronAddressInput, setTronAddressInput] = useState('');
  const [settingAddress, setSettingAddress] = useState(false);
  const [showDepositAddress, setShowDepositAddress] = useState(false); // 充值地址默认隐藏

  // 提现相关
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
      alert('✅ 充值地址设置成功！');
      setTronAddressInput('');
      loadTronData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '设置失败'));
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
      alert('✅ 提现申请已提交！');
      setWithdrawAmount('');
      setWithdrawAddress('');
      loadData();
    } catch (err: any) {
      alert('❌ ' + (err.response?.data?.message || '提现失败'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          我的钱包
        </h1>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">可用余额</p>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{balance.balance.toFixed(2)} USDT</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">冻结余额</p>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-600">{balance.frozenBalance.toFixed(2)} USDT</p>
            <p className="text-xs text-gray-400 mt-2">订单进行中</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">待入账</p>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{pendingBalance.toFixed(2)} USDT</p>
            <p className="text-xs text-gray-400 mt-2">链上充值待确认</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20 transform hover:scale-105 transition-all">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">总资产</p>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{(balance.total + pendingBalance).toFixed(2)} USDT</p>
          </div>
        </div>

        {/* TRON Deposit Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                <span className="text-xl">🔗</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">TRON链上充值</h2>
            </div>

            {depositAddress && depositAddress.startsWith('T') ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">你的专属充值地址（TRC-20 USDT）</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-indigo-600 font-mono text-sm break-all">
                      {showDepositAddress ? depositAddress : 'T•••••••••••••••••••••••••••••'}
                    </code>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDepositAddress(!showDepositAddress)}
                        className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300"
                      >
                        {showDepositAddress ? '隐藏' : '显示'}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(depositAddress)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    💡 转账 USDT (TRC-20) 到上述地址，系统将自动入账（约30秒）
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    仅支持 TRON 网络 USDT，请勿转账其他币种
                  </p>
                </div>

                <div className="text-center">
                  <a
                    href={`https://tronscan.org/#/address/${depositAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    在 TronScan 查看地址交易记录 →
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSetDepositAddress} className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-2">
                    请设置你的 TRON 钱包地址作为充值地址
                  </p>
                  <p className="text-xs text-yellow-600">
                    地址格式：以 T 开头，长度 34 位
                  </p>
                </div>
                <input
                  type="text"
                  value={tronAddressInput}
                  onChange={(e) => setTronAddressInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/50"
                  placeholder="例如: TJx2hy4...（你的TRON地址）"
                  pattern="^T[A-Za-z1-9]{33}$"
                />
                <button
                  type="submit"
                  disabled={settingAddress}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-lg transition-all"
                >
                  {settingAddress ? '设置中...' : '设置充值地址'}
                </button>
              </form>
            )}
          </div>

          {/* Withdraw */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                <span className="text-xl">⬆️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">提现</h2>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  提现地址（TRON）
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50"
                  placeholder="输入 TRON 地址"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  提现金额 (USDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white/50"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">可用: {balance.balance.toFixed(2)} USDT</p>
              </div>
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 shadow-lg transition-all"
              >
                {processing ? '处理中...' : '提现'}
              </button>
            </form>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20">
          <h2 className="text-xl font-bold mb-6 text-gray-900">交易记录</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无交易记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">类型</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">金额</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">交易前</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">交易后</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">描述</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.type === 'DEPOSIT' || tx.type === 'ORDER_RELEASE' || tx.type === 'ORDER_REFUND'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {TRANSACTION_TYPE_MAP[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold ${
                        tx.type === 'DEPOSIT' || tx.type === 'ORDER_RELEASE' || tx.type === 'ORDER_REFUND'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'ORDER_RELEASE' || tx.type === 'ORDER_REFUND' ? '+' : '-'}
                        {Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-600">{Number(tx.balanceBefore).toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-sm font-semibold">{Number(tx.balanceAfter).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{tx.description}</td>
                      <td className="text-right py-3 px-4 text-sm text-gray-500">
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