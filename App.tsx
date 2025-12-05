import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginScreen } from './app/(auth)/login';
import { RegisterScreen } from './app/(auth)/register';
import { Dashboard } from './app/(tabs)/index';
import { SettingsScreen } from './app/(tabs)/settings';
import { DebtSimulator } from './app/(tabs)/debt';
import { InsightsScreen } from './app/(tabs)/insights';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'debt' | 'settings' | 'insights'>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  if (!user) {
    return authView === 'login' 
      ? <LoginScreen onSwitchToRegister={() => setAuthView('register')} />
      : <RegisterScreen onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <Layout activeTab={currentTab} onNavigate={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'insights' && <InsightsScreen />}
      {currentTab === 'debt' && <DebtSimulator />}
      {currentTab === 'settings' && <SettingsScreen />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
