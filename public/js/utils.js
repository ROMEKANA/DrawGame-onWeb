export function show(element) {
  const view = document.getElementById('view');
  view.innerHTML = '';
  view.appendChild(element);
}
