// **** Gestion du select et stockage du groupe ****
document.addEventListener("DOMContentLoaded", function () {
    var selectGroupe = document.getElementById("groupe");

    // Liste des groupes détectés dans edt_data
    var groupes = [
        "1G1A", "1G1B", "1G2A", "1G2B", "1G3A", "1G3B", "1G4A", "1G4B",
        "2GA1-1", "2GA1-2", "2GA2-1", "2GA2-2", "2GB-1", "2GB-2",
        "3A1-1", "3A1-2", "3A2-1", "3A2-2", "3B-1", "3B-2"
    ];

    // Génère les options dynamiquement
    if (selectGroupe) {
        selectGroupe.innerHTML = groupes.map(g =>
            `<option value="${g}">${g}</option>`
        ).join("");

        // 🛠️ Vérifie si un groupe était déjà sélectionné
        const savedGroup = localStorage.getItem("selectedGroup");
        if (savedGroup && groupes.includes(savedGroup)) {
            selectGroupe.value = savedGroup;
        }

        // Stocke à chaque changement
        selectGroupe.addEventListener("change", function () {
            localStorage.setItem("selectedGroup", this.value);
        });
    }
});

// **** Initialisation du calendrier et intégration de la sélection par divs ****
document.addEventListener("DOMContentLoaded", function () {
    var calendarEl = document.getElementById("calendar");
    var selectGroupe = document.getElementById("groupe");

    if (!calendarEl) {
        console.error("❌ Élément #calendar introuvable !");
        return;
    }
    if (typeof FullCalendar === "undefined") {
        console.error("❌ FullCalendar.js n'est pas chargé !");
        return;
    }

    // Restaurer le groupe sauvegardé dans le Select (visuel uniquement)
    const savedGroup = localStorage.getItem("selectedGroup");
    if (savedGroup && selectGroupe) {
        selectGroupe.value = savedGroup;
    }

    // Configuration du calendrier
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
            var props = info.event.extendedProps || {};
            var contentEl = document.createElement("div");
            contentEl.classList.add("event-details");

            if (props.salle) {
                var salleEl = document.createElement("div");
                salleEl.classList.add("salle-info");
                salleEl.innerHTML = props.salleUrl
                    ? `<p onclick="afficheSalle('${props.salleUrl}')" style="cursor: pointer;">📍 <strong>${props.salle}</strong></p>`
                    : `📍 <strong>${props.salle}</strong>`;
                contentEl.appendChild(salleEl);
            }
            if (props.professeur && props.professeur !== "Inconnu") {
                var profEl = document.createElement("div");
                profEl.classList.add("prof-info");
                profEl.textContent = `👨‍🏫 ${props.professeur}`;
                contentEl.appendChild(profEl);
            }
            var titleEl = info.el.querySelector(".fc-event-title");
            if (titleEl) titleEl.insertAdjacentElement("afterend", contentEl);

            var title = info.event.title || "";
            var match = title.match(/([RS]\d+(?:\.[A-Z]?(?:&[A-Z])?\.\d+|\.[A-Z]?\.\w+|\.\d+)|S\d+\.[A-Z]?\.\d+)/);
            if (match) info.el.classList.add("resource-" + match[1].replace(/\.|&|\s/g, "-"));
            if (/Examen|Soutenance|Evaluation/i.test(title)) info.el.classList.add("exam-event");
            if (/S\d+\.\d+/.test(title)) info.el.classList.add("SAE");
            if (/autonomie/i.test(title) || (props.description && /autonomie/i.test(props.description))) info.el.classList.add("autonomie");
            if (/Vacances|Ferié/.test(title)) info.el.classList.add("vacances");
        }
    });


    function scanWeeks() {
        const events = calendar.getEvents();
        const today  = calendar.view.currentStart;
        const weeks = [
          {
            label:     'Cette semaine',
            base:      new Date(today),
            container: document.getElementById('summary-this-week')
          },
          {
            label:     'Semaine prochaine',
            base:      (() => { const d = new Date(today); d.setDate(d.getDate()+7); return d; })(),
            container: document.getElementById('summary-next-week')
          }
        ];
      
        weeks.forEach(wk => {
          const feries      = [];
          let   hasVacances = false;
          const empties     = [];
          const exams       = [];
          const cont        = wk.container;
          if (!cont) return;
      
          // 1) Vide l’ancien contenu puis ajoute systématiquement le titre
          cont.innerHTML = '';
          const h3 = document.createElement('h3');
          h3.textContent = wk.label;
          cont.appendChild(h3);
      
          // 2) Parcours des jours (skip sam/dim)
          for (let i = 0; i < 7; i++) {
            const day = new Date(wk.base);
            day.setDate(wk.base.getDate() + i);
            const dow = day.getDay();
            if (dow === 0 || dow === 6) continue;
      
            const dateLabel = day.toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
            const dayEvents = events.filter(e => {
              const d = e.start;
              return d.getFullYear() === day.getFullYear() &&
                     d.getMonth()    === day.getMonth()    &&
                     d.getDate()     === day.getDate();
            });
      
            if (dayEvents.length === 0) {
              empties.push(dateLabel);
            } else {
              dayEvents.forEach(e => {
                const t = e.title;
                if (/Vacances/i.test(t)) {
                  hasVacances = true;
                }
                else if (/Ferié|Férié/i.test(t)) {
                  feries.push(dateLabel);
                }
                else if (/Examen|Soutenance|Evaluation/i.test(t)) {
                  exams.push(`${dateLabel} → ${t}`);
                }
              });
            }
          }
      
          // 3) Si RAS, on affiche juste ça et on stoppe
          if (feries.length === 0 && !hasVacances && empties.length === 0 && exams.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Rien à signaler';
            cont.appendChild(p);
            return;
          }
      
          // 4) Sinon on affiche les paragraphes pertinents
          if (feries.length) {
            const p = document.createElement('p');
            p.textContent = `Jours fériés : ${[...new Set(feries)].join(', ')}`;
            cont.appendChild(p);
          }
          if (hasVacances) {
            const p = document.createElement('p');
            p.textContent = 'Vacances en approche';
            cont.appendChild(p);
          }
          if (empties.length) {
            const p = document.createElement('p');
            p.textContent = `Jours vides : ${empties.join(', ')}`;
            cont.appendChild(p);
          }
          if (exams.length) {
            const p = document.createElement('p');
            p.textContent = `Examens : ${exams.join(', ')}`;
            cont.appendChild(p);
          }
        });
      }

    // Masquage dynamique du samedi
    function hideEmptySaturday(cal) {
        var view = cal.view;
        var start = view.currentStart, end = view.currentEnd;
        var hasSat = cal.getEvents().some(evt => {
            var d = new Date(evt.start);
            return d >= start && d < end && d.getDay() === 6;
        });
        var days = hasSat ? [0] : [0,6];
        if (JSON.stringify(cal.getOption('hiddenDays')) !== JSON.stringify(days)) {
            cal.setOption('hiddenDays', days);
        }
    }
    calendar.on('eventsSet', () => setTimeout(() => hideEmptySaturday(calendar), 100));
    calendar.on('datesSet',  () => setTimeout(() => hideEmptySaturday(calendar), 100));
    calendar.on('datesSet',  () => scanWeeks());
    calendar.on('eventsSet', () => scanWeeks());
    calendar.render();

    // Fonction de chargement de l'ICS
    function loadCalendarForGroup(group) {
        console.log("🔍 Chargement de l'EDT pour :", group);
        localStorage.setItem("selectedGroup", group);
        var url = `https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/main/edt_data/${group}.ics`;
        fetch(url)
            .then(resp => { if (!resp.ok) throw new Error(`HTTP ${resp.status}`); return resp.text(); })
            .then(data => {
                var evts = parseICS(data);
                calendar.removeAllEvents();
                calendar.addEventSource(evts);
            })
            .catch(err => console.error("❌ Erreur ICS :", err));
    }

    // Clic sur chaque div de sous-groupe
    document.querySelectorAll('#groupe-menu .subgroup').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', function() {
          const grp = this.getAttribute('data-groupe');
          loadCalendarForGroup(grp);
      
          // ——— highlight path ———
          document.querySelectorAll('#groupe-menu .year, #groupe-menu .group, #groupe-menu .subgroup')
            .forEach(el => el.classList.remove('selected'));
      
          // sous-groupe
          this.classList.add('selected');
      
          // groupe parent
          const groupMenu   = this.parentElement;
          const groupHeader = groupMenu.previousElementSibling;
          if (groupHeader) groupHeader.classList.add('selected');
      
          // année parente
          const yearMenu   = groupMenu.parentElement;
          const yearHeader = yearMenu.previousElementSibling;
          if (yearHeader) yearHeader.classList.add('selected');
          // ————————————————
        });
      });
      

    // Chargement initial
    if (savedGroup) loadCalendarForGroup(savedGroup);

    // Parsing ICS
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

    // Conversion ICS → ISO
    function formatICSTime(str) {
        var y=+str.slice(0,4), m=+str.slice(4,6)-1, d=+str.slice(6,8);
        var hh=+str.slice(9,11), mm=+str.slice(11,13), ss=+str.slice(13,15);
        var dt = new Date(Date.UTC(y,m,d,hh,mm,ss));
        dt.setHours(dt.getHours() + dt.getTimezoneOffset()/ -60);
        return dt.toISOString().replace('Z','');
    }
});
