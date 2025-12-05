import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { Debt, DebtProjectionPoint } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingDown, Plus, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { AddDebtModal } from '../../components/AddDebtModal';

type Strategy = 'snowball' | 'avalanche';

export const DebtSimulator: React.FC = () => {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [extraPayment, setExtraPayment] = useState(200);
  const [projection, setProjection] = useState<DebtProjectionPoint[]>([]);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>('snowball');

  const fetchData = async () => {
    if (user) {
      const d = await mockBackend.getDebts(user.id);
      setDebts(d);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (debts.length >= 0) { // Always run to allow empty state handling
      calculateProjection();
    }
  }, [debts, extraPayment]);

  const calculateProjection = () => {
    let totalPrincipal = debts.reduce((acc, d) => acc + d.principal, 0);
    const minPayments = debts.reduce((acc, d) => acc + d.minPayment, 0);
    const avgRate = totalPrincipal > 0 
        ? debts.reduce((acc, d) => acc + (d.rate * d.principal), 0) / totalPrincipal / 100 / 12 
        : 0;

    let balanceMin = totalPrincipal;
    let balanceStrat = totalPrincipal;
    const data: DebtProjectionPoint[] = [];
    let month = 0;

    // Simulate 48 months or until payoff
    while (month <= 48) {
      data.push({
        month,
        balanceMinimum: Math.max(0, Math.round(balanceMin)),
        balanceStrategy: Math.max(0, Math.round(balanceStrat))
      });

      if (balanceMin > 0) {
        const interest = balanceMin * avgRate;
        balanceMin = balanceMin + interest - minPayments;
      }
      
      if (balanceStrat > 0) {
        const interest = balanceStrat * avgRate;
        balanceStrat = balanceStrat + interest - (minPayments + extraPayment);
      }
      
      month++;
    }
    setProjection(data);
  };

  const symbol = user?.preferences.currency === 'EUR' ? '€' : user?.preferences.currency === 'INR' ? '₹' : user?.preferences.currency === 'CAD' ? 'C$' : '$';
  
  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/10 p-3 rounded-xl shadow-xl">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Month {label}</p>
          <p className="text-red-500 dark:text-red-400 text-sm font-bold">Min: {symbol}{payload[0].value}</p>
          <p className="text-green-600 dark:text-green-400 text-sm font-bold">Strategy: {symbol}{payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  // Sort debts based on Strategy
  const sortedDebts = [...debts].sort((a, b) => {
      if (strategy === 'snowball') {
          return a.principal - b.principal; // Lowest balance first
      } else {
          return b.rate - a.rate; // Highest interest first
      }
  });
  
  const activeDebt = sortedDebts[0];

  return (
    <div className="pt-8 px-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debt Manager</h1>
        <div className="flex bg-gray-200 dark:bg-[#1E1E1E] rounded-lg p-1 border border-gray-300 dark:border-white/5">
            <button 
                onClick={() => setStrategy('snowball')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${strategy === 'snowball' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
            >
                Snowball
            </button>
            <button 
                onClick={() => setStrategy('avalanche')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${strategy === 'avalanche' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'}`}
            >
                Avalanche
            </button>
        </div>
      </div>

      {/* Projection Card */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="text-blue-500" size={18} />
            <span className="text-blue-500 font-bold text-xs tracking-wider uppercase">Projected Freedom</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">December 2025</h2>
        <p className="text-gray-500 text-xs mb-6">Increase payment to finish sooner.</p>

        <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStrat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(100,100,100,0.1)' }} />
                <Area type="monotone" dataKey="balanceMinimum" stroke="#ef4444" fillOpacity={1} fill="url(#colorMin)" strokeWidth={2} />
                <Area type="monotone" dataKey="balanceStrategy" stroke="#10b981" fillOpacity={1} fill="url(#colorStrat)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="flex justify-between mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
            <div>
                <p className="text-xs text-gray-500">Total Interest</p>
                <p className="text-red-500 dark:text-red-400 font-bold">{symbol}{Math.round(debts.reduce((acc, d) => acc + d.principal * 0.15, 0)).toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500">Savings vs Min</p>
                <p className="text-green-600 dark:text-green-400 font-bold">-{symbol}{Math.round(projection.reduce((a,b)=>a+b.balanceMinimum,0)*0.01).toLocaleString()}</p>
            </div>
        </div>
      </div>

      {/* Payoff Plan Section */}
      {debts.length > 0 && (
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Payoff Plan ({strategy === 'snowball' ? 'Snowball' : 'Avalanche'})</h3>
            <div className="bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                    <CheckCircle2 className="text-blue-500 mt-1" size={20} />
                    <div>
                        <p className="text-gray-900 dark:text-white font-bold">Focus: {activeDebt?.name}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                            Pay minimums on everything else. Put all extra cash towards this debt.
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-lg mt-2">
                            Pay {symbol}{(activeDebt.minPayment + extraPayment).toLocaleString()} this month
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Next in line</p>
                {sortedDebts.slice(1).map((debt, index) => (
                    <div key={debt.id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{index + 1}. {debt.name}</span>
                        <span className="text-gray-500 text-sm">Pay min: {symbol}{debt.minPayment}</span>
                    </div>
                ))}
                {sortedDebts.length <= 1 && <p className="text-gray-500 text-sm italic">You're crushing it! Only one debt left.</p>}
            </div>
        </div>
      )}

      {/* Accelerator Slider */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-gray-900 dark:text-white font-bold">
                <span className="mr-2">⚡ Accelerator</span>
            </div>
            <span className="text-blue-500 font-bold">+{symbol}{extraPayment.toFixed(2)}</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="2000" 
            step="50"
            value={extraPayment}
            onChange={(e) => setExtraPayment(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
            <span>Min Pay Only</span>
            <span>Aggressive ($2k)</span>
        </div>
      </div>

      {/* Debt List */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Accounts</h3>
            <button 
                onClick={() => setIsAddDebtOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
            >
                <Plus size={16} />
            </button>
        </div>

        <div className="space-y-3">
            {debts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No debts found.</div>
            ) : (
                debts.map(debt => (
                    <div key={debt.id} className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{debt.name}</p>
                                <p className="text-xs text-gray-500">{debt.rate}% APR</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">{symbol}{debt.principal.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Min: {symbol}{debt.minPayment}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      <AddDebtModal 
        isOpen={isAddDebtOpen} 
        onClose={() => setIsAddDebtOpen(false)} 
        onDebtAdded={fetchData} 
      />
    </div>
  );
};
