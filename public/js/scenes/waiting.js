export function createWaiting(onStart) {
  const div = document.createElement('div');
  const list = document.createElement('ul');
  const btn = document.createElement('button');
  btn.textContent = 'Start Game';
  btn.onclick = onStart;
  div.appendChild(btn);
  div.appendChild(list);
  function update(names) {
    list.innerHTML = '';
    names.forEach(n => {
      const li = document.createElement('li');
      li.textContent = n;
      list.appendChild(li);
    });
    btn.disabled = names.length < 3;
  }
  return { div, update };
}
