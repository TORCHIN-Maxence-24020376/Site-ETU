// Données des salles avec leurs configurations réseau
const roomConfig = {
    I002: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I004: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I009: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I010: { ip: "10.203.9.***", Passerelle: "10.203.9.1" },
    I102: { ip: "10.203.28.***", Passerelle: "10.203.28.1"},
    I104: { ip: "10.203.28.***", Passerelle: "10.203.28.1" },
    I106: { ip: "10.203.9.***", Passerelle: "10.203.9.1"},
};

// Met à jour les champs en fonction de la salle sélectionnée
function updateReseauConfig() {
    const room = document.getElementById("select-salle").value;
    const config = roomConfig[room] || { ip: "", Passerelle: "" };

    // Mise à jour des champs
    document.getElementById("ip").value = config.ip;
    document.getElementById("Passerelle").value = config.Passerelle;
}