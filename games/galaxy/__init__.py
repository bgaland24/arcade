from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('galaxy', __name__)

GAME_ID = 'galaxy'

def calculate_galaxy_score(kill_points, shots_fired, shots_hit, wave_reached):
    precision_bonus = int((shots_hit / max(1, shots_fired)) * 3000)
    wave_bonus      = wave_reached * 300
    return kill_points + precision_bonus + wave_bonus

@blueprint.route('/galaxy')
def game():
    from flask import session
    return render_template('galaxy/game.html',
                           p1name=session.get('p1', {}).get('name', ''),
                           p2name=session.get('p2', {}).get('name', ''))

@blueprint.route('/api/galaxy/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))

@blueprint.route('/api/galaxy/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Données invalides'}), 400
    p1_name      = str(data.get('p1_name', 'P1'))[:20]
    p2_name      = str(data.get('p2_name', 'P2'))[:20]
    kill_points  = int(data.get('kill_points', 0))
    shots_fired  = int(data.get('shots_fired', 0))
    shots_hit    = int(data.get('shots_hit', 0))
    wave_reached = int(data.get('wave_reached', 1))
    score        = calculate_galaxy_score(kill_points, shots_fired, shots_hit, wave_reached)
    kills        = int(data.get('kills', 0))
    accuracy     = shots_hit / max(1, shots_fired)
    save_score(GAME_ID, score, {
        'p1_name':      p1_name,
        'p2_name':      p2_name,
        'wave_reached': wave_reached,
        'kills':        kills,
        'accuracy':     round(accuracy, 3),
    })
    return jsonify({'score': score})
