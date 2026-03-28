from flask import Blueprint, render_template, jsonify, request
from core.scores import save_score, get_scores

blueprint = Blueprint('pongpong', __name__)
GAME_ID = 'pongpong'


def calculate_pong_score(winner_points, loser_points, time_seconds):
    dominance   = (winner_points - loser_points) * 500
    speed_bonus = max(0, int((300 - time_seconds) * 3))
    return winner_points * 200 + dominance + speed_bonus


@blueprint.route('/pongpong')
def game():
    return render_template('pongpong/game.html')


@blueprint.route('/api/pongpong/scores', methods=['GET'])
def get_scores_route():
    return jsonify(get_scores(GAME_ID))


@blueprint.route('/api/pongpong/scores', methods=['POST'])
def post_score():
    data = request.get_json(silent=True)
    if not data or 'winner_name' not in data:
        return jsonify({'error': 'Donnees invalides'}), 400
    winner_name = str(data.get('winner_name', ''))[:20]
    loser_name  = str(data.get('loser_name',  ''))[:20]
    winner_pts  = int(data.get('winner_score', 0))
    loser_pts   = int(data.get('loser_score',  0))
    time_sec    = float(data.get('time_seconds', 0))
    score = calculate_pong_score(winner_pts, loser_pts, time_sec)
    save_score(GAME_ID, score, {
        'player_name':   winner_name,
        'opponent_name': loser_name,
        'points_won':    winner_pts,
        'points_lost':   loser_pts,
        'time_seconds':  round(time_sec, 1),
    })
    return jsonify({'score': score})
