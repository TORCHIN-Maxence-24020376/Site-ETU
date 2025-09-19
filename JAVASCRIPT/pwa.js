/**
 * Initialise les fonctionnalités PWA
 */
function initPWA() {
    // Vérifier si le navigateur prend en charge les PWA
    if ('serviceWorker' in navigator) {
        // Enregistrer le service worker
        window.addEventListener('load', () => {
            // Déterminer le bon chemin selon l'environnement
            const swPath = location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
                ? './service-worker.js' 
                : '/Site-ETU/service-worker.js';
                
            navigator.serviceWorker.register(swPath)
                .catch(() => {
                    // Silencieux en cas d'erreur
                });
        });
        
        // Gestion du bouton "Installer l'application"
        let deferredPrompt;
        const addToHomeButton = document.querySelector('[data-pwa-install]');
        
        if (addToHomeButton) {
            addToHomeButton.style.display = 'none';
            
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                
                addToHomeButton.style.display = 'inline-block';
                
                addToHomeButton.addEventListener('click', () => {
                    addToHomeButton.style.display = 'none';
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        deferredPrompt = null;
                    });
                });
            });
        }
    }
}

initPWA();