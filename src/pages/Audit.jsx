import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Audit() {
  const { user, api, showToast, setAuthModalOpen } = useAuth();
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [repoInput, setRepoInput] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuditSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await api('audits', 'POST', { name, source });
      setAuditResult(res.audit);
      showToast('Inspection saved to your account.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoCheck = async () => {
    try {
      const res = await api('github', 'POST', { repo: repoInput });
      setRepoData(res);
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <p className="eyebrow">AEGISRA / INSPECT SOURCE</p>
        <h1>Inspect source</h1>
        <p>Run a server-side heuristic review on Lua source. Findings and the content-addressable report reference are saved to your account.</p>
      </div>

      <div className="audit-layout">
        <section className="panel" style={{ padding: '24px' }}>
          <form onSubmit={handleAuditSubmit}>
            <label>
              Process name
              <input
                name="name"
                placeholder="Escrow process"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Lua source
              <textarea
                name="source"
                spellCheck="false"
                placeholder="Handlers.add('Transfer', ...)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
            <button className="button red" type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Run inspection'}
            </button>
          </form>

          <div className="github">
            <input
              id="repo"
              placeholder="owner/repository or github.com/owner/repository"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
            />
            <button className="button" id="repoBtn" type="button" onClick={handleRepoCheck}>
              Check GitHub repository
            </button>
          </div>
          {repoData && (
            <p className="muted" id="repoResult" style={{ marginTop: '12px' }}>
              Connected result:{' '}
              <a href={repoData.url} target="_blank" rel="noreferrer" style={{ color: 'var(--lime)' }}>
                {repoData.fullName}
              </a>{' '}
              · {repoData.defaultBranch} · {repoData.description || 'No description'}
            </p>
          )}
        </section>

        <aside className="output" id="auditResult">
          {auditResult ? (
            <>
              <p className="eyebrow">
                {auditResult.status.toUpperCase()} / {auditResult.reportRef}
              </p>
              <div className="score">{auditResult.score}</div>
              <p className="muted">Security confidence score. Review the following evidence before release.</p>
              {auditResult.findings &&
                auditResult.findings.map((f) => (
                  <div key={f.id} className={`finding ${f.severity === 'info' ? 'info' : ''}`}>
                    <b>
                      {f.title} · {f.severity.toUpperCase()}
                    </b>
                    <p>{f.guidance}</p>
                  </div>
                ))}
            </>
          ) : (
            <>
              <p className="eyebrow">REVIEW OUTPUT</p>
              <h3>Waiting for source.</h3>
              <p className="muted">
                Your output will show a score, findings, and report reference after the server completes inspection.
              </p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
