import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

type AuthView = 'login' | 'register';

function AppContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <DashboardPage onLogout={logout} />;
  }

  if (authView === 'login') {
    return <LoginPage onToggleView={() => setAuthView('register')} />;
  }

  return <RegisterPage onGoToLogin={() => setAuthView('login')} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;