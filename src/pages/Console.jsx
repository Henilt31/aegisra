import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Console() {
  const { user, api, showToast, setAuthModalOpen } = useAuth();
  const [data, setData] = useState({ audits: [], watches: [] });
  const [label, setLabel] = useState('');
  const [processId, setProcessId] = useState('');
  const [webhook, setWebhook] = useState('');

  const loadData = async () => {
    try {
      const res = await api('me');
      setData(res);
    } catch (err) {
      showToast(err.message);
    }
  };

  useEffect(() => {
    if (!user) {
      setAuthModalOpen(true);
    } else {
      loadData();
    }
  }, [user]);

  const handleWatchSubmit = async (e) => {
    e.preventDefault();
    try {
      await api('watches', 'POST', { label, processId, webhook });
      showToast('Watch activated.');
      setLabel('');
      setProcessId('');
      setWebhook('');
      loadData();
    } catch (err) {
      showToast(err.message);
    }
  };

  if (!user) {
    return (
      <div className="page-head">
        <p className="eyebrow">AEGISRA / CONSOLE</p>
        <h1>Security console</h1>
        <p>Please sign in to access your security telemetry console.</p>
      </div>
    );
  }

  const audits = data.audits || [];
  const watches = data.watches || [];

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">AEGISRA / SECURITY CONSOLE</p>
        <h1>Security console</h1>
        <p>Your authenticated control surface for reviews, protected processes, test allocations, and source connections.</p>
      </div>

      <div className="console-grid">
        <article className="panel">
          <div className="stat">{audits.length}</div>
          <div className="stat-label">COMPLETED INSPECTIONS</div>
        </article>
        <article className="panel">
          <div className="stat">{watches.filter((x) => x.state === 'active').length}</div>
          <div className="stat-label">ACTIVE PROCESS WATCHES</div>
        </article>

        <article className="panel wide">
          <h3>Deploy a process watch</h3>
          <form onSubmit={handleWatchSubmit}>
            <div className="two-col">
              <label>
                Process label
                <input
                  name="label"
                  placeholder="Payments controller"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </label>
              <label>
                AO process ID
                <input
                  name="processId"
                  placeholder="Process identifier"
                  value={processId}
                  onChange={(e) => setProcessId(e.target.value)}
                />
              </label>
            </div>
            <label>
              Webhook endpoint (optional)
              <input
                name="webhook"
                type="url"
                placeholder="https://your-service.example/alerts"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
              />
            </label>
            <button className="button red" type="submit">
              Activate watch
            </button>
          </form>
        </article>

        <article className="panel wide">
          <h3>Recent inspections</h3>
          <div className="list">
            {audits.length ? (
              audits.map((a) => (
                <div className="record" key={a.id}>
                  <div>
                    <strong>{a.name}</strong>
                    <br />
                    <span>
                      {new Date(a.createdAt).toLocaleString()} · {a.reportRef}
                    </span>
                  </div>
                  <div>
                    <span className={`pill ${a.status}`}>{a.status}</span>{' '}
                    <strong>{a.score}/100</strong>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No inspections yet. Submit source code to create your first record.</p>
            )}
          </div>
        </article>

        <article className="panel wide">
          <h3>Protected processes</h3>
          <div className="list">
            {watches.length ? (
              watches.map((w) => (
                <div className="record" key={w.id}>
                  <div>
                    <strong>{w.label}</strong>
                    <br />
                    <span>{w.processId}</span>
                  </div>
                  <span className="pill active">{w.state}</span>
                </div>
              ))
            ) : (
              <p className="muted">No process watches are active.</p>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
