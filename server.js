const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const room = { id: 'main', players: [], currentDrawer: -1, state: 'wait' };
const { tops, bottoms } = require('./server/prompts.json');

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  room.players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(msg);
    }
  });
}

function updatePlayers() {
  broadcast({ type: 'players', names: room.players.map(p => p.name) });
}

function startRound() {
  if (room.players.length === 0) return;
  room.state = 'drawing';
  room.currentDrawer = (room.currentDrawer + 1) % room.players.length;
  room.prompt = `${randomChoice(tops)}${randomChoice(bottoms)}`;
  room.titles = {};
  room.answers = {};
  const drawer = room.players[room.currentDrawer];
  broadcast({ type: 'roundStart', drawer: drawer.name });
  if (drawer.ws.readyState === WebSocket.OPEN) {
    drawer.ws.send(JSON.stringify({ type: 'prompt', prompt: room.prompt }));
  }
}

function finishRound() {
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
  broadcast({
    type: 'roundEnd',
    results,
    scores: room.players.map(p => ({ name: p.name, score: p.score }))
  });
  startRound();
}

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }
    if (data.type === 'join') {
      const player = { ws, name: data.name, score: 0 };
      room.players.push(player);
      ws.playerName = data.name;
      broadcast({ type: 'system', msg: `${data.name} joined` });
      updatePlayers();
    } else {
      switch (data.type) {
        case 'start':
          if (room.state === 'wait' && room.players.length >= 3) startRound();
          break;
        case 'draw':
          broadcast({ type: 'draw', data: data.data });
          break;
        case 'finish':
          room.state = 'titles';
          broadcast({ type: 'enterTitles' });
          break;
        case 'title':
          room.titles[ws.playerName] = data.text;
          if (Object.keys(room.titles).length === room.players.length - 1) {
            const opts = [room.prompt, ...Object.values(room.titles)];
            room.state = 'guess';
            broadcast({ type: 'choose', options: shuffle(opts) });
          }
          break;
        case 'answer':
          room.answers[ws.playerName] = data.text;
          if (Object.keys(room.answers).length === room.players.length - 1) {
            finishRound();
          }
          break;
      }
    }
  });

  ws.on('close', () => {
    room.players = room.players.filter(p => p.ws !== ws);
    updatePlayers();
  });
});

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
