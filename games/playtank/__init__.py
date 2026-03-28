from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('playtank', __name__)

GAME_ID = 'playtank'

# ── Score formula ────────────────────────────────────────
def calculate_score(time_seconds, shots_fired, shots_hit, game_duration=180):
    if shots_fired == 0 or shots_hit == 0:
        return 0
    accuracy        = shots_hit / shots_fired
    time_ratio      = max(0.0, (game_duration - time_seconds) / game_duration)
    shot_efficiency = 3 / max(3, shots_fired)
    return int(time_ratio * 5000 + accuracy * 3000 + shot_efficiency * 2000)

# ── Routes ───────────────────────────────────────────────
@blueprint.route('/playtank')
def game():
    return render_template('playtank/game.html')

@blueprint.route('/api/playtank/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))

@blueprint.route('/api/playtank/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    if not data or 'player_name' not in data:
        return jsonify({'error': 'Données invalides'}), 400
    shots_fired = max(1, int(data.get('shots_fired', 1)))
    shots_hit   = int(data.get('shots_hit', 0))
    time_sec    = float(data.get('time_seconds', 180))
    score       = calculate_score(time_sec, shots_fired, shots_hit)
    accuracy    = shots_hit / shots_fired
    save_score(GAME_ID, score, {
        'player_name':   data['player_name'][:20],
        'opponent_name': str(data.get('opponent_name', ''))[:20],
        'time_seconds':  round(time_sec, 1),
        'accuracy':      round(accuracy, 3),
        'shells_used':   shots_fired,
    })
    return jsonify({'score': score})
