/**
 * AegisRA — Cloudflare Worker (ported from server.cjs).
 *
 * Same HTTP API and auth contract as the original Node server, adapted to the
 * Workers runtime: a `fetch` handler instead of http.createServer, Cloudflare D1
 * instead of node:sqlite, and Web Crypto instead of node:crypto. The built React
 * SPA is served from static assets (env.ASSETS); /api/* is handled here on D1.
 */

const now = () => new Date().toISOString();

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) =>
  new Uint8Array((hex.match(/.{1,2}/g) || []).map((b) => parseInt(b, 16)));

const randomHex = (n) => toHex(crypto.getRandomValues(new Uint8Array(n)));
const id = (p) => p + '_' + randomHex(12);

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(str) {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)));
}

// Constant-time compare of two equal-length hex strings.
function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Password hashing: PBKDF2-HMAC-SHA256 via Web Crypto (Workers has no scrypt).
// Stored as pbkdf2$<iterations>$<saltHex>$<hashHex> — strong, salted, slow.
const PBKDF2_ITER = 100000;

async function deriveHex(password, salt, iter) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, keyMaterial, 256
  );
  return toHex(bits);
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashHex = await deriveHex(password, salt, PBKDF2_ITER);
  return `pbkdf2$${PBKDF2_ITER}$${toHex(salt)}$${hashHex}`;
}

async function verifyPassword(password, record) {
  const parts = String(record).split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const got = await deriveHex(password, fromHex(parts[2]), parseInt(parts[1], 10));
  return timingSafeEqualHex(got, parts[3]);
}

function send(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function parseBody(request) {
  const text = await request.text();
  if (!text) return {};
  if (text.length > 1e6) throw new Error('Request exceeds 1 MB.');
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON.'); }
}

function getCfg(env) {
  return {
    githubId: env.GITHUB_CLIENT_ID || '',
    githubSecret: env.GITHUB_CLIENT_SECRET || '',
    walletConnect: env.WALLETCONNECT_PROJECT_ID || '',
    aoGateway: env.AO_GATEWAY_URL || '',
    uploadUrl: env.ARWEAVE_UPLOAD_URL || '',
    uploadToken: env.ARWEAVE_UPLOAD_TOKEN || '',
    faucet: Boolean(env.EVM_RPC_URL && env.FAUCET_PRIVATE_KEY && env.FAUCET_TOKEN_CONTRACT),
  };
}

function integrations(cfg) {
  return {
    githubOAuth: Boolean(cfg.githubId && cfg.githubSecret),
    walletConnect: Boolean(cfg.walletConnect),
    aoMonitoring: Boolean(cfg.aoGateway),
    immutableReports: Boolean(cfg.uploadUrl && cfg.uploadToken),
    faucet: cfg.faucet,
  };
}

function inspect(source) {
  const tests = [
    ['Privileged execution path', /\bonlyOwner\b|\bowner\b|\bOwner\b|msg\.sender\s*==/i, 'high',
      'Verify privileged actions are intentionally restricted and ownership can be safely rotated.'],
    ['External value movement', /\.call\{|\.transfer\(|\.send\(|transferFrom\s*\(/, 'medium',
      'Review external calls for reentrancy protection, return-value handling, and state-update ordering.'],
    ['Message or handler surface', /Handlers\.add|ao\.send|Send\s*\(/, 'medium',
      'Validate message tags, payload structure, sender identity, and expected recipient.'],
    ['Time-dependent branch', /block\.timestamp|expiresAt|os\.time/, 'low',
      'Confirm time windows have clear expiry behavior.'],
  ];
  let f = tests.filter((t) => t[1].test(source))
    .map((t) => ({ id: id('finding'), title: t[0], severity: t[2], guidance: t[3] }));
  if (!f.length)
    f = [{ id: id('finding'), title: 'Manual review advised', severity: 'info',
      guidance: 'No high-signal patterns matched. This does not prove the source is secure.' }];
  const d = { high: 28, medium: 14, low: 6, info: 2 };
  return {
    findings: f,
    score: Math.max(25, 94 - f.reduce((n, x) => n + d[x.severity], 0)),
    status: f.some((x) => x.severity === 'high') ? 'attention' : 'reviewed',
  };
}

async function repo(name) {
  const m = String(name).match(/(?:github\.com\/)?([\w.-]+)\/([\w.-]+)/i);
  if (!m) throw new Error('Use owner/repository or a GitHub repository URL.');
  // Cache successful lookups: GitHub rate-limits unauthenticated requests per IP,
  // and Workers egress from shared IPs, so repeat lookups would otherwise 403.
  const cacheKey = new Request(`https://aegisra-cache.internal/gh/${m[1].toLowerCase()}/${m[2].toLowerCase()}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return await hit.json();

  const api = `https://api.github.com/repos/${m[1]}/${m[2]}`;
  let r;
  for (let i = 0; i < 3; i++) {
    r = await fetch(api, { headers: { 'User-Agent': 'Aegisra/1.0', Accept: 'application/vnd.github+json' } });
    if (r.ok || r.status === 404) break; // retry only transient rate-limit (403/429)
  }
  if (!r.ok) throw new Error(r.status === 404 ? 'Repository not found or private.' : `GitHub lookup failed (HTTP ${r.status}). Public GitHub API rate limit; please retry.`);
  const x = await r.json();
  const data = {
    fullName: x.full_name, defaultBranch: x.default_branch, description: x.description,
    url: x.html_url, updatedAt: x.updated_at, private: x.private,
  };
  await cache.put(cacheKey, new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=600' },
  }));
  return data;
}

async function publish(cfg, audit) {
  if (!integrations(cfg).immutableReports) return null;
  const r = await fetch(cfg.uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.uploadToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(audit),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error('Immutable report upload failed.');
  const x = await r.json();
  return x.id || x.txId || x.url;
}

async function current(request, env) {
  const t = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return null;
  const row = await env.DB.prepare(
    'SELECT u.id, u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?'
  ).bind(await sha256Hex(t), now()).first();
  return row || null;
}

const SESSION_MS = 6048e5; // 7 days

async function handleApi(request, env, url) {
  const method = request.method;
  const cfg = getCfg(env);
  try {
    const x = method === 'GET' ? {} : await parseBody(request);

    if (url.pathname === '/api/health')
      return send(200, { ok: true, time: now(), integrations: integrations(cfg) });

    if (url.pathname === '/api/integrations')
      return send(200, integrations(cfg));

    if (url.pathname === '/api/register' && method === 'POST') {
      const email = String(x.email || '').trim().toLowerCase();
      const pass = String(x.password || '');
      if (!/^\S+@\S+\.\S+$/.test(email) || pass.length < 8)
        return send(400, { error: 'Use a valid email and a password of at least 8 characters.' });
      const uid = id('usr');
      const password = await hashPassword(pass);
      try {
        await env.DB.prepare('INSERT INTO users VALUES (?,?,?,?)').bind(uid, email, password, now()).run();
      } catch (e) {
        if (String((e && e.message) || e).includes('UNIQUE')) return send(409, { error: 'That email already has an account.' });
        throw e;
      }
      const token = randomToken();
      await env.DB.prepare('INSERT INTO sessions VALUES (?,?,?)')
        .bind(await sha256Hex(token), uid, new Date(Date.now() + SESSION_MS).toISOString()).run();
      return send(201, { token, user: { id: uid, email } });
    }

    if (url.pathname === '/api/login' && method === 'POST') {
      const user = await env.DB.prepare('SELECT * FROM users WHERE email=?')
        .bind(String(x.email || '').trim().toLowerCase()).first();
      if (!user || !(await verifyPassword(String(x.password || ''), user.password)))
        return send(401, { error: 'Invalid email or password.' });
      const token = randomToken();
      await env.DB.prepare('INSERT INTO sessions VALUES (?,?,?)')
        .bind(await sha256Hex(token), user.id, new Date(Date.now() + SESSION_MS).toISOString()).run();
      return send(200, { token, user: { id: user.id, email: user.email } });
    }

    if (url.pathname === '/api/github' && method === 'POST')
      return send(200, await repo(x.repo));

    if (url.pathname === '/api/github/oauth/start')
      return integrations(cfg).githubOAuth
        ? send(501, { error: 'Configure a production HTTPS redirect URI before OAuth is enabled.' })
        : send(503, { error: 'GitHub OAuth is not configured.' });

    const u = await current(request, env);
    if (!u) return send(401, { error: 'Authentication required.' });

    if (url.pathname === '/api/me') {
      const audits = (await env.DB.prepare(
        'SELECT id, name, score, status, findings, report_ref AS reportRef, created_at AS createdAt, published_at AS publishedAt FROM audits WHERE user_id=? ORDER BY created_at DESC'
      ).bind(u.id).all()).results.map((a) => ({ ...a, findings: JSON.parse(a.findings) }));
      const watches = (await env.DB.prepare(
        'SELECT id, label, process_id AS processId, webhook, state, created_at AS createdAt FROM watches WHERE user_id=? ORDER BY created_at DESC'
      ).bind(u.id).all()).results;
      const claims = (await env.DB.prepare(
        'SELECT id, wallet, amount, status, tx_hash AS txHash, created_at AS createdAt FROM claims WHERE user_id=? ORDER BY created_at DESC'
      ).bind(u.id).all()).results;
      return send(200, { user: u, audits, watches, claims, integrations: integrations(cfg) });
    }

    if (url.pathname === '/api/audits' && method === 'POST') {
      const source = String(x.source || '');
      if (source.length < 10) return send(400, { error: 'Paste at least 10 characters of source.' });
      const review = inspect(source);
      const a = {
        id: id('audit'), name: String(x.name || 'Untitled source').slice(0, 120),
        sourceHash: await sha256Hex(source), ...review,
        reportRef: `local://${randomHex(18)}`, createdAt: now(),
      };
      await env.DB.prepare('INSERT INTO audits VALUES (?,?,?,?,?,?,?,?,?,?)').bind(
        a.id, u.id, a.name, a.sourceHash, a.score, a.status,
        JSON.stringify(a.findings), a.reportRef, a.createdAt, null
      ).run();
      try {
        const ref = await publish(cfg, a);
        if (ref) {
          a.reportRef = ref; a.publishedAt = now();
          await env.DB.prepare('UPDATE audits SET report_ref=?,published_at=? WHERE id=?')
            .bind(ref, a.publishedAt, a.id).run();
        }
      } catch (e) { a.publishError = e.message; }
      return send(201, { audit: a });
    }

    if (url.pathname === '/api/watches' && method === 'POST') {
      const processId = String(x.processId || '').trim();
      const webhook = String(x.webhook || '').trim();
      if (processId.length < 8) return send(400, { error: 'Enter a valid process ID.' });
      if (webhook) {
        try { if (new URL(webhook).protocol !== 'https:') throw new Error(); }
        catch { return send(400, { error: 'Webhook URL must use HTTPS.' }); }
      }
      const w = {
        id: id('watch'), label: String(x.label || 'Unlabelled process').slice(0, 120),
        processId, webhook, state: 'active', createdAt: now(),
      };
      await env.DB.prepare('INSERT INTO watches VALUES (?,?,?,?,?,?,?)')
        .bind(w.id, u.id, w.label, w.processId, w.webhook, w.state, w.createdAt).run();
      return send(201, { watch: w });
    }

    const matchAlert = url.pathname.match(/^\/api\/watches\/([^/]+)\/test-alert$/);
    if (matchAlert && method === 'POST') {
      const w = await env.DB.prepare('SELECT * FROM watches WHERE id=? AND user_id=?').bind(matchAlert[1], u.id).first();
      if (!w) return send(404, { error: 'Watch not found.' });
      if (!w.webhook) return send(400, { error: 'This watch has no webhook.' });
      let d;
      try {
        const target = new URL(w.webhook);
        if (target.protocol !== 'https:') throw new Error('Webhook must use HTTPS.');
        const out = await fetch(target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Aegisra/1.0' },
          body: JSON.stringify({ type: 'aegisra.test_alert', processId: w.process_id, at: now() }),
          signal: AbortSignal.timeout(8000),
        });
        d = { status: out.ok ? 'delivered' : 'failed', code: out.status };
      } catch (e) { d = { status: 'failed', error: e.message }; }
      await env.DB.prepare('INSERT INTO deliveries VALUES (?,?,?,?,?)')
        .bind(id('delivery'), w.id, d.status, d.code || null, now()).run();
      return send(200, { delivery: d });
    }

    if (url.pathname === '/api/faucet' && method === 'POST') {
      const wallet = String(x.wallet || '');
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet))
        return send(400, { error: 'Connect an EVM wallet or use a valid 0x address.' });
      if (await env.DB.prepare('SELECT id FROM claims WHERE lower(wallet)=lower(?)').bind(wallet).first())
        return send(409, { error: 'This wallet has already claimed a test allocation.' });
      return send(503, { error: cfg.faucet ? 'Faucet transfer adapter is awaiting token deployment settings.' : 'The faucet signer is not configured.' });
    }

    return send(404, { error: 'Route not found.' });
  } catch (e) {
    return send(500, { error: (e && e.message) || 'Unexpected server error.' });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
    // Everything else: the built React SPA, served from static assets.
    return env.ASSETS.fetch(request);
  },
};
