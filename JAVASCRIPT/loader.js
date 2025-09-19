
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
        "De base, ce site était conçu uniquement pour une seule personne: Maxence TORCHIN.",
        "La version originale était bien différente de la version d'aujourd'hui.\nPas de changement de thèmes... Une seule page... juste une horloge et des cases pour des liens.",
        "Cyril TAMINE a été la première personne à rejoindre le projet dans ses débuts, c'est même lui qui a initié la mise en page que vous voyez aujourd'hui.",
        "Monsieur Mickael Martin Nevot, aussi connu sous le nom de, \"LE GOAT\" a déjà réalisé un film.",
        "Conseil: N'arrivez pas en retard.",
        "Vraiment, ne venez pas en retard.",
        "Si tu vois ça, ta co est pas folle je crois.",
        "Savez vous qu'en contactant le créateur vous pouvez avoir votre propre site personnalisé? 50 Balles.\n\n(C'était une blague)",
        "Malgré les apparences, les emplois du temps ne sont pas raffraichis en temps réel. Ils sont actualisés au levé du soleil, à 12h15 et 20h00"
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