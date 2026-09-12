import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import WalletModal from './components/WalletModal';
import Toast from './components/Toast';
import Home from './pages/Home';
import Console from './pages/Console';
import Audit from './pages/Audit';
import Faucet from './pages/Faucet';
import Certificates from './pages/Certificates';
import Guides from './pages/Guides';

export default function App() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (route) {
      case '/console':
        return <Console />;
      case '/audit':
        return <Audit />;
      case '/faucet':
        return <Faucet />;
      case '/certificates':
        return <Certificates />;
      case '/guides':
        return <Guides />;
      default:
        return <Home />;
    }
  };

  return (
    <>
      <div className="grain" />
      <Header currentRoute={route} />
      <main id="app">{renderPage()}</main>
      <AuthModal />
      <WalletModal />
      <Toast />
    </>
  );
}
