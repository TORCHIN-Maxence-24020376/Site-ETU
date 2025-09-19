/* today.js — Vue jour unique (#edt-du-jour) avec classes CSS inspirées de la grille semaine */
(function () {
    const START_HOUR = 7;
    const END_HOUR   = 19;
    const PX_PER_MIN = 1.2;
    const VIEW_MODE  = "auto"; // "auto" => après 21h on bascule sur demain
  
    // ====== Groupe & URL ICS ======
    function getGroupFromStorage() {
      return localStorage.getItem('selectedGroup') || null;
    }
    function icsUrlFor(group) {
      return `https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/main/edt_data/${encodeURIComponent(group)}.ics`;
    }
  
    // ====== Date cible ======
    function getTargetDate(){
      const now = new Date();
      const target = new Date();
      if (VIEW_MODE === "auto" && now.getHours() >= 21) target.setDate(target.getDate()+1);
      target.setHours(0,0,0,0);
      return target;
    }
    function shouldUpdateAt(){
      const h = new Date().getHours();
      return h < 21 ? 21 : 24; // 24 => minuit
    }
    function scheduleNextUpdate(){
      const now = new Date();
      const targetHour = shouldUpdateAt();
      const next = new Date(now);
      next.setHours(targetHour,0,0,0);
      if (targetHour === 24) next.setDate(now.getDate()+1);
      const delay = next - now;
      setTimeout(()=>{ loadAndRender(); scheduleNextUpdate(); }, Math.max(1000, delay));
    }
  
    // ====== Utils ======
    function pad2(n){ return (n<10?"0":"")+n; }
    function frDateLong(d){
      return d.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    }
    function frTime(d){ return `${pad2(d.getHours())}h${pad2(d.getMinutes())}`; }
    function minutesSinceStart(date){ return (date.getHours()-START_HOUR)*60 + date.getMinutes(); }
    function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
    function sameYMD(a,b){
      return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
    }
  
    // ====== ICS parsing ======
    function icsTimeToDate(ics){
      const y=+ics.slice(0,4), m=+ics.slice(4,6)-1, d=+ics.slice(6,8);
      const H=+ics.slice(9,11), M=+ics.slice(11,13), S=+(ics.slice(13,15)||"0");
      return ics.endsWith("Z") ? new Date(Date.UTC(y,m,d,H,M,S)) : new Date(y,m,d,H,M,S);
    }
    function parseICS(text){
      const lines = text.replace(/\r/g,"\n").split(/\n/);
      // dé-plie (RFC 5545)
      for (let i=1;i<lines.length;i++){
        if (lines[i].startsWith(" ")) { lines[i-1]+=lines[i].slice(1); lines[i]=""; }
      }
      const out=[]; let ev=null;
      for (const raw of lines){
        const line = raw.trim(); if (!line) continue;
        if (line.startsWith("BEGIN:VEVENT")){
          ev = { extendedProps:{ professeur:"Inconnu", salle:"", salleUrl:null } };
        } else if (line.startsWith("SUMMARY:")){
          ev.title = line.slice(8).trim();
        } else if (line.startsWith("DTSTART")){
          ev.start = icsTimeToDate(line.split(":")[1]);
        } else if (line.startsWith("DTEND")){
          ev.end   = icsTimeToDate(line.split(":")[1]);
        } else if (line.startsWith("LOCATION:")){
          const salleClean = line.slice(9).trim().replace(/\\,/g,',');
          ev.extendedProps.salle = salleClean || "Salle inconnue";
          ev.extendedProps.salleUrl = salleClean ? `carte.html#${encodeURIComponent(salleClean)}` : null;
        } else if (line.startsWith("DESCRIPTION:")){
          const desc = line.slice(12).trim();
          const cleaned = desc
            .replace(/\\n/g," ")
            .replace(/Groupe|Modifié le:|\(|\)|\//g,"")
            .replace(/\d+/g,"")
            .replace(/\s+/g," ")
            .replace(/-/g," ")
            .replace(/ère année|ème année|ère Année|ème Année/g,"")
            .replace(/:/g,"")
            .replace(/A an| an /g," ")
            .replace(/G[A-Z] /g,"")
            .trim();
          ev.extendedProps.professeur = cleaned || "Inconnu";
        } else if (line.startsWith("END:VEVENT")){
          if (ev) out.push(ev);
          ev=null;
        }
      }
      return out;
    }
  
    // ====== Rendu de la timeline ======
    function renderGrid(container){
      container.innerHTML = "";
      container.style.position = "relative";
      container.style.padding = "0";
  
      const timeline = document.createElement("div");
      timeline.setAttribute("data-role","timeline");
      timeline.style.position = "relative";
      const totalMinutes = (END_HOUR-START_HOUR)*60;
      timeline.style.height = `${Math.max(480, totalMinutes*PX_PER_MIN)}px`;
  
      for (let h=START_HOUR; h<=END_HOUR; h++){
        const top = (h-START_HOUR)*60*PX_PER_MIN;
        const row = document.createElement("div");
        row.style.position = "absolute";
        row.style.left = 0; row.style.right = 0; row.style.top = `${top}px`;
        row.style.borderTop = "1px solid var(--glass-border)";
        row.style.opacity = "0.6";
  
        const label = document.createElement("span");
        label.textContent = `${pad2(h)}:00`;
        label.style.position = "absolute";
        label.style.left = "10px";
        label.style.top = "-10px";
        label.style.fontSize = "12px";
        label.style.color = "var(--less-important-text)";
  
        row.appendChild(label);
        timeline.appendChild(row);
      }
  
      const nowLine = document.createElement("div");
      nowLine.id = "now-line";
      nowLine.style.position = "absolute";
      nowLine.style.left = 0; nowLine.style.right = 0;
      nowLine.style.height = "2px";
      nowLine.style.background = "#e74c3c";
      nowLine.style.boxShadow = "0 0 6px rgba(231,76,60,0.8)";
      nowLine.style.zIndex = 5;
      timeline.appendChild(nowLine);
  
      container.appendChild(timeline);
      return { timeline, nowLine };
    }
  
    // ====== Attributions de classes (mêmes règles que ta grille semaine) ======
    function addSemanticClasses(card, ev){
      const title = ev.title || "";
      const t = title.toLowerCase();
      const s = (ev.extendedProps?.salle || "").toLowerCase();
      const p = (ev.extendedProps?.professeur || "").toLowerCase();
  
      // code UE / resource-* depuis le SUMMARY (regex reprise)
      const m = title.match(/([RS]\d+(?:\.[A-Z]?(?:&[A-Z])?\.\d+|\.[A-Z]?\.\w+|\.\d+)|S\d+\.[A-Z]?\.\d+)/);
      if (m) card.classList.add("resource-" + m[1].replace(/\.|&|\s/g,"-"));
  
      // catégories d’événements
      if (/Examen|Soutenance|Evaluation|évaluation|contrôle|partiel|test/i.test(title)) card.classList.add("exam-event");
      if (/S\d+\.\d+/.test(title)) card.classList.add("SAE");
      if (/autonomie/i.test(title)) card.classList.add("autonomie");
      if (/Vacances|Ferié|Férié/i.test(title)) card.classList.add("vacances");
  
      // type de séance (optionnel si tu as des styles par type)
      if (/\b(cmi|td|tp|cours magistral|amphi|cm)\b/.test(t)){
        const mt = t.match(/\b(td|tp|cm|amphi)\b/);
        if (mt) card.classList.add(`type-${mt[0]}`);
      }
  
      // ressources salle/prof (slugifiés)
      const salleSlug = s.replace(/\s+/g,'-').replace(/[^\w-]/g,'').slice(0,40);
      const profSlug  = p.replace(/\s+/g,'-').replace(/[^\w-]/g,'').slice(0,40);
      if (salleSlug) card.classList.add(`resource-salle-${salleSlug}`);
      if (profSlug)  card.classList.add(`resource-prof-${profSlug}`);
    }
  
    function placeEventCard(timeline, ev){
      const card = document.createElement("div");
      card.className = "cour";
  
      // classes CSS (héritées)
      addSemanticClasses(card, ev);
  
      // contenu
      const topRow = document.createElement("div");
      const name = document.createElement("p"); name.className = "name"; name.textContent = ev.title || "Cours";
      const location = document.createElement("p"); location.className = "location";
      location.textContent = ev.extendedProps?.salle || "Salle ?";
      if (ev.extendedProps?.salleUrl){
        location.style.cursor = "pointer";
        location.title = "Ouvrir sur la carte des prises";
        location.addEventListener('click', ()=> {
          if (typeof afficheSalle === 'function') {
            afficheSalle(ev.extendedProps.salleUrl);
          } else {
            // fallback
            localStorage.setItem("salleCiblee", ev.extendedProps.salleUrl);
            window.location.href = ev.extendedProps.salleUrl;
          }
        });
      }
      topRow.append(name, location);
  
      const bottomRow = document.createElement("div");
      const prof = document.createElement("p"); prof.className = "prof";  prof.textContent  = ev.extendedProps?.professeur || "Inconnu";
      const time = document.createElement("p"); time.className = "time";  time.textContent  = `${frTime(ev.start)} - ${frTime(ev.end)}`;
      bottomRow.append(prof, time);
  
      card.append(topRow, bottomRow);
  
      // positionnement
      const startMin = minutesSinceStart(ev.start);
      const endMin   = minutesSinceStart(ev.end);
      const top = clamp(startMin, 0, (END_HOUR-START_HOUR)*60) * PX_PER_MIN;
      const height = Math.max(32, (endMin - startMin) * PX_PER_MIN - 6);
      Object.assign(card.style, {
        position:"absolute", left:"10px", right:"10px",
        top:`${top}px`, height:`${height}px`,
        boxShadow:"0 6px 14px rgba(0,0,0,0.15)", zIndex:2
      });
  
      timeline.appendChild(card);
    }
  
    function updateNowLine(nowLine, containerDate){
      const now = new Date();
      const minutes = minutesSinceStart(now);
      const total = (END_HOUR-START_HOUR)*60;
      if (!sameYMD(now, containerDate) || minutes<0 || minutes>total){
        nowLine.style.display = "none";
        return;
      }
      nowLine.style.display = "block";
      nowLine.style.top = `${minutes*PX_PER_MIN}px`;
    }
  
    // ====== Chargement & rendu ======
    async function loadICS(url){
      const resp = await fetch(url, { cache:"no-cache" });
      if (!resp.ok) throw new Error("Chargement ICS échoué");
      return parseICS(await resp.text());
    }
  
    async function loadAndRender(){
      const container = document.getElementById("edt-du-jour");
      const dateHost  = document.getElementById("date-du-jour");
      if (!container) return;
  
      const targetDate = getTargetDate();
      if (dateHost) dateHost.textContent = frDateLong(targetDate);
  
      const group = getGroupFromStorage();
      if (!group){
        container.innerHTML = `<p style="padding:1rem">Aucun groupe sélectionné. Défini <code>localStorage.selectedGroup</code>.</p>`;
        return;
      }
  
      const { timeline, nowLine } = renderGrid(container);
  
      try{
        const events = await loadICS(icsUrlFor(group));
        const todays = events.filter(e => sameYMD(e.start, targetDate)).sort((a,b)=>a.start-b.start);
  
        todays.forEach(ev => placeEventCard(timeline, ev));
  
        // scroll auto
        const now = new Date();
        if (todays.length){
          const y = sameYMD(now, targetDate)
            ? minutesSinceStart(now)*PX_PER_MIN - (container.clientHeight*0.35)
            : minutesSinceStart(todays[0].start)*PX_PER_MIN - 20;
          container.scrollTo({ top: Math.max(0,y), behavior: "smooth" });
        }
  
        // ligne “maintenant”
        const tick = () => updateNowLine(nowLine, targetDate);
        tick();
        clearInterval(container._nowTimer);
        container._nowTimer = setInterval(tick, 60*1000);
  
      } catch (e){
        console.error(e);
        container.innerHTML = `<p style="padding:1rem">Impossible de charger l’EDT pour le groupe <b>${group}</b>.</p>`;
      }
    }
  
    // ====== Boot ======
    document.addEventListener("DOMContentLoaded", () => {
      if (document.getElementById("edt-du-jour")) {
        loadAndRender();
        scheduleNextUpdate();
      }
    });
  })();
  