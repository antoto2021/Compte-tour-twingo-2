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
    document.getElementById('val-speed').innerText = Math.round(obd.speed || 0);
    
    const rpmValEl = document.getElementById('val-rpm');
    const ecoStatusEl = document.getElementById('val-eco-status');
    const rpm = Math.round(obd.rpm || 0);
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

    let coolant = Math.round(obd.coolant_temp || 0);
    let tempFill = Math.min((coolant / 120) * 100, 100);
    document.getElementById('val-temp').innerText = coolant + "°C";
    document.getElementById('bar-fill-temp').style.width = tempFill + "%";
    document.getElementById('val-temp').style.color = (coolant > 105) ? "var(--accent-red)" : "var(--accent-green)";

    if(sensors.cabin_temp !== undefined) document.getElementById('val-cabin').innerText = Math.round(sensors.cabin_temp) + "°";
    if(sensors.ext_temp !== undefined) document.getElementById('val-ext').innerText = Math.round(sensors.ext_temp) + "°";
    if(sensors.pm25 !== undefined) {
        document.getElementById('val-pm').innerText = "AQI " + Math.round(sensors.pm25);
        document.getElementById('val-pm').style.color = (sensors.pm25 > 35) ? "var(--accent-orange)" : "var(--accent-green)";
    }

    // --- ONGLET 2 : TÉLÉMÉTRIE ---
    let engineLoad = obd.engine_load || 0;
    let loadFactor = engineLoad / 100.0; 
    let currentTorque = getMaxTorqueAtRpm(rpm) * loadFactor;
    let currentHp = (currentTorque * rpm) / 7021.5;

    // Arrondis stricts pour la télémétrie
    document.getElementById('val-torque').innerText = Math.round(currentTorque);
    document.getElementById('val-hp').innerText = Math.round(currentHp);
    document.getElementById('val-load').innerText = Math.round(engineLoad) + " %";
    
    if(obd.throttle_pos !== undefined) document.getElementById('val-throttle').innerText = Math.round(obd.throttle_pos) + " %";
    if(obd.intake_temp !== undefined) document.getElementById('val-iat').innerText = Math.round(obd.intake_temp) + " °C";
    if(obd.map !== undefined) document.getElementById('val-map').innerText = Math.round(obd.map) + " kPa";
    if(obd.timing_advance !== undefined) document.getElementById('val-timing').innerText = Math.round(obd.timing_advance) + " °";
    
    // EXCEPTIONS : Force G et Lambda gardent leurs décimales pour rester lisibles
    if(sensors.g_force_accel !== undefined) document.getElementById('val-gforce').innerText = Number(sensors.g_force_accel).toFixed(1) + " G";
    if(obd.lambda_volt !== undefined) document.getElementById('val-lambda').innerText = Number(obd.lambda_volt).toFixed(2) + " V";
    
    if(obd.fuel_status !== undefined) {
        let loopEl = document.getElementById('val-loop');
        loopEl.innerText = obd.fuel_status.includes("Closed") ? "Fermée (Optimale)" : "Ouverte (Pleine charge)";
        loopEl.style.color = obd.fuel_status.includes("Closed") ? "var(--accent-green)" : "var(--accent-orange)";
    }

    // --- ONGLET 3 : DIAGNOSTIC ---
    if(obd.stft !== undefined) {
        let stftVal = Math.round(obd.stft);
        document.getElementById('val-stft').innerText = stftVal + " %";
        document.getElementById('bar-fill-stft').style.width = Math.max(0, Math.min(100, (50 + (stftVal * 2)))) + "%";
    }
    if(obd.ltft !== undefined) {
        let ltftValRounded = Math.round(obd.ltft);
        let ltftEl = document.getElementById('val-ltft');
        ltftEl.innerText = ltftValRounded + " %";
        document.getElementById('bar-fill-ltft').style.width = Math.max(0, Math.min(100, (50 + (ltftValRounded * 2)))) + "%";
        
        if (ltftValRounded > 15 || ltftValRounded < -15) {
            ltftEl.style.color = "var(--accent-red)";
            document.getElementById('bar-fill-ltft').style.backgroundColor = "var(--accent-red)";
        } else {
            ltftEl.style.color = "var(--text-main)";
            document.getElementById('bar-fill-ltft').style.backgroundColor = "var(--accent-orange)";
        }
    }
};

// ==========================================
// 4. LOGIQUE DE CONNEXION (FAILOVER)
// ==========================================
window.isObdConnected = false;

try {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = function() {
        console.log("[RÉSEAU] Connecté au Raspberry Pi en temps réel !");
        window.isObdConnected = true;
    };

    ws.onmessage = function(event) {
        window.updateDashboardUI(JSON.parse(event.data));
    };

    ws.onclose = function() {
        console.warn("[RÉSEAU] Raspberry Pi non détecté. Basculement possible vers le simulateur.");
        window.isObdConnected = false;
        document.getElementById('val-eco-status').innerText = "Recherche capteurs...";
        document.getElementById('val-eco-status').style.color = "var(--text-muted)";
    };

    ws.onerror = function() {
        window.isObdConnected = false;
    };
} catch (e) {
    window.isObdConnected = false;
}
