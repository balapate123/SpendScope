import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { mockBackend } from '../../services/mockBackend';
import { Moon, Sun, Monitor, Bell, Download, Trash2, CreditCard, User as UserIcon, Loader2, ChevronRight, Smartphone, Database } from 'lucide-react';
import { Currency } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  
  if (!user) return null;

  const handleCurrencyChange = async (currency: Currency) => {
    setIsSaving(true);
    try {
      const updated = await mockBackend.updateUserPreferences(user.id, { currency });
      updateUser(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pt-8 px-4 space-y-6 pb-24 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>

      {/* User Card */}
      <div className="bg-blue-600 rounded-3xl p-6 flex items-center space-x-4 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
            <UserIcon size={32} />
        </div>
        <div>
            <p className="text-sm text-blue-100 font-medium">User</p>
            <p className="text-white font-bold truncate max-w-[200px]">{user.email}</p>
            <div className="mt-2 inline-block bg-black/20 px-3 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-sm">
                Pro Member
            </div>
        </div>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase mt-6 tracking-wider">Preferences</p>
      
      {/* Theme */}
      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl overflow-hidden">
        <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-white/5 transition-colors"
        >
            <div className="flex items-center space-x-3 text-white">
                <Moon size={20} className="text-gray-400" />
                <span className="font-medium">App Theme</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
                <span className="text-sm">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                <ChevronRight size={16} />
            </div>
        </button>

        {/* Currency */}
        <div className="w-full flex items-center justify-between p-4">
            <div className="flex items-center space-x-3 text-white">
                <CreditCard size={20} className="text-gray-400" />
                <span className="font-medium">Currency</span>
            </div>
            <div className="flex bg-black/30 rounded-lg p-1 overflow-x-auto no-scrollbar">
                {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD'].map((curr) => (
                    <button
                        key={curr}
                        onClick={() => handleCurrencyChange(curr as Currency)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${
                            user.preferences.currency === curr ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {curr}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase mt-6 tracking-wider">Data & Sync</p>
      
      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl overflow-hidden">
        <div className="w-full flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center space-x-3 text-white">
                <Smartphone size={20} className="text-gray-400" />
                <span className="font-medium">Auto-Capture (Android)</span>
            </div>
            <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">Active</span>
        </div>
        <button className="w-full flex items-center justify-between p-4 border-b border-white/5 active:bg-white/5 transition-colors">
            <div className="flex items-center space-x-3 text-white">
                <Bell size={20} className="text-gray-400" />
                <span className="font-medium">Notifications</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
                <span className="text-sm">On</span>
                <ChevronRight size={16} />
            </div>
        </button>
        <button className="w-full flex items-center justify-between p-4 active:bg-white/5 transition-colors">
            <div className="flex items-center space-x-3 text-white">
                <Database size={20} className="text-gray-400" />
                <span className="font-medium">Backup Data</span>
            </div>
            <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase mt-6 tracking-wider">Security</p>
      <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl overflow-hidden">
         <button 
            onClick={logout}
            className="w-full flex items-center justify-between p-4 text-red-500 active:bg-red-500/10 transition-colors"
        >
            <div className="flex items-center space-x-3">
                <Trash2 size={20} />
                <span className="font-medium">Sign Out</span>
            </div>
        </button>
      </div>

      <div className="text-center pt-4 pb-8">
        <p className="text-xs text-gray-600">SpendScope v2.0.2 (Premium)</p>
      </div>
    </div>
  );
};
