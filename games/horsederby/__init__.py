from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('horsederby', __name__)

GAME_ID = 'horsederby'


def calculate_score(distance_m, jumps_ok, winner_tag):
    """Score partage des 2 joueurs : distance + sauts + bonus gagnant."""
    winner_bonus = 2500 if winner_tag in ('P1', 'P2', 'BOTH') else 0
    return int(distance_m) * 10 + int(jumps_ok) * 200 + winner_bonus


@blueprint.route('/horsederby')
def game():
    return render_template('horsederby/game.html')


@blueprint.route('/api/horsederby/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))


@blueprint.route('/api/horsederby/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Donnees invalides'}), 400
    p1_name    = str(data.get('p1_name', 'P1'))[:20]
    p2_name    = str(data.get('p2_name', 'P2'))[:20]
    distance_m = max(0, int(data.get('distance_m', 0)))
    jumps_ok   = max(0, int(data.get('jumps_ok', 0)))
    jumps_miss = max(0, int(data.get('jumps_miss', 0)))
    duration   = max(0, int(data.get('duration_s', 0)))
    winner     = str(data.get('winner', ''))[:4].upper()      # 'P1' | 'P2' | '' (draw/aborted)
    winner_name = p1_name if winner == 'P1' else (p2_name if winner == 'P2' else '-')
    score = calculate_score(distance_m, jumps_ok, winner)
    save_score(GAME_ID, score, {
        'p1_name':     p1_name,
        'p2_name':     p2_name,
        'winner':      winner or '-',
        'winner_name': winner_name,
        'distance_m':  distance_m,
        'jumps_ok':    jumps_ok,
        'jumps_miss':  jumps_miss,
        'duration_s':  duration,
    })
    return jsonify({'score': score})
