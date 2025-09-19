// JAVASCRIPT/map.js
(() => {
    const DATA_URL = "JAVASCRIPT/data/map.json";

    // titre d’affichage par catégorie (slug -> label)
    const CATEGORY_LABELS = {
        "amphis":  "Amphis",
        "rdc":     "Rez de chaussée",
        "etage-1": "Premier étage",
        "etage-2": "Deuxième étage",
    };
    // ordre d’affichage
    const CATEGORY_ORDER = ["amphis", "rdc", "etage-1", "etage-2"];

    let ALL = [];
    let currentQuery = "";
    let currentCat = "all";
    let CONTAINER = null;

    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn, { once: true });
        } else {
            fn();
        }
    }
    ready(init);

    async function init() {
        CONTAINER = ensureDynamicContainers();
        const data = await fetchJSON(DATA_URL);
        ALL = normalize(data);

        wireSearchAndFilters(CONTAINER);
        render(applyFilters(), CONTAINER);

        // arrivée avec un hash → tenter le highlight après rendu
        highlightHashAfterRender();
        window.addEventListener("hashchange", highlightHashAfterRender);
    }

    function ensureDynamicContainers() {
        // conteneur dynamique (crée si absent)
        let dyn = document.querySelector(".categories-container");
        if (!dyn) {
            dyn = document.createElement("section");
            dyn.className = "categories-container";
            const h1 = document.querySelector("h1") || document.body.firstElementChild;
            (h1?.parentNode || document.body).insertBefore(dyn, h1?.nextSibling || null);
        }

        // barre de recherche si absente
        if (!document.getElementById("search-input")) {
            const searchWrap = document.createElement("div");
            searchWrap.className = "search-container";
            searchWrap.innerHTML = `
                <input type="text" id="search-input" placeholder="Rechercher une salle..." aria-label="Rechercher une salle">
                <button id="search-button" aria-label="Rechercher">
                    <img src="IMAGES/search.svg" alt="Rechercher" class="search-icon">
                </button>`;
            dyn.parentNode.insertBefore(searchWrap, dyn);
        }

        // filtres si absents
        if (!document.querySelector(".category-filters")) {
            const filters = document.createElement("div");
            filters.className = "category-filters";
            filters.innerHTML = `
                <button class="category-filter active" data-category="all">Tous</button>
                <button class="category-filter" data-category="amphis">Amphis</button>
                <button class="category-filter" data-category="rdc">Rez de chaussée</button>
                <button class="category-filter" data-category="etage-1">Premier étage</button>
                <button class="category-filter" data-category="etage-2">Deuxième étage</button>`;
            dyn.parentNode.insertBefore(filters, dyn);
        }

        // supprime les anciens blocs statiques si présents
        document.querySelectorAll(".Amphi, .Salle").forEach(el => el.remove());
        document.querySelectorAll(".Container > .Amphi, .Container > .Salle").forEach(el => el.remove());

        return dyn;
    }

    async function fetchJSON(url) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`);
        return r.json();
    }

    function normalize(arr) {
        return (Array.isArray(arr) ? arr : []).map(it => ({
            name: String(it.name ?? "").trim(),
            type: (it.type === "Amphi" ? "Amphi" : "Salle"),
            info: String(it.info ?? "").trim(),
            ip: String(it.ip ?? "").trim(),
            category: String(it.category ?? "rdc").trim(), // amphis/rdc/etage-1/etage-2
            idText: String(it.idText ?? it.name).trim()    // peut déjà être encodé
        }));
    }

    function stripAccents(s) {
        return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    }

    function applyFilters() {
        const q = stripAccents(currentQuery).toLowerCase();
        return ALL.filter(it => {
            const name = stripAccents(it.name).toLowerCase();
            const info = stripAccents(it.info).toLowerCase();
            const idt  = stripAccents(it.idText).toLowerCase(); // ok même si encodé
            const qOk  = !q || name.includes(q) || info.includes(q) || idt.includes(q);
            const cOk  = (currentCat === "all") || (it.category === currentCat);
            return qOk && cOk;
        }).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    }

    function groupByCategory(list) {
        const map = new Map();
        for (const it of list) {
            const slug = it.category || "rdc";
            if (!map.has(slug)) map.set(slug, []);
            map.get(slug).push(it);
        }
        const orderedKnown = CATEGORY_ORDER.filter(s => map.has(s)).map(s => [s, map.get(s)]);
        const others = [...map.entries()]
            .filter(([s]) => !CATEGORY_ORDER.includes(s))
            .sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }));
        return [...orderedKnown, ...others];
    }

    function render(list, container) {
        container.innerHTML = "";
        if (!list.length) {
            container.innerHTML = `<p style="margin:1rem 0;">Aucun résultat.</p>`;
            return;
        }

        const grouped = groupByCategory(list);
        const frag = document.createDocumentFragment();

        for (const [slug, items] of grouped) {
            if (!items.length) continue;

            const section = document.createElement("div");
            section.className = "category-section";
            section.id = slug;

            const h2 = document.createElement("h2");
            h2.textContent = CATEGORY_LABELS[slug] || slug;

            const grid = document.createElement("div");
            grid.className = "Container";

            for (const it of items) grid.appendChild(makeCard(it));

            section.appendChild(h2);
            section.appendChild(grid);
            frag.appendChild(section);
        }

        container.appendChild(frag);
        refreshFilterButtons();
    }

    // ——— IDs & cartes ———

    // détecte si idText semble déjà encodé (présence de %xx)
    function looksEncoded(s) {
        return /%[0-9A-Fa-f]{2}/.test(s);
    }
    // renvoie un id encodé UNE seule fois
    function ensureEncodedId(idText) {
        return looksEncoded(idText) ? idText : encodeURIComponent(idText);
    }

    function makeCard(it) {
        const id = ensureEncodedId(it.idText);

        const wrap = document.createElement("div");
        wrap.className = it.type === "Amphi" ? "Amphi" : "Salle";
        wrap.id = id;

        const pName = document.createElement("span");
        pName.className = "name";
        pName.textContent = it.name;

        const pInfo = document.createElement("span");
        pInfo.className = "info";
        pInfo.innerHTML = it.info.replace(/\s*\•\s*/g, " <br> ");

        wrap.appendChild(pName);
        wrap.appendChild(pInfo);

        // clic → hash (lien direct)
        wrap.addEventListener("click", () => {
            if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
            pulseHighlight(wrap);
        });

        return wrap;
    }

    // ——— UI ———

    function wireSearchAndFilters(container) {
        const input = document.getElementById("search-input");
        const button = document.getElementById("search-button");
        const filterBtns = [...document.querySelectorAll(".category-filter")];

        if (input) {
            input.addEventListener("input", () => {
                currentQuery = input.value.trim();
                render(applyFilters(), container);
            });
        }
        if (button) {
            button.addEventListener("click", () => {
                currentQuery = (input?.value || "").trim();
                render(applyFilters(), container);
            });
        }
        if (filterBtns.length) {
            filterBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    currentCat = btn.dataset.category || "all";
                    render(applyFilters(), container);
                });
            });
        }
    }

    function refreshFilterButtons() {
        const filterBtns = [...document.querySelectorAll(".category-filter")];
        filterBtns.forEach(btn => {
            btn.classList.toggle("active", (btn.dataset.category || "all") === currentCat);
        });
    }

    // ——— Highlight robuste ———

    function getByIdLoose(id) {
        // essaie 3 variantes : tel que, encodé, décodé
        return (
            document.getElementById(id) ||
            document.getElementById(encodeURIComponent(id)) ||
            document.getElementById(decodeURIComponentSafe(id))
        );
    }

    function decodeURIComponentSafe(s) {
        try { return decodeURIComponent(s); } catch { return s; }
    }

    function pulseHighlight(el, ms = 1500) {
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("pulse-highlight");
        setTimeout(() => el.classList.remove("pulse-highlight"), ms);
    }

    function highlightHashAfterRender() {
        const raw = (location.hash || "").slice(1);
        if (!raw) return;
        const target = getByIdLoose(raw);
        if (target) pulseHighlight(target);
    }

    // ——— API publique ———
    // Permet d'appeler depuis une autre page/script : window.afficherSalle("TP I-010")
    window.afficherSalle = (idText, { forceResetFilters = true } = {}) => {
        if (forceResetFilters) {
            currentCat = "all";
            currentQuery = "";
            const input = document.getElementById("search-input");
            if (input) input.value = "";
        }
        render(applyFilters(), CONTAINER);

        const target = getByIdLoose(idText);
        if (target) {
            const id = target.id;
            if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
            pulseHighlight(target);
        } else {
            console.warn("Salle introuvable pour highlight:", idText);
        }
    };

})();
