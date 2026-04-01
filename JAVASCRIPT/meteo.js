async function getMeteoAix() {
    try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=43.5297&longitude=5.4474&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&timezone=Europe/Paris&forecast_days=7&current_weather=true");
        const data = await response.json();
        afficherDatesPrevision(data);
        return data;
    } catch (error) {
        console.error("❌ Erreur lors de la récupération de la météo :", error);
        return null;
    }

}

function changeIcone(codeMeteo) {
    let icone;
    let background;
    let nom;

    switch (codeMeteo) {
        case 0:
            icone = "☀️"; // Ciel clair
            background = "IMAGES/meteo/ensoleille.jpg";
            nom = "Ciel clair"
            break;
        case 1:
            icone = "🌤️"; // Peu nuageux
            background = "IMAGES/meteo/default.jpg";
            nom = "Peu nuageux"
            break;
        case 2:
            icone = "⛅️"; // Partiellement nuageux
            background = "IMAGES/meteo/partiellement-nuageux.jpg";
            nom = "Partiellement nuageux"
            break;
        case 3:
            icone = "☁️"; // Couvert
            background = "IMAGES/meteo/couvert.jpg";
            nom = "Couvert"
            break;
        case 45:
            icone = "🌫️"; // Brouillard
            background = "IMAGES/meteo/default.jpg";
            nom = "Brouillard"
            break;
        case 51:
            icone = "☀️🌧️"; // Bruine légère
            background = "IMAGES/meteo/default.jpg";
            nom = "Bruine légère"
            break;
        case 61:
            icone = "🌧️"; // Pluie légère
            background = "IMAGES/meteo/pluie-legere.webp";
            nom = "Pluie légère"
            break;
        case 63:
            icone = "🌧️🌧️"; // Pluie modérée
            background = "IMAGES/meteo/pluie-legere.webp";
            nom = "Pluie modérée"
            break;
        case 65:
            icone = "🌧️🌧️🌧️"; // Pluie forte
            background = "IMAGES/meteo/pluie.webp";
            nom = "Forte pluie"
            break;
        case 80:
            icone = "🌤️🌧️"; // Averses
            background = "IMAGES/meteo/averses.webp";
            nom = "Averses"
            break;
        case 95:
            icone = "⛈️"; // Orages
            background = "IMAGES/meteo/pluie.webp";
            nom = "Orages"
            break;
        case 96:
            icone = "⛈️🧊"; // Orages avec grêle
            background = "IMAGES/meteo/default.jpg";
            nom = "Orages avec grêle"
            break
        default:
            icone = "💀"; // On verra si je suis le goat ou pas
            background = "IMAGES/meteo/default.jpg";
            nom = "Absolute allo salem"
            break
    }
    return { icone, background, nom };
}

getMeteoAix().then(data => {
    if (data) {
        afficherPrevisionJour(0, data);
        initialiserCliquables(data);
    }
    else{
        console.log("Pas de data météo")
    }
});

function afficherMeteo(date, icone, temperature, vent, precipitations, min, max, background, nom) {
    const meteo = document.getElementById("meteo");
    const meteoDate = document.getElementById("meteo-date");
    const meteoLogo = document.getElementById("meteo-logo");
    const temperatureEl = document.getElementById("temperature");
    const ventEl = document.getElementById("vent");
    const tempMin = document.getElementById("temp_min");
    const tempMax = document.getElementById("temp_max");
    const precipitationsEl = document.getElementById("precipitations");
    const nomEl = document.getElementById("nom");

    if (!meteoDate || !meteoLogo || !temperatureEl || !ventEl || !tempMin || !tempMax || !precipitationsEl) {
        console.warn("❌ Certains éléments météo sont introuvables dans le DOM.");
        return;
    }

    meteo.style.backgroundImage = `url('${background}')`;
    meteoDate.textContent = date;
    meteoLogo.textContent = icone;
    nomEl.textContent = nom;
    temperatureEl.textContent = `${temperature}°C`;
    ventEl.textContent = `🍃 ${vent} km/h`;
    precipitationsEl.textContent = `🌧️ ${precipitations} mm`;
    tempMin.textContent = `🌡️ Min : ${min}°C`;
    tempMax.textContent = `🌡️ Max : ${max}°C`;
}

function afficherPrevisionJour(index, data) {
    highlightJour(index);

    const dateISO = data.daily.time[index];
    const datePrevision = new Date(dateISO);

    const date = datePrevision.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long"
    });

    let temperature;
    if (index === 0) {
        temperature = `${data.current_weather.temperature}`;
    } else {
        const min = data.daily.temperature_2m_min[index];
        const max = data.daily.temperature_2m_max[index];
        temperature = ((min + max) / 2).toFixed(1);
    }

    const vent = `${data.daily.windspeed_10m_max[index]}`;
    const min = `${data.daily.temperature_2m_min[index]}`;
    const max = `${data.daily.temperature_2m_max[index]}`;
    const pluie = `${data.daily.precipitation_sum[index]}`;
    const code = data.daily.weathercode[index];
    
    const { icone, background, nom } = changeIcone(code);

    afficherMeteo(date, icone, temperature, vent, pluie, min, max, background, nom);
}

function initialiserCliquables(data) {
    for (let i = 0; i < 7; i++) {
        const jourEl = document.getElementById(`jour${i + 1}`);
        if (jourEl) {
            jourEl.addEventListener("click", () => {
                afficherPrevisionJour(i, data);
            });
        }
    }
}

function highlightJour(index) {
    for (let i = 1; i <= 7; i++) {
        const el = document.getElementById(`jour${i}`);
        el.classList.remove("selected");
    }
    document.getElementById(`jour${index + 1}`).classList.add("selected");
}

function afficherDatesPrevision(data) {
    const jours = data.daily.time;

    for (let i = 0; i < 7; i++) {
        const date = new Date(jours[i]);
        const jour = String(date.getDate()).padStart(2, '0');
        const mois = String(date.getMonth() + 1).padStart(2, '0');

        const element = document.getElementById(`jour${i + 1}`);
        if (element) {
            element.textContent = `${jour}/${mois}`;
        }
    }
}
