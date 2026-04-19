/**
 * racer-ui.js — overlays DOM pour Galaxy Racer (accueil, fin, leaderboard).
 */

function showRacerWelcome() {
  document.getElementById('racer-welcome').style.display = 'flex';
}
function hideRacerWelcome() {
  document.getElementById('racer-welcome').style.display = 'none';
}

function showRacerGameOver(state, p1name, p2name, scores) {
  const banner = document.getElementById('rcr-result-banner');
  if (state.anyoneAlive) {
    banner.innerHTML = '<span style="color:#FF66CC">PARTIE TERMINEE !</span>';
  } else {
    banner.innerHTML = '<span style="color:#FF2244">CRASHES !</span>';
  }

  const dist = Math.floor(state.distance);
  document.getElementById('rcr-result-stats').innerHTML =
      `Distance : <b>${dist} m</b> &nbsp;|&nbsp; `
    + `Score : <b>${state.score}</b> &nbsp;|&nbsp; `
    + `Pickups : <b>${state.pickups}</b> &nbsp;|&nbsp; `
    + `Vmax : <b>${Math.floor(state.maxSpeed)}</b>`;

  _renderRacerLeaderboard(scores, state.score);

  document.getElementById('racer-gameover').style.display = 'flex';
}

function hideRacerGameOver() {
  document.getElementById('racer-gameover').style.display = 'none';
}

function _renderRacerLeaderboard(scores, newScore) {
  const lb = document.getElementById('rcr-leaderboard');
  if (!scores || scores.length === 0) {
    lb.innerHTML = '<p style="color:#444;font-size:11px;text-align:center;padding:12px">Aucun score enregistre</p>';
    return;
  }

  let html = '<table><thead><tr>'
    + '<th>#</th><th>P1</th><th>P2</th>'
    + '<th style="text-align:right">SCORE</th>'
    + '<th style="text-align:right">DIST.</th>'
    + '<th style="text-align:right">PICK.</th>'
    + '</tr></thead><tbody>';

  scores.forEach((s, i) => {
    const isNew = i === 0 && s.score === newScore;
    const cls   = isNew ? ' class="rcr-new-entry"' : '';
    html += `<tr${cls}>`
      + `<td>${i + 1}</td>`
      + `<td>${s.p1_name || '-'}</td>`
      + `<td>${s.p2_name || '-'}</td>`
      + `<td style="text-align:right">${s.score}</td>`
      + `<td style="text-align:right">${s.distance || 0}</td>`
      + `<td style="text-align:right">${s.pickups || 0}</td>`
      + (isNew ? '<td style="color:#FF66CC;font-size:9px"> &#9668; NEW</td>' : '<td></td>')
      + '</tr>';
  });

  html += '</tbody></table>';
  lb.innerHTML = html;
}
