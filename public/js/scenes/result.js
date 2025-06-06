export function showResult(data) {
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
  return div;
}
