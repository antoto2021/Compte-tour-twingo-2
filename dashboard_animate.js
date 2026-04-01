// ==========================================
// SIMULATEUR DE DONNÉES GPS (dashboard_animate.js)
// Source temporaire pour l'Étape 0 (GitHub Pages)
// ==========================================

console.log("🛠️ Simulateur GPS démarré avec les ratios exacts de la boîte MA5.");

// Données démultiplication exactes de la Peugeot 206
const TIRE_CIRCUMFERENCE = 1.757; // Calculé mathématiquement d'après vos données
const FINAL_DRIVE = 4.06; // Votre rapport de pont
const GEAR_RATIOS = [3.42, 1.81, 1.28, 0.98, 0.77]; // Vos 5 rapports de boîte

let currentGear = 0; // 1ère vitesse par défaut (Index 0)
let lastSpeedMps = 0;

// Calcule les RPM théoriques basés sur la transmission exacte
function calculateRpmFromSpeed(speedKmh) {
    if (speedKmh < 3) return 850; // Ralenti moteur

    let speedMps = speedKmh / 3.6;
    
    // Calcul de base pour le rapport actuellement engagé
    let rpm = speedMps * (60 / TIRE_CIRCUMFERENCE) * GEAR_RATIOS[currentGear] * FINAL_DRIVE;

    // Logique de "passage de vitesse" virtuelle pour simuler la conduite
    // On passe le rapport supérieur à 3000 RPM (jusqu'à la 5ème vitesse)
    if (rpm > 2200 && currentGear < 4) {
        currentGear++;
        rpm = speedMps * (60 / TIRE_CIRCUMFERENCE) * GEAR_RATIOS[currentGear] * FINAL_DRIVE;
    } 
    // On repasse le rapport inférieur sous 1400 RPM
    else if (rpm < 1600 && currentGear > 0) {
        currentGear--;
        rpm = speedMps * (60 / TIRE_CIRCUMFERENCE) * GEAR_RATIOS[currentGear] * FINAL_DRIVE;
    }
    
    return Math.round(rpm);
}

// Vérifie si le GPS du navigateur est actif
if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
        (position) => {
            // 1. Vitesse (m/s) convertie en km/h
            let speedMps = position.coords.speed || 0; 
            let speedKmh = Math.round(speedMps * 3.6);
            let altitude = position.coords.altitude ? Math.round(position.coords.altitude) : 145;

            // 2. RPM calculés avec votre vraie boîte
            let rpm = calculateRpmFromSpeed(speedKmh);

            // 3. Simulation de Charge et Papillon
            let acceleration = speedMps - lastSpeedMps; 
            lastSpeedMps = speedMps;

            let engineLoad = 25; 
            let throttle = 15; 
            
            if (acceleration > 0.5) { 
                engineLoad = 85; throttle = 70; // Accélération
            } else if (acceleration < -0.5) {
                engineLoad = 5; throttle = 0; // Freinage
            } else if (speedKmh < 3) {
                engineLoad = 30; throttle = 5; // Ralenti
            }

            // ==========================================
            // INJECTION DES DONNÉES DANS script.js
            // ==========================================
            const mockPayload = {
                obd: {
                    speed: speedKmh,
                    rpm: rpm,
                    coolant_temp: 88, 
                    engine_load: engineLoad,
                    throttle_pos: throttle,
                    intake_temp: 35,
                    map: (engineLoad > 50) ? 95 : 30, // Pression simulée
                    timing_advance: 15, // Avance simulée
                    lambda_volt: (Math.random() * (0.8 - 0.2) + 0.2).toFixed(2), // Oscillation de la sonde Lambda
                    fuel_status: "Closed loop",
                    stft: (Math.random() * 4 - 2).toFixed(1), // Variation STFT +/- 2%
                    ltft: 1.5
                },
                sensors: {
                    cabin_temp: 21.5,
                    ext_temp: 14,
                    pm25: 12,
                    altitude: altitude,
                    g_force_accel: (acceleration / 9.81).toFixed(2) // Simulation des G
                }
            };

            // Envoi des données si le vrai OBD n'est pas connecté
            if (typeof window.updateDashboardUI === 'function' && !window.isObdConnected) {
                window.updateDashboardUI(mockPayload);
            }
        }, 
        (error) => { console.warn("Erreur GPS: ", error.message); }, 
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
} else {
    alert("Votre appareil n'a pas de GPS pour la simulation.");
}
