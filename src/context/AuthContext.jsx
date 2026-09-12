import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3200);
  };

  const api = async (path, method = 'GET', data = null) => {
    const headers = { 'Content-Type': 'application/json' };
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      headers['Authorization'] = 'Bearer ' + currentToken;
    }
    const res = await fetch('/api/' + path, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    const result = await res.json();
    if (res.status === 401) {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
      setAuthModalOpen(true);
    }
    if (!res.ok) {
      throw new Error(result.error || 'Request failed');
    }
    return result;
  };

  const login = (authToken, userData) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      api('me')
        .then((data) => {
          if (data.user) setUser(data.user);
        })
        .catch(() => logout());
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        wallet,
        setWallet,
        login,
        logout,
        api,
        showToast,
        toastMessage,
        toastVisible,
        authModalOpen,
        setAuthModalOpen,
        walletModalOpen,
        setWalletModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
