
document.addEventListener("DOMContentLoaded", function () {
    var selectGroupe = document.getElementById("groupe");

    // Liste des groupes détectés dans edt_data
    var groupes = [
        "1G1A", "1G1B", "1G2A", "1G2B", "1G3A", "1G3B", "1G4A", "1G4B",
        "2GA1-1", "2GA1-2", "2GA2-1", "2GA2-2", "2GB-1", "2GB-2",
        "3A1-1", "3A1-2", "3A2-1", "3A2-2", "3B-1", "3B-2"
    ];

    // Génère les options dynamiquement
    selectGroupe.innerHTML = groupes.map(g =>
        `<option value="${g}">${g}</option>`
    ).join("");

    // 🛠️ Vérifie si un groupe était déjà sélectionné
    const savedGroup = localStorage.getItem("selectedGroup");
    if (savedGroup && groupes.includes(savedGroup)) {
        selectGroupe.value = savedGroup;
    }

    // Charge l'emploi du temps au changement de groupe
    selectGroupe.addEventListener("change", function () {
        localStorage.setItem("selectedGroup", this.value);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    var calendarEl = document.getElementById("calendar");
    var selectGroupe = document.getElementById("groupe");

    if (typeof FullCalendar === "undefined") {
        console.error("❌ FullCalendar.js n'est pas chargé !");
        return;
    }

    const savedGroup = localStorage.getItem("selectedGroup");
    if (savedGroup) {
        selectGroupe.value = savedGroup;
    }

    var calendar = new FullCalendar.Calendar(calendarEl, {
        locale: "fr",
        initialView: "timeGridWeek",
        nowIndicator: true,
        slotMinTime: "08:00:00",
        slotMaxTime: "19:00:00",
        height: "80vh",
        contentHeight: "auto",

        allDaySlot: false,
        expandRows: true,
        hiddenDays: [0],
        events: [],
        slotEventOverlap: false,

        eventDidMount: function (info) {
            let salle = info.event.extendedProps ? info.event.extendedProps.salle : null;
            let salleUrl = info.event.extendedProps ? info.event.extendedProps.salleUrl : null;
            let professeur = info.event.extendedProps ? info.event.extendedProps.professeur : null;

            let contentEl = document.createElement("div");
            contentEl.classList.add("event-details");

            // Affichage de la salle
            if (salle) {
                let salleEl = document.createElement("div");
                salleEl.classList.add("salle-info");
                salleEl.innerHTML = salleUrl
                    ? `<p onclick="afficheSalle('${salleUrl}')" style="cursor: pointer;" >📍 <strong>${salle}</strong></p>`
                    : `📍 <strong>${salle}</strong>`;
                contentEl.appendChild(salleEl);
            }

            // Affichage du professeur (nom + prénom)
            if (professeur && professeur !== "Inconnu") {
                let profEl = document.createElement("div");
                profEl.classList.add("prof-info");
                profEl.innerHTML = `👨‍🏫 <strong>${professeur}</strong>`;
                contentEl.appendChild(profEl);
            }

            let titleEl = info.el.querySelector(".fc-event-title");
            if (titleEl) {
                titleEl.insertAdjacentElement("afterend", contentEl);
            }
            
            let title = info.event.title || "";

            let match = title.match(/([RS]\d+(?:\.[A-Z]?(?:&[A-Z])?\.\d+|\.[A-Z]?\.\w+|\.\d+)|S\d+\.[A-Z]?\.\d+)/);
            if (match) {
                let resourceClass = "resource-" + match[1]
                    .replace(/\./g, "-")
                    .replace(/&/g, "")
                    .replace(/\s/g, "");
        
                info.el.classList.add(resourceClass);

            }

            // Appliquer la classe Examen
            if (info.event.title.includes("Examen") || info.event.title.includes("Soutenance") || info.event.title.includes("Evaluation")) {
                info.el.classList.add("exam-event");
            }

            // Appliquer la classe SAE
            if (info.event.title.match(/S\d+\.\d+/)) {
                info.el.classList.add("SAE");
            }

            // Appliquer la classe autonomie
            if (info.event.title.toLowerCase().includes("autonomie") || 
            (info.event.extendedProps.description && info.event.extendedProps.description.toLowerCase().includes("autonomie"))) {
            info.el.classList.add("autonomie");
            }
            // Appliquer la classe vacance
            if (info.event.title.includes("Vacances") || info.event.title.includes("Ferié")){
            info.el.classList.add("vacances");
            }
        }
    });
    
    function hideEmptySaturday(calendar) {
        let view = calendar.view;
        let startWeek = view.currentStart;
        let endWeek = view.currentEnd;
    
        let events = calendar.getEvents().filter(event => {
            let eventDate = new Date(event.start);
            return eventDate >= startWeek && eventDate < endWeek;
        });
    
        let hasSaturdayEvent = events.some(event => new Date(event.start).getDay() === 6);
    
        let currentHiddenDays = calendar.getOption('hiddenDays') || [];
        let newHiddenDays = hasSaturdayEvent ? [0] : [0, 6];
    
        if (JSON.stringify(currentHiddenDays) !== JSON.stringify(newHiddenDays)) {
            calendar.setOption('hiddenDays', newHiddenDays);
        }
    }
    
    calendar.on('eventsSet', function () {
        setTimeout(() => hideEmptySaturday(calendar), 100);
    });
    
    calendar.on('datesSet', function () {
        setTimeout(() => hideEmptySaturday(calendar), 100);
    });
    
    
    calendar.render();

    window.loadCalendar = function () {
        var selectedGroup = selectGroupe.value;
        console.log("🔍 Chargement de l'EDT pour :", selectedGroup);
    
        localStorage.setItem("selectedGroup", selectedGroup);
    
        let githubICSUrl = `https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/main/edt_data/${selectedGroup}.ics`;

    fetch(githubICSUrl)
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then((data) => {
        let events = parseICS(data);
        calendar.removeAllEvents();
        calendar.addEventSource(events);
    })
    .catch((error) => console.error("❌ Erreur lors du chargement du fichier .ics depuis GitHub :", error));

    };

    loadCalendar();

    function parseICS(icsData) {
        let events = [];
        let lines = icsData.split("\n");
        let event = {};

        for (let line of lines) {
            if (line.startsWith("BEGIN:VEVENT")) {
                event = {};
            } else if (line.startsWith("SUMMARY:")) {
                event.title = line.replace("SUMMARY:", "").trim();
            } else if (line.startsWith("DTSTART:")) {
                event.start = formatICSTime(line.replace("DTSTART:", "").trim());
            } else if (line.startsWith("DTEND:")) {
                event.end = formatICSTime(line.replace("DTEND:", "").trim());
            } else if (line.startsWith("LOCATION:")) {
                let salle = line.replace("LOCATION:", "").trim();
                event.extendedProps = {
                    salle: salle || "Salle inconnue",
                    salleUrl: salle ? `carte.html#${encodeURIComponent(salle)}` : null,
                    professeur: "Inconnu",
                };
            } else if (line.startsWith("DESCRIPTION:")) {
                let desc = line.replace("DESCRIPTION:", "").trim();
            
                // Nettoyage des lignes
                let cleanedDesc = desc
                    .replace(/\\n/g, " ")
                    .replace(/Groupe|Modifié le:|\(|\)|\//g, "")
                    .replace(/\d+/g, "")
                    .replace(/\s+/g, " ")
                    .replace(/-/g, " ")
                    .replace(/ère année/g, "")
                    .replace(/ème année/g, "")
                    .replace(/ère Année/g, "")
                    .replace(/ème Année/g, "")
                    .replace(/:/g,"")
                    .replace(/A an/g, "")
                    .replace(/ an /g, "")
                    .replace(/G[A-Z] /g, "")
                    
                    .trim();
    
            
                // Ce qui reste après nettoyage est le nom du professeur
                if (cleanedDesc) {
                    event.extendedProps.professeur = cleanedDesc;
                } else {
                    event.extendedProps.professeur = "";
                }
            }
            
            
             else if (line.startsWith("END:VEVENT")) {
                events.push(event);
            } else if (line.startsWith("SUMMARY:")) {
                let title = line.replace("SUMMARY:", "").trim();
                event.title = title;
            
                // Détection d'examen
                if (title.match(/examen|contrôle|partiel|évaluation|test/i)) {
                    event.extendedProps.isExam = true;
                }
            }
        
        }
        return events;
    }

    function formatICSTime(icsTime) {
        let dateObj = new Date(
            Date.UTC(
                parseInt(icsTime.substring(0, 4)),
                parseInt(icsTime.substring(4, 6)) - 1,
                parseInt(icsTime.substring(6, 8)),
                parseInt(icsTime.substring(9, 11)),
                parseInt(icsTime.substring(11, 13)),
                parseInt(icsTime.substring(13, 15)) 
            )
        );
    
        let offset = dateObj.getTimezoneOffset() / -60;
        dateObj.setHours(dateObj.getHours() + offset);
            return dateObj.toISOString().replace("Z", "");

        }
    });