// ==========================================
// 1. GESTION DE LA NAVIGATION (4 Onglets)
// ==========================================
function switchTab(tabId, btnElement) {
    // Cache tous les contenus
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    // Retire le style "actif" de tous les boutons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Affiche le bon contenu et allume le bouton
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
}

// ==========================================
// 2. CAPTEURS VIRTUELS & DIAGNOSTIC
// ==========================================
// Calculateur mathématique du couple du moteur Peugeot TU3JP KFW
function getMaxTorqueAtRpm(rpm) {
    if (rpm < 1000) return 85; 
    if (rpm < 2800) return 85 + ((rpm - 1000) / 1800) * (120 - 85); 
    if (rpm < 4000) return 120 - ((rpm - 2800) / 1200) * (120 - 105);
    if (rpm <= 6200) return 105 - ((rpm - 4000) / 2200) * (105 - 80);
    return 0; 
}

// Simulation visuelle du scanner de défauts
function runDiagnostic() {
    const box = document.getElementById('dtc-results');
    box.style.color = "var(--text-muted)";
    box.innerText = "Interrogation du calculateur Sagem S2000 en cours...\nAnalyse des codes P0XXX...";
    
    // Simule un temps de recherche de 2 secondes
    setTimeout(() => {
        // Plus tard, nous relierons ça à la vraie fonction obd.commands.GET_DTC
        box.style.color = "var(--accent-green)";
        box.innerText = "✅ Scan terminé.\nAucun code défaut (DTC) détecté dans la mémoire.\nSystème antipollution opérationnel.";
    }, 2000);
}

// ==========================================
// 3. CONNEXION WEBSOCKET AU RASPBERRY PI
// ==========================================
const ws = new WebSocket(`ws://${window.location.host}/ws`);

ws.onopen = function() {
    console.log("Connecté au Dashboard 206 en temps réel !");
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    const obd = data.obd;
    const sensors = data.sensors;
    
    // --------------------------------------------------
    // ONGLET 1 : ESSENTIEL
    // --------------------------------------------------
    document.getElementById('val-speed').innerText = obd.speed || 0;
    
    // Régime Moteur et Zone Éco
    const rpmValEl = document.getElementById('val-rpm');
    const ecoStatusEl = document.getElementById('val-eco-status');
    const rpm = obd.rpm || 0;
    rpmValEl.innerText = rpm;

    if (rpm === 0) { 
        rpmValEl.style.color = "var(--text-main)"; ecoStatusEl.innerText = "Arrêté"; ecoStatusEl.style.color = "var(--text-muted)"; 
    } 
    else if (rpm < 1500) { 
        rpmValEl.style.color = "var(--accent-cyan)"; ecoStatusEl.innerText = "Sous-régime"; ecoStatusEl.style.color = "var(--accent-cyan)"; 
    } 
    else if (rpm <= 2500) { 
        rpmValEl.style.color = "var(--accent-green)"; ecoStatusEl.innerText = "Zone Éco"; ecoStatusEl.style.color = "var(--accent-green)"; 
    } 
    else if (rpm < 5500) { 
        rpmValEl.style.color = "var(--accent-orange)"; ecoStatusEl.innerText = "Puissance"; ecoStatusEl.style.color = "var(--accent-orange)"; 
    } 
    else { 
        rpmValEl.style.color = "var(--accent-red)"; ecoStatusEl.innerText = "⚠️ Zone Rouge"; ecoStatusEl.style.color = "var(--accent-red)"; 
    }

    // Jauge Température Liquide de Refroidissement
    let coolant = obd.coolant_temp || 0;
    let tempFill = Math.min((coolant / 120) * 100, 100);
    document.getElementById('val-temp').innerText = coolant + "°C";
    document.getElementById('bar-fill-temp').style.width = tempFill + "%";
    document.getElementById('val-temp').style.color = (coolant > 105) ? "var(--accent-red)" : "var(--accent-green)";

    // Grille Environnement Essentielle
    if(sensors) {
        document.getElementById('val-cabin').innerText = (sensors.cabin_temp || "--") + "°";
        document.getElementById('val-ext').innerText = "14°"; // Placeholder pour le moment
        document.getElementById('val-pm').innerText = sensors.pm25 !== undefined ? "AQI " + sensors.pm25 : "--";
        
        // Alerte pollution visuelle
        if(sensors.pm25 !== undefined) {
            document.getElementById('val-pm').style.color = (sensors.pm25 > 35) ? "var(--accent-orange)" : "var(--accent-green)";
        }
    }

    // --------------------------------------------------
    // ONGLET 2 : TÉLÉMÉTRIE
    // --------------------------------------------------
    let engineLoad = obd.engine_load || 0;
    let loadFactor = engineLoad / 100.0; 
    let currentTorque = getMaxTorqueAtRpm(rpm) * loadFactor;
    let currentHp = (currentTorque * rpm) / 7021.5;

    document.getElementById('val-torque').innerText = Math.round(currentTorque);
    document.getElementById('val-hp').innerText = Math.round(currentHp);
    document.getElementById('val-load').innerText = Math.round(engineLoad) + " %";
    
    // Nouveaux capteurs ajoutés suite à l'analyse de la 206
    if(obd.throttle_pos !== undefined) document.getElementById('val-throttle').innerText = obd.throttle_pos + " %";
    if(obd.intake_temp !== undefined) document.getElementById('val-iat').innerText = obd.intake_temp + " °C";
    if(sensors && sensors.g_force_accel !== undefined) document.getElementById('val-gforce').innerText = sensors.g_force_accel + " G";
	
	// --- Nouvelles données Télémétrie ---
    if(obd.map !== undefined) document.getElementById('val-map').innerText = obd.map + " kPa";
    if(obd.timing_advance !== undefined) document.getElementById('val-timing').innerText = obd.timing_advance + " °";
    if(obd.lambda_volt !== undefined) document.getElementById('val-lambda').innerText = obd.lambda_volt + " V";
    
    // Le statut de la boucle renvoie un texte (ex: "Closed loop")
    if(obd.fuel_status !== undefined) {
        let loopEl = document.getElementById('val-loop');
        loopEl.innerText = obd.fuel_status.includes("Closed") ? "Fermée (Optimale)" : "Ouverte (Chauffe/Pleine charge)";
        loopEl.style.color = obd.fuel_status.includes("Closed") ? "var(--accent-green)" : "var(--accent-orange)";
    }

    // --------------------------------------------------
    // ONGLET 3 : DIAGNOSTIC (STFT / LTFT)
    // --------------------------------------------------
    // Les sondes renvoient une correction de -25% à +25%. 
    // On convertit cela en largeur de barre CSS (50% = Zéro correction, le moteur est parfait)
    if(obd.stft !== undefined) {
        document.getElementById('val-stft').innerText = obd.stft + " %";
        document.getElementById('bar-fill-stft').style.width = (50 + (obd.stft * 2)) + "%";
    }
    
    if(obd.ltft !== undefined) {
        let ltftVal = document.getElementById('val-ltft');
        ltftVal.innerText = obd.ltft + " %";
        document.getElementById('bar-fill-ltft').style.width = (50 + (obd.ltft * 2)) + "%";
        
        // Alerte visuelle : le document d'analyse indique qu'au-delà de 15%, la 206 a probablement une fuite de vide
        if (obd.ltft > 15 || obd.ltft < -15) {
            ltftVal.style.color = "var(--accent-red)";
            document.getElementById('bar-fill-ltft').style.backgroundColor = "var(--accent-red)";
        } else {
            ltftVal.style.color = "var(--text-main)";
            document.getElementById('bar-fill-ltft').style.backgroundColor = "var(--accent-orange)";
        }
    }
};

ws.onclose = function() {
    console.warn("Connexion perdue avec le Raspberry Pi.");
    document.getElementById('val-speed').innerText = "--";
    document.getElementById('val-rpm').innerText = "--";
    document.getElementById('val-eco-status').innerText = "Déconnecté";
    document.getElementById('val-eco-status').style.color = "var(--accent-red)";
};
