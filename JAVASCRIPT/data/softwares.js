// JAVASCRIPT/softwares.js
(() => {
    const DATA_URL      = "JAVASCRIPT/data/softwares.json";
    const LOGO_BASE     = "IMAGES/icons/";          // adapte si tes icônes sont ailleurs
    const FALLBACK_LOGO = "logo.svg";

    // mapping slug -> titre affiché (doit matcher tes boutons data-category)
    const CATEGORY_LABELS = {
        "ide": "IDE & Éditeurs",
        "dev-tools": "Outils de développement",
        "modelisation": "Modélisation",
        "reseau": "Réseau & Systèmes"
    };

    // ordre d’affichage des catégories
    const CATEGORY_ORDER = ["ide", "dev-tools", "modelisation", "reseau"];

    let ALL = [];
    let currentQuery = "";
    let currentCat   = "all";

    function ready(fn) {
        document.readyState === "loading"
            ? document.addEventListener("DOMContentLoaded", fn, { once: true })
            : fn();
    }

    ready(init);

    async function init() {
        const container = document.querySelector(".categories-container");
        if (!container) {
            console.warn("'.categories-container' introuvable");
            return;
        }

        const data = await fetchJSON(DATA_URL);
        ALL = normalize(data);

        // branche la recherche + filtres
        wireSearchAndFilters(container);

        // rendu initial
        render(applyFilters(), container);
    }

    async function fetchJSON(url) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`);
        return r.json();
    }

    function normalize(arr) {
        return (Array.isArray(arr) ? arr : []).map(it => ({
            link: String(it.link ?? "").trim(),
            name: String(it.name ?? "").trim(),
            logo: String(it.logo ?? "").trim(),
            info: String(it.info ?? "").trim(),
            category: String(it.category ?? "other").trim(), // slug déjà prêt (ide/dev-tools/...)
            // invert => "" ou "logo"
            invert: (it.invert && String(it.invert).toLowerCase() !== "false") ? "logo" : ""
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
            const catOk = (currentCat === "all") || (it.category === currentCat);
            const qOk = !q || name.includes(q) || info.includes(q);
            return catOk && qOk;
        }).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    }

    function groupByCategory(list) {
        const map = new Map();
        for (const it of list) {
            const slug = it.category || "other";
            if (!map.has(slug)) map.set(slug, []);
            map.get(slug).push(it);
        }
        // Trie selon CATEGORY_ORDER, puis alpha pour le reste
        const known = CATEGORY_ORDER.filter(s => map.has(s)).map(s => [s, map.get(s)]);
        const others = [...map.entries()]
            .filter(([s]) => !CATEGORY_ORDER.includes(s))
            .sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }));
        return [...known, ...others];
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
            // si une catégorie n’a aucun item : on ne la rend PAS (donc masquée)
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

    function resolveLogoPath(logo) {
        if (!logo) return LOGO_BASE + FALLBACK_LOGO;
        if (/^(https?:)?\/\//i.test(logo) || logo.startsWith("/")) return logo;
        return LOGO_BASE + logo;
    }

    function makeCard(it) {
        const a = document.createElement("a");
        a.className = "Site";
        a.href = it.link || "#";
        a.target = "_blank";
        a.rel = "noopener";
        a.title = it.info || "";

        // structure: <div class="site-icon [logo]"><img ...></div>
        const iconWrap = document.createElement("div");
        iconWrap.className = "site-icon " + it.invert;

        const img = document.createElement("img");
        img.src = resolveLogoPath(it.logo);
        img.alt = "Logo";
        img.loading = "lazy";
        img.onerror = () => (img.src = LOGO_BASE + FALLBACK_LOGO);

        const pName = document.createElement("p");
        pName.className = "name";
        pName.textContent = it.name || "Sans nom";

        const pInfo = document.createElement("p");
        pInfo.className = "info";
        pInfo.textContent = it.info || "";

        iconWrap.appendChild(img);
        a.appendChild(iconWrap);
        a.appendChild(pName);
        a.appendChild(pInfo);
        return a;
    }

    // ——— UI ———
    function wireSearchAndFilters(container) {
        const input  = document.getElementById("search-input");
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
            const cat = btn.dataset.category || "all";
            btn.classList.toggle("active", cat === currentCat);
        });
    }

})();