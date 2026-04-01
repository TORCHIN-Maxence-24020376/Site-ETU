
/**
 * Vérifie l'heure et affiche des notifications sur l'EDT à certains moments de la journée
 * Vérifie accéssoirement si la fonctionnalité des Emplois du temps est fonctionnelle ou non
 */

const safetyUrl ="https://raw.githubusercontent.com/TORCHIN-Maxence-24020376/EDT/main/alert.json";
function checkEdtNotifications() {
    // On ne vérifie que sur la page EDT
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    
    // Vérifier l'heure et afficher la notification appropriée
    if (hours === 7 && minutes <= 30) {
        createNotification("Bonjour ! L'emploi du temps peut avoir été mis à jour pendant la nuit. Vérifiez bien vos cours d'aujourd'hui.");
    } else if (hours === 12 && minutes >= 15 && minutes <= 45) {
        createNotification("Attention ! Des changements peuvent avoir été apportés à l'emploi du temps de cet après-midi.");
    } else if (hours === 20 && minutes <= 30) {
        createNotification("Bonsoir ! Pensez à vérifier votre emploi du temps pour demain. Des modifications de dernière minute sont possibles.");
    }
}

// Créer un élément pour afficher la notification
async function createNotification(message,alert=false) {
    // Vérifier si une notification existe déjà
    const existingNotification = document.querySelector('.edt-notification');
    if (existingNotification) return;
    let bgColor = "rgba(255, 215, 0, 0.9)"
    let fColor = "#000000"
    if (alert==true) {
        fColor = "#ffffff"
        bgColor = "rgba(166, 0, 255, 0.9)"
    }

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
    notification.style.backgroundColor = bgColor;
    notification.style.color = fColor;
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
    
    alert = fetch(safetyUrl)
    .then(res => res.json())
    .then(data => {
        if (data[0].alert == true){
            createNotification(data[0].message, true)
        }
        else{
            // Vérifier les notifications toutes les minutes
            setInterval(checkEdtNotifications, 60000);
            
            // Vérifier immédiatement au chargement de la page
            checkEdtNotifications();
        }
    });

});