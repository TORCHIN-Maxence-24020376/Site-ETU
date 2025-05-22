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
    
    // Initialiser la PWA
    initPWA();
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

function toggleSousMenu(menuCible) {
    const sousMenu = document.getElementById(menuCible);

    sousMenu.style.display = sousMenu.style.display === 'block' ? 'none' : 'block';
}


let previousTheme = localStorage.getItem('selected-theme');

function toggleFullScreen() {
    const veilleElement = document.getElementById("veille");

    if (!document.fullscreenElement) {
        previousTheme = localStorage.getItem('selected-theme');
        veilleElement.style.display = "block";
        changeTheme('CSS/AMOLED/AMOLED.css');

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

//Ecran de chargement

const startTime = performance.now();

window.addEventListener("load", () => {
    const loadingScreen = document.getElementById("chargement");
    const loader = document.querySelector('.maia-loader');
    const cubes = Array.from(loader.children);
    const spacing = 70;

    let positions = [0, 1, 2];

    function updatePositions() {
        positions.forEach((pos, index) => {
            cubes[index].style.transform = `translateX(${pos * spacing}px)`;
        });
    }

    function step() {
        const first = positions.shift();
        positions.push(first);
        updatePositions();
    }

    updatePositions();
    setInterval(step, 750);

    const loadTime = performance.now() - startTime;
    const extraTime = loadTime * 1;
    const totalTime = Math.max(loadTime + extraTime);
    const phrases = [
        "De base, ce site était conçu uniquement pour une seule personne",
        "La version originale était bien différente de la version d'aujourd'hui.\nPas de changement de thèmes... Une seule page... juste une horloge et des cases pour des liens.",
        "Cyril a été la première personne à rejoindre le projet dans ses débuts, c'est même lui qui a initié la mise en page que vous voyez aujourd'hui.",
        "Monsieur Mickael Martin Nevot, aussi connu sous le nom de, \"LE GOAT\" a déjà réalisé un film.",
        "Conseil: N'arrivez pas en retard.",
        "Vous avez jusqu'à 4 absences non justifiées autorisée avant que cela soit déduit de votre moyenne (-0.1 points par compétences)."
      ];
      
      const texteElem = document.getElementById("loading-text");
      if (texteElem) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        texteElem.textContent = phrase;
      }
      
      
    setTimeout(() => {
        loadingScreen.style.transition = "opacity 0.3s ease-out";
        loadingScreen.style.opacity = "0";
        setTimeout(() => {
            loadingScreen.style.display = "none";
        }, 300);
    }, totalTime);
});

/**
 * Initialise les fonctionnalités PWA
 */
function initPWA() {
    // Vérifier si le navigateur prend en charge les PWA
    if ('serviceWorker' in navigator) {
        // Enregistrer le service worker
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .catch(() => {
                    // Silencieux en cas d'erreur
                });
        });
        
        // Gestion du bouton "Installer l'application"
        let deferredPrompt;
        const addToHomeButton = document.querySelector('[data-pwa-install]');
        
        if (addToHomeButton) {
            // Masquer le bouton par défaut
            addToHomeButton.style.display = 'none';
            
            // Attendre l'événement beforeinstallprompt
            window.addEventListener('beforeinstallprompt', (e) => {
                // Empêcher Chrome de montrer automatiquement la notification d'installation
                e.preventDefault();
                // Stocker l'événement pour l'utiliser plus tard
                deferredPrompt = e;
                
                // S'assurer que le bouton a toujours un style
                if (!addToHomeButton.style.backgroundColor) {
                    const themeLink = document.getElementById('theme-link');
                    const themePath = themeLink ? themeLink.getAttribute('href') : '';
                    
                    // Appliquer une couleur selon le thème
                    if (themePath.includes('AMOLED')) {
                        if (themePath.includes('vert')) {
                            addToHomeButton.style.backgroundColor = '#00ff99';
                            addToHomeButton.style.color = '#000000';
                        } else if (themePath.includes('violet')) {
                            addToHomeButton.style.backgroundColor = '#b266ff';
                            addToHomeButton.style.color = '#000000';
                        } else if (themePath.includes('bleu')) {
                            addToHomeButton.style.backgroundColor = '#1a75ff';
                        } else {
                            addToHomeButton.style.backgroundColor = '#ffffff';
                            addToHomeButton.style.color = '#000000';
                        }
                    } else if (themePath.includes('SOMBRE')) {
                        if (themePath.includes('vert')) {
                            addToHomeButton.style.backgroundColor = '#08ca6d';
                            addToHomeButton.style.color = '#000000';
                        } else if (themePath.includes('cristal')) {
                            addToHomeButton.style.backgroundColor = '#a64ee1';
                        } else if (themePath.includes('4b00')) {
                            addToHomeButton.style.backgroundColor = '#ff4b00';
                        } else {
                            addToHomeButton.style.backgroundColor = '#60d5e5';
                            addToHomeButton.style.color = '#081b33';
                        }
                    } else {
                        // Thème clair par défaut
                        addToHomeButton.style.backgroundColor = '#0065e5';
                    }
                }
                
                // Afficher le bouton
                addToHomeButton.style.display = 'inline-block';
                
                // Gestionnaire d'événement pour le bouton
                addToHomeButton.addEventListener('click', () => {
                    // Masquer le bouton
                    addToHomeButton.style.display = 'none';
                    // Afficher la notification d'installation
                    deferredPrompt.prompt();
                    // Attendre la réponse de l'utilisateur
                    deferredPrompt.userChoice.then((choiceResult) => {
                        // On ne peut utiliser deferredPrompt qu'une fois
                        deferredPrompt = null;
                    });
                });
            });
        }
    }
}

/**
 * Vérifie l'heure et affiche des notifications sur l'EDT à certains moments de la journée
 */
function checkEdtNotifications() {
    // On ne vérifie que sur la page EDT
    if (!window.location.href.includes('edt.html')) return;
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Créer un élément pour afficher la notification
    function createNotification(message) {
        // Vérifier si une notification existe déjà
        const existingNotification = document.querySelector('.edt-notification');
        if (existingNotification) return;
        
        const notification = document.createElement('div');
        notification.className = 'edt-notification';
        notification.innerHTML = `
            <div class="edt-notification-content">
                <p>${message}</p>
                <button class="edt-notification-close">×</button>
            </div>
        `;
        
        // Style de la notification
        notification.style.position = 'fixed';
        notification.style.top = '70px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(255, 215, 0, 0.9)';
        notification.style.color = '#000';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '80%';
        notification.style.textAlign = 'center';
        notification.style.animation = 'fadeIn 0.5s';
        
        // Style du bouton de fermeture
        const closeButton = notification.querySelector('.edt-notification-close');
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.marginLeft = '10px';
        closeButton.style.verticalAlign = 'middle';
        
        // Ajouter au document
        document.body.appendChild(notification);
        
        // Événement de fermeture
        closeButton.addEventListener('click', () => {
            notification.style.animation = 'fadeOut 0.5s';
            setTimeout(() => {
                notification.remove();
            }, 500);
        });
        
        // Fermer automatiquement après 30 secondes
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'fadeOut 0.5s';
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }
        }, 30000);
    }
    
    // Vérifier l'heure et afficher la notification appropriée
    if (hours === 7 && minutes <= 30) {
        createNotification("Bonjour ! L'emploi du temps peut avoir été mis à jour pendant la nuit. Vérifiez bien vos cours d'aujourd'hui.");
    } else if (hours === 12 && minutes >= 15 && minutes <= 45) {
        createNotification("Attention ! Des changements peuvent avoir été apportés à l'emploi du temps de cet après-midi.");
    } else if (hours === 20 && minutes <= 30) {
        createNotification("Bonsoir ! Pensez à vérifier votre emploi du temps pour demain. Des modifications de dernière minute sont possibles.");
    }
}

// Ajouter le style des notifications au document
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);
    
    // Vérifier les notifications toutes les minutes
    setInterval(checkEdtNotifications, 60000);
    
    // Vérifier immédiatement au chargement de la page
    checkEdtNotifications();
});



