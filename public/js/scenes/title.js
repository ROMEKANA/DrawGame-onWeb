export function createTitle(onStart) {
  const div = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = 'DrawGame';
  const nameInput = document.createElement('input');
  nameInput.placeholder = 'Your Name';
  const btn = document.createElement('button');
  btn.textContent = 'Start';
  btn.onclick = () => onStart(nameInput.value || 'Player');
  div.appendChild(title);
  div.appendChild(nameInput);
  div.appendChild(document.createElement('br'));
  div.appendChild(btn);
  return div;
}
