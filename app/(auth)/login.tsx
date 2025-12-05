import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockBackend } from '../../services/mockBackend';
import { Lock, Mail, Wallet, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('john@example.com'); // Pre-fill for demo convenience
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { token, user } = await mockBackend.login(email, password);
      login(token, user);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 text-white font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] mb-4">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SpendScope</h1>
          <p className="text-gray-500 text-sm mt-1">Master your money with premium analytics</p>
        </div>

        {/* Card */}
        <div className="w-full bg-[#18181b] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Welcome Back</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center space-x-2 text-sm mb-4">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-gray-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <button onClick={onSwitchToRegister} className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
