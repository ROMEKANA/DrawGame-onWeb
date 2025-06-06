import { state } from '../state.js';

let canvas, ctx, drawing = false;

export function createDrawer(prompt) {
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
    state.ws.send(JSON.stringify({ type: 'draw', data: { m: [e.offsetX, e.offsetY] } }));
  };
  canvas.onpointermove = e => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    state.ws.send(JSON.stringify({ type: 'draw', data: { l: [e.offsetX, e.offsetY] } }));
  };
  canvas.onpointerup = () => { drawing = false; };
  const finishBtn = document.createElement('button');
  finishBtn.textContent = 'Finish Drawing';
  finishBtn.onclick = () => state.ws.send(JSON.stringify({ type: 'finish' }));
  div.appendChild(p);
  div.appendChild(canvas);
  div.appendChild(document.createElement('br'));
  div.appendChild(finishBtn);
  return div;
}

export function createViewer() {
  canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  ctx = canvas.getContext('2d');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const div = document.createElement('div');
  div.appendChild(canvas);
  return div;
}

export function drawRemote(data) {
  if (!canvas) return;
  if (data.m) {
    ctx.beginPath();
    ctx.moveTo(data.m[0], data.m[1]);
  }
  if (data.l) {
    ctx.lineTo(data.l[0], data.l[1]);
    ctx.stroke();
  }
}
