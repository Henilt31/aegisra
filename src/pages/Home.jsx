import React from 'react';

export default function Home() {
  return (
    <>
      <div className="hero">
        <div>
          <p className="eyebrow">SECURITY OBSERVABILITY FOR AO</p>
          <h1>
            Know what your<br />
            code does <em>next.</em>
          </h1>
          <p>
            Aegisra examines process logic before you ship, then keeps an independent signal line on the code that is already live.
          </p>
          <div className="buttons">
            <a className="button red" href="#/audit">
              Inspect source
            </a>
            <a className="button" href="#/console">
              Open console
            </a>
          </div>
        </div>
        <div className="system-card">
          <h4>NETWORK POSTURE / AO TESTNET</h4>
          <div className="metric-row">
            <span>PROCESS INTEGRITY</span>
            <b>STABLE 98%</b>
          </div>
          <div className="meter">
            <i style={{ width: '98%' }} />
          </div>
          <div className="metric-row">
            <span>EVENT SURFACE</span>
            <b>OBSERVING</b>
          </div>
          <div className="meter">
            <i style={{ width: '76%' }} />
          </div>
          <div className="metric-row">
            <span>RESPONSE CHANNEL</span>
            <b>READY</b>
          </div>
          <div className="meter">
            <i style={{ width: '92%' }} />
          </div>
        </div>
      </div>

      <div className="ticker">
        <span>
          <strong>LIVE</strong> EVENT INTELLIGENCE
        </span>
        <span>PRE-DEPLOYMENT REVIEW</span>
        <span>PROCESS WATCHES</span>
        <span>ARWEAVE-ADDRESSABLE REPORTS</span>
      </div>

      <section>
        <div className="section-kicker">
          <p className="eyebrow">TWO LAYERS / ONE CONTROL PLANE</p>
        </div>
        <h2 className="section-title">
          Coverage that stays<br />
          with the process.
        </h2>
        <div className="cap-grid">
          <article className="cap">
            <span className="cap-n">01 / BEFORE RELEASE</span>
            <h3>Source inspection</h3>
            <p>
              Examine Lua process code for unsafe control paths, message patterns, and missing guards before deployment.
            </p>
            <small>OUTPUT / FINDINGS + REPORT REF</small>
          </article>
          <article className="cap">
            <span className="cap-n">02 / AFTER RELEASE</span>
            <h3>Process watches</h3>
            <p>
              Attach a persistent watch to a process ID, capture its operating context, and route important signals to your team.
            </p>
            <small>OUTPUT / STATUS + WEBHOOK</small>
          </article>
          <article className="cap">
            <span className="cap-n">03 / EVIDENCE</span>
            <h3>Verifiable records</h3>
            <p>
              Every completed inspection receives a content-addressable report reference for transparent review and handoff.
            </p>
            <small>OUTPUT / IMMUTABLE REFERENCE</small>
          </article>
          <article className="cap">
            <span className="cap-n">04 / DELIVERY</span>
            <h3>Signal routing</h3>
            <p>
              Connect your development loop through repository lookup and optional webhook endpoints for incident delivery.
            </p>
            <small>OUTPUT / WEBHOOK + GITHUB</small>
          </article>
        </div>
      </section>

      <div className="footer-cta">
        <p className="eyebrow">SECURITY IS A CONTINUOUS STATE</p>
        <h2>
          Build it.<br />
          <em>Watch it.</em>
        </h2>
        <a className="button red" href="#/audit">
          Start an inspection
        </a>
      </div>
    </>
  );
}
