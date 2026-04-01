// JAVASCRIPT/links.js
(() => {
    const DATA_URL = "JAVASCRIPT/data/links.json";
    const LOGO_BASE = "IMAGES/icons/";
    const FALLBACK_LOGO = "logo.svg";

    let ALL = [];
    let currentQuery = "";
    let currentCat = "all"; // slug ou "all"

    function ready(fn) {
        document.readyState === "loading"
            ? document.addEventListener("DOMContentLoaded", fn, { once: true })
            : fn();
    }
    ready(init);

    async function init() {
        const container = document.querySelector(".categories-container") || document.querySelector(".recepteur");
        if (!container) {
            console.warn("Container .categories-container/.recepteur introuvable");
            return;
        }
        const data = await fetchJSON(DATA_URL);
        ALL = normalize(data);

        wireSearchAndFilters(container);
        render(applyFilters(), container);
    }

    async function fetchJSON(url) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`);
        return r.json();
    }

    function slugifyCat(label) {
        return String(label || "")
        .toLowerCase()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    function normalize(arr) {
        return (Array.isArray(arr) ? arr : []).map(it => {
        const catLabel = String(it.category ?? "Autres").trim();
        return {
            link: String(it.link ?? "").trim(),
            name: String(it.name ?? "").trim(),
            logo: String(it.logo ?? "").trim(),
            info: String(it.info ?? "").trim(),
            categoryLabel: catLabel,
            categorySlug: slugifyCat(catLabel),
            invert: (it.invert && String(it.invert).toLowerCase() !== "false") ? "logo" : "",
            tags: Array.from(new Set(((it.tags ?? [])).map(t => String(t ?? "").trim()).filter(Boolean)))
        };
    });
}

    function stripAccents(s) {
        if (s == null) return "";
        return String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "");
    }

    function applyFilters() {
        const q = stripAccents(currentQuery).toLowerCase();

        return ALL
            .filter(it => {
            const name = stripAccents(it.name).toLowerCase();
            const info = stripAccents(it.info).toLowerCase();
            const tagsT = stripAccents((it.tags || []).join(" ")).toLowerCase();

            const catOk =
                (currentCat === "all") ||
                (it.categorySlug === currentCat) ||
                (it.categoryLabel === currentCat); // compat si un bouton envoie le libellé

            const qOk = !q || name.includes(q) || info.includes(q) || tagsT.includes(q);
            return catOk && qOk;
            })
            .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
    }

    function groupByCategory(list) {
        const map = new Map();
        for (const it of list) {
            const label = it.categoryLabel || "Autres";
            if (!map.has(label)) map.set(label, []);
            map.get(label).push(it);
        }
        return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }));
    }

    function render(list, container) {
        container.innerHTML = "";

        if (!list.length) {
            container.innerHTML = `<p style="margin:1rem 0;">Aucun résultat.</p>`;
            return;
        }

        const grouped = groupByCategory(list);
        const frag = document.createDocumentFragment();

        for (const [catLabel, items] of grouped) {
            const section = document.createElement("div");
            section.className = "category-section";
            section.id = slugifyCat(catLabel);

            const h2 = document.createElement("h2");
            h2.textContent = catLabel;

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

        const img = document.createElement("img");
        img.className = "site-icon " + it.invert;
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

        a.appendChild(img);
        a.appendChild(pName);
        a.appendChild(pInfo);
        return a;
    }

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
                    currentCat = btn.dataset.category || "all"; // attendu: slug
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
