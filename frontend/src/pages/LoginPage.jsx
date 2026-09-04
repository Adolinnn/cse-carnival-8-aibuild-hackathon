import React from 'react';
import { LoginView } from '../components/auth/LoginView';

export function LoginPage({ onLogin, theme, onToggleTheme }) {
  return (
    <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200" id="page-login">
      <LoginView
        onLogin={onLogin}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}

export default LoginPage;
