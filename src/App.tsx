/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';
import { DepositPage } from './pages/DepositPage';
import { HelpPage } from './pages/HelpPage';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { MemberPage } from './pages/MemberPage';
import { PlanPage } from './pages/PlanPage';
import { TeamPage } from './pages/TeamPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { PlatformProvider, usePlatform } from './store/alphaStore';
import { initEmailJs } from './utils/notifications';

function parseHash() {
  const raw = window.location.hash.slice(1) || '/';
  const [path, query] = raw.split('?');
  return {
    path: path || '/',
    params: new URLSearchParams(query || ''),
  };
}

function AppRouter() {
  const { loading, isAuthenticated, isAdminMode } = usePlatform();
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((target: string) => {
    window.location.hash = target;
    window.scrollTo(0, 0);
  }, []);

  const { path, params } = route;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-med-forest via-med-deep to-med-emerald">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white font-bold tracking-wide">MED</p>
        </div>
      </div>
    );
  }

  if (path.startsWith('/admin')) {
    if (isAuthenticated && isAdminMode) {
      return <AdminPage navigate={navigate} />;
    }
    return <AuthPage navigate={navigate} initialMode="adminLogin" />;
  }

  if (!isAuthenticated) {
    if (path === '/auth') {
      const modeParam = params.get('mode');
      const initialMode =
        modeParam === 'signup'
          ? 'signup'
          : modeParam === 'adminLogin'
            ? 'adminLogin'
            : 'login';
      const initialRef = (params.get('ref') || '').toUpperCase();
      return (
        <AuthPage
          navigate={navigate}
          initialMode={initialMode}
          initialRef={initialRef}
        />
      );
    }
    return <LandingPage navigate={navigate} />;
  }

  if (isAdminMode) {
    return <AdminPage navigate={navigate} />;
  }

  let content: React.ReactNode;
  switch (path) {
    case '/home':
    case '/':
      content = <HomePage navigate={navigate} />;
      break;
    case '/plan':
      content = <PlanPage navigate={navigate} />;
      break;
    case '/deposit':
      content = <DepositPage navigate={navigate} />;
      break;
    case '/withdraw':
      content = <WithdrawPage navigate={navigate} />;
      break;
    case '/team':
      content = <TeamPage navigate={navigate} />;
      break;
    case '/member':
      content = <MemberPage navigate={navigate} />;
      break;
    case '/help':
      content = <HelpPage navigate={navigate} />;
      break;
    default:
      content = <HomePage navigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {content}
      <BottomNav navigate={navigate} currentPath={path} />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initEmailJs();
  }, []);

  return (
    <PlatformProvider>
      <ToastContainer />
      <AppRouter />
    </PlatformProvider>
  );
}
