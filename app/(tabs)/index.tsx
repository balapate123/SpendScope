import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { Transaction } from '../../types';
import { ArrowUpRight, ArrowDownRight, Wallet, Bell, Loader2, ArrowUp, BarChart2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useAutoCapture } from '../../hooks/useAutoCapture';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const { simulateIncomingTransaction } = useAutoCapture();
  const [isCapturing, setIsCapturing] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const fetchData = async () => {
    if (user) {
      const txs = await mockBackend.getTransactions(user.id);
      setTransactions(txs);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for soft refresh events from AddExpenseModal
    const handleRefresh = () => fetchData();
    window.addEventListener('transaction_updated', handleRefresh);
    
    return () => {
      window.removeEventListener('transaction_updated', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAutoCapture = async () => {
    setIsCapturing(true);
    await simulateIncomingTransaction();
    await fetchData();
    setIsCapturing(false);
  };

  const symbol = user?.preferences.currency === 'EUR' ? '€' : user?.preferences.currency === 'INR' ? '₹' : user?.preferences.currency === 'CAD' ? 'C$' : '$';

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netWorth = 12450.00; // Hardcoded for demo match or calculate

  // Dummy data for the chart - varies based on timeframe
  const chartDataMonth = [
      { day: 'Mon', amount: 30 },
      { day: 'Tue', amount: 45 },
      { day: 'Wed', amount: 20 },
      { day: 'Thu', amount: 60 },
      { day: 'Fri', amount: 40 },
      { day: 'Sat', amount: 80 },
      { day: 'Sun', amount: 50 },
  ];

  const chartDataYear = [
      { day: 'Jan', amount: 400 },
      { day: 'Feb', amount: 300 },
      { day: 'Mar', amount: 550 },
      { day: 'Apr', amount: 450 },
      { day: 'May', amount: 600 },
      { day: 'Jun', amount: 500 },
  ];

  const currentChartData = timeframe === 'month' ? chartDataMonth : chartDataYear;

  const displayedTransactions = showAllActivity ? transactions : transactions.slice(0, 5);

  return (
    <div className="pt-8 px-4 space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
           <Wallet className="text-white" size={24} />
        </div>
        <div className="ml-3 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SpendScope</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Master your money</p>
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex justify-between items-start mb-2">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Net Worth</p>
            <div className="bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full flex items-center">
                <ArrowUp size={12} className="mr-1" />
                +2.4%
            </div>
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{symbol}{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        <p className="text-xs text-gray-500">Total assets across all accounts</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center space-x-2 mb-2 text-gray-500 dark:text-gray-400">
                <Wallet size={16} />
                <span className="text-xs font-bold uppercase">Spent (Mo)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{symbol}{totalExpense.toFixed(2)}</p>
        </div>
        
        {/* Mock Add Button acting as visual flair since real add is in nav */}
        <button 
            onClick={handleAutoCapture}
            className="bg-blue-600 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group active:scale-95 transition-all shadow-lg shadow-blue-500/30"
        >
            <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-full">
                {isCapturing ? <Loader2 className="animate-spin text-white" size={16} /> : <Bell className="text-white" size={16} />}
            </div>
            <div className="mt-8">
                <p className="text-white font-bold text-lg">Simulate</p>
                <p className="text-blue-200 text-xs">Auto-Capture (Android)</p>
            </div>
        </button>
      </div>

      {/* Spending Trend / Chart Placeholder */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 h-80 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trend</h3>
                <button 
                  onClick={() => setChartType(prev => prev === 'bar' ? 'line' : 'bar')}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-colors"
                >
                  {chartType === 'bar' ? <TrendingUp size={16} /> : <BarChart2 size={16} />}
                </button>
            </div>
            <div className="flex space-x-1 bg-gray-100 dark:bg-black/20 p-1 rounded-xl">
                <button 
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    timeframe === 'month' 
                      ? 'bg-white dark:bg-purple-500 text-purple-600 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setTimeframe('year')}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    timeframe === 'year' 
                      ? 'bg-white dark:bg-purple-500 text-purple-600 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Year
                </button>
            </div>
        </div>
        
        {/* Real Responsive Chart */}
        <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={currentChartData}>
                      <Tooltip 
                          cursor={{fill: 'rgba(100,100,100,0.1)'}}
                          contentStyle={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          formatter={(value: number) => [`${symbol}${value}`, 'Spent']}
                      />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={currentChartData}>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        formatter={(value: number) => [`${symbol}${value}`, 'Spent']}
                    />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} activeDot={{r: 6}} />
                  </LineChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          {transactions.length > 5 && (
            <button 
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              {showAllActivity ? 'Show Less' : 'See All'}
              {showAllActivity ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
            </button>
          )}
        </div>
        <div className="space-y-3">
            {isLoading ? (
                <div className="text-center py-4"><Loader2 className="animate-spin text-blue-500 mx-auto" /></div>
            ) : transactions.length === 0 ? (
                 <p className="text-gray-500 text-center py-4">No recent activity.</p>
            ) : (
                displayedTransactions.map(tx => (
                <div key={tx.id} className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'income' ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500'
                        }`}>
                            {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{tx.merchant}</p>
                            <p className="text-xs text-gray-500">{tx.category}</p>
                        </div>
                    </div>
                    <span className={`font-bold ${tx.type === 'income' ? 'text-green-600 dark:text-green-500' : 'text-gray-900 dark:text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{symbol}{tx.amount.toFixed(2)}
                    </span>
                </div>
            )))}
        </div>
      </div>
    </div>
  );
};
