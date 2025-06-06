const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const WSPORT = process.env.WSPORT || 8080;

app.use(express.static(path.join(__dirname, '..', 'public')));

const server = app.listen(PORT, () => {
  console.log(`HTTP server listening on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ port: WSPORT });

const rooms = {};
const prompts = [
  'Flying cat',
  'Running dog',
  'Jumping fox',
  'Dancing bear'
];

function broadcast(roomId, data) {
  const room = rooms[roomId];
  if (!room) return;
  const msg = JSON.stringify(data);
  room.players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(msg);
    }
  });
}

function startRound(room) {
  if (room.players.length === 0) return;
  room.state = 'drawing';
  room.currentDrawer = (room.currentDrawer + 1) % room.players.length;
  room.prompt = prompts[Math.floor(Math.random() * prompts.length)];
  room.titles = {};
  room.answers = {};
  const drawer = room.players[room.currentDrawer];
  broadcast(room.id, { type: 'roundStart', drawer: drawer.name });
  if (drawer.ws.readyState === WebSocket.OPEN) {
    drawer.ws.send(JSON.stringify({ type: 'prompt', prompt: room.prompt }));
  }
}

function finishRound(room) {
  room.state = 'result';
  const results = [];
  for (const player of room.players) {
    const ans = room.answers[player.name];
    if (!ans) continue;
    if (ans === room.prompt) {
      player.score++;
      room.players[room.currentDrawer].score++;
      results.push({ player: player.name, correct: true });
    } else {
      const author = room.players.find(p => room.titles[p.name] === ans);
      if (author) author.score++;
      results.push({ player: player.name, correct: false, chose: ans });
    }
  }
  broadcast(room.id, {
    type: 'roundEnd',
    results,
    scores: room.players.map(p => ({ name: p.name, score: p.score }))
  });
  startRound(room);
}

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.type === 'join') {
      const id = data.roomId;
      if (!rooms[id]) {
        rooms[id] = { id, players: [], currentDrawer: -1, state: 'wait' };
      }
      const room = rooms[id];
      room.players.push({ ws, name: data.name, score: 0 });
      ws.roomId = id;
      ws.playerName = data.name;
      broadcast(id, { type: 'system', msg: `${data.name} joined` });
    } else {
      const room = rooms[ws.roomId];
      if (!room) return;
      switch (data.type) {
        case 'start':
          if (room.state === 'wait') startRound(room);
          break;
        case 'draw':
          broadcast(room.id, { type: 'draw', data: data.data });
          break;
        case 'finish':
          room.state = 'titles';
          broadcast(room.id, { type: 'enterTitles' });
          break;
        case 'title':
          room.titles[ws.playerName] = data.text;
          if (Object.keys(room.titles).length === room.players.length - 1) {
            const opts = [room.prompt, ...Object.values(room.titles)];
            room.state = 'guess';
            broadcast(room.id, { type: 'choose', options: shuffle(opts) });
          }
          break;
        case 'answer':
          room.answers[ws.playerName] = data.text;
          if (Object.keys(room.answers).length === room.players.length - 1) {
            finishRound(room);
          }
          break;
      }
    }
  });

  ws.on('close', () => {
    const id = ws.roomId;
    if (!id) return;
    const room = rooms[id];
    if (!room) return;
    room.players = room.players.filter(p => p.ws !== ws);
  });
});

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

console.log(`WebSocket server running on ws://localhost:${WSPORT}`);
