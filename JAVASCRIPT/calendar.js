(function () {
  // --- Réglages d'affichage
  const START_HOUR = 7;
  const END_HOUR   = 20;
  const PX_PER_MIN = 1.2;
  const VIEW_MODE  = "auto"; // bascule sur demain après 21h

  // --- État
  let weekOffset = 0;
  let CURRENT_GROUP = null;
  const EVENTS_CACHE = new Map(); // key = group, value = array events

  // --- Utils dates
  function getTargetDate() {
    const now = new Date();
    const target = new Date();
    if (VIEW_MODE === "tomorrow") target.setDate(target.getDate() + 1);
    else if (VIEW_MODE === "auto" && now.getHours() >= 21) target.setDate(target.getDate() + 1);
    target.setHours(0,0,0,0);
    return target;
  }
  function getMonday(d){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function sameYMD(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function pad2(n){ return (n<10?"0":"")+n; }
  function frTime(d){ return `${pad2(d.getHours())}h${pad2(d.getMinutes())}`; }
  function minutesSinceStart(date){ return (date.getHours()-START_HOUR)*60 + date.getMinutes(); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }

  // --- ICS parsing (hérité et consolidé)
  function icsTimeToDate(ics){
    const y=+ics.slice(0,4), m=+ics.slice(4,6)-1, d=+ics.slice(6,8);
    const H=+ics.slice(9,11), M=+ics.slice(11,13), S=+(ics.slice(13,15)||"0");
    return ics.endsWith("Z") ? new Date(Date.UTC(y,m,d,H,M,S)) : new Date(y,m,d,H,M,S);
  }
  function parseICS(text){
    const lines = text.replace(/\r/g,"\n").split(/\n/);
    // dé-plie les lignes continuées (RFC 5545)
    for (let i=1;i<lines.length;i++){ if (lines[i].startsWith(" ")) { lines[i-1]+=lines[i].slice(1); lines[i]=""; } }

    const out = []; let ev=null;
    for (const raw of lines){
      const line = raw.trim(); if (!line) continue;
      if (line.startsWith("BEGIN:VEVENT")) {
        ev = { extendedProps:{ professeur:"Inconnu", salle:"", salleUrl:null } };
      }
      else if (line.startsWith("SUMMARY:")) {
        ev.title = line.slice(8).trim();
      }
      else if (line.startsWith("DTSTART")) {
        ev.start = icsTimeToDate(line.split(":")[1]);
      }
      else if (line.startsWith("DTEND")) {
        ev.end = icsTimeToDate(line.split(":")[1]);
      }
      else if (line.startsWith("LOCATION:")) {
        const salleClean=line.slice(9).trim().replace(/\\,/g,',');
        ev.extendedProps.salle = salleClean || "Salle inconnue";
        ev.extendedProps.salleUrl = salleClean ? `carte.html#${encodeURIComponent(salleClean)}` : null;
      }
      else if (line.startsWith("DESCRIPTION:")) {
        const desc=line.slice(12).trim();
        const cleaned=desc
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
      }
      else if (line.startsWith("END:VEVENT")) {
        if (ev) out.push(ev);
        ev=null;
      }
    }
    return out;
  }

  // --- Chargement ICS par groupe (avec cache)
  async function loadICS(group){
    if (EVENTS_CACHE.has(group)) return EVENTS_CACHE.get(group);
    const url = `https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/main/edt_data/${group}.ics`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Erreur de chargement ICS (${resp.status})`);
    const events = parseICS(await resp.text());
    EVENTS_CACHE.set(group, events);
    return events;
  }

  // --- Header navigation (icônes => IMAGES/*)
  function makeHeader(container, weekStart, weekEnd) {
    const hdr = document.createElement("div");
    Object.assign(hdr.style,{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"0.5rem",margin:"0 0 0.5rem 0"});

    const left = document.createElement("div");
    left.style.display = "flex"; left.style.gap = "0.5rem";

    const mkBtn = (iconPath, label, onClick) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", label);
      btn.title = label;
      Object.assign(btn.style,{
        padding:"6px 10px", borderRadius:"10px", border:"1px solid var(--glass-border)",
        background:"var(--glass-bg-dark)", cursor:"pointer", display:"inline-flex",
        alignItems:"center", justifyContent:"center"
      });
      const img = document.createElement("img");
      img.src = iconPath; img.alt = label; img.width = 20; img.height = 20; img.style.display = "block";
      btn.appendChild(img);
      btn.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); onClick(); });
      return btn;
    };

    const prev  = mkBtn("IMAGES/prev.svg",  "Semaine précédente", ()=>{ weekOffset--; loadAndRender(); });
    const today = mkBtn("IMAGES/today.svg", "Aujourd’hui",         ()=>{ weekOffset=0;  loadAndRender(); });
    const next  = mkBtn("IMAGES/next.svg",  "Semaine suivante",    ()=>{ weekOffset++; loadAndRender(); });

    left.append(prev, today, next);

    const title = document.createElement("div");
    title.style.fontWeight = "600"; title.style.opacity = "0.9";
    const opts = { weekday:"short", day:"2-digit", month:"short" };
    title.textContent = `${weekStart.toLocaleDateString('fr-FR', opts)} → ${weekEnd.toLocaleDateString('fr-FR', opts)}`;

    hdr.append(left, title);
    container.appendChild(hdr);
  }

  // --- Colonne jour
  function renderDayColumn(grid, dateObj) {
    const col = document.createElement("div");
    col.className = "day-col";
    Object.assign(col.style,{flex:"1 1 0",minWidth:"220px",position:"relative",borderLeft:"1px solid var(--glass-border)",padding:"0.25rem 0.5rem",boxSizing:"border-box"});

    const head = document.createElement("div");
    Object.assign(head.style,{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"0.25rem"});
    const name = dateObj.toLocaleDateString('fr-FR',{weekday:"long"});
    const labL = document.createElement("span"); labL.textContent = name.charAt(0).toUpperCase()+name.slice(1); labL.style.fontWeight="600";
    const labR = document.createElement("span"); labR.textContent = dateObj.toLocaleDateString('fr-FR',{day:"2-digit",month:"2-digit"}); labR.style.opacity="0.7";
    head.append(labL, labR);
    col.appendChild(head);

    const timeline = document.createElement("div");
    timeline.style.position = "relative";
    const totalMinutes = (END_HOUR-START_HOUR)*60;
    timeline.style.height = `${Math.max(480,totalMinutes*PX_PER_MIN)}px`;
    timeline.style.borderTop = "1px solid var(--glass-border)";
    timeline.style.borderRight = "1px solid var(--glass-border)";
    timeline.style.borderRadius = "12px";
    timeline.style.overflow = "hidden";

    for (let h=START_HOUR; h<=END_HOUR; h++){
      const top = (h-START_HOUR)*60*PX_PER_MIN;
      const row = document.createElement("div");
      Object.assign(row.style,{position:"absolute",left:0,right:0,top:`${top}px`,borderTop:"1px dashed var(--glass-border)",opacity:"0.6"});
      const label = document.createElement("span");
      Object.assign(label.style,{position:"absolute",left:"8px",top:"-10px",fontSize:"11px",color:"var(--less-important-text)"});
      label.textContent = `${pad2(h)}:00`;
      row.appendChild(label);
      timeline.appendChild(row);
    }

    const nowLine = document.createElement("div");
    Object.assign(nowLine.style,{position:"absolute",left:0,right:0,height:"2px",background:"#e74c3c",boxShadow:"0 0 6px rgba(231,76,60,0.8)",zIndex:5});
    timeline.appendChild(nowLine);

    col.appendChild(timeline);
    grid.appendChild(col);
    return { col, timeline, nowLine };
  }

  // --- Carte cours
  function placeEventCard(timeline, ev){
    const card = document.createElement("div");
    card.className = "cour";

    // Attributions de classes (hérité de l'ancien)
    const t = ev.title || "";
    const match = t.match(/([RS]\d+(?:\.[A-Z]?(?:&[A-Z])?\.\d+|\.[A-Z]?\.\w+|\.\d+)|S\d+\.[A-Z]?\.\d+)/);
    if (match) card.classList.add("resource-" + match[1].replace(/\.|&|\s/g, "-"));
    if (/Examen|Soutenance|Evaluation|évaluation|contrôle|partiel|test/i.test(t)) card.classList.add("exam-event");
    if (/S\d+\.\d+/.test(t)) card.classList.add("SAE");
    if (/autonomie/i.test(t)) card.classList.add("autonomie");
    if (/Vacances|Ferié|Férié/.test(t)) card.classList.add("vacances");

    const topRow = document.createElement("div");
    const name = document.createElement("p"); name.className="name"; name.textContent=ev.title||"Cours";
    const location = document.createElement("p"); location.className="location"; location.textContent=ev.extendedProps?.salle||"Salle ?";
    if (ev.extendedProps?.salleUrl) {
      location.style.cursor = 'pointer';
      location.title = 'Ouvrir sur la carte des prises';
      location.addEventListener('click', ()=>{ afficheSalle(ev.extendedProps.salleUrl); });
    }
    topRow.append(name, location);

    const bottomRow = document.createElement("div");
    const prof = document.createElement("p"); prof.className="prof"; prof.textContent=ev.extendedProps?.professeur||"Inconnu";
    const time = document.createElement("p"); time.className="time"; time.textContent=`${frTime(ev.start)} - ${frTime(ev.end)}`;
    bottomRow.append(prof, time);

    card.append(topRow, bottomRow);

    card.style.position="absolute";
    const startMin = minutesSinceStart(ev.start);
    const endMin   = minutesSinceStart(ev.end);
    const top = clamp(startMin,0,(END_HOUR-START_HOUR)*60) * PX_PER_MIN;
    const height = Math.max(32, (endMin - startMin) * PX_PER_MIN - 6);
    Object.assign(card.style,{left:"8px",right:"8px",top:`${top}px`,height:`${height}px`,boxShadow:"0 6px 14px rgba(0,0,0,0.15)",zIndex:2});
    timeline.appendChild(card);
  }

  function updateNowLine(nowLine, containerDate){
    const now = new Date();
    const minutes = minutesSinceStart(now);
    const total = (END_HOUR-START_HOUR)*60;
    if (!sameYMD(now,containerDate) || minutes<0 || minutes>total){ nowLine.style.display="none"; return; }
    nowLine.style.display="block";
    nowLine.style.top = `${minutes*PX_PER_MIN}px`;
  }

  function shouldUpdateAt(){ const h=new Date().getHours(); return h<21?21:24; }
  function scheduleNextUpdate(){
    const now=new Date(); const targetHour=shouldUpdateAt(); const next=new Date(now);
    next.setHours(targetHour,0,0,0); if (targetHour===24) next.setDate(now.getDate()+1);
    const delay=next-now;
    setTimeout(()=>{ loadAndRender(); scheduleNextUpdate(); }, Math.max(1000,delay));
  }

  // --- Résumé de semaine (reconstruction côté grille)
  function scanWeeks(allEvents, monday){
    const blocks = [
      { label:'Cette semaine',      base:new Date(monday),                     el:document.getElementById('summary-this-week') },
      { label:'Semaine prochaine',  base:addDays(new Date(monday), 7),         el:document.getElementById('summary-next-week') }
    ];

    blocks.forEach(b => {
      const cont = b.el; if (!cont) return;
      cont.innerHTML = '';
      const h3 = document.createElement('h3'); h3.textContent = b.label; cont.appendChild(h3);

      const feries = new Set();
      let hasVacances = false;
      const empties = [];
      const exams = [];

      for (let i=0;i<7;i++){
        const day = addDays(b.base, i);
        const dow = day.getDay(); if (dow===0 || dow===6) continue; // skip dim/sam
        const dateLabel = day.toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
        const dayEvents = allEvents.filter(e => sameYMD(e.start, day));
        if (dayEvents.length===0) empties.push(dateLabel);
        else {
          dayEvents.forEach(e => {
            const t=e.title||'';
            if (/Vacances/i.test(t)) hasVacances = true;
            else if (/Ferié|Férié/i.test(t)) feries.add(dateLabel);
            else if (/Examen|Soutenance|Evaluation|évaluation|contrôle|partiel|test/i.test(t)) exams.push(`${dateLabel} → ${t}`);
          });
        }
      }

      if (!feries.size && !hasVacances && !empties.length && !exams.length){
        const p=document.createElement('p'); p.textContent='Rien à signaler'; cont.appendChild(p); return;
      }
      if (feries.size){ const p=document.createElement('p'); p.textContent = `Jours fériés : ${[...feries].join(', ')}`; cont.appendChild(p); }
      if (hasVacances){ const p=document.createElement('p'); p.textContent = 'Vacances en approche'; cont.appendChild(p); }
      if (empties.length){ const p=document.createElement('p'); p.textContent = `Jours vides : ${empties.join(', ')}`; cont.appendChild(p); }
      if (exams.length){ const p=document.createElement('p'); p.textContent = `Examens : ${exams.join(', ')}`; cont.appendChild(p); }
    });
  }

  // --- Rendu principal
  async function loadAndRender(){
    const host = document.querySelector(".calendar-grid");
    if (!host || !CURRENT_GROUP) return;

    host.innerHTML="";
    Object.assign(host.style,{display:"flex",flexDirection:"column",gap:"0.5rem"});

    const base   = getTargetDate();
    const monday0= getMonday(base);
    const monday = addDays(monday0, weekOffset*7);
    const sunday = addDays(monday,6);

    makeHeader(host, monday, sunday);

    const grid = document.createElement("div");
    Object.assign(grid.style,{display:"flex",gap:"0.5rem",alignItems:"flex-start",overflowX:"auto",scrollSnapType:"x proximity"});
    host.appendChild(grid);

    let events;
    try { events = await loadICS(CURRENT_GROUP); }
    catch(e){ const p=document.createElement("p"); p.textContent="Impossible de charger l’EDT."; p.style.padding="1rem"; host.appendChild(p); return; }

    // Filtrage semaine courante (borne haute EXCLUSIVE)
    const nextMonday = addDays(monday, 7);
    const weekEvents = events.filter(e => e.start >= monday && e.start < nextMonday);
    const byDay = Array.from({length:7}, ()=>[]);
    for (const ev of weekEvents){ const idx=(ev.start.getDay()+6)%7; byDay[idx].push(ev); }
    byDay.forEach(list=>list.sort((a,b)=>a.start-b.start));

    // Masque sam/dim si vides
    const showSat = byDay[5].length>0;
    const showSun = byDay[6].length>0;

    const columns=[];
    for (let i=0;i<7;i++){
      if ((i===5 && !showSat) || (i===6 && !showSun)) continue;
      const dateObj = addDays(monday,i);
      const {col, timeline, nowLine} = renderDayColumn(grid, dateObj);
      col.style.scrollSnapAlign="start";
      byDay[i].forEach(ev => placeEventCard(timeline, ev));
      const tick = () => updateNowLine(nowLine, dateObj);
      tick();
      clearInterval(col._nowTimer);
      col._nowTimer = setInterval(tick, 60*1000);
      columns.push({col, dateObj});
    }

    const isCurrentWeek = getMonday(new Date()).getTime() === monday.getTime();
    if (isCurrentWeek && columns.length){
      const targetCol = columns.find(c => sameYMD(c.dateObj, new Date()));
      if (targetCol){
        const y = minutesSinceStart(new Date())*PX_PER_MIN - 120;
        targetCol.col.scrollTo({ top: Math.max(0,y), behavior:"smooth" });
      }
    } else if (columns.length){
      const idxFirstWith = byDay.findIndex(d => d.length>0);
      if (idxFirstWith>=0){
        const firstDate = addDays(monday, idxFirstWith);
        const targetCol = columns.find(c => sameYMD(c.dateObj, firstDate));
        const firstEv = byDay[idxFirstWith][0];
        if (targetCol && firstEv){
          const y = minutesSinceStart(firstEv.start)*PX_PER_MIN - 20;
          targetCol.col.scrollTo({ top: Math.max(0,y) });
        }
      }
    }

    // Résumés (on scanne la semaine affichée **et** la suivante)
    const twoWeeksEvents = events.filter(e => e.start >= monday && e.start < addDays(monday, 14));
    scanWeeks(twoWeeksEvents, monday);
  }

  // --- Sélection de groupe (réutilise le HTML existant #groupe-menu)
  function setupGroupMenu(){
    const nodes = document.querySelectorAll('#groupe-menu .subgroup');
    nodes.forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(){
        const grp = this.getAttribute('data-groupe');
        if (!grp) return;
        CURRENT_GROUP = grp;
        localStorage.setItem('selectedGroup', grp);
        highlightPath(this);
        loadAndRender();
      });
    });
  }
  function highlightPath(subgroupEl){
    document.querySelectorAll('#groupe-menu .year, #groupe-menu .group, #groupe-menu .subgroup')
      .forEach(el => el.classList.remove('selected'));
    subgroupEl.classList.add('selected');
    const groupMenu   = subgroupEl.parentElement;
    const groupHeader = groupMenu?.previousElementSibling; if (groupHeader) groupHeader.classList.add('selected');
    const yearMenu    = groupMenu?.parentElement;
    const yearHeader  = yearMenu?.previousElementSibling;  if (yearHeader)  yearHeader.classList.add('selected');
  }

  // --- Init
  window.initEDTGrid = function(){
    setupGroupMenu();
    const saved = localStorage.getItem('selectedGroup');
    if (saved) {
      CURRENT_GROUP = saved;
      const node = document.querySelector(`#groupe-menu .subgroup[data-groupe="${CSS.escape(saved)}"]`);
      if (node) highlightPath(node);
    } else {
      // défaut : premier sous-groupe disponible
      const first = document.querySelector('#groupe-menu .subgroup');
      if (first) { CURRENT_GROUP = first.getAttribute('data-groupe'); highlightPath(first); }
    }
    if (CURRENT_GROUP) { loadAndRender(); scheduleNextUpdate(); }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.calendar-grid')) window.initEDTGrid();
  });

  // Raccourcis clavier
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft'){ e.preventDefault(); weekOffset--; loadAndRender(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); weekOffset++; loadAndRender(); }
    if (e.key.toLowerCase() === 't'){ e.preventDefault(); weekOffset=0; loadAndRender(); }
  });
})();
