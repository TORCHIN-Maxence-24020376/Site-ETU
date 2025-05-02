function redirectTo(url, newTab = true) {
    if (url === "https://www.google.com/") {
        setTimeout(() => {
            if (newTab) {
                window.open(url, '_blank');
            } else {
                window.location.href = url;
            }
        }, 500);
    } else {
        if (newTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    }
}

function updateClock() {
    const clockElement = document.getElementById('clock');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
updateClock();

document.addEventListener("DOMContentLoaded", () => {
    const mainHeader = document.getElementById("main-header");
    let lastScrollTop = 0;
    const topMargin = 100;
    const hideThreshold = 10;

    window.addEventListener("scroll", () => {
        const currentScrollTop = window.pageYOffset;

        if (currentScrollTop <= topMargin) {
            mainHeader.classList.remove("slide-up");
            mainHeader.classList.add("slide-down");
        } else if (currentScrollTop > lastScrollTop + hideThreshold) {
            mainHeader.classList.remove("slide-down");
            mainHeader.classList.add("slide-up");
        } else if (currentScrollTop < lastScrollTop) {
            mainHeader.classList.remove("slide-up");
            mainHeader.classList.add("slide-down");
        }

        lastScrollTop = currentScrollTop;
    });

    const googleButton = document.querySelector('.google');
    if (googleButton) {
        googleButton.addEventListener('mouseenter', () => googleButton.classList.add('hovered'));
        googleButton.addEventListener('mouseleave', () => googleButton.classList.remove('hovered'));
        googleButton.addEventListener('click', () => {
            googleButton.classList.remove('hovered');
            googleButton.classList.add('clicked');
            setTimeout(() => googleButton.classList.remove('clicked'), 2000);
        });
    }
});


// Fonction pour afficher/masquer le menu
function toggleMenuById(menuId) {
    const menu = document.getElementById(menuId);
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    closeNav();
}

    

// Fonction pour changer le fichier CSS
function changeTheme(theme) {
    const link = document.getElementById('theme-link');
    link.href = theme;

    // Sauvegarder le thème sélectionné dans le stockage local
    localStorage.setItem('selected-theme', theme);
    
    closeTheme()
}

// Appliquer le thème sauvegardé lors du chargement de la page
window.onload = function() {
const savedTheme = localStorage.getItem('selected-theme');
if (savedTheme) {
    document.getElementById('theme-link').href = savedTheme;
}
}

function closeTheme() {
    const themePanel = document.getElementById("myTheme");
    const navPanel = document.getElementById("myNav");

    themePanel.style.width = "0%";
    navPanel.style.boxShadow = "none";
}

function closeNav() {
    const navPanel = document.getElementById("myNav");

    navPanel.style.width = "0%";
    navPanel.style.boxShadow = "none";
}

function togglePanel(panelIdToToggle, panelIdToClose) {
    const panelToToggle = document.getElementById(panelIdToToggle);
    const panelToClose = document.getElementById(panelIdToClose);

    // Ferme le panneau actif si nécessaire
    if (panelToClose.style.width === "85%") {
        panelToClose.style.width = "0%";
        panelToClose.style.boxShadow = "none";
    }

    // Basculer l'état du panneau ciblé
    if (panelToToggle.style.width === "85%") {
        panelToToggle.style.width = "0%";
        panelToToggle.style.boxShadow = "none";
    } else {
        panelToToggle.style.width = "85%";
        panelToToggle.style.boxShadow = "50px 0px 50px rgba(0,0,0,0.5)";
    }
}

function toggleSousMenu() {
    const sousMenu = document.getElementById("sous-menu");

    sousMenu.style.display = sousMenu.style.display === 'block' ? 'none' : 'block';
}


let previousTheme = localStorage.getItem('selected-theme');

function toggleFullScreen() {
    const veilleElement = document.getElementById("veille");

    if (!document.fullscreenElement) {
        previousTheme = localStorage.getItem('selected-theme');
        veilleElement.style.display = "block";
        changeTheme('CSS/AMOLED.css');

        const requestFullScreen = document.documentElement.requestFullscreen ||
                                  document.documentElement.webkitRequestFullscreen ||
                                  document.documentElement.msRequestFullscreen;
        if (requestFullScreen) requestFullScreen.call(document.documentElement);
    } else {
        veilleElement.style.display = "none";

        const exitFullScreen = document.exitFullscreen ||
                               document.webkitExitFullscreen ||
                               document.msExitFullscreen;
        if (exitFullScreen) exitFullScreen.call(document);

        if (previousTheme) changeTheme(previousTheme);
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        const veilleElement = document.getElementById("veille");
        veilleElement.style.display = "none";
        if (previousTheme) changeTheme(previousTheme);
    }
});




// Ajoute un gestionnaire d'événements pour détecter les changements de plein écran
document.addEventListener("fullscreenchange", () => {
    const veilleElement = document.getElementById("veille");
    if (!document.fullscreenElement) {
        veilleElement.style.display = "none";
    }
});

// Données des salles avec leurs configurations réseau
const roomConfig = {
    I002: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I004: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I009: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I010: { ip: "10.203.9.***", Passerelle: "10.203.9.1" },
    I102: { ip: "10.203.28.***", Passerelle: "10.203.28.1"},
    I104: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I106: { ip: "10.203.28.***", Passerelle: "10.203.28.1"},
};

// Met à jour les champs en fonction de la salle sélectionnée
function updateReseauConfig() {
    const room = document.getElementById("select-salle").value;
    const config = roomConfig[room] || { ip: "", Passerelle: "" };

    // Mise à jour des champs
    document.getElementById("ip").value = config.ip;
    document.getElementById("Passerelle").value = config.Passerelle;
}

document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("main-header");

    // Objets contenant les IDs des déclencheurs et des menus associés
    const menus = {
        "navigation": "navigation-contenu",
        "theme": "theme-contenu"
    };

    let timeouts = {};

    function updateMenuPosition(menuId) {
        const headerHeight = header.offsetHeight;
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.style.top = headerHeight + "px";
        }
    }

    // Fonction pour afficher un menu
    function showMenu(menuId) {
        clearTimeout(timeouts[menuId]);
        updateMenuPosition(menuId);
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.style.maxHeight = menu.scrollHeight + "px";
        }
    }

    // Fonction pour cacher un menu après un délai
    function hideMenu(menuId) {
        timeouts[menuId] = setTimeout(() => {
            const menu = document.getElementById(menuId);
            if (menu) {
                menu.style.maxHeight = "0px";
            }
        }, 0);
    }

    // Initialiser la mise à jour des positions des menus
    Object.values(menus).forEach(menuId => updateMenuPosition(menuId));

    // Mise à jour de la position des menus au redimensionnement de la fenêtre
    window.addEventListener("resize", () => {
        Object.values(menus).forEach(updateMenuPosition);
    });

    // Ajouter les événements pour chaque menu
    Object.entries(menus).forEach(([triggerId, menuId]) => {
        const trigger = document.getElementById(triggerId);
        const menu = document.getElementById(menuId);

        if (trigger && menu) {
            trigger.addEventListener("mouseenter", () => showMenu(menuId));
            menu.addEventListener("mouseenter", () => showMenu(menuId));

            trigger.addEventListener("mouseleave", () => hideMenu(menuId));
            menu.addEventListener("mouseleave", () => hideMenu(menuId));
        }
    });
});

function afficheSalle(salleURL) {
    localStorage.setItem("salleCiblee", salleURL);
    
    redirectTo(salleURL, false);
}

document.addEventListener("DOMContentLoaded", function () {
    let salleCiblee = localStorage.getItem("salleCiblee");

    if (salleCiblee) {
        let salleId = salleCiblee.split("#")[1]; 
        if (!salleId) {
            console.warn("⚠️ Aucun ID trouvé après `#` dans :", salleCiblee);
            return;
        }

        let salleIdDecoded = decodeURIComponent(salleId);

        function highlightSalle() {
            let salleElement = document.getElementById(salleIdDecoded) || document.getElementById(salleId);

            if (salleElement) {
                salleElement.style.backgroundColor = "orange";
                salleElement.style.color = "white";
                salleElement.style.fontWeight = "bold";
                localStorage.removeItem("salleCiblee");
            } else {
                console.warn("❌ Salle introuvable :", salleIdDecoded);
            }
        }

        setTimeout(highlightSalle, 500);
    }
});

const startTime = performance.now();

    window.addEventListener("load", () => {
        const loadingScreen = document.getElementById("chargement");

        const loadTime = performance.now() - startTime; 
        const extraTime = loadTime * 0.2;

        const totalTime = Math.max(loadTime + extraTime);

        setTimeout(() => {
            loadingScreen.style.transition = "opacity 0.3s ease-out";
            loadingScreen.style.opacity = "0";

            setTimeout(() => {
                loadingScreen.style.display = "none";
            }, 300);
        }, totalTime);
    });
