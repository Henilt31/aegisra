import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Faucet() {
  const { user, wallet, setWallet, api, showToast, setAuthModalOpen } = useAuth();
  const [inputWallet, setInputWallet] = useState(wallet || '');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No browser wallet was found. Install or enable MetaMask, then retry.');
      }
      const [a] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(a);
      setInputWallet(a);
      showToast('Wallet connected: ' + a.slice(0, 6) + '…' + a.slice(-4));
    } catch (err) {
      showToast(err.message);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await api('faucet', 'POST', { wallet: inputWallet });
      showToast(`${res.claim ? res.claim.amount : 'Test'} allocation queued.`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">AEGISRA / TESTNET ALLOCATION</p>
        <h1>Testnet allocation</h1>
        <p>Request a single development allocation for a connected EVM wallet. Claims are persisted, rate-limited per wallet, and visible in your console.</p>
      </div>

      <div className="audit-layout">
        <section className="panel" style={{ padding: '24px' }}>
          <p className="eyebrow">25 TEST / ONE-TIME CLAIM</p>
          <h2 style={{ fontSize: '34px', letterSpacing: '-0.06em' }}>
            Fund your evaluation environment.
          </h2>
          <p className="muted">
            Use the test allocation to evaluate process interactions and alert routes without using production assets.
          </p>
          <form onSubmit={handleClaimSubmit}>
            <label>
              Wallet address
              <input
                name="wallet"
                id="wallet"
                placeholder="0x..."
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
              />
            </label>
            <button type="button" className="button" id="connect" onClick={handleConnect}>
              Connect browser wallet
            </button>
            <button className="button red" type="submit" disabled={loading}>
              {loading ? 'Requesting...' : 'Request allocation'}
            </button>
          </form>
        </section>

        <aside className="output">
          <p className="eyebrow">ALLOCATION RULES</p>
          <h3>Clear, visible limits.</h3>
          <div className="finding info">
            <b>ONE ADDRESS, ONE CLAIM</b>
            <p>A wallet can request one test allocation.</p>
          </div>
          <div className="finding info">
            <b>OPERATOR ACCOUNT REQUIRED</b>
            <p>Claims are associated with your Aegisra identity.</p>
          </div>
          <div className="finding info">
            <b>NOT PRODUCTION VALUE</b>
            <p>Test tokens are intended solely for integration evaluation.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
