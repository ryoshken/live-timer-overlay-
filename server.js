const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const rooms = new Map();

function initRoom(name) {
  if (!rooms.has(name)) rooms.set(name, {
    timers: {
      1: { remainingMs: 0, running: false },
      2: { remainingMs: 0, running: false },
      3: { remainingMs: 0, running: false }
    },
    clients: []
  });
  return rooms.get(name);
}

function tick(dt) {
  rooms.forEach(room => {
    let changed = false;
    for (const i of [1,2,3]) {
      const t = room.timers[i];
      if (t.running && t.remainingMs > 0) {
        t.remainingMs -= dt;
        if (t.remainingMs <= 0) { t.remainingMs = 0; t.running = false; }
        changed = true;
      }
    }
    if (changed) broadcast(room);
  });
}

function broadcast(room) {
  const payload = JSON.stringify({ timers: room.timers, ts: Date.now() });
  room.clients = room.clients.filter(res => {
    try { res.write(`data: ${payload}\n\n`); return true; } catch { return false; }
  });
}

let last = Date.now();
setInterval(() => { const now = Date.now(); tick(now - last); last = now; }, 200);

function serveStatic(req, res) {
  let p = url.parse(req.url).pathname;
  if (p === '/' || p === '/timer/' || p === '/timer') p = '/index.html';
  const fp = path.join(__dirname, p.replace(/^\//,''));
  fs.readFile(fp, (err, data) => {
    if (err) { res.statusCode = 404; res.end('Not found'); return; }
    const ext = path.extname(fp);
    const type = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/plain';
    res.setHeader('Content-Type', type);
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise(resolve => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  if (u.pathname === '/sse') {
    const roomName = String(u.query.room || 'default');
    const room = initRoom(roomName);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    room.clients.push(res);
    broadcast(room);
    req.on('close', () => { room.clients = room.clients.filter(x => x !== res); });
    return;
  }
  if (u.pathname === '/api/action' && req.method === 'POST') {
    const body = await parseBody(req);
    const roomName = String(body.room || 'default');
    const room = initRoom(roomName);
    const i = Number(body.timer);
    const type = String(body.type || '');
    const minutes = Number(body.minutes || 0);
    const t = room.timers[i];
    if (!t || !['start','pause','reset','add','set'].includes(type)) { res.statusCode = 400; res.end('bad'); return; }
    if (type === 'start') { if (t.remainingMs <= 0 && minutes > 0) t.remainingMs = minutes*60*1000; t.running = t.remainingMs > 0; }
    if (type === 'pause') { t.running = false; }
    if (type === 'reset') { t.running = false; t.remainingMs = minutes*60*1000; }
    if (type === 'add') { t.remainingMs += minutes*60*1000; }
    if (type === 'set') { t.running = false; t.remainingMs = minutes*60*1000; }
    broadcast(room);
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({ ok: true, timers: room.timers }));
    return;
  }
  serveStatic(req, res);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {});