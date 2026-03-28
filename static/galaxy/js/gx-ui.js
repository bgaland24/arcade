/**
 * gx-ui.js — overlays DOM pour Galaxy (accueil, fin de partie, leaderboard).
 */

function showGalaxyWelcome() {
  document.getElementById('galaxy-welcome').style.display = 'flex';
}
function hideGalaxyWelcome() {
  document.getElementById('galaxy-welcome').style.display = 'none';
}

function showGalaxyGameOver(state, p1name, p2name, scores) {
  // Résultat
  const banner = document.getElementById('gx-result-banner');
  const lives  = state.lives;
  if (lives > 0) {
    banner.innerHTML = '<span style="color:#00EEFF">PARTIE TERMINEE !</span>';
  } else {
    banner.innerHTML = '<span style="color:#FF2244">GAME OVER</span>';
  }

  // Stats
  const acc = state.shotsFired > 0
    ? Math.round(state.shotsHit / state.shotsFired * 100) : 0;
  document.getElementById('gx-result-stats').innerHTML =
    `Vague atteinte : <b>${state.waveReached}</b> &nbsp;|&nbsp; `+
    `Score : <b>${state.score}</b> &nbsp;|&nbsp; `+
    `Kills : <b>${state.kills}</b> &nbsp;|&nbsp; `+
    `Précision : <b>${acc}%</b>`;

  // Leaderboard
  _renderGxLeaderboard(scores, state.score);

  document.getElementById('galaxy-gameover').style.display = 'flex';
}

function hideGalaxyGameOver() {
  document.getElementById('galaxy-gameover').style.display = 'none';
}

function _renderGxLeaderboard(scores, newScore) {
  const lb = document.getElementById('gx-leaderboard');
  if (!scores || scores.length === 0) {
    lb.innerHTML = '<p style="color:#444;font-size:11px;text-align:center;padding:12px">Aucun score enregistré</p>';
    return;
  }

  let html = '<table><thead><tr>'
    + '<th>#</th><th>P1</th><th>P2</th>'
    + '<th style="text-align:right">SCORE</th>'
    + '<th style="text-align:right">VAGUE</th>'
    + '<th style="text-align:right">KILLS</th>'
    + '<th style="text-align:right">PREC.</th>'
    + '</tr></thead><tbody>';

  scores.forEach((s, i) => {
    const isNew = i === 0 && s.score === newScore;
    const cls   = isNew ? ' class="gx-new-entry"' : '';
    const acc   = Math.round((s.accuracy || 0) * 100);
    html += `<tr${cls}>`
      + `<td>${i + 1}</td>`
      + `<td>${s.p1_name || '—'}</td>`
      + `<td>${s.p2_name || '—'}</td>`
      + `<td style="text-align:right">${s.score}</td>`
      + `<td style="text-align:right">${s.wave_reached}</td>`
      + `<td style="text-align:right">${s.kills}</td>`
      + `<td style="text-align:right">${acc}%</td>`
      + (isNew ? '<td style="color:#00EEFF;font-size:9px"> ◄ NEW</td>' : '<td></td>')
      + '</tr>';
  });

  html += '</tbody></table>';
  lb.innerHTML = html;
}
