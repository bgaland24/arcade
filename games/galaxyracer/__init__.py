from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('galaxyracer', __name__)

GAME_ID = 'galaxyracer'


def calculate_racer_score(distance, p1_lives_left, p2_lives_left, pickups):
    """Score = distance parcourue + bonus vies restantes + bonus pickups ramassés."""
    return int(distance) + (p1_lives_left + p2_lives_left) * 400 + pickups * 250


@blueprint.route('/galaxyracer')
def game():
    return render_template('galaxyracer/game.html')


@blueprint.route('/api/galaxyracer/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))


@blueprint.route('/api/galaxyracer/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Donnees invalides'}), 400
    p1_name       = str(data.get('p1_name', 'P1'))[:20]
    p2_name       = str(data.get('p2_name', 'P2'))[:20]
    distance      = max(0, int(data.get('distance', 0)))
    p1_lives_left = max(0, int(data.get('p1_lives_left', 0)))
    p2_lives_left = max(0, int(data.get('p2_lives_left', 0)))
    pickups       = max(0, int(data.get('pickups', 0)))
    max_speed     = max(0, int(data.get('max_speed', 0)))
    score         = calculate_racer_score(distance, p1_lives_left, p2_lives_left, pickups)
    save_score(GAME_ID, score, {
        'p1_name':  p1_name,
        'p2_name':  p2_name,
        'distance': distance,
        'pickups':  pickups,
        'max_speed': max_speed,
    })
    return jsonify({'score': score})
