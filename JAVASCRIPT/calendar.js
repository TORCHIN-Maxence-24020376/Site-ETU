(function () {
  // === Réglages =========================================================
  const START_HOUR = 7;
  const END_HOUR   = 19;
  const PX_PER_MIN = 1;
  const VIEW_MODE  = "auto";       // bascule sur demain après 21h
  const HOURS_RAIL_W = 64;         // largeur rail des heures (px)

  // === État =============================================================
  let weekOffset = 0;
  let CURRENT_GROUP = null;
  const EVENTS_CACHE = new Map();  // key = group, value = events[]
  let _lastFocused = null;         // pour focus retour (modale)

  // === Utils dates ======================================================
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
  function frDayLabel(d){
    const opts = { weekday:'long', day:'2-digit', month:'long' };
    return d.toLocaleDateString('fr-FR', opts);
  }
  function timelineHeightPx(){
    const totalMinutes = (END_HOUR-START_HOUR)*60;
    return Math.max(480, totalMinutes*PX_PER_MIN);
  }

  // === ICS ==============================================================
  function icsTimeToDate(ics){
    const y=+ics.slice(0,4), m=+ics.slice(4,6)-1, d=+ics.slice(6,8);
    const H=+ics.slice(9,11), M=+ics.slice(11,13), S=+(ics.slice(13,15)||"0");
    return ics.endsWith("Z") ? new Date(Date.UTC(y,m,d,H,M,S)) : new Date(y,m,d,H,M,S);
  }
  function parseICS(text){
    const lines = text.replace(/\r/g,"\n").split(/\n/);
    for (let i=1;i<lines.length;i++){ if (lines[i].startsWith(" ")) { lines[i-1]+=lines[i].slice(1); lines[i]=""; } }

    const out = []; let ev=null;
    for (const raw of lines){
      const line = raw.trim(); if (!line) continue;
      if (line.startsWith("BEGIN:VEVENT")) ev = { extendedProps:{ professeur:"Inconnu", salle:"", salleUrl:null } };
      else if (line.startsWith("SUMMARY:"))  ev.title = line.slice(8).trim();
      else if (line.startsWith("DTSTART"))   ev.start = icsTimeToDate(line.split(":")[1]);
      else if (line.startsWith("DTEND"))     ev.end   = icsTimeToDate(line.split(":")[1]);
      else if (line.startsWith("LOCATION:")){
        const salleClean=line.slice(9).trim().replace(/\\,/g,',');
        ev.extendedProps.salle = salleClean || "Salle inconnue";
        ev.extendedProps.salleUrl = salleClean ? `carte.html#${encodeURIComponent(salleClean)}` : null;
      }
      else if (line.startsWith("DESCRIPTION:")){
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
      else if (line.startsWith("END:VEVENT")) { if (ev) out.push(ev); ev=null; }
    }
    return out;
  }
  async function loadICS(group){
    if (EVENTS_CACHE.has(group)) return EVENTS_CACHE.get(group);
    const url = `https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/main/edt_data/${group}.ics`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Erreur de chargement ICS (${resp.status})`);
    const events = parseICS(await resp.text());
    EVENTS_CACHE.set(group, events);
    return events;
  }

  // === UI : Header navigation ==========================================
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
        padding:"6px 10px", borderRadius:"10px", cursor:"pointer", display:"inline-flex",
        alignItems:"center", justifyContent:"center"
      });
      const img = document.createElement("img");
      img.src = iconPath; img.alt = label; img.width = 20; img.height = 20; img.style.display = "block";
      btn.appendChild(img);
      btn.addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); onClick(); });
      return btn;
    };

    const prev  = mkBtn("IMAGES/prev.svg",  "Semaine précédente", ()=>{ weekOffset--; loadAndRender(); });
    prev.classList.add("logo")
    const today = mkBtn("IMAGES/today.svg", "Aujourd’hui",         ()=>{ weekOffset=0;  loadAndRender(); });
    today.classList.add("logo")
    const next  = mkBtn("IMAGES/next.svg",  "Semaine suivante",    ()=>{ weekOffset++; loadAndRender(); });
    next.classList.add("logo")

    left.append(prev, today, next);

    const title = document.createElement("div");
    title.style.fontWeight = "600"; title.style.opacity = "0.9";
    const opts = { weekday:"short", day:"2-digit", month:"short" };
    title.textContent = `${weekStart.toLocaleDateString('fr-FR', opts)} → ${weekEnd.toLocaleDateString('fr-FR', opts)}`;

    hdr.append(left, title);
    container.appendChild(hdr);
  }

  // === Grille : rail des heures & overlay lignes =======================
  function renderTimeRail(container, timelineHeight){
    const railWrap = document.createElement("div");
    Object.assign(railWrap.style,{
      flex:`0 0 ${HOURS_RAIL_W}px`, position:"relative",
      height:`${timelineHeight}px`, boxSizing:"border-box", overflow:"hidden", zIndex:3
    });

    for (let h=START_HOUR; h< END_HOUR; h++){
      const top = (h-START_HOUR)*60*PX_PER_MIN;
      const tick = document.createElement("div");
      Object.assign(tick.style,{position:"absolute", left:"0", right:"0", top:`${top}px`});
      const dash = document.createElement("div");
      Object.assign(dash.style,{position:"absolute", right:"8px", width:"10px", height:"1px",});
      const label = document.createElement("div");
      Object.assign(label.style,{position:"absolute", left:"8px", top:"-10px", fontSize:"11px", userSelect:"none", fontVariantNumeric:"tabular-nums"});
      label.textContent = `${pad2(h)}:00`;
      tick.append(dash,label);
      railWrap.appendChild(tick);
    }
    container.appendChild(railWrap);
  }

  function renderHourOverlay(scrollWrap, timelineHeight){
    const overlay = document.createElement("div");
    Object.assign(overlay.style,{position:"absolute", left:0, right:0, top:0, height:`${timelineHeight}px`, pointerEvents:"none", zIndex:1});
    for (let h=START_HOUR; h< END_HOUR*1.6; h++){
      const top = (h-START_HOUR)*30*PX_PER_MIN;
      const row = document.createElement("div");
      Object.assign(row.style,{position:"absolute", left:0, right:0, top:`${top}px`, borderTop:"1px dashed gray", opacity:"0.6"});
      overlay.appendChild(row);
    }
    scrollWrap.appendChild(overlay);
  }

  // Barre rouge seulement sur le jour courant
  function renderNowLine(timelineEl){
    if (!timelineEl) return;
    const nowLine = document.createElement("div");
    Object.assign(nowLine.style,{
      position:"absolute", left:0, right:0, height:"2px",
      background:"#e74c3c", boxShadow:"0 0 6px rgba(231,76,60,0.8)",
      zIndex:20, display:"none", pointerEvents:"none"
    });
    timelineEl.appendChild(nowLine);

    function tick(){
      const now = new Date();
      const minutes = minutesSinceStart(now);
      const total = (END_HOUR-START_HOUR)*60;
      if (minutes<0 || minutes>total){ nowLine.style.display="none"; return; }
      nowLine.style.display="block";
      nowLine.style.top = `${minutes*PX_PER_MIN}px`;
    }
    tick();
    clearInterval(timelineEl._nowTimer);
    timelineEl._nowTimer = setInterval(tick, 60*1000);
  }

  // === Colonnes jours (sans entête dans la colonne) ====================
  function renderDayColumn(daysArea, timelineHeight){
    const col = document.createElement("div");
    col.className = "day-col";
    Object.assign(col.style,{flex:"1 1 0", position:"relative", scrollSnapAlign:"start", zIndex:3, overflow:"hidden"});

    const timeline = document.createElement("div");
    Object.assign(timeline.style,{position:"relative", height:`${timelineHeight}px`, borderLeft:"1px solid gray", borderRight:"1px solid gray", overflow:"hidden"});
    col.appendChild(timeline);

    daysArea.appendChild(col);
    return { col, timeline };
  }

  // === Modale ===========================================================
  function ensureModal(){
    if (document.getElementById('edt-modal')) return;
    const root = document.createElement('div');
    root.id = 'edt-modal';
    root.innerHTML = `
      <div class="backdrop" data-close="1" aria-hidden="true"></div>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="edt-modal-title">
        <button class="close" aria-label="Fermer">×</button>
        <h3 id="edt-modal-title" class="title"></h3>
        <div class="meta"></div>
      </div>`;
    document.body.appendChild(root);
    root.addEventListener('click', (e)=>{ if (e.target.dataset.close) closeModal(); });
    root.querySelector('.close').addEventListener('click', closeModal);
  }
  function openCourseModal(ev, sourceEl){
    ensureModal();
    _lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const root   = document.getElementById('edt-modal');
    const dialog = root.querySelector('.dialog');
    const titleEl= root.querySelector('#edt-modal-title');
    const metaEl = root.querySelector('.meta');

    // couleur de ressource sur la modale
    dialog.classList.forEach(c => { if (c.startsWith('resource-')) dialog.classList.remove(c); });
    if (sourceEl && sourceEl.classList) {
      const resClass = [...sourceEl.classList].find(c => c.startsWith('resource-'));
      if (resClass) dialog.classList.add(resClass);
    }

    // contenu sans libellés
    titleEl.textContent = ev.title || 'Cours';
    const salleLabel = ev.extendedProps?.salle || 'Salle ?';
    const salleHTML  = `<button type="button" class="salle-link" id="edt-modal-salle-link">${salleLabel}</button>`;
    metaEl.innerHTML = `
      <div>${frDayLabel(ev.start)} - ${frTime(ev.start)}–${frTime(ev.end)}</div>
      <div>${ev.extendedProps?.professeur || 'Inconnu'}</div>
      <div>${salleHTML}</div>`;

    const salleBtn = document.getElementById('edt-modal-salle-link');
    if (salleBtn) {
      salleBtn.addEventListener('click', () => {
        if (ev.extendedProps?.salleUrl) {
          if (typeof window.afficheSalle === 'function') window.afficheSalle(ev.extendedProps.salleUrl);
          else window.location.href = ev.extendedProps.salleUrl;
        }
        closeModal();
      }, { once:true });
    }

    root.classList.add('show');
    document.documentElement.style.overflow = 'hidden';
    const btnClose = root.querySelector('.close');
    if (btnClose) btnClose.focus();
  }
  function closeModal(){
    const root = document.getElementById('edt-modal');
    if (root) root.classList.remove('show');
    document.documentElement.style.overflow = '';
    if (_lastFocused) { try{ _lastFocused.focus(); } catch(_){} }
  }

  // === Cartes cours =====================================================
  function placeEventCard(timeline, ev){
    const card = document.createElement("div");
    card.className = "cour";

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
      location.addEventListener('click', (e)=>{
        e.stopPropagation();
        if (typeof window.afficheSalle === 'function') window.afficheSalle(ev.extendedProps.salleUrl);
        else window.location.href = ev.extendedProps.salleUrl;
      });
    }
    topRow.append(name, location);

    const bottomRow = document.createElement("div");
    const prof = document.createElement("p"); prof.className="prof"; prof.textContent=ev.extendedProps?.professeur||"Inconnu";
    const time = document.createElement("p"); time.className="time"; time.textContent=`${frTime(ev.start)} - ${frTime(ev.end)}`;
    bottomRow.append(prof, time);

    card.append(topRow, bottomRow);

    // Placement vertical
    card.style.position="absolute";
    const startMin = minutesSinceStart(ev.start);
    const endMin   = minutesSinceStart(ev.end);
    const top = clamp(startMin,0,(END_HOUR-START_HOUR)*60) * PX_PER_MIN;
    const height = Math.max(32, (endMin - startMin) * PX_PER_MIN - 6);
    Object.assign(card.style,{left:"8px",right:"8px",top:`${top}px`,height:`${height}px`,boxShadow:"0 6px 14px rgba(0,0,0,0.15)",zIndex:2});

    card.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openCourseModal(ev, card); });

    timeline.appendChild(card);
  }

  // === Entête des jours =================
  function renderDaysHeader(host, monday, showSat, showSun){
    const headerRow = document.createElement('div');
    headerRow.className = 'edt-days-header';

    const spacer = document.createElement('div');
    spacer.className = 'hours-spacer';
    headerRow.appendChild(spacer);

    const labelsWrap = document.createElement('div');
    labelsWrap.className = 'days-labels';
    headerRow.appendChild(labelsWrap);

    for (let i=0;i<7;i++){
      if ((i===5 && !showSat) || (i===6 && !showSun)) continue;
      const d = addDays(monday,i);
      const cell = document.createElement('div');
      cell.className = 'day-label';
      const wd = d.toLocaleDateString('fr-FR',{weekday:'long'});
      const wdCap = wd.charAt(0).toUpperCase()+wd.slice(1);
      const dateStr = d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
      cell.innerHTML = `<span>${wdCap}</span><span class="date">${dateStr}</span>`;
      labelsWrap.appendChild(cell);
    }

    host.appendChild(headerRow);
  }

  // === Rendu principal ==================================================
  async function loadAndRender(){
    const host = document.querySelector(".calendar-grid");
    if (!host || !CURRENT_GROUP) return;

    host.innerHTML="";
    Object.assign(host.style,{display:"flex",flexDirection:"column"});

    const base   = getTargetDate();
    const monday0= getMonday(base);
    const monday = addDays(monday0, weekOffset*7);
    const sunday = addDays(monday,6);

    makeHeader(host, monday, sunday);

    // Charger les events AVANT de construire les colonnes pour savoir si on masque sam/dim
    let events;
    try { events = await loadICS(CURRENT_GROUP); }
    catch(e){ const p=document.createElement("p"); p.textContent="Impossible de charger l’EDT."; p.style.padding="1rem"; host.appendChild(p); return; }

    const nextMonday = addDays(monday, 7);
    const weekEvents = events.filter(e => e.start >= monday && e.start < nextMonday);
    const byDay = Array.from({length:7}, ()=>[]);
    for (const ev of weekEvents){ const idx=(ev.start.getDay()+6)%7; byDay[idx].push(ev); }
    byDay.forEach(list=>list.sort((a,b)=>a.start-b.start));
    const showSat = byDay[5].length>0;
    const showSun = byDay[6].length>0;

    // Entête des jours
    renderDaysHeader(host, monday, showSat, showSun);

    // Rangée grille
    const row = document.createElement("div");
    Object.assign(row.style,{display:"flex",alignItems:"flex-start"});
    host.appendChild(row);

    const hPx = timelineHeightPx();

    // Wrapper commun (scroll vertical unique)
    const scrollWrap = document.createElement("div");
    Object.assign(scrollWrap.style,{position:"relative",display:"flex",alignItems:"flex-start",height:`${hPx}px`,overflowY:"auto",overflowX:"hidden",width:"100%"});
    row.appendChild(scrollWrap);

    // Rail des heures + zone jours
    renderTimeRail(scrollWrap, hPx);

    const daysArea = document.createElement("div");
    Object.assign(daysArea.style,{position:"relative", flex:"1 1 auto", display:"flex", alignItems:"flex-start", overflowX:"auto", overflowY:"hidden", height:`${hPx}px`});
    scrollWrap.appendChild(daysArea);

    // Lignes horaires globales (mais PAS de barre rouge ici)
    renderHourOverlay(scrollWrap, hPx);

    // Colonnes et cartes
    const columns=[];
    for (let i=0;i<7;i++){
      if ((i===5 && !showSat) || (i===6 && !showSun)) continue;
      const {col, timeline} = renderDayColumn(daysArea, hPx);
      byDay[i].forEach(ev => placeEventCard(timeline, ev));
      columns.push({col, timeline, idx:i});
    }

    // Barre "maintenant" seulement sur le jour courant (si semaine courante)
    const today = new Date();
    const isCurrentWeek = getMonday(today).getTime() === monday.getTime();
    if (isCurrentWeek){
      const todayIdx = (today.getDay()+6)%7;
      const todayCol = columns.find(c => c.idx === todayIdx);
      if (todayCol) renderNowLine(todayCol.timeline);
    }

    // Auto-scroll vertical (sur le wrapper commun)
    if (isCurrentWeek && columns.length){
      const y = minutesSinceStart(new Date())*PX_PER_MIN - 120;
      scrollWrap.scrollTo({ top: Math.max(0,y), behavior:"smooth" });
    } else if (columns.length){
      const idxFirstWith = byDay.findIndex(d => d.length>0);
      if (idxFirstWith>=0){
        const firstEv = byDay[idxFirstWith][0];
        if (firstEv){
          const y = minutesSinceStart(firstEv.start)*PX_PER_MIN - 20;
          scrollWrap.scrollTo({ top: Math.max(0,y) });
        }
      }
    }

    // Résumé 2 semaines
    const twoWeeksEvents = events.filter(e => e.start >= monday && e.start < addDays(monday, 14));
    scanWeeks(twoWeeksEvents, monday);
  }

  // === Résumés ==============================================
  function scanWeeks(allEvents, monday){
    const blocks = [
      { label:'Cette semaine',      base:new Date(monday),             el:document.getElementById('summary-this-week') },
      { label:'Semaine prochaine',  base:addDays(new Date(monday), 7), el:document.getElementById('summary-next-week') }
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
        const dow = day.getDay(); if (dow===0 || dow===6) continue;
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

  // === Menu groupes / init / raccourcis ================================
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

  window.initEDTGrid = function(){
    setupGroupMenu();
    const saved = localStorage.getItem('selectedGroup');
    if (saved) {
      CURRENT_GROUP = saved;
      const node = document.querySelector(`#groupe-menu .subgroup[data-groupe="${CSS.escape(saved)}"]`);
      if (node) highlightPath(node);
    } else {
      const first = document.querySelector('#groupe-menu .subgroup');
      if (first) { CURRENT_GROUP = first.getAttribute('data-groupe'); highlightPath(first); }
    }
    if (CURRENT_GROUP) { loadAndRender(); scheduleNextUpdate(); }
  };

  function shouldUpdateAt(){ const h=new Date().getHours(); return h<21?21:24; }
  function scheduleNextUpdate(){
    const now=new Date(); const targetHour=shouldUpdateAt(); const next=new Date(now);
    next.setHours(targetHour,0,0,0); if (targetHour===24) next.setDate(now.getDate()+1);
    const delay=next-now;
    setTimeout(()=>{ loadAndRender(); scheduleNextUpdate(); }, Math.max(1000,delay));
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.calendar-grid')) window.initEDTGrid();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const m = document.getElementById('edt-modal');
      if (m && m.classList.contains('show')) { e.preventDefault(); closeModal(); return; }
    }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); weekOffset--; loadAndRender(); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); weekOffset++; loadAndRender(); }
    if (e.key.toLowerCase() === 't'){ e.preventDefault(); weekOffset=0; loadAndRender(); }
  });
})();
