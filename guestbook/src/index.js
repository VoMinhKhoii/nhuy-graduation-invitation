// Lưu bút backend: a Cloudflare Worker in front of a D1 (SQLite) table.
// GET returns the visible wishes, newest first. POST saves one wish.

const ALLOWED_ORIGINS = [/^https:\/\/vominhkhoii\.github\.io$/, /^https:\/\/nhui-ba-khi\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const MAX_PER_TEN_MINUTES = 10;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some((re) => re.test(origin));
  return allowed
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : { Vary: 'Origin' };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request) },
  });
}

// Store a hash of the sender's IP, never the IP itself; it is only used for the rate limit.
async function senderId(request) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nhuy-luu-but:${ip}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function listWishes(request, env) {
  const { results } = await env.DB.prepare(
    'SELECT name, message, created_at AS at FROM wishes WHERE hidden = 0 ORDER BY id DESC LIMIT 300',
  ).all();
  return json(request, { notes: results });
}

async function addWish(request, env) {
  let data;
  try {
    data = JSON.parse(await request.text());
  } catch {
    return json(request, { ok: false, error: 'bad-json' }, 400);
  }
  const name = String(data.name || '').trim().slice(0, 60);
  const message = String(data.message || '').trim().slice(0, 1000);
  if (!message) return json(request, { ok: false, error: 'empty' }, 400);

  const sender = await senderId(request);
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM wishes WHERE sender = ? AND created_at > datetime('now', '-10 minutes')",
  ).bind(sender).first();
  if (recent.n >= MAX_PER_TEN_MINUTES) return json(request, { ok: false, error: 'too-many' }, 429);

  await env.DB.prepare('INSERT INTO wishes (name, message, sender) VALUES (?, ?, ?)').bind(name, message, sender).run();
  return json(request, { ok: true });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
    if (request.method === 'GET') return listWishes(request, env);
    if (request.method === 'POST') return addWish(request, env);
    return json(request, { ok: false, error: 'method' }, 405);
  },
};
