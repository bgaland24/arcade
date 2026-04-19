# Add an entry here for each new game.
GAMES = [
    {
        'id':    'playtank',
        'name':  'PlayTank',
        'title_html': 'PLAY<span>TANK</span>',
        'desc':  'Duel de tanks &bull; 2 joueurs &bull; Terrain destructible',
        'url':   '/playtank',
        'color': '#CC4400',
        'accent':'#FFD700',
        'card_class': 'tank-card',
        'btn_class':  'tank-btn',
        'title_class':'tank-title',
        'svg': '''<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="30" width="70" height="14" fill="#1a1a1a"/>
            <rect x="8" y="31" width="10" height="12" fill="#333"/>
            <rect x="20" y="31" width="10" height="12" fill="#333"/>
            <rect x="32" y="31" width="10" height="12" fill="#333"/>
            <rect x="44" y="31" width="10" height="12" fill="#333"/>
            <rect x="56" y="31" width="10" height="12" fill="#333"/>
            <rect x="12" y="18" width="56" height="14" fill="#CC4400"/>
            <rect x="12" y="18" width="56" height="4" fill="rgba(255,255,255,0.12)"/>
            <rect x="26" y="8" width="28" height="12" fill="#882200"/>
            <rect x="51" y="10" width="22" height="6" fill="#661100"/>
            <rect x="16" y="20" width="6" height="6" fill="#881100"/>
            <rect x="58" y="20" width="6" height="6" fill="#881100"/>
        </svg>''',
    },
    {
        'id':    'galaxy',
        'name':  'Galaxy Space Attack',
        'title_html': 'GALAXY<br><span>SPACE ATTACK</span>',
        'desc':  'Coop 2 joueurs &bull; Vagues infinies &bull; Boss',
        'url':   '/galaxy',
        'color': '#22AAFF',
        'accent':'#00EEFF',
        'card_class': 'galaxy-card',
        'btn_class':  'galaxy-btn',
        'title_class':'galaxy-title',
        'svg': '''<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="5"  width="2" height="2" fill="white" opacity="0.8"/>
            <rect x="60" y="8"  width="2" height="2" fill="white" opacity="0.7"/>
            <rect x="35" y="3"  width="1" height="1" fill="white" opacity="0.6"/>
            <rect x="70" y="15" width="1" height="1" fill="white" opacity="0.9"/>
            <rect x="5"  y="20" width="1" height="1" fill="white" opacity="0.5"/>
            <rect x="8"  y="10" width="10" height="8" fill="#44DD44"/>
            <rect x="22" y="10" width="10" height="8" fill="#44DD44"/>
            <rect x="36" y="10" width="10" height="8" fill="#DDAA00"/>
            <rect x="50" y="10" width="10" height="8" fill="#DDAA00"/>
            <rect x="64" y="10" width="10" height="8" fill="#AA44FF"/>
            <rect x="22" y="36" width="6" height="10" fill="#FF6622"/>
            <rect x="16" y="40" width="6" height="6"  fill="#CC3300"/>
            <rect x="28" y="40" width="6" height="6"  fill="#CC3300"/>
            <rect x="24" y="33" width="2" height="4"  fill="#FF6622"/>
            <rect x="52" y="36" width="6" height="10" fill="#22AAFF"/>
            <rect x="46" y="40" width="6" height="6"  fill="#0055CC"/>
            <rect x="58" y="40" width="6" height="6"  fill="#0055CC"/>
            <rect x="54" y="33" width="2" height="4"  fill="#22AAFF"/>
        </svg>''',
    },
    {
        'id':    'pongpong',
        'name':  'PongPong',
        'title_html': 'PONG<span>PONG</span>',
        'desc':  'Duel Pong &bull; 2 joueurs &bull; Bonus dynamiques',
        'url':   '/pongpong',
        'color': '#00CC88',
        'accent':'#00FFAA',
        'card_class': 'pong-card',
        'btn_class':  'pong-btn',
        'title_class':'pong-title',
        'svg': '''<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="80" height="50" fill="#030308"/>
            <line x1="40" y1="2" x2="40" y2="48" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-dasharray="5,4"/>
            <rect x="5"  y="14" width="5" height="22" fill="#CC4400" rx="1"/>
            <rect x="70" y="14" width="5" height="22" fill="#1A5FA0" rx="1"/>
            <circle cx="40" cy="25" r="5" fill="#FFD700"/>
            <circle cx="27" cy="32" r="6" fill="none" stroke="#00CC88" stroke-width="1.5"/>
            <circle cx="27" cy="32" r="1.5" fill="#00CC88"/>
        </svg>''',
    },
    {
        'id':    'galaxyracer',
        'name':  'Galaxy Racer',
        'title_html': 'GALAXY<br><span>RACER</span>',
        'desc':  'Course spatiale &bull; 2 joueurs &bull; Esquive d\'asteroides',
        'url':   '/galaxyracer',
        'color': '#FF00AA',
        'accent':'#FF66CC',
        'card_class': 'racer-card',
        'btn_class':  'racer-btn',
        'title_class':'racer-title',
        'svg': '''<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="80" height="50" fill="#07001a"/>
            <rect x="12" y="4"  width="1" height="1" fill="white" opacity="0.8"/>
            <rect x="60" y="8"  width="1" height="1" fill="white" opacity="0.6"/>
            <rect x="34" y="2"  width="1" height="1" fill="white" opacity="0.7"/>
            <rect x="68" y="14" width="1" height="1" fill="white" opacity="0.9"/>
            <rect x="6"  y="18" width="1" height="1" fill="white" opacity="0.5"/>
            <rect x="46" y="20" width="1" height="1" fill="white" opacity="0.6"/>
            <polygon points="52,12 58,12 60,16 58,20 52,20 50,16" fill="#FF00AA"/>
            <polygon points="18,28 26,28 28,32 26,36 18,36 16,32" fill="#663388"/>
            <polygon points="22,36 22,40 20,43 16,42 16,38" fill="#AA4488"/>
            <rect x="22" y="38" width="6" height="10" fill="#FF6622"/>
            <rect x="18" y="42" width="5" height="6"  fill="#CC3300"/>
            <rect x="27" y="42" width="5" height="6"  fill="#CC3300"/>
            <rect x="24" y="34" width="2" height="4"  fill="#FFDD55"/>
            <rect x="52" y="38" width="6" height="10" fill="#22AAFF"/>
            <rect x="48" y="42" width="5" height="6"  fill="#0055CC"/>
            <rect x="57" y="42" width="5" height="6"  fill="#0055CC"/>
            <rect x="54" y="34" width="2" height="4"  fill="#AADDFF"/>
        </svg>''',
    },
    {
        'id':    'starcrew',
        'name':  'StarCrew',
        'title_html': 'STAR<span>CREW</span>',
        'desc':  'Coop 2 joueurs &bull; Pilote + Artilleur &bull; Grapin &amp; metal',
        'url':   '/starcrew',
        'color': '#00DDAA',
        'accent':'#FFAA00',
        'card_class': 'crew-card',
        'btn_class':  'crew-btn',
        'title_class':'crew-title',
        'svg': '''<svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="80" height="50" fill="#021a14"/>
            <rect x="8"  y="6"  width="1" height="1" fill="white" opacity="0.7"/>
            <rect x="66" y="4"  width="1" height="1" fill="white" opacity="0.9"/>
            <rect x="30" y="3"  width="1" height="1" fill="white" opacity="0.5"/>
            <rect x="72" y="18" width="1" height="1" fill="white" opacity="0.7"/>
            <rect x="4"  y="22" width="1" height="1" fill="white" opacity="0.6"/>
            <circle cx="22" cy="10" r="3" fill="#888" stroke="#444" stroke-width="0.5"/>
            <circle cx="58" cy="12" r="4" fill="#FFAA00" stroke="#AA7700" stroke-width="0.5"/>
            <polygon points="34,30 46,30 50,36 46,44 34,44 30,36" fill="#00DDAA"/>
            <rect x="36" y="32" width="8" height="6" fill="#FFAA00"/>
            <rect x="38" y="34" width="4" height="2" fill="#FFFFFF"/>
            <line x1="40" y1="30" x2="40" y2="22" stroke="#00DDAA" stroke-width="1.5"/>
            <rect x="38" y="20" width="4" height="4" fill="#00DDAA"/>
            <line x1="44" y1="36" x2="52" y2="28" stroke="#FFAA00" stroke-width="0.8" stroke-dasharray="2,1"/>
            <rect x="30" y="43" width="3" height="4" fill="#FF6622"/>
            <rect x="47" y="43" width="3" height="4" fill="#22AAFF"/>
        </svg>''',
    },
]
