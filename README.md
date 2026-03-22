<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Dashboard Peugeot 206</title>
    <style>
        /* --- VARIABLES DE COULEURS (Dark Mode) --- */
        :root {
            --bg-color: #0d0d0d;
            --card-bg: #1c1c1e;
            --text-main: #ffffff;
            --text-muted: #8e8e93;
            --accent-blue: #0a84ff;
            --accent-green: #30d158;
            --accent-red: #ff453a;
            --accent-orange: #ff9f0a;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            /* Empêche de sélectionner le texte par erreur en conduisant */
            user-select: none; 
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* --- BARRE D'ONGLETS --- */
        .tab-bar {
            display: flex;
            background-color: var(--card-bg);
            padding: 15px 15px;
            gap: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            z-index: 10;
        }
        .tab-btn {
            flex: 1;
            padding: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: none;
            color: var(--text-muted);
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tab-btn.active {
            background-color: rgba(10, 132, 255, 0.15);
            color: var(--accent-blue);
        }

        /* --- ZONE DE CONTENU --- */
        .content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* --- ONGLET 1 : COMPTEURS TEMPS RÉEL --- */
        .gauge-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 10px;
            margin-bottom: 30px;
            position: relative;
        }
        
        /* Compteur SVG (Régime Moteur) */
        .gauge {
            width: 260px;
            height: 260px;
        }
        .gauge-bg {
            fill: none;
            stroke: #2c2c2e;
            stroke-width: 14;
        }
        .gauge-progress {
            fill: none;
            stroke: var(--accent-blue);
            stroke-width: 14;
            stroke-linecap: round;
            /* 630 est la circonférence. En changeant le dashoffset en JS, la jauge se remplit */
            stroke-dasharray: 630; 
            stroke-dashoffset: 250; 
            transition: stroke-dashoffset 0.2s ease-out;
        }

        /* Vitesse au centre de la jauge */
        .speed-display {
            position: absolute;
            text-align: center;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .speed-val {
            font-size: 4.8rem;
            font-weight: 800;
            line-height: 1;
            letter-spacing: -2px;
        }
        .speed-unit {
            font-size: 1.2rem;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
            margin-top: 5px;
        }

        /* Barres de progression horizontales */
        .bar-card {
            background-color: var(--card-bg);
            border-radius: 16px;
            padding: 18px;
            margin-bottom: 15px;
        }
        .bar-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .bar-track {
            height: 14px;
            background-color: #2c2c2e;
            border-radius: 8px;
            overflow: hidden;
        }
        .bar-fill-temp {
            height: 100%;
            width: 45%; /* Modifier en JS pour faire bouger la barre */
            background: linear-gradient(90deg, var(--accent-blue), var(--accent-green) 60%, var(--accent-red));
            border-radius: 8px;
            transition: width 0.3s ease;
        }
        .bar-fill-load {
            height: 100%;
            width: 30%;
            background-color: var(--accent-orange);
            border-radius: 8px;
            transition: width 0.3s ease;
        }

        /* Grille pour les capteurs Environnement */
        .env-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .env-card {
            background-color: var(--card-bg);
            border-radius: 16px;
            padding: 18px;
            text-align: center;
        }
        .env-val {
            font-size: 2.2rem;
            font-weight: bold;
            margin: 5px 0;
        }
        .env-label {
            font-size: 0.9rem;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 600;
        }

        /* --- ONGLET 2 : HISTORIQUE TRAJETS --- */
        .trip-header {
            font-size: 1.4rem;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .trip-item {
            background-color: var(--card-bg);
            border-radius: 16px;
            padding: 18px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 5px solid var(--accent-green);
        }
        .trip-date {
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 5px;
        }
        .trip-stats {
            color: var(--text-muted);
            font-size: 0.95rem;
        }
        .trip-score {
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--accent-green);
        }
        .score-label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-align: center;
            text-transform: uppercase;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <div class="tab-bar">
        <button class="tab-btn active" onclick="switchTab('dash', this)">Dashboard</button>
        <button class="tab-btn" onclick="switchTab('history', this)">Trajets</button>
    </div>

    <div class="content">

        <div id="dash" class="tab-content active">
            
            <div class="gauge-container">
                <svg class="gauge" viewBox="0 0 220 220">
                    <circle class="gauge-bg" cx="110" cy="110" r="100"></circle>
                    <circle class="gauge-progress" cx="110" cy="110" r="100" transform="rotate(135 110 110)"></circle>
                </svg>
                <div class="speed-display">
                    <div class="speed-val" id="val-speed">84</div>
                    <div class="speed-unit">km/h</div>
                </div>
            </div>

            <div class="bar-card">
                <div class="bar-header">
                    <span>Température LDR</span>
                    <span id="val-temp" style="color: var(--accent-green);">88°C</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill-temp"></div>
                </div>
            </div>

            <div class="bar-card">
                <div class="bar-header">
                    <span>Charge Moteur</span>
                    <span id="val-load">30%</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill-load"></div>
                </div>
            </div>

            <div class="env-grid">
                <div class="env-card">
                    <div class="env-label">Habitacle</div>
                    <div class="env-val" id="val-cabin">21°</div>
                </div>
                <div class="env-card">
                    <div class="env-label">Qualité Air</div>
                    <div class="env-val" id="val-pm" style="color: var(--accent-green);">AQI 12</div>
                </div>
            </div>

        </div>

        <div id="history" class="tab-content">
            <div class="trip-header">Vos derniers trajets</div>
            
            <div class="trip-item">
                <div>
                    <div class="trip-date">Aujourd'hui • 08h30</div>
                    <div class="trip-stats">24 km • 35 min • Vmax: 110 km/h</div>
                </div>
                <div>
                    <div class="trip-score">8.5</div>
                    <div class="score-label">Éco-Score</div>
                </div>
            </div>

            <div class="trip-item" style="border-left-color: var(--accent-orange);">
                <div>
                    <div class="trip-date">Hier • 18h15</div>
                    <div class="trip-stats">12 km • 45 min (Bouchons)</div>
                </div>
                <div>
                    <div class="trip-score" style="color: var(--accent-orange);">6.2</div>
                    <div class="score-label">Éco-Score</div>
                </div>
            </div>
            
            <div class="trip-item" style="border-left-color: var(--accent-blue);">
                <div>
                    <div class="trip-date">Dimanche • 14h00</div>
                    <div class="trip-stats">145 km • 1h 20m (Autoroute)</div>
                </div>
                <div>
                    <div class="trip-score" style="color: var(--accent-blue);">7.8</div>
                    <div class="score-label">Éco-Score</div>
                </div>
            </div>
        </div>

    </div>

    <script>
        function switchTab(tabId, btnElement) {
            // 1. On cache tous les contenus et on retire la couleur active des boutons
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            
            // 2. On affiche le contenu demandé et on colore le bouton cliqué
            document.getElementById(tabId).classList.add('active');
            btnElement.classList.add('active');
        }
    </script>

</body>
</html>
