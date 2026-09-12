import React from 'react';

export default function Guides() {
  return (
    <>
      <div className="page-head">
        <p className="eyebrow">AEGISRA / OPERATOR GUIDES</p>
        <h1>Operator guides</h1>
        <p>Practical controls for a safer AO process lifecycle. These resources are public; no account or wallet is required.</p>
      </div>

      <div className="cap-grid" style={{ marginTop: '28px' }}>
        <article className="cap">
          <span className="cap-n">01 / BUILD</span>
          <h3>Before deployment</h3>
          <p>
            Minimize privileged handlers, constrain state transitions, and inspect all routes that dispatch messages.
          </p>
          <small>CHECKLIST / SOURCE REVIEW</small>
        </article>
        <article className="cap">
          <span className="cap-n">02 / OBSERVE</span>
          <h3>After deployment</h3>
          <p>
            Create a persistent process watch and route high-priority events into your team’s incident workflow.
          </p>
          <small>CHECKLIST / WATCH + WEBHOOK</small>
        </article>
        <article className="cap">
          <span className="cap-n">03 / RESPOND</span>
          <h3>When a signal arrives</h3>
          <p>
            Verify process ID, reproduce the event, pause affected actions where appropriate, then leave an evidence trail.
          </p>
          <small>CHECKLIST / TRIAGE</small>
        </article>
        <article className="cap">
          <span className="cap-n">04 / PROVE</span>
          <h3>Share review evidence</h3>
          <p>
            Use the inspection reference to give collaborators a stable record of what was assessed and when.
          </p>
          <small>CHECKLIST / REPORT REFERENCE</small>
        </article>
      </div>
    </>
  );
}
