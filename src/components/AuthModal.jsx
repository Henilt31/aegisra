import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, login, api, showToast } = useAuth();
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const res = await api(endpoint, 'POST', { email, password });
      login(res.token, res.user);
      showToast('Access granted.');
      setAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setAuthModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={() => setAuthModalOpen(false)}>
          ×
        </button>
        <p className="eyebrow">ACCESS CONTROL</p>
        <h2>Enter the perimeter.</h2>
        <p className="muted">
          Save inspections, watches, and allocations under one operator identity.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              placeholder="operator@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button red" type="submit" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Already registered? Sign in' : 'Need an account? Create one'}
          </button>
        </form>
      </div>
    </div>
  );
}
