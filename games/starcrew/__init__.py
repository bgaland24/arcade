from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('starcrew', __name__)

GAME_ID = 'starcrew'


def calculate_score(kills, waves_completed, metal_collected, shots_fired, shots_hit):
    """Score server-side : kills + vagues + metal + precision."""
    precision_bonus = int((shots_hit / max(1, shots_fired)) * 2000)
    return int(kills) * 100 \
         + int(waves_completed) * 500 \
         + int(metal_collected) * 10 \
         + precision_bonus


@blueprint.route('/starcrew')
def game():
    return render_template('starcrew/game.html')


@blueprint.route('/api/starcrew/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))


@blueprint.route('/api/starcrew/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Donnees invalides'}), 400
    p1_name         = str(data.get('p1_name', 'P1'))[:20]
    p2_name         = str(data.get('p2_name', 'P2'))[:20]
    kills           = max(0, int(data.get('kills', 0)))
    waves_completed = max(0, int(data.get('waves_completed', 0)))
    metal_collected = max(0, int(data.get('metal_collected', 0)))
    shots_fired     = max(0, int(data.get('shots_fired', 0)))
    shots_hit       = max(0, int(data.get('shots_hit', 0)))
    score = calculate_score(kills, waves_completed, metal_collected, shots_fired, shots_hit)
    accuracy = shots_hit / max(1, shots_fired)
    save_score(GAME_ID, score, {
        'p1_name':         p1_name,
        'p2_name':         p2_name,
        'kills':           kills,
        'waves_completed': waves_completed,
        'metal':           metal_collected,
        'accuracy':        round(accuracy, 3),
    })
    return jsonify({'score': score})
