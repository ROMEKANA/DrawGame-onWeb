import { state } from './state.js';
import { show } from './utils.js';
import { createTitle } from './scenes/title.js';
import { createWaiting } from './scenes/waiting.js';
import { createDrawer, createViewer, drawRemote } from './scenes/draw.js';
import { createFakeInput } from './scenes/fakeInput.js';
import { createChoice } from './scenes/choice.js';
import { showResult } from './scenes/result.js';

let waitingScene = null;

function connect() {
  const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${location.host}`;
  state.ws = new WebSocket(wsUrl);
  state.ws.onopen = () => {
    state.ws.send(JSON.stringify({ type: 'join', name: state.playerName }));
  };
  state.ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    handleMessage(data);
  };
  state.ws.onclose = () => {
    alert('Disconnected');
    start();
  };
}

function handleMessage(data) {
  switch (data.type) {
    case 'players':
      if (waitingScene) waitingScene.update(data.names);
      break;
    case 'roundStart':
      state.isDrawer = (data.drawer === state.playerName);
      break;
    case 'prompt':
      if (state.isDrawer) show(createDrawer(data.prompt));
      else show(createViewer());
      break;
    case 'draw':
      if (!state.isDrawer) drawRemote(data.data);
      break;
    case 'enterTitles':
      if (!state.isDrawer) show(createFakeInput());
      break;
    case 'choose':
      show(createChoice(data.options));
      break;
    case 'roundEnd':
      show(showResult(data));
      break;
  }
}

function start() {
  const title = createTitle(name => {
    state.playerName = name;
    connect();
    waitingScene = createWaiting(() => state.ws.send(JSON.stringify({ type: 'start' })));
    show(waitingScene.div);
  });
  show(title);
}

document.addEventListener('DOMContentLoaded', start);
