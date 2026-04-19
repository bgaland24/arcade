/**
 * sc-ui.js — overlays DOM (accueil, fin, leaderboard). Shop est gere par sc-shop.
 */

function showCrewWelcome() {
  document.getElementById('crew-welcome').style.display = 'flex';
}
function hideCrewWelcome() {
  document.getElementById('crew-welcome').style.display = 'none';
}

function showCrewGameOver(state, p1name, p2name, scores) {
  const banner = document.getElementById('sc-result-banner');
  banner.innerHTML = '<span style="color:#FF4422">EQUIPAGE PERDU</span>';

  const acc = state.shotsFired > 0
      ? Math.round(state.shotsHit / state.shotsFired * 100) : 0;
  document.getElementById('sc-result-stats').innerHTML =
      `Vague : <b>${state.waveNumber}</b> &nbsp;|&nbsp; `
    + `Score : <b>${state.score}</b> &nbsp;|&nbsp; `
    + `Kills : <b>${state.kills}</b> &nbsp;|&nbsp; `
    + `Metal : <b>${state.metal}</b> &nbsp;|&nbsp; `
    + `Prec : <b>${acc}%</b>`;

  _renderCrewLeaderboard(scores, state.score);

  document.getElementById('crew-gameover').style.display = 'flex';
}

function hideCrewGameOver() {
  document.getElementById('crew-gameover').style.display = 'none';
}

function _renderCrewLeaderboard(scores, newScore) {
  const lb = document.getElementById('sc-leaderboard');
  if (!scores || scores.length === 0) {
    lb.innerHTML = '<p style="color:#444;font-size:11px;text-align:center;padding:12px">Aucun score enregistre</p>';
    return;
  }
  let html = '<table><thead><tr>'
    + '<th>#</th><th>PILOTE</th><th>ARTILLEUR</th>'
    + '<th style="text-align:right">SCORE</th>'
    + '<th style="text-align:right">VAGUE</th>'
    + '<th style="text-align:right">KILLS</th>'
    + '<th style="text-align:right">METAL</th>'
    + '<th style="text-align:right">PREC.</th>'
    + '</tr></thead><tbody>';
  scores.forEach((s, i) => {
    const isNew = i === 0 && s.score === newScore;
    const cls   = isNew ? ' class="sc-new-entry"' : '';
    const acc   = Math.round((s.accuracy || 0) * 100);
    html += `<tr${cls}>`
      + `<td>${i + 1}</td>`
      + `<td>${s.p1_name || '-'}</td>`
      + `<td>${s.p2_name || '-'}</td>`
      + `<td style="text-align:right">${s.score}</td>`
      + `<td style="text-align:right">${s.waves_completed || 0}</td>`
      + `<td style="text-align:right">${s.kills || 0}</td>`
      + `<td style="text-align:right">${s.metal || 0}</td>`
      + `<td style="text-align:right">${acc}%</td>`
      + (isNew ? '<td style="color:#00DDAA;font-size:9px"> &#9668; NEW</td>' : '<td></td>')
      + '</tr>';
  });
  html += '</tbody></table>';
  lb.innerHTML = html;
}
