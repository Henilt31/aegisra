import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function WalletModal() {
  const { walletModalOpen, setWalletModalOpen, setWallet, showToast } = useAuth();

  if (!walletModalOpen) return null;

  const linkWallet = async (type) => {
    try {
      if (type === 'evm') {
        if (!window.ethereum) {
          throw new Error('No injected EVM wallet was found. Install MetaMask or open this site in a wallet browser.');
        }
        const [a] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(a);
        showToast('Browser wallet connected: ' + a.slice(0, 6) + '…' + a.slice(-4));
      } else if (type === 'arconnect') {
        if (!window.arweaveWallet) {
          throw new Error('ArConnect is not available. Install the ArConnect extension, then retry.');
        }
        await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);
        const a = await window.arweaveWallet.getActiveAddress();
        setWallet(a);
        showToast('ArConnect wallet linked: ' + a.slice(0, 6) + '…' + a.slice(-4));
      } else {
        throw new Error('WalletConnect needs a Project ID.');
      }
      setWalletModalOpen(false);
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setWalletModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={() => setWalletModalOpen(false)}>
          ×
        </button>
        <p className="eyebrow">WALLET LINK</p>
        <h2>Choose a connector.</h2>
        <p className="muted">Wallet authorization is requested only after selecting a provider.</p>
        <div className="wallet-options">
          <button className="wallet-option" onClick={() => linkWallet('arconnect')}>
            <span className="wallet-icon ar">A</span>
            <span>
              <b>ArConnect</b>
              <small>Arweave / AO extension</small>
            </span>
            <em>→</em>
          </button>
          <button className="wallet-option" onClick={() => linkWallet('evm')}>
            <span className="wallet-icon evm">◇</span>
            <span>
              <b>Browser wallet</b>
              <small>MetaMask and injected EVM wallets</small>
            </span>
            <em>→</em>
          </button>
          <button
            className="wallet-option unavailable"
            onClick={() => linkWallet('walletconnect')}
          >
            <span className="wallet-icon wc">W</span>
            <span>
              <b>WalletConnect</b>
              <small>Mobile wallet relay</small>
            </span>
            <em>↗</em>
          </button>
        </div>
        <p className="wallet-note">WalletConnect becomes available after adding a WalletConnect Project ID.</p>
      </div>
    </div>
  );
}
