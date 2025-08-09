/**
 * Script de recherche et filtrage pour les pages de liens et logiciels
 */

document.addEventListener('DOMContentLoaded', function() {
    // Éléments du DOM
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const sites = document.querySelectorAll('.Site');
    
    // État actuel du filtre
    let currentCategory = 'all';
    
    // Fonction pour filtrer les sites par catégorie
    function filterByCategory(category) {
        sites.forEach(site => {
            const siteCategory = site.dataset.category;
            
            if (category === 'all' || siteCategory === category) {
                site.classList.remove('hidden');
                site.classList.add('visible');
            } else {
                site.classList.add('hidden');
                site.classList.remove('visible');
            }
        });
    }
    
    // Fonction pour filtrer les sites par texte de recherche
    function filterBySearch(searchText) {
        const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
        
        if (searchTerms.length === 0) {
            // Si la recherche est vide, on revient au filtre par catégorie
            filterByCategory(currentCategory);
            return;
        }
        
        sites.forEach(site => {
            const siteCategory = site.dataset.category;
            const siteName = site.querySelector('.name').textContent.toLowerCase();
            const siteInfo = site.querySelector('.info').textContent.toLowerCase();
            const siteTitle = site.getAttribute('title') ? site.getAttribute('title').toLowerCase() : '';
            
            // Vérifie si le site correspond à la catégorie actuelle (si ce n'est pas "all")
            const matchesCategory = currentCategory === 'all' || siteCategory === currentCategory;
            
            // Vérifie si le site correspond à au moins un terme de recherche
            const matchesSearch = searchTerms.some(term => 
                siteName.includes(term) || 
                siteInfo.includes(term) || 
                siteTitle.includes(term)
            );
            
            if (matchesCategory && matchesSearch) {
                site.classList.remove('hidden');
                site.classList.add('visible');
            } else {
                site.classList.add('hidden');
                site.classList.remove('visible');
            }
        });
        
        // Vérifier si des sections sont vides et les masquer
        const sections = document.querySelectorAll('.category-section');
        sections.forEach(section => {
            const visibleSites = section.querySelectorAll('.Site:not(.hidden)');
            if (visibleSites.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
    }
    
    // Gestionnaire d'événement pour les filtres de catégorie
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Mettre à jour la classe active
            categoryFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // Mettre à jour la catégorie actuelle
            currentCategory = this.dataset.category;
            
            // Appliquer le filtre
            if (searchInput.value.trim() === '') {
                filterByCategory(currentCategory);
            } else {
                filterBySearch(searchInput.value);
            }
        });
    });
    
    // Gestionnaire d'événement pour la recherche
    function performSearch() {
        filterBySearch(searchInput.value);
    }
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    // Recherche en temps réel (après un court délai pour éviter trop de calculs)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300);
    });
    
    // Initialiser l'affichage
    filterByCategory('all');
}); 