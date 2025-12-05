import React, { useState } from 'react';
import { LayoutDashboard, Settings, TrendingUp, Plus, PieChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AddExpenseModal } from './AddExpenseModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'debt' | 'settings' | 'insights';
  onNavigate: (tab: 'dashboard' | 'debt' | 'settings' | 'insights') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const { user } = useAuth();

  // Handle successful expense addition by dispatching a custom event
  // This allows components like Dashboard to refetch data without a hard page reload
  const handleExpenseAdded = () => {
    window.dispatchEvent(new Event('transaction_updated'));
  };

  return (
    <div className="h-full flex flex-col bg-[#121212] text-white overflow-hidden">
      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-8">
        <div className="max-w-md mx-auto min-h-full">
            {children}
        </div>
      </main>

      {/* Glassmorphism Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-40">
        {/* Gradient Blur Overlay */}
        <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-xl border-t border-white/5" />
        
        <div className="relative max-w-md mx-auto flex justify-between items-center px-6 h-20 md:pb-0 pb-2">
          {/* Home */}
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => onNavigate('dashboard')} 
            icon={<LayoutDashboard size={22} />} 
            label="Home" 
          />

          {/* Insights */}
          <NavButton 
            active={activeTab === 'insights'} 
            onClick={() => onNavigate('insights')} 
            icon={<PieChart size={22} />} 
            label="Insights" 
          />

          {/* ADD Button (Floating Center) */}
          <div className="relative -top-5">
            <button 
              onClick={() => setIsAddExpenseOpen(true)}
              className="w-14 h-14 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center text-white hover:bg-blue-500 transition-all active:scale-95"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>

          {/* Debt */}
          <NavButton 
            active={activeTab === 'debt'} 
            onClick={() => onNavigate('debt')} 
            icon={<TrendingUp size={22} />} 
            label="Debt" 
          />

          {/* Tools */}
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => onNavigate('settings')} 
            icon={<Settings size={22} />} 
            label="Tools" 
          />
        </div>
      </nav>

      {/* Add Expense Modal */}
      <AddExpenseModal 
        isOpen={isAddExpenseOpen} 
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 w-12 transition-all duration-200 ${
      active ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
