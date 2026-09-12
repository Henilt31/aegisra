import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ currentRoute }) {
  const { user, wallet, setAuthModalOpen, setWalletModalOpen } = useAuth();

  return (
    <header>
      <a className="brand" href="#/">
        AEGISRA<span>_</span>
      </a>
      <nav>
        <a href="#/console" className={currentRoute === '/console' ? 'active' : ''}>
          Console
        </a>
        <a href="#/audit" className={currentRoute === '/audit' ? 'active' : ''}>
          Inspect
        </a>
        <a href="#/certificates" className={currentRoute === '/certificates' ? 'active' : ''}>
          Proof
        </a>
        <a href="#/guides" className={currentRoute === '/guides' ? 'active' : ''}>
          Guides
        </a>
      </nav>
      <div className="head-actions">
        <span id="identity" className="identity">
          {user ? 'VERIFIED' : 'UNVERIFIED'}
        </span>
        <button
          className="button wallet-button"
          onClick={() => setWalletModalOpen(true)}
          type="button"
        >
          <i />
          <span>
            {wallet ? wallet.slice(0, 6) + '…' + wallet.slice(-4) : 'Connect wallet'}
          </span>
        </button>
        <button
          className="button subtle"
          onClick={() => setAuthModalOpen(true)}
          type="button"
        >
          {user ? (user.email ? user.email.split('@')[0] : 'Account') : 'Sign in'}
        </button>
      </div>
    </header>
  );
}
