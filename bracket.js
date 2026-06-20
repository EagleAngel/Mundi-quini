// ── Pestaña Eliminatoria / Bracket ─────────────────────────────────────

const BRACKET_API = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Traducción de claves de API → nombres legibles
const ROUND_LABELS = {
    "Round of 32":         "Ronda de 32",
    "Round of 16":         "Octavos de Final",
    "Quarter-final":       "Cuartos de Final",
    "Semi-final":          "Semifinales",
    "Match for third place":"Tercer Lugar",
    "Final":               "🏆 Gran Final",
};

const ROUND_ORDER = [
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Final",
];

// Mapa inglés → español (mismo que app.js)
const BK_NAME_MAP = {
    "Algeria":"Argelia","Argentina":"Argentina","Australia":"Australia",
    "Austria":"Austria","Belgium":"Bélgica","Bosnia & Herzegovina":"Bosnia y Herzegovina",
    "Brazil":"Brasil","Canada":"Canadá","Cape Verde":"Cabo Verde",
    "Colombia":"Colombia","Croatia":"Croacia","Curaçao":"Curazao",
    "Czech Republic":"Chequia","DR Congo":"RD del Congo","Ecuador":"Ecuador",
    "Egypt":"Egipto","England":"Inglaterra","France":"Francia",
    "Germany":"Alemania","Ghana":"Ghana","Haiti":"Haití","Iran":"Irán",
    "Iraq":"Irak","Ivory Coast":"Costa de Marfil","Japan":"Japón",
    "Jordan":"Jordania","Mexico":"México","Morocco":"Marruecos",
    "Netherlands":"Países Bajos","New Zealand":"Nueva Zelanda","Norway":"Noruega",
    "Panama":"Panamá","Paraguay":"Paraguay","Portugal":"Portugal",
    "Qatar":"Qatar","Saudi Arabia":"Arabia Saudita","Scotland":"Escocia",
    "Senegal":"Senegal","South Africa":"Sudáfrica","South Korea":"Corea del Sur",
    "Spain":"España","Sweden":"Suecia","Switzerland":"Suiza","Tunisia":"Túnez",
    "Turkey":"Turquía","USA":"Estados Unidos","Uruguay":"Uruguay","Uzbekistan":"Uzbekistán",
};
const bkes = n => BK_NAME_MAP[n] || n;

// Formatear claves genéricas tipo "1A", "2B", "W73"
function fmtTeam(name) {
    if (!name) return "Por definir";
    if (/^W\d+$/.test(name))   return `Ganador partido ${name.slice(1)}`;
    if (/^L\d+$/.test(name))   return `Perdedor partido ${name.slice(1)}`;
    if (/^\d[A-L]$/.test(name)) {
        const pos = name[0] === "1" ? "1°" : name[0] === "2" ? "2°" : "3°";
        return `${pos} Grupo ${name[1]}`;
    }
    if (name.includes("/")) return `Mejor 3° (${name})`;
    return bkes(name);
}

// Saber si un nombre es "real" (equipo conocido) o genérico
function isRealTeam(name) {
    return !(/^[WL]\d+$/.test(name) || /^\d[A-L]$/.test(name) || name.includes("/"));
}

// ── Render del bracket ──────────────────────────────────────────────────
window.renderBracket = async function() {
    const container = document.getElementById("bracketContainer");
    if (!container) return;
    container.innerHTML = `<div class="bk-loading">⏳ Cargando bracket...</div>`;

    let bracketData = {};
    try {
        const res  = await fetch(BRACKET_API + "?t=" + Date.now());
        const data = await res.json();

        // Agrupar por ronda
        ROUND_ORDER.forEach(round => { bracketData[round] = []; });

        data.matches.forEach(m => {
            if (!ROUND_ORDER.includes(m.round)) return;
            const score   = m.score?.ft || null;
            const hasPens = m.score?.p  || null;
            bracketData[m.round].push({
                date:   m.date,
                home:   m.team1,
                away:   m.team2,
                hScore: score ? score[0] : null,
                aScore: score ? score[1] : null,
                hPens:  hasPens ? hasPens[0] : null,
                aPens:  hasPens ? hasPens[1] : null,
                ground: m.ground || "",
            });
        });
    } catch(e) {
        container.innerHTML = `<div class="bk-loading">⚠️ No se pudo cargar el bracket</div>`;
        return;
    }

    // Detectar equipos de la familia
    const familyTeams = new Set(participantsData.flatMap(p => p.teams));
    const ownerOf = team => participantsData.find(p => p.teams.includes(team))?.name || "";

    // Construir HTML por ronda
    let html = `<div class="bracket-scroll">`;

    ROUND_ORDER.forEach(round => {
        const matches = bracketData[round] || [];
        if (matches.length === 0) return;

        const label    = ROUND_LABELS[round] || round;
        const isFinal  = round === "Final";

        html += `<div class="bk-round ${isFinal ? "bk-final-round" : ""}">`;
        html += `<div class="bk-round-label">${label}</div>`;
        html += `<div class="bk-matches">`;

        matches.forEach((m, idx) => {
            const played  = m.hScore !== null;
            const homeEs  = bkes(m.home);
            const awayEs  = bkes(m.away);
            const homeReal = isRealTeam(m.home);
            const awayReal = isRealTeam(m.away);

            const hWin = played && (m.hScore > m.aScore || (m.hScore === m.aScore && m.hPens > m.aPens));
            const aWin = played && !hWin;

            const homeFam = homeReal && familyTeams.has(homeEs);
            const awayFam = awayReal && familyTeams.has(awayEs);
            const homeOwner = homeFam ? ownerOf(homeEs) : "";
            const awayOwner = awayFam ? ownerOf(awayEs) : "";

            const dateStr = m.date
                ? new Date(m.date + "T12:00:00").toLocaleDateString("es-MX", { day:"numeric", month:"short" })
                : "";

            let scoreHtml = "";
            if (played) {
                scoreHtml = `
                    <div class="bk-score">
                        <span class="bk-sc ${hWin?"bk-win":""}">${m.hScore}${m.hPens!==null?` (${m.hPens}p)`:""}</span>
                        <span class="bk-dash">-</span>
                        <span class="bk-sc ${aWin?"bk-win":""}">${m.aScore}${m.aPens!==null?` (${m.aPens}p)`:""}</span>
                    </div>`;
            } else {
                scoreHtml = `<div class="bk-date">${dateStr}</div>`;
            }

            html += `
            <div class="bk-match ${played?"bk-played":""} ${isFinal&&played?"bk-final-played":""}">
                <div class="bk-team ${hWin?"bk-winner":""} ${homeFam?"bk-family":""} ${!homeReal?"bk-tbd":""}">
                    <span class="bk-tname">${homeReal ? homeEs : fmtTeam(m.home)}</span>
                    ${homeOwner ? `<span class="bk-owner">👤 ${homeOwner}</span>` : ""}
                </div>
                ${scoreHtml}
                <div class="bk-team ${aWin?"bk-winner":""} ${awayFam?"bk-family":""} ${!awayReal?"bk-tbd":""}">
                    <span class="bk-tname">${awayReal ? awayEs : fmtTeam(m.away)}</span>
                    ${awayOwner ? `<span class="bk-owner">👤 ${awayOwner}</span>` : ""}
                </div>
                ${isFinal && played && hWin ? `<div class="bk-champion-badge">🏆 Campeón: ${homeEs}</div>` : ""}
                ${isFinal && played && aWin ? `<div class="bk-champion-badge">🏆 Campeón: ${awayEs}</div>` : ""}
            </div>`;
        });

        html += `</div></div>`; // bk-matches, bk-round
    });

    // Tercer lugar aparte
    const tercero = bracketData["Match for third place"] || [];
    if (tercero.length > 0) {
        const m = tercero[0];
        const played   = m.hScore !== null;
        const homeEs   = bkes(m.home);
        const awayEs   = bkes(m.away);
        const homeReal = isRealTeam(m.home);
        const awayReal = isRealTeam(m.away);
        const hWin = played && m.hScore > m.aScore;
        const aWin = played && !hWin;
        const dateStr = m.date
            ? new Date(m.date + "T12:00:00").toLocaleDateString("es-MX", { day:"numeric", month:"short" })
            : "";

        html += `<div class="bk-third">
            <div class="bk-round-label">🥉 Tercer Lugar</div>
            <div class="bk-match bk-played-third ${played?"bk-played":""}">
                <div class="bk-team ${hWin?"bk-winner":""} ${!homeReal?"bk-tbd":""}">
                    <span class="bk-tname">${homeReal ? homeEs : fmtTeam(m.home)}</span>
                </div>
                ${played
                    ? `<div class="bk-score">
                        <span class="bk-sc ${hWin?"bk-win":""}">${m.hScore}</span>
                        <span class="bk-dash">-</span>
                        <span class="bk-sc ${aWin?"bk-win":""}">${m.aScore}</span>
                       </div>`
                    : `<div class="bk-date">${dateStr}</div>`}
                <div class="bk-team ${aWin?"bk-winner":""} ${!awayReal?"bk-tbd":""}">
                    <span class="bk-tname">${awayReal ? awayEs : fmtTeam(m.away)}</span>
                </div>
            </div>
        </div>`;
    }

    html += `</div>`; // bracket-scroll

    const ts = new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" });
    html += `<p class="bk-updated">Actualizado ${ts} · Se refresca cada 5 min</p>`;

    container.innerHTML = html;
};
