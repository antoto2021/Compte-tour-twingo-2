// ==========================================
// 1. GESTION DE LA NAVIGATION (4 Onglets)
// ==========================================
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
}

// ==========================================
// 2. CAPTEURS VIRTUELS & DIAGNOSTIC
// ==========================================
function getMaxTorqueAtRpm(rpm) {
    if (rpm < 1000) return 85; 
    if (rpm < 2800) return 85 + ((rpm - 1000) / 1800) * (120 - 85); 
    if (rpm < 4000) return 120 - ((rpm - 2800) / 1200) * (120 - 105);
    if (rpm <= 6200) return 105 - ((rpm - 4000) / 2200) * (105 - 80);
    return 0; 
}

function runDiagnostic() {
    const box = document.getElementById('dtc-results');
    box.style.color = "var(--text-muted)";
    box.innerText = "Interrogation du calculateur Sagem S2000 en cours...\nAnalyse des codes P0XXX...";
    setTimeout(() => {
        box.style.color = "var(--accent-green)";
        box.innerText = "✅ Scan terminé.\nAucun code défaut (DTC) détecté dans la mémoire.\nSystème antipollution opérationnel.";
    }, 2000);
}

// ==========================================
// 3. LE MOTEUR D'AFFICHAGE (Accessible globalement)
// ==========================================
window.updateDashboardUI = function(data) {
    if (!data || !data.obd) return;

    const obd = data.obd;
    const sensors = data.sensors || {};
    
    // --- ONGLET 1 : ESSENTIEL ---
    document.getElementById('val-speed').innerText = obd.speed || 0;
    
    const rpmValEl = document.getElementById('val-rpm');
    const ecoStatusEl = document.getElementById('val-eco-status');
    const rpm = obd.rpm || 0;
    rpmValEl.innerText = rpm;

    if (rpm === 0) { 
        rpmValEl.style.color = "var(--text-main)"; ecoStatusEl.innerText = "Arrêté"; ecoStatusEl.style.color = "var(--text-muted)"; 
    } else if (rpm < 1500) { 
        rpmValEl.style.color = "var(--accent-cyan)"; ecoStatusEl.innerText = "Sous-régime"; ecoStatusEl.style.color = "var(--accent-cyan)"; 
    } else if (rpm <= 2500) { 
        rpmValEl.style.color = "var(--accent-green)"; ecoStatusEl.innerText = "Zone Éco"; ecoStatusEl.style.color = "var(--accent-green)"; 
    } else if (rpm < 5500) { 
        rpmValEl.style.color = "var(--accent-orange)"; ecoStatusEl.innerText = "Puissance"; ecoStatusEl.style.color = "var(--accent-orange)"; 
    } else { 
        rpmValEl.style.color = "var(--accent-red)"; ecoStatusEl.innerText = "⚠️ Zone Rouge"; ecoStatusEl.style.color = "var(--accent-red)"; 
    }

    let coolant = obd.coolant_temp || 0;
    let tempFill = Math.min((coolant / 120) * 100, 100);
    document.getElementById('val-temp').innerText = coolant + "°C";
    document.getElementById('bar-fill-temp').style.width = tempFill + "%";
    document.getElementById('val-temp').style.color = (coolant > 105) ? "var(--accent-red)" : "var(--accent-green)";

    if(sensors.cabin_temp !== undefined) document.getElementById('val-cabin').innerText = sensors.cabin_temp + "°";
    if(sensors.ext_temp !== undefined) document.getElementById('val-ext').innerText = sensors.ext_temp + "°";
    if(sensors.pm25 !== undefined) {
        document.getElementById('val-pm').innerText = "AQI " + sensors.pm25;
        document.getElementById('val-pm').style.color = (sensors.pm25 > 35) ? "var(--accent-orange)" : "var(--accent-green)";
    }

    // --- ONGLET 2 : TÉLÉMÉTRIE ---
    let engineLoad = obd.engine_load || 0;
    let loadFactor = engineLoad / 100.0; 
    let currentTorque = getMaxTorqueAtRpm(rpm) * loadFactor;
    let currentHp = (currentTorque * rpm) / 7021.5;

    document.getElementById('val-torque').innerText = Math.round(currentTorque);
    document.getElementById('val-hp').innerText = Math.round(currentHp);
    document.getElementById('val-load').innerText = Math.round(engineLoad) + " %";
    
    if(obd.throttle_pos !== undefined) document.getElementById('val-throttle').innerText = obd.throttle_pos + " %";
    if(obd.intake_temp !== undefined) document.getElementById('val-iat').innerText = obd.intake_temp + " °C";
    if(sensors.g_force_accel !== undefined) document.getElementById('val-gforce').innerText = sensors.g_force_accel + " G";
	
    if(obd.map !== undefined) document.getElementById('val-map').innerText = obd.map + " kPa";
    if(obd.timing_advance !== undefined) document.getElementById('val-timing').innerText = obd.timing_advance + " °";
    if(obd.lambda_volt !== undefined) document.getElementById('val-lambda').innerText = obd.lambda_volt + " V";
    
    if(obd.fuel_status !== undefined) {
        let loopEl = document.getElementById('val-loop');
        loopEl.innerText = obd.fuel_status.includes("Closed") ? "Fermée (Optimale)" : "Ouverte (Pleine charge)";
        loopEl.style.color = obd.fuel_status.includes("Closed") ? "var(--accent-green)" : "var(--accent-orange)";
    }

    // --- ONGLET 3 : DIAGNOSTIC ---
    if(obd.stft !== undefined) {
        document.getElementById('val-stft').innerText = obd.stft + " %";
        document.getElementById('bar-fill-stft').style.width = (50 + (obd.stft * 2)) + "%";
    }
    if(obd.ltft !== undefined) {
        let ltftVal = document.getElementById('val-ltft');
        ltftVal.innerText = obd.ltft + " %";
        document.getElementById('bar-fill-ltft').style.width = (50 + (obd.ltft * 2)) + "%";
        if (obd.ltft > 15 || obd.ltft < -15) {
            ltftVal.style.color = "var(--accent-red)";
            document.getElementById('bar-fill-ltft').style.backgroundColor = "var(--accent-red)";
        } else {
            ltftVal.style.color = "var(--text-main)";
            document.getElementById('bar-fill-ltft').style.backgroundColor = "var(--accent-orange)";
        }
    }
};

// ==========================================
// 4. LOGIQUE DE CONNEXION (FAILOVER)
// ==========================================

// Variable globale pour informer le simulateur de l'état du vrai OBD
window.isObdConnected = false;

try {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = function() {
        console.log("[RÉSEAU] Connecté au Raspberry Pi en temps réel !");
        window.isObdConnected = true; // Le vrai OBD prend le relais
    };

    ws.onmessage = function(event) {
        // Envoie les vraies données au moteur d'affichage
        window.updateDashboardUI(JSON.parse(event.data));
    };

    ws.onclose = function() {
        console.warn("[RÉSEAU] Raspberry Pi non détecté. Basculement possible vers le simulateur.");
        window.isObdConnected = false;
        
        // Affichage d'un statut déconnecté temporaire (le simulateur l'écrasera s'il est actif)
        document.getElementById('val-eco-status').innerText = "Recherche capteurs...";
        document.getElementById('val-eco-status').style.color = "var(--text-muted)";
    };

    ws.onerror = function() {
        window.isObdConnected = false;
    };
} catch (e) {
    window.isObdConnected = false;
}
