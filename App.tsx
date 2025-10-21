import React, { useState, useCallback } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

type AuthView = 'login' | 'register';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);
  
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAuthView('login');
  }, []);

  const toggleAuthView = useCallback(() => {
    setAuthView(prev => prev === 'login' ? 'register' : 'login');
  }, []);

  if (isAuthenticated) {
    return <DashboardPage onLogout={handleLogout} />;
  }

  if (authView === 'login') {
    return <LoginPage onLogin={handleLogin} onToggleView={toggleAuthView} />;
  }

  return <RegisterPage onRegister={handleLogin} onGoToLogin={toggleAuthView} />;
}

export default App;