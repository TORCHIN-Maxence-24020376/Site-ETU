(() => {
    // ⚙️ Réglages
    const DATA_URL    = "JAVASCRIPT/data/teachers.json";
    const LOGO_BASE   = "IMAGES/icons/";          // préfix ajouté si 'logo' n'est pas un chemin absolu
    const FALLBACK_LOGO = "logo.svg"; // fallback

    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn, { once: true });
        } else {
            fn();
        }
    }

    ready(init);

    async function init() {
        const container = document.querySelector(".recepteur");
        if (!container) {
            console.warn(".ressources-selector introuvable");
            return;
        }

        try {
            const data = await fetchJSON(DATA_URL);
            const items = normalize(data);

            items.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

            render(items, container);
        } catch (e) {
            console.error(e);
            container.innerHTML = `<p>Impossible de charger les ressources.</p>`;
        }
    }

    async function fetchJSON(url) {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status} sur ${url}`);
        return r.json();
    }

    // Adapte les champs à ton schéma
    function normalize(arr) {
        return (Array.isArray(arr) ? arr : []).map(it => ({
            link: String(it.link ?? "").trim(),
            name: String(it.name ?? "").trim(),
            logo: String(it.logo ?? "").trim(),
            info: String(it.info ?? "").trim(),
            invert: (it.invert && String(it.invert).toLowerCase() !== "false") ? "logo" : ""
        }));
    }

    function resolveLogoPath(logo) {
        if (!logo) return LOGO_BASE + FALLBACK_LOGO;
        // si le logo commence par http(s) ou / ou contient déjà un sous-dossier, on ne préfixe pas
        if (/^(https?:)?\/\//i.test(logo) || logo.startsWith("/")) return logo;
        return LOGO_BASE + logo;
    }

    function render(list, container) {
        container.innerHTML = "";
        if (!list.length) {
            container.innerHTML = `<p>Aucun résultat.</p>`;
            return;
        }
        const frag = document.createDocumentFragment();
        for (const it of list) frag.appendChild(makeCard(it));
        container.appendChild(frag);
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
})();
