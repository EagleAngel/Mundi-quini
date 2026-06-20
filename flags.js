// ══════════════════════════════════════════════════════════
//  FLAGS — Emojis de bandera por equipo (español)
// ══════════════════════════════════════════════════════════
const TEAM_FLAGS = {
    // Grupo A
    "México":              "🇲🇽",
    "Sudáfrica":           "🇿🇦",
    "Corea del Sur":       "🇰🇷",
    "Chequia":             "🇨🇿",
    // Grupo B
    "Canadá":              "🇨🇦",
    "Bosnia y Herzegovina":"🇧🇦",
    "Qatar":               "🇶🇦",
    "Suiza":               "🇨🇭",
    // Grupo C
    "Brasil":              "🇧🇷",
    "Marruecos":           "🇲🇦",
    "Haití":               "🇭🇹",
    "Escocia":             "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    // Grupo D
    "Estados Unidos":      "🇺🇸",
    "Paraguay":            "🇵🇾",
    "Australia":           "🇦🇺",
    "Turquía":             "🇹🇷",
    // Grupo E
    "Alemania":            "🇩🇪",
    "Curazao":             "🇨🇼",
    "Costa de Marfil":     "🇨🇮",
    "Ecuador":             "🇪🇨",
    // Grupo F
    "Países Bajos":        "🇳🇱",
    "Japón":               "🇯🇵",
    "Suecia":              "🇸🇪",
    "Túnez":               "🇹🇳",
    // Grupo G
    "Bélgica":             "🇧🇪",
    "Egipto":              "🇪🇬",
    "Irán":                "🇮🇷",
    "Nueva Zelanda":       "🇳🇿",
    // Grupo H
    "España":              "🇪🇸",
    "Cabo Verde":          "🇨🇻",
    "Arabia Saudita":      "🇸🇦",
    "Uruguay":             "🇺🇾",
    // Grupo I
    "Francia":             "🇫🇷",
    "Senegal":             "🇸🇳",
    "Irak":                "🇮🇶",
    "Noruega":             "🇳🇴",
    // Grupo J
    "Argentina":           "🇦🇷",
    "Argelia":             "🇩🇿",
    "Austria":             "🇦🇹",
    "Jordania":            "🇯🇴",
    // Grupo K
    "Portugal":            "🇵🇹",
    "RD del Congo":        "🇨🇩",
    "Uzbekistán":          "🇺🇿",
    "Colombia":            "🇨🇴",
    // Grupo L
    "Inglaterra":          "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Croacia":             "🇭🇷",
    "Ghana":               "🇬🇭",
    "Panamá":              "🇵🇦",
};

// Función global para obtener bandera
window.getFlag = function(teamName) {
    return TEAM_FLAGS[teamName] || "🏳️";
};
