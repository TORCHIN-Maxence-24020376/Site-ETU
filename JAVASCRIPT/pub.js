/**
 * pub.js - Fonctionnalités JavaScript pour la publicité événementielle
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de la pub
    initPub();
});

/**
 * Initialise les fonctionnalités de la publicité
 */
function initPub() {
    // Si la section de pub existe
    const pubContainer = document.querySelector('.pub-container-wrapper .pub-container');
    if (!pubContainer) return;

    // Ajouter l'effet de "shine" à certains éléments
    const shineElements = document.querySelectorAll('.pub-container-wrapper .pub-highlight, .pub-container-wrapper .pub-cta');
    shineElements.forEach(el => {
        el.classList.add('pub-shine');
    });

    // Gestion du bouton CTA
    const ctaButton = document.querySelector('.pub-container-wrapper .pub-cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            // Vous pouvez ajouter ici un suivi d'analytics ou d'autres fonctions
            console.log('CTA de pub cliqué');
        });
    }

    // Mise à jour dynamique de la date si nécessaire
    updatePubDate();
}

/**
 * Met à jour dynamiquement la date d'événement si nécessaire
 */
function updatePubDate() {
    const dateElement = document.querySelector('.pub-container-wrapper .pub-date');
    if (!dateElement) return;

    // Exemple: si vous voulez toujours afficher la date à J+30 jours
    // const eventDate = new Date();
    // eventDate.setDate(eventDate.getDate() + 30);
    // const formattedDate = formatDate(eventDate);
    // dateElement.textContent = formattedDate;
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(date) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Permet de masquer/afficher la publicité
 */
function togglePubVisibility(show = true) {
    const pubSection = document.getElementById('pub-section');
    if (!pubSection) return;
    
    pubSection.style.display = show ? 'block' : 'none';
} 