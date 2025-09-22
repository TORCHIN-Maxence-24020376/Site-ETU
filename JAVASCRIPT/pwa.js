/* pwa.js — SW + bouton Installer + purge caches
   — Adapté pour GitHub Pages (BASE_PATH = "/Site-ETU/")
   — Si ton site est à la racine, mets BASE_PATH = "/"
*/
(function () {
  if (window.__pwaBootstrapped) return;
  window.__pwaBootstrapped = true;

  // === CONFIG ===
  const BASE_PATH  = "/Site-ETU/";            // <- change si nécessaire
  const SW_FILE    = "service-worker.js";     // même dossier que manifest
  const SW_VERSION = "v1-offline-only";
  const MANIFEST_HREF = `${BASE_PATH}manifest.json?v=${SW_VERSION}`;

  // === LIEN MANIFEST (au cas où il n’est pas dans le <head>) ===
  (function ensureManifestLink() {
    const has = document.querySelector('link[rel="manifest"]');
    if (!has) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = MANIFEST_HREF;
      document.head.appendChild(link);
    }
  })();

  // === UTILS ===
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true; // iOS Safari
  }

  async function sendToSW(type, payload = {}, waitReply = false) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.active) return false;
    if (!waitReply) {
      reg.active.postMessage({ type, ...payload });
      return true;
    }
    const ch = new MessageChannel();
    const done = new Promise(res => (ch.port1.onmessage = () => res(true)));
    reg.active.postMessage({ type, ...payload }, [ch.port2]);
    return done;
  }

  // === INSTALL BUTTON HANDLER ===
  let deferredPrompt = null;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Tous les boutons marqués data-pwa-install
  function getInstallButtons() {
    return Array.from(document.querySelectorAll('[data-pwa-install]'));
  }
  function hideBtns() { getInstallButtons().forEach(b => b.hidden = true); }
  function showBtns() { getInstallButtons().forEach(b => { b.hidden = false; b.disabled = false; }); }

  // iOS fallback
  function wireIosHintOnce(btn) {
    btn.addEventListener('click', () => {
      alert("Sur iPhone/iPad : touchez le bouton Partager puis « Sur l’écran d’accueil » pour installer.");
    }, { once: true });
  }

  // Branche l’événement beforeinstallprompt (Chrome/Edge/Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBtns();
    window.dispatchEvent(new CustomEvent('pwa:eligible', { detail: true }));
  });

  // Clic sur bouton = lancer l’install
  function attachInstallClicks() {
    getInstallButtons().forEach(btn => {
      // nettoie les handlers existants
      btn.replaceWith(btn.cloneNode(true));
    });
    getInstallButtons().forEach(btn => {
      btn.addEventListener('click', async () => {
        if (isiOS && isSafari && !deferredPrompt) return; // iOS fallback géré plus bas
        if (!deferredPrompt) return;
        btn.disabled = true;
        const { outcome } = await deferredPrompt.prompt();
        deferredPrompt = null;
        if (outcome === 'accepted') {
          hideBtns();
        } else {
          btn.disabled = false;
        }
      });
    });
  }

  // App installée -> masquer
  window.addEventListener('appinstalled', () => {
    hideBtns();
    deferredPrompt = null;
  });

  // Affichage initial des boutons selon plateforme
  function updateInstallButtonsVisibility() {
    if (isStandalone()) {
      hideBtns();
      return;
    }
    if (isiOS && isSafari) {
      // Pas d’évènement → on affiche un bouton qui montre une aide
      showBtns();
      getInstallButtons().forEach(wireIosHintOnce);
    } else {
      // On attend beforeinstallprompt pour afficher
      hideBtns();
    }
  }

  // === SW REGISTER + PURGE CACHES ===
  async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    const swUrl = `${BASE_PATH}${SW_FILE}?v=${SW_VERSION}`;

    try {
      const reg = await navigator.serviceWorker.register(swUrl);
      // Forcer un check d’update
      reg.update().catch(() => {});
      // Si une nouvelle version s’installe, skipWaiting
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // Purge au démarrage si en ligne
      if (navigator.onLine) {
        await sendToSW('PURGE_ALL', {}, true);
      }
    } catch (e) {
      // ignore
    }

    // Rechargement unique quand le nouveau SW prend le contrôle
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloaded) { reloaded = true; location.reload(); }
    });
  }

  // Au retour en ligne : purge (réchauffe offline.html dans le SW)
  window.addEventListener('online', () => {
    if ('serviceWorker' in navigator) sendToSW('PURGE_ALL', {}, true);
  });

  // === API PUBLIQUE ===
  window.PWA = {
    async promptInstall() {
      if (deferredPrompt) {
        const { outcome } = await deferredPrompt.prompt();
        deferredPrompt = null;
        return outcome; // 'accepted' | 'dismissed'
      }
      if (isiOS && isSafari) {
        alert("Sur iPhone/iPad : bouton Partager → « Sur l’écran d’accueil ».");
        return 'ios-hint';
      }
      return 'unavailable';
    },
    isInstallable() { return !!deferredPrompt || (isiOS && isSafari); },
    onEligible(cb) { window.addEventListener('pwa:eligible', () => cb(true)); }
  };

  // === BOOT ===
  // 1) visuel du bouton
  updateInstallButtonsVisibility();
  attachInstallClicks();

  // 2) SW
  window.addEventListener('load', registerSW);

})();