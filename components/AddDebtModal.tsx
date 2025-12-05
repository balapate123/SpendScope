import React, { useState } from 'react';
import { X, Loader2, CreditCard, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockBackend } from '../services/mockBackend';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDebtAdded: () => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose, onDebtAdded }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await mockBackend.addDebt(user.id, {
        name,
        principal: parseFloat(principal),
        rate: parseFloat(rate),
        minPayment: minPayment ? parseFloat(minPayment) : 0 // Default to 0 if empty
      });
      setName('');
      setPrincipal('');
      setRate('');
      setMinPayment('');
      onDebtAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1E1E1E] rounded-2xl shadow-2xl border border-white/10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New Debt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase">Debt Name</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Visa Card"
                className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase">Total Balance</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase">APR Interest</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="18.99"
                  className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase">Min Monthly Payment (Optional)</label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="number"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                placeholder="150"
                className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Debt Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
