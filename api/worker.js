// Micro Defense – kleine Schnittstelle für die gemeinsame Bestenliste der Familie.
// GET  /scores            → die besten 20 (optional ?map=wiese&stufe=normal&regel=1)
// POST /scores  {name,pts,map,stufe,won,wave,waves} → speichern, Antwort: Platz + Liste
const ORIGINS = ['https://micro-defense.christian-hein.de'];
const MAPS = ['wiese', 'wueste', 'eis'];
const STUFEN = ['leicht', 'normal', 'schwer'];
const MAX_PTS = 3000000;          // mehr geht in einer Partie nicht – alles darüber ist geschummelt

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) || o.startsWith('http://localhost') ? o : ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
const json = (data, req, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req) } });

async function top(env, map, stufe, regel, limit = 20) {
  let sql = 'SELECT name, pts, map, stufe, won, wave, waves, created, ver, regel FROM scores';
  const w = [], args = [];
  if (Number.isInteger(regel)) { w.push('regel = ?'); args.push(regel); }
  if (MAPS.includes(map)) { w.push('map = ?'); args.push(map); }
  if (STUFEN.includes(stufe)) { w.push('stufe = ?'); args.push(stufe); }
  if (w.length) sql += ' WHERE ' + w.join(' AND ');
  sql += ' ORDER BY pts DESC, created ASC LIMIT ?'; args.push(limit);
  const r = await env.DB.prepare(sql).bind(...args).all();
  return r.results || [];
}

async function ipHash(req) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('md-' + ip));
  return [...new Uint8Array(d)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });

    if (url.pathname === '/scores' && req.method === 'GET') {
      return json({ scores: await top(env, url.searchParams.get('map'), url.searchParams.get('stufe'), url.searchParams.has('regel') ? parseInt(url.searchParams.get('regel')) : undefined) }, req);
    }

    // POST /scores        {name,pts,map,stufe,won,wave,waves,d}  → ein Eintrag
    // POST /scores/import {entries:[...]}                         → alle Einträge eines Geräts (max. 25), doppelte werden übersprungen
    if ((url.pathname === '/scores' || url.pathname === '/scores/import') && req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ error: 'kein JSON' }, req, 400); }
      const list = url.pathname === '/scores' ? [b] : (Array.isArray(b.entries) ? b.entries.slice(0, 25) : []);
      const now = Date.now(), ip = await ipHash(req);
      const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE ip = ? AND recv > ?').bind(ip, now - 5000).first();
      if (recent && recent.n >= 25) return json({ error: 'zu schnell' }, req, 429);
      const ok = [], stmts = [];
      for (const e of list) {
        const name = String(e.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14) || 'Unbekannt';
        const pts = Math.round(Number(e.pts));
        if (!Number.isFinite(pts) || pts < 0 || pts > MAX_PTS) continue;
        if (!MAPS.includes(e.map) || !STUFEN.includes(e.stufe)) continue;
        const wave = Math.max(0, Math.min(99, e.wave | 0)), waves = Math.max(0, Math.min(99, e.waves | 0));
        let created = Math.round(Number(e.d)); if (!(created > 1.7e12 && created <= now + 60000)) created = now;
        const ver = String(e.ver || 'unbekannt').slice(0, 20), regel = Math.max(1, Math.min(999, e.regel | 0 || 1));
        stmts.push(env.DB.prepare('INSERT OR IGNORE INTO scores (name, pts, map, stufe, won, wave, waves, created, recv, ip, ver, regel) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(name, pts, e.map, e.stufe, e.won ? 1 : 0, wave, waves, created, now, ip, ver, regel));
        ok.push({ d: e.d, pts, regel });
      }
      if (stmts.length) await env.DB.batch(stmts);
      const last = ok[ok.length - 1];
      const rank = last ? await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE pts > ? AND regel = ?').bind(last.pts, last.regel).first() : null;
      return json({ ok: true, angenommen: ok.map(x => x.d), platz: rank ? rank.n + 1 : null, scores: last ? await top(env, null, null, last.regel) : [] }, req);
    }

    return new Response('Micro Defense API 🥦', { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cors(req) } });
  },
};
