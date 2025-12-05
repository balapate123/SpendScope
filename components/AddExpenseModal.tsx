import React, { useState } from 'react';
import { X, Utensils, Car, ShoppingBag, Receipt, Film, Heart, Plane, MoreHorizontal, Loader2, ChevronDown, Keyboard, Pencil } from 'lucide-react';
import { CustomKeypad } from './CustomKeypad';
import { useAuth } from '../contexts/AuthContext';
import { mockBackend } from '../services/mockBackend';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
}

const CATEGORIES = [
  { id: 'Food', icon: Utensils, label: 'Food' },
  { id: 'Transport', icon: Car, label: 'Transport' },
  { id: 'Shopping', icon: ShoppingBag, label: 'Shopping' },
  { id: 'Bills', icon: Receipt, label: 'Bills' },
  { id: 'Fun', icon: Film, label: 'Fun' },
  { id: 'Health', icon: Heart, label: 'Health' },
  { id: 'Travel', icon: Plane, label: 'Travel' },
  { id: 'Other', icon: MoreHorizontal, label: 'Other' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onExpenseAdded }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeypadVisible, setIsKeypadVisible] = useState(true);

  if (!isOpen) return null;

  const handleKeyPress = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    if (amount.replace('.', '').length >= 9) return;
    
    setAmount(prev => {
        if (prev === '0' && key !== '.') return key;
        return prev + key;
    });
  };

  const handleDelete = () => {
    setAmount(prev => {
        if (prev.length === 1) return '0';
        return prev.slice(0, -1);
    });
  };

  const handleSave = async () => {
    if (!user || !selectedCategory) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await mockBackend.addTransaction(user.id, {
        amount: parsedAmount,
        merchant: note || selectedCategory, // Use Note as merchant, fallback to category name
        category: selectedCategory,
        type: 'expense',
        note: note
      });

      // Close modal first
      onClose();

      // Reset Form State after close
      setTimeout(() => {
        setAmount('0');
        setNote('');
        setSelectedCategory(null);
        setIsKeypadVisible(true);
        onExpenseAdded();
      }, 300);

    } catch (e) {
      console.error("Failed to add expense:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center animate-in slide-in-from-bottom duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content - Adjusted Height constraints */}
      <div className="relative w-full max-w-md bg-[#09090b] md:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden h-[92vh] md:h-auto md:max-h-[85vh] border border-white/5 flex flex-col transition-all">
        
        {/* Header - Fixed at top */}
        <div className="flex justify-between items-center p-6 pb-2 shrink-0">
          <h2 className="text-lg font-bold text-white">Add Expense</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Middle Section - This flex-1 area shrinks when Keypad is present */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
            
            {/* Amount Display */}
            <div className="py-6 flex justify-center items-center shrink-0">
                <div 
                    className="flex items-baseline text-6xl font-bold text-white tracking-tighter cursor-pointer" 
                    onClick={() => setIsKeypadVisible(true)}
                >
                    <span className="text-blue-500 text-4xl mr-1 align-top mt-2">$</span>
                    <span>{amount === '' ? '0' : amount}</span>
                    <span className="w-0.5 h-10 bg-blue-500 animate-pulse ml-1"></span>
                </div>
            </div>

            {/* Note Input */}
            <div className="px-6 mb-4 shrink-0">
                <div className="bg-[#18181b] rounded-2xl flex items-center p-4 border border-white/5 group focus-within:border-blue-500/50 transition-colors">
                    <Pencil className="text-gray-500 group-focus-within:text-blue-500 mr-3" size={18} />
                    <input 
                        type="text" 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note (e.g., Lunch with Mike)" 
                        className="w-full bg-transparent text-white placeholder-gray-600 outline-none text-sm font-medium"
                    />
                </div>
            </div>

            {/* Category Grid - Allows internal scrolling if needed */}
            <div className="px-6 pb-4">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-400">Select Category</label>
                    {!isKeypadVisible && (
                        <button onClick={() => setIsKeypadVisible(true)} className="text-blue-500 text-xs font-bold">Show Keypad</button>
                    )}
                </div>
                
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex flex-col items-center justify-center h-20 rounded-2xl border transition-all duration-200 ${
                                selectedCategory === cat.id 
                                    ? 'bg-[#1e293b] border-blue-500/50' 
                                    : 'bg-[#18181b] border-white/5 text-gray-400 hover:bg-[#27272a]'
                            }`}
                        >
                            <cat.icon size={22} className={`mb-1.5 ${selectedCategory === cat.id ? 'text-white' : 'text-gray-500'}`} />
                            <span className={`text-[11px] font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-500'}`}>
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Bottom Section - Keypad or Save Button (Fixed at bottom) */}
        {isKeypadVisible ? (
            <div className="bg-[#18181b] rounded-t-[2rem] pt-2 pb-6 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 z-10 shrink-0 border-t border-white/5">
                <div className="w-full flex justify-center py-2 mb-2" onClick={() => setIsKeypadVisible(false)}>
                    <div className="flex items-center space-x-1 text-gray-500 cursor-pointer">
                        <ChevronDown size={14} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Hide</span>
                    </div>
                </div>
                
                <CustomKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
                
                <div className="px-4 mt-4">
                    <button
                        onClick={handleSave}
                        disabled={amount === '0' || !selectedCategory || isSubmitting}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                            amount !== '0' && selectedCategory 
                            ? 'bg-[#3b3e4a] text-white hover:bg-[#454955] shadow-lg' 
                            : 'bg-[#27272a] text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Expense'}
                    </button>
                </div>
            </div>
        ) : (
             <div className="p-6 shrink-0 bg-[#09090b]">
                <button
                    onClick={handleSave}
                    disabled={amount === '0' || !selectedCategory || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all ${
                        amount !== '0' && selectedCategory 
                        ? 'bg-[#3b3e4a] text-white hover:bg-[#454955] shadow-lg' 
                        : 'bg-[#27272a] text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Expense'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
