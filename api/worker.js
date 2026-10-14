// Micro Defense – kleine Schnittstelle für die gemeinsame Bestenliste der Familie.
// GET  /scores            → die besten 20 (optional ?map=wiese&stufe=normal)
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

async function top(env, map, stufe, limit = 20) {
  let sql = 'SELECT name, pts, map, stufe, won, wave, waves, created FROM scores';
  const w = [], args = [];
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
      return json({ scores: await top(env, url.searchParams.get('map'), url.searchParams.get('stufe')) }, req);
    }

    if (url.pathname === '/scores' && req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ error: 'kein JSON' }, req, 400); }
      const name = String(b.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14) || 'Unbekannt';
      const pts = Math.round(Number(b.pts));
      if (!Number.isFinite(pts) || pts < 0 || pts > MAX_PTS) return json({ error: 'Punkte ungültig' }, req, 400);
      if (!MAPS.includes(b.map) || !STUFEN.includes(b.stufe)) return json({ error: 'Karte/Stufe ungültig' }, req, 400);
      const wave = Math.max(0, Math.min(99, b.wave | 0)), waves = Math.max(0, Math.min(99, b.waves | 0));
      const now = Date.now(), ip = await ipHash(req);
      // höchstens ein Eintrag alle 20 Sekunden pro Anschluss
      const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE ip = ? AND created > ?').bind(ip, now - 20000).first();
      if (recent && recent.n > 0) return json({ error: 'zu schnell' }, req, 429);
      await env.DB.prepare('INSERT INTO scores (name, pts, map, stufe, won, wave, waves, created, ip) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(name, pts, b.map, b.stufe, b.won ? 1 : 0, wave, waves, now, ip).run();
      const rank = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE pts > ?').bind(pts).first();
      return json({ ok: true, platz: (rank ? rank.n : 0) + 1, scores: await top(env) }, req);
    }

    return new Response('Micro Defense API 🥦', { headers: { 'Content-Type': 'text/plain; charset=utf-8', ...cors(req) } });
  },
};
