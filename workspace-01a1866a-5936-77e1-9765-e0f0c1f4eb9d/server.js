'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const gzip = promisify(zlib.gzip);
const PORT = process.env.PORT || 8080;
const TTL = 5 * 60 * 1000;
let cache = null, fetchedAt = 0, inFlight = null;
async function refresh() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const get = async name => {
      const response = await fetch(`https://api.discordquest.com/api/${name}`, {signal: AbortSignal.timeout(15000), headers:{'User-Agent':'QuestAtlas/1.0'}});
      if (!response.ok) throw new Error(`Upstream ${name}: ${response.status}`);
      return response.json();
    };
    const [quests, regions] = await Promise.all([get('quests'), get('regions')]);
    const ids = new Set(regions.quests.map(r => r.id));
    // Filter out historical entries on the server to reduce response size and parsing time.
    const now = Date.now();
    const active = quests.filter(q => ids.has(q.id) && Date.parse(q.config?.starts_at) <= now && Date.parse(q.config?.expires_at) > now);
    const activeIds = new Set(active.map(q => q.id));
    cache = JSON.stringify({quests:active, regions:{quests:regions.quests.filter(r => activeIds.has(r.id))}, fetchedAt:new Date().toISOString()});
    fetchedAt = Date.now();
    return cache;
  })().finally(() => { inFlight = null; });
  return inFlight;
}
const assets = {'/': ['index.html','text/html; charset=utf-8'], '/index.html':['index.html','text/html; charset=utf-8'], '/styles.css':['styles.css','text/css; charset=utf-8'], '/app.js':['app.js','text/javascript; charset=utf-8']};
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://local');
    const pathname = url.pathname;
    if (pathname === '/api/data') {
      if (!cache || url.searchParams.has('refresh')) await refresh();
      else if (Date.now() - fetchedAt > TTL) refresh().catch(e=>console.error('Background refresh failed:',e.message));
      const body = Buffer.from(cache);
      const compressed = (req.headers['accept-encoding'] || '').includes('gzip');
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Accept-Encoding',...(compressed?{'Content-Encoding':'gzip'}:{})});
      res.end(compressed ? await gzip(body) : body); return;
    }
    const asset = assets[pathname];
    if (!asset) {res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found');}
    const body = await fs.readFile(path.join(__dirname, asset[0]));
    res.writeHead(200, {'Content-Type':asset[1], 'Cache-Control': pathname.endsWith('.css') || pathname.endsWith('.js') ? 'public, max-age=300' : 'no-cache', 'X-Content-Type-Options':'nosniff'});res.end(body);
  } catch(e) { console.error(e);res.writeHead(502,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'Quest data is temporarily unavailable. Please retry.'})); }
}).listen(PORT,'0.0.0.0',()=>{console.log(`Quest Atlas listening on ${PORT}`);refresh().catch(e=>console.error('Initial refresh failed:',e.message));});
