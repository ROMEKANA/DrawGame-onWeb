import { state } from '../state.js';

export function createFakeInput() {
  const div = document.createElement('div');
  const input = document.createElement('input');
  input.placeholder = 'Fake title';
  const btn = document.createElement('button');
  btn.textContent = 'Submit';
  btn.onclick = () => {
    state.ws.send(JSON.stringify({ type: 'title', text: input.value }));
    div.innerHTML = 'Waiting for others...';
  };
  div.appendChild(input);
  div.appendChild(btn);
  return div;
}
