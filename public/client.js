const view = document.getElementById('view');
let ws = null;
let roomId = '';
let playerName = '';
let isHost = false;
let isDrawer = false;

function show(element) {
  view.innerHTML = '';
  view.appendChild(element);
}

function startPage() {
  const div = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = 'DrawGame';
  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.onclick = matchingPage;
  div.appendChild(title);
  div.appendChild(btn);
  show(div);
}

function matchingPage() {
  const div = document.createElement('div');
  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Your Name';
  const roomInput = document.createElement('input');
  roomInput.placeholder = 'Room ID';
  const createBtn = document.createElement('button');
  createBtn.textContent = 'Create Room';
  createBtn.onclick = () => {
    roomId = Math.random().toString(36).slice(2, 8);
    playerName = nameInput.value || 'Player';
    isHost = true;
    connect();
  };
  const joinBtn = document.createElement('button');
  joinBtn.textContent = 'Join Room';
  joinBtn.onclick = () => {
    roomId = roomInput.value.trim();
    playerName = nameInput.value || 'Player';
    isHost = false;
    connect();
  };
  div.appendChild(nameInput);
  div.appendChild(document.createElement('br'));
  div.appendChild(roomInput);
  div.appendChild(document.createElement('br'));
  div.appendChild(createBtn);
  div.appendChild(joinBtn);
  show(div);
}

function connect() {
  // Build the WebSocket URL based on the current page protocol/host so
  // it works in both local (http/ws) and production (https/wss) setups.
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${location.host}`;
  ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'join', roomId, name: playerName }));
    if (isHost) {
      startWaiting(true);
    } else {
      startWaiting(false);
    }
  };
  ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    handleMessage(data);
  };
  ws.onclose = () => {
    alert('Disconnected');
    startPage();
  };
}

function handleMessage(data) {
  switch (data.type) {
    case 'system':
      log(data.msg);
      break;
    case 'roundStart':
      isDrawer = (data.drawer === playerName);
      log(`Round started. Drawer: ${data.drawer}`);
      break;
    case 'prompt':
      if (isDrawer) drawingPage(data.prompt);
      break;
    case 'draw':
      if (!isDrawer) drawRemote(data.data);
      break;
    case 'enterTitles':
      if (!isDrawer) titleInputPage();
      break;
    case 'choose':
      choicePage(data.options);
      break;
    case 'roundEnd':
      resultPage(data);
      break;
  }
}

function startWaiting(isHostStart) {
  const div = document.createElement('div');
  div.innerHTML = `<h2>Room: ${roomId}</h2>`;
  if (isHostStart) {
    const btn = document.createElement('button');
    btn.textContent = 'Start Game';
    btn.onclick = () => ws.send(JSON.stringify({ type: 'start' }));
    div.appendChild(btn);
  }
  const p = document.createElement('p');
  p.textContent = 'Waiting for game...';
  div.appendChild(p);
  show(div);
}

let canvas, ctx, drawing = false;
function drawingPage(prompt) {
  const div = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = `Prompt: ${prompt}`;
  canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  ctx = canvas.getContext('2d');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  canvas.onpointerdown = e => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    ws.send(JSON.stringify({ type: 'draw', data: { m: [e.offsetX, e.offsetY] } }));
  };
  canvas.onpointermove = e => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ws.send(JSON.stringify({ type: 'draw', data: { l: [e.offsetX, e.offsetY] } }));
  };
  canvas.onpointerup = () => { drawing = false; };
  const finishBtn = document.createElement('button');
  finishBtn.textContent = 'Finish Drawing';
  finishBtn.onclick = () => ws.send(JSON.stringify({ type: 'finish' }));
  div.appendChild(p);
  div.appendChild(canvas);
  div.appendChild(document.createElement('br'));
  div.appendChild(finishBtn);
  show(div);
}

function drawRemote(data) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const div = document.createElement('div');
    div.appendChild(canvas);
    show(div);
  }
  if (data.m) {
    ctx.beginPath();
    ctx.moveTo(data.m[0], data.m[1]);
  }
  if (data.l) {
    ctx.lineTo(data.l[0], data.l[1]);
    ctx.stroke();
  }
}

function titleInputPage() {
  const div = document.createElement('div');
  const input = document.createElement('input');
  input.placeholder = 'Fake title';
  const btn = document.createElement('button');
  btn.textContent = 'Submit';
  btn.onclick = () => {
    ws.send(JSON.stringify({ type: 'title', text: input.value }));
    div.innerHTML = 'Waiting for others...';
  };
  div.appendChild(input);
  div.appendChild(btn);
  show(div);
}

function choicePage(options) {
  const div = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = 'Choose the correct title';
  div.appendChild(p);
  const list = document.createElement('div');
  options.forEach(opt => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'opt';
    radio.value = opt;
    label.appendChild(radio);
    label.appendChild(document.createTextNode(opt));
    list.appendChild(label);
    list.appendChild(document.createElement('br'));
  });
  const btn = document.createElement('button');
  btn.textContent = 'Confirm';
  btn.onclick = () => {
    const selected = document.querySelector('input[name="opt"]:checked');
    if (selected) {
      ws.send(JSON.stringify({ type: 'answer', text: selected.value }));
      div.innerHTML = 'Waiting for results...';
    }
  };
  div.appendChild(list);
  div.appendChild(btn);
  show(div);
}

function resultPage(data) {
  const div = document.createElement('div');
  const title = document.createElement('h2');
  title.textContent = 'Results';
  div.appendChild(title);
  const list = document.createElement('ul');
  data.results.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r.player + (r.correct ? ' got it right!' : ` chose ${r.chose}`);
    list.appendChild(li);
  });
  div.appendChild(list);
  const scoreTitle = document.createElement('h3');
  scoreTitle.textContent = 'Scores';
  div.appendChild(scoreTitle);
  const scoreList = document.createElement('ul');
  data.scores.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.name}: ${s.score}`;
    scoreList.appendChild(li);
  });
  div.appendChild(scoreList);
  show(div);
}

function log(msg) {
  console.log(msg);
}

startPage();
