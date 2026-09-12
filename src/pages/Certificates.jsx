import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Certificates() {
  const { user, api, showToast, setAuthModalOpen } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      api('me')
        .then((res) => setItems(res.audits || []))
        .catch((err) => showToast(err.message));
    }
  }, [user]);

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">AEGISRA / VERIFICATION RECORDS</p>
        <h1>Verification records</h1>
        <p>Publicly shareable inspection evidence, generated when a source review is completed.</p>
      </div>

      <div className="console-grid">
        <article className="panel wide">
          <h3>Issued verification records</h3>
          <div className="list">
            {items.length ? (
              items.map((a) => (
                <div className="record" key={a.id}>
                  <div>
                    <strong>{a.name}</strong>
                    <br />
                    <span>
                      {a.reportRef} · {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className={`pill ${a.status}`}>{a.status}</span>{' '}
                    <strong>{a.score}/100</strong>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">
                No record has been issued. Run a source inspection to produce verifiable evidence.
              </p>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
