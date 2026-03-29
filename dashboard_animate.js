// ==========================================
// SIMULATEUR DE DONNÉES GPS (dashboard_animate.js)
// Source temporaire pour l'Étape 0 (GitHub Pages)
// ==========================================

console.log("🛠️ Simulateur GPS démarré. En attente du signal...");

// Données démultiplication Peugeot 206 1.4i (TU3JP BVA AL4)
const TIRE_CIRCUMFERENCE = 1.83; 
const FINAL_DRIVE = 4.28; 
const GEAR_RATIOS = [3.417, 1.949, 1.357, 1.054]; // BVA 4 Rapports

let currentGear = 0; // 1ère vitesse par défaut

// Calcule les RPM théoriques basés sur la transmission de la 206
function calculateRpmFromSpeed(speedKmh) {
    if (speedKmh < 3) return 850; // Ralenti moteur

    let speedMps = speedKmh / 3.6;
    
    // Calcul de base
    let rpm = speedMps * (60 / TIRE_CIRCUMFERENCE) * GEAR_RATIOS[currentGear] * FINAL_DRIVE;

    // Logique de "passage de vitesse automatique" virtuelle pour la simulation
    // On passe le rapport supérieur à 3500 RPM
    if (rpm > 3500 && currentGear < 3) {
        currentGear++;
        rpm = speedMps * (60 / TIRE_CIRCUMFERENCE) * GEAR_RATIOS[currentGear] * FINAL_DRIVE;
    } 
    // On repasse le rapport inférieur à 1600 RPM
    else if (rpm < 1600 && currentGear > 0) {
        currentGear--;
        rpm = speedMps * (60 / TIRE_CIRCUMFERENCE) * GEAR_RATIOS[currentGear] * FINAL_DRIVE;
    }
    
    return Math.round(rpm);
}

// Vérifie si le GPS du navigateur (tablette Android / Smartphone) est actif
if ("geolocation" in navigator) {
    // navigator.geolocation.watchPosition interroge la puce GPS en boucle
    navigator.geolocation.watchPosition(
        (position) => {
            // 1. Vitesse (m/s) convertie en km/h
            let speedMps = position.coords.speed || 0; 
            let speedKmh = Math.round(speedMps * 3.6);
            let altitude = position.coords.altitude ? Math.round(position.coords.altitude) : 145;

            // 2. RPM (Devinés dynamiquement)
            let rpm = calculateRpmFromSpeed(speedKmh);

            // 3. Simulation "Tricherie" (Charge et Papillon basés sur la vitesse)
            let engineLoad = Math.min(25 + (speedKmh * 0.7), 90);
            let throttle = Math.min(10 + (speedKmh * 0.8), 100);
            if(speedKmh < 3) { engineLoad = 25; throttle = 0; }

            // ==========================================
            // INJECTION DES DONNÉES DANS script.js
            // ==========================================
            // Nous construisons le colis de données EXACT que le Pi enverra.
            const mockPayload = {
                obd: {
                    speed: speedKmh,
                    rpm: rpm,
                    coolant_temp: 88, // Fictif, le moteur est chaud
                    engine_load: engineLoad,
                    throttle_pos: throttle,
                    intake_temp: 35
                },
                sensors: {
                    cabin_temp: 21.5,
                    pm25: 12,
                    altitude: altitude
                }
            };

            // Le simulateur n'affiche ses données QUE si le vrai OBD est déconnecté
            if (typeof window.updateDashboardUI === 'function' && !window.isObdConnected) {
                window.updateDashboardUI(mockPayload);
            }
        }, 
        (error) => { console.warn("Erreur GPS: ", error.message); }, 
        {
            enableHighAccuracy: true, // Force l'utilisation du GPS précis
            maximumAge: 0,
            timeout: 5000
        }
    );
} else {
    alert("Votre appareil n'a pas de GPS pour la simulation.");
}
