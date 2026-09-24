/**
 * bubbles.js - Animations de fou style Blob Button (Hilwat) et Bubble Button (Grsmto)
 * Supporte tous les thèmes, sans dépendance externe.
 */

(function() {
    'use strict';

    // 1. Injecter les filtres SVG Gooey dans le DOM
    function injectGooFilter() {
        if (document.getElementById('goo-filters-svg')) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'goo-filters-svg';
        svg.setAttribute('class', 'goo-filters-svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.position = 'fixed';
        svg.style.top = '-9999px';
        svg.style.left = '-9999px';
        svg.style.width = '0';
        svg.style.height = '0';
        svg.style.pointerEvents = 'none';

        svg.innerHTML = `
            <defs>
                <!-- Filtre Gooey pour les blobs internes (Hilwat style) -->
                <filter id="goo-inner">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
                <!-- Filtre Gooey pour les bulles qui éclatent à l'extérieur (Grsmto style) -->
                <filter id="goo-outer">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7" result="goo" />
                    <feBlend in="SourceGraphic" in2="goo" />
                </filter>
            </defs>
        `;

        document.body.appendChild(svg);
    }

    // 2. Déterminer la couleur spécifique pour les boutons ETU 2
    function getButtonColor(btn) {
        // Couleur bleue signature ETU 2
        return '#0078d7';
    }

    // 3. Équiper un bouton des structures Hilwat Blob et Grsmto Bubbles
    function setupCrazyButton(btn) {
        if (btn.dataset.crazyReady === 'true') return;
        btn.dataset.crazyReady = 'true';
        btn.classList.add('crazy-btn', 'etu2-crazy-btn');

        // A. Structure Hilwat Blob interne
        if (!btn.querySelector('.blob-btn__inner')) {
            const inner = document.createElement('span');
            inner.className = 'blob-btn__inner';
            inner.setAttribute('aria-hidden', 'true');

            const blobs = document.createElement('span');
            blobs.className = 'blob-btn__blobs';

            for (let i = 0; i < 4; i++) {
                const blob = document.createElement('span');
                blob.className = 'blob-btn__blob';
                blobs.appendChild(blob);
            }

            inner.appendChild(blobs);
            btn.insertBefore(inner, btn.firstChild);
        }

        // B. Ajout automatique du logo ETU si non présent
        if (!btn.querySelector('.etu2-logo-icon') && !btn.querySelector('.nav-etu2-icon')) {
            const logo = document.createElement('img');
            logo.src = 'IMAGES/logo-etu.svg';
            logo.alt = 'Logo ETU';
            logo.className = (btn.id === 'etu2' && btn.parentElement && btn.parentElement.classList.contains('navigation'))
                ? 'nav-etu2-icon'
                : 'etu2-logo-icon';
            
            const targetRef = btn.querySelector('p') || btn.querySelector('span:not(.blob-btn__inner)') || btn.lastChild;
            if (targetRef) {
                btn.insertBefore(logo, targetRef);
            } else {
                btn.appendChild(logo);
            }
        }

        // C. Conteneur externe pour les bulles qui éclatent (Grsmto)
        let bubbleContainer = btn.querySelector('.btn-bubbles-outer');
        if (!bubbleContainer) {
            bubbleContainer = document.createElement('span');
            bubbleContainer.className = 'btn-bubbles-outer';
            bubbleContainer.setAttribute('aria-hidden', 'true');
            btn.appendChild(bubbleContainer);
        }

        // C. Gestionnaire de bulles Grsmto
        let intervalId = null;

        function spawnBubbleBurst(count = 6, intensity = 1) {
            const rect = btn.getBoundingClientRect();
            const width = rect.width || 200;
            const height = rect.height || 50;
            const color = getButtonColor(btn);

            for (let i = 0; i < count; i++) {
                const particle = document.createElement('span');
                particle.className = 'goo-particle';
                
                // Choisir un bord au hasard (0: haut, 1: droite, 2: bas, 3: gauche)
                const edge = Math.floor(Math.random() * 4);
                let startX = 0, startY = 0;
                let dirX = 0, dirY = 0;

                const pad = 6;
                if (edge === 0) { // Haut
                    startX = Math.random() * width;
                    startY = pad;
                    dirX = (Math.random() - 0.5) * 40;
                    dirY = -15 - Math.random() * 25 * intensity;
                } else if (edge === 1) { // Droite
                    startX = width - pad;
                    startY = Math.random() * height;
                    dirX = 15 + Math.random() * 25 * intensity;
                    dirY = (Math.random() - 0.5) * 40 - 10;
                } else if (edge === 2) { // Bas
                    startX = Math.random() * width;
                    startY = height - pad;
                    dirX = (Math.random() - 0.5) * 40;
                    dirY = 10 + Math.random() * 20 * intensity;
                } else { // Gauche
                    startX = pad;
                    startY = Math.random() * height;
                    dirX = -15 - Math.random() * 25 * intensity;
                    dirY = (Math.random() - 0.5) * 40 - 10;
                }

                const size = (8 + Math.random() * 14 * intensity).toFixed(1);
                const duration = (0.55 + Math.random() * 0.35).toFixed(2);
                const delay = (Math.random() * 0.12).toFixed(2);

                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.backgroundColor = color;
                particle.style.left = `${startX}px`;
                particle.style.top = `${startY}px`;
                particle.style.setProperty('--dest-x', `${dirX.toFixed(1)}px`);
                particle.style.setProperty('--dest-y', `${dirY.toFixed(1)}px`);
                particle.style.animationDuration = `${duration}s`;
                particle.style.animationDelay = `${delay}s`;

                particle.addEventListener('animationend', () => {
                    particle.remove();
                });

                bubbleContainer.appendChild(particle);
            }
        }

        // Événements Hover
        btn.addEventListener('mouseenter', () => {
            spawnBubbleBurst(7, 1);
            intervalId = setInterval(() => {
                spawnBubbleBurst(2, 0.8);
            }, 300);
        });

        btn.addEventListener('mouseleave', () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        });

        // Événement Clic : explosion de bulles à 360°
        btn.addEventListener('click', () => {
            spawnBubbleBurst(12, 1.4);
        });
    }

    // 4. Initialisation sur TOUS les boutons en rapport avec ETU 2
    function initAllButtons() {
        injectGooFilter();

        const selectors = [
            '.promo-btn',
            '.etu2-banner-btn',
            '.etu2-floating-pill',
            '.Site.etu2',
            '#etu2',
            'a[href*="etu-aix.alwaysdata.net"]'
        ];

        const buttons = document.querySelectorAll(selectors.join(', '));
        buttons.forEach(btn => {
            // Vérifier que l'élément est un bouton ou lien ETU 2
            if (
                btn.classList.contains('promo-btn') ||
                btn.classList.contains('etu2-banner-btn') ||
                btn.classList.contains('etu2-floating-pill') ||
                btn.classList.contains('etu2') ||
                btn.id === 'etu2' ||
                (btn.href && btn.href.includes('etu-aix.alwaysdata.net'))
            ) {
                setupCrazyButton(btn);
            }
        });
    }

    // 5. Exécution au chargement et observation des modifications DOM (ex: chargement dynamique des cartes)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllButtons);
    } else {
        initAllButtons();
    }

    // Observer pour les boutons insérés dynamiquement (links.js, prof.js, softwares.js)
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length > 0) {
                for (const node of m.addedNodes) {
                    // Ignorer nos propres éléments internes
                    if (node.nodeType === 1 && (
                        node.classList.contains('goo-particle') ||
                        node.classList.contains('btn-bubbles-outer') ||
                        node.classList.contains('blob-btn__inner') ||
                        node.classList.contains('blob-btn__blob')
                    )) {
                        continue;
                    }
                    shouldCheck = true;
                    break;
                }
            }
            if (shouldCheck) break;
        }
        if (shouldCheck) {
            initAllButtons();
        }
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    // Exposer globalement si besoin
    window.initCrazyButtons = initAllButtons;
})();
