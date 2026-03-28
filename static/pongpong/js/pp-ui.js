'use strict';

function ppShowWelcome(p1name, p2name) {
  document.getElementById('pp-welcome').style.display = 'flex';
  document.getElementById('pp-gameover').style.display = 'none';
  if (p1name) document.getElementById('pp-p1name').value = p1name;
  if (p2name) document.getElementById('pp-p2name').value = p2name;
}

function ppHideWelcome() {
  document.getElementById('pp-welcome').style.display = 'none';
}

function ppShowGameOver(winnerName, p1, p2, timeSec, scores) {
  document.getElementById('pp-gameover').style.display = 'flex';
  const col = p1.name === winnerName ? PP.COLOR.P1 : PP.COLOR.P2;
  document.getElementById('pp-winner-banner').innerHTML =
    `<span style="color:${col}">${winnerName.toUpperCase()}</span> GAGNE !`;

  const mm = String(Math.floor(timeSec / 60)).padStart(1, '0');
  const ss = String(Math.floor(timeSec % 60)).padStart(2, '0');
  document.getElementById('pp-stats').innerHTML =
    `<div class="pp-stat-row">
      <span style="color:${PP.COLOR.P1}">${p1.name}</span>
      <span class="pp-stat-vs">${p1.score} — ${p2.score}</span>
      <span style="color:${PP.COLOR.P2}">${p2.name}</span>
    </div>
    <div class="pp-stat-time">Durée : ${mm}m${ss}s</div>`;

  const lb = document.getElementById('pp-leaderboard');
  if (!scores || !scores.length) {
    lb.innerHTML = '<p class="pp-lb-empty">Aucun score enregistré</p>'; return;
  }
  lb.innerHTML = '<table class="pp-lb-table"><thead>'
    + '<tr><th>#</th><th>JOUEUR</th><th>SCORE</th><th>RÉSULTAT</th></tr></thead><tbody>'
    + scores.slice(0, 10).map((s, i) => {
        const hi = s.player_name && s.player_name.toLowerCase() === winnerName.toLowerCase() && i === 0;
        return `<tr${hi ? ' class="pp-lb-new"' : ''}>
          <td>${i + 1}</td><td>${s.player_name}</td><td>${s.score}</td>
          <td>${s.points_won}—${s.points_lost}</td></tr>`;
      }).join('')
    + '</tbody></table>';
}

function ppHideGameOver() {
  document.getElementById('pp-gameover').style.display = 'none';
}
