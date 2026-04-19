/**
 * derby-ui.js — overlays DOM (accueil, fin, leaderboard).
 */

function showDerbyWelcome() { document.getElementById('derby-welcome').style.display = 'flex'; }
function hideDerbyWelcome() { document.getElementById('derby-welcome').style.display = 'none'; }

function showDerbyGameOver(state, p1name, p2name, scores) {
  const banner = document.getElementById('drb-result-banner');
  let txt = 'COURSE TERMINEE';
  let color = '#F4C430';
  if (state.winner === 'P1') { txt = `VICTOIRE ${p1name.toUpperCase()} !`; color = '#FF6622'; }
  else if (state.winner === 'P2') { txt = `VICTOIRE ${p2name.toUpperCase()} !`; color = '#22AAFF'; }
  banner.innerHTML = `<span style="color:${color}">${txt}</span>`;

  const dist = Math.floor(Math.max(state.p1dist, state.p2dist));
  document.getElementById('drb-result-stats').innerHTML =
      `Distance : <b>${dist} m</b> &nbsp;|&nbsp; `
    + `Score : <b>${state.score}</b> &nbsp;|&nbsp; `
    + `Sauts reussis : <b>${state.jumps_ok}</b> &nbsp;|&nbsp; `
    + `Sauts rates : <b>${state.jumps_miss}</b> &nbsp;|&nbsp; `
    + `Duree : <b>${state.duration_s}s</b>`;

  _renderDerbyLeaderboard(scores, state.score);

  document.getElementById('derby-gameover').style.display = 'flex';
}

function hideDerbyGameOver() { document.getElementById('derby-gameover').style.display = 'none'; }

function _renderDerbyLeaderboard(scores, newScore) {
  const lb = document.getElementById('drb-leaderboard');
  if (!scores || scores.length === 0) {
    lb.innerHTML = '<p style="color:#444;font-size:11px;text-align:center;padding:12px">Aucun score enregistre</p>';
    return;
  }
  let html = '<table><thead><tr>'
    + '<th>#</th><th>P1</th><th>P2</th>'
    + '<th style="text-align:right">SCORE</th>'
    + '<th style="text-align:right">GAGNANT</th>'
    + '<th style="text-align:right">DIST.</th>'
    + '<th style="text-align:right">SAUTS</th>'
    + '</tr></thead><tbody>';
  scores.forEach((s, i) => {
    const isNew = i === 0 && s.score === newScore;
    const cls   = isNew ? ' class="drb-new-entry"' : '';
    const winnerName = s.winner_name || '-';
    html += `<tr${cls}>`
      + `<td>${i + 1}</td>`
      + `<td>${s.p1_name || '-'}</td>`
      + `<td>${s.p2_name || '-'}</td>`
      + `<td style="text-align:right">${s.score}</td>`
      + `<td style="text-align:right">${winnerName}</td>`
      + `<td style="text-align:right">${s.distance_m || 0}</td>`
      + `<td style="text-align:right">${s.jumps_ok || 0}</td>`
      + (isNew ? '<td style="color:#F4C430;font-size:9px"> &#9668; NEW</td>' : '<td></td>')
      + '</tr>';
  });
  html += '</tbody></table>';
  lb.innerHTML = html;
}
