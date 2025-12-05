import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { Transaction } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Award, Calendar, Utensils, Car, ShoppingBag, Receipt, MoreHorizontal, Film, Heart, Plane, ChevronRight, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const InsightsScreen: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  const symbol = user?.preferences.currency === 'EUR' ? '€' : user?.preferences.currency === 'INR' ? '₹' : user?.preferences.currency === 'CAD' ? 'C$' : '$';

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const txs = await mockBackend.getTransactions(user.id);
        setAllTransactions(txs);
      }
    };
    loadData();
  }, [user]);

  // Map category strings to Icons
  const getIcon = (catName: string) => {
    switch (catName) {
      case 'Food': return Utensils;
      case 'Transport': return Car;
      case 'Shopping': return ShoppingBag;
      case 'Bills': return Receipt;
      case 'Fun': return Film;
      case 'Health': return Heart;
      case 'Travel': return Plane;
      default: return MoreHorizontal;
    }
  };

  const categoryData = [
    { name: 'Food', value: 450, color: '#3b82f6', icon: Utensils },
    { name: 'Transport', value: 120, color: '#a855f7', icon: Car },
    { name: 'Shopping', value: 300, color: '#ec4899', icon: ShoppingBag },
    { name: 'Bills', value: 200, color: '#10b981', icon: Receipt },
    { name: 'Other', value: 80, color: '#64748b', icon: MoreHorizontal },
  ];

  const monthlyData = [
    { name: 'Jul', spent: 1200 },
    { name: 'Aug', spent: 950 },
    { name: 'Sep', spent: 1400 },
    { name: 'Oct', spent: 1100 },
    { name: 'Nov', spent: 1350 },
    { name: 'Dec', spent: 800 },
  ];

  // Filter transactions for the selected category
  const filteredTransactions = selectedCategory 
    ? allTransactions.filter(t => t.category === selectedCategory && t.type === 'expense')
    : [];

  return (
    <div className="pt-8 px-4 space-y-6 pb-24 animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insights</h1>
        <div className="flex items-center space-x-2 bg-white dark:bg-[#1E1E1E] px-3 py-1 rounded-full border border-gray-200 dark:border-white/5 shadow-sm">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-xs text-gray-700 dark:text-white font-medium">This Month</span>
        </div>
      </div>

      {/* Top Spending Category Card */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-sm">
         <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide font-bold mb-1">Top Category</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Food & Dining</h2>
            <p className="text-blue-500 dark:text-blue-400 text-sm font-bold mt-1">{symbol}450.00 <span className="text-gray-400 dark:text-gray-500 font-normal">spent</span></p>
         </div>
         <div className="w-12 h-12 bg-blue-100 dark:bg-blue-600/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500">
            <Award size={24} />
         </div>
      </div>

      {/* Category Distribution Pie Chart */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Spending Breakdown</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => `${symbol}${value}`}
                    />
                    <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown List */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Category Details</h3>
        <p className="text-xs text-gray-500 mb-2">Tap a category to see transactions</p>
        <div className="space-y-3">
            {categoryData.map((category) => (
                <button 
                  key={category.name} 
                  onClick={() => setSelectedCategory(category.name)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: category.color }}>
                            <category.icon size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white">{category.name}</p>
                            <p className="text-xs text-gray-500">{Math.round((category.value / 1150) * 100)}% of total</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-900 dark:text-white">{symbol}{category.value.toFixed(2)}</span>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white" />
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* Monthly History Bar Chart */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly History</h3>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                        dataKey="name" 
                        stroke="#6b7280" 
                        tick={{fill: '#9ca3af', fontSize: 12}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis 
                        stroke="#6b7280" 
                        tick={{fill: '#9ca3af', fontSize: 12}} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip 
                        cursor={{fill: 'rgba(100,100,100,0.1)'}}
                        contentStyle={{ backgroundColor: '#1E1E1E', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        formatter={(value: number) => [`${symbol}${value}`, 'Spent']}
                    />
                    <Bar 
                        dataKey="spent" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                        barSize={30}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
      
      {/* Category Details Modal / Slide-over */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCategory(null)} />
           <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-t-3xl md:rounded-3xl shadow-2xl h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-500">
                    {(() => {
                      const Icon = getIcon(selectedCategory);
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCategory}</h2>
                    <p className="text-xs text-gray-500">Transaction History</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCategory(null)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                       <p>No transactions found for this category.</p>
                       <p className="text-xs mt-1">Try adding some expenses!</p>
                    </div>
                 ) : (
                    filteredTransactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-500">
                                  <ArrowDownRight size={20} />
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{tx.merchant}</p>
                                  <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                              </div>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">
                              -{symbol}{tx.amount.toFixed(2)}
                          </span>
                      </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
