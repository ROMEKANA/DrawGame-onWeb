import { state } from '../state.js';

export function createChoice(options) {
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
      state.ws.send(JSON.stringify({ type: 'answer', text: selected.value }));
      div.innerHTML = 'Waiting for results...';
    }
  };
  div.appendChild(list);
  div.appendChild(btn);
  return div;
}
