/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '') || 'home';
      setCurrentRoute(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = `/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
        
        {/* Navigation */}
        <Navbar currentRoute={currentRoute} onNavigate={navigateTo} />

        {/* Views */}
        <main className="flex-1">
          {currentRoute === 'home' && (
            <HomePage onNavigate={navigateTo} />
          )}

          {currentRoute === 'register' && (
            <RegisterPage onNavigate={navigateTo} />
          )}

          {currentRoute === 'login' && (
            <LoginPage onNavigate={navigateTo} />
          )}

          {currentRoute === 'student-dashboard' && (
            <StudentDashboard onNavigate={navigateTo} />
          )}

          {currentRoute === 'admin-login' && (
            <AdminLoginPage onNavigate={navigateTo} />
          )}

          {currentRoute === 'admin-dashboard' && (
            <AdminDashboard onNavigate={navigateTo} />
          )}
        </main>

        {/* Simple Footer */}
        <Footer />

      </div>
    </AuthProvider>
  );
}
