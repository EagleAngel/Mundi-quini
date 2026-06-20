        // ══════════════════════════════════════════════════════════
//  BRACKET VISUAL — Mundial 2026
//  Ronda de 32 → Octavos → Cuartos → Semis → Final
// ══════════════════════════════════════════════════════════

const BK_API = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

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

function isReal(name) {
    if (!name) return false;
    return !((/^[WL]\d+$/.test(name)) || (/^\d[A-L]$/.test(name)) || name.includes("/"));
}

function fmtTeam(name) {
    if (!name) return "Por definir";
    if (/^W\d+$/.test(name))    return `W${name.slice(1)}`;
    if (/^L\d+$/.test(name))    return `L${name.slice(1)}`;
    if (/^\d[A-L]$/.test(name)) return `${name[0]}° Grupo ${name[1]}`;
    if (name.includes("/"))      return `Mejor 3°`;
    return bkes(name);
}

function teamLabel(name) {
    return isReal(name) ? bkes(name) : fmtTeam(name);
}

// Detectar equipos de la familia (requiere participantsData global)
function isFamilyTeam(nameEs) {
    if (!window.participantsData) return false;
    return participantsData.some(p => p.teams.includes(nameEs));
}
function ownerOf(nameEs) {
    if (!window.participantsData) return "";
    return participantsData.find(p => p.teams.includes(nameEs))?.name || "";
}

// ── Render principal ──────────────────────────────────────
window.renderBracket = async function () {
    const wrap = document.getElementById("bracketContainer");
    if (!wrap) return;
    wrap.innerHTML = `<div class="bk-loading">⏳ Cargando bracket…</div>`;

    let rounds = {};
    try {
        const res  = await fetch(BK_API + "?t=" + Date.now());
        const data = await res.json();

        const ROUNDS = ["Round of 32","Round of 16","Quarter-final","Semi-final","Final","Match for third place"];
        ROUNDS.forEach(r => rounds[r] = []);

        data.matches.forEach(m => {
            if (!ROUNDS.includes(m.round)) return;
            const sc = m.score?.ft || null;
            const pk = m.score?.p  || null;
            rounds[m.round].push({
                date:   m.date,
                home:   m.team1,
                away:   m.team2,
                hs:     sc ? sc[0] : null,
                as:     sc ? sc[1] : null,
                hp:     pk ? pk[0] : null,
                ap:     pk ? pk[1] : null,
            });
        });
    } catch(e) {
        wrap.innerHTML = `<div class="bk-loading">⚠️ No se pudo cargar el bracket</div>`;
        return;
    }

    // ── Construir HTML ─────────────────────────────────────
    // Estructura: [R32 top-half] [R16] [QF] [SF] [Final] [SF'] [QF'] [R16'] [R32 bottom-half]
    // Mostramos dos mitades (arriba/abajo) por columna para el efecto clásico de bracket

    const r32  = rounds["Round of 32"];          // 16 partidos [0..15]
    const r16  = rounds["Round of 16"];           // 8  partidos [0..7]
    const qf   = rounds["Quarter-final"];         // 4  partidos [0..3]
    const sf   = rounds["Semi-final"];            // 2  partidos [0..1]
    const fin  = rounds["Final"];                 // 1  partido  [0]
    const tp   = rounds["Match for third place"]; // 1  partido

    // Mitad superior: R32[0-7], R16[0-3], QF[0-1], SF[0]
    // Mitad inferior: R32[8-15], R16[4-7], QF[2-3], SF[1]

    function matchCard(m, size = "md") {
        if (!m) return `<div class="bk-card bk-card--${size} bk-card--empty"><div class="bk-slot">—</div><div class="bk-slot">—</div></div>`;

        const played = m.hs !== null;
        const homeEs = teamLabel(m.home);
        const awayEs = teamLabel(m.away);
        const homeFlag = isReal(m.home) && window.getFlag ? window.getFlag(bkes(m.home)) : "";
        const awayFlag = isReal(m.away) && window.getFlag ? window.getFlag(bkes(m.away)) : "";
        const homeFam = isReal(m.home) && isFamilyTeam(bkes(m.home));
        const awayFam = isReal(m.away) && isFamilyTeam(bkes(m.away));

        let hw = false, aw = false;
        if (played) {
            hw = m.hs > m.as || (m.hs === m.as && m.hp > m.ap);
            aw = !hw;
        }

        const dateStr = m.date
            ? new Date(m.date + "T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})
            : "";

        const scoreH = played ? `<span class="bk-sc ${hw?"bk-w":""}">${m.hs}${m.hp!=null?` (${m.hp}p)`:""}</span>` : "";
        const scoreA = played ? `<span class="bk-sc ${aw?"bk-w":""}">${m.as}${m.ap!=null?` (${m.ap}p)`:""}</span>` : `<span class="bk-date-badge">${dateStr}</span>`;

        const owH = homeFam ? ownerOf(bkes(m.home)) : "";
        const owA = awayFam ? ownerOf(bkes(m.away)) : "";

        return `<div class="bk-card bk-card--${size}">
            <div class="bk-slot ${hw?"bk-winner":""} ${homeFam?"bk-fam":""} ${!isReal(m.home)?"bk-tbd":""}">
                <span class="bk-name">${homeFlag} ${homeEs}</span>
                ${owH ? `<span class="bk-ow">${owH}</span>` : ""}
                ${scoreH}
            </div>
            <div class="bk-slot ${aw?"bk-winner":""} ${awayFam?"bk-fam":""} ${!isReal(m.away)?"bk-tbd":""}">
                <span class="bk-name">${awayFlag} ${awayEs}</span>
                ${owA ? `<span class="bk-ow">${owA}</span>` : ""}
                ${scoreA}
            </div>
        </div>`;
    }

    // columna de ronda
    function col(label, cards, cls = "") {
        return `<div class="bk-col ${cls}">
            <div class="bk-col-label">${label}</div>
            <div class="bk-col-matches">${cards.join("")}</div>
        </div>`;
    }

    // Tarjeta de campeón
    const finalMatch = fin[0];
    let champHtml = "";
    if (finalMatch && finalMatch.hs !== null) {
        const hw = finalMatch.hs > finalMatch.as;
        const champName = hw ? bkes(finalMatch.home) : bkes(finalMatch.away);
        const champOwner = isFamilyTeam(champName) ? ownerOf(champName) : "";
        champHtml = `<div class="bk-champion">
            <div class="bk-champ-trophy">🏆</div>
            <div class="bk-champ-name">${window.getFlag?window.getFlag(champName):""} ${champName}</div>
            <div class="bk-champ-label">Campeón Mundial 2026</div>
            ${champOwner ? `<div class="bk-champ-owner">🎉 ${champOwner}</div>` : ""}
        </div>`;
    } else {
        champHtml = `<div class="bk-champion bk-champion--pending">
            <div class="bk-champ-trophy">🏆</div>
            <div class="bk-champ-label">Por definirse</div>
            <div class="bk-final-date">19 Jul · Nueva York</div>
        </div>`;
    }

    // 3er lugar
    const tpMatch = tp[0];
    const tpHtml = tpMatch ? `
        <div class="bk-third-place">
            <div class="bk-tp-label">🥉 Tercer Lugar · ${tpMatch.date ? new Date(tpMatch.date+"T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"long"}) : "18 Jul"}</div>
            ${matchCard(tpMatch, "sm")}
        </div>` : "";

    // Construir layout completo
    wrap.innerHTML = `
    <div class="bk-scroll-wrap">
      <div class="bk-bracket">

        <!-- MITAD SUPERIOR -->
        <div class="bk-half bk-half--top">
          ${col("Ronda de 32", r32.slice(0,8).map(m=>matchCard(m)))}
          <div class="bk-connectors bk-conn-32-16 bk-conn-top"></div>
          ${col("Octavos", r16.slice(0,4).map(m=>matchCard(m)))}
          <div class="bk-connectors bk-conn-16-qf bk-conn-top"></div>
          ${col("Cuartos", qf.slice(0,2).map(m=>matchCard(m)))}
          <div class="bk-connectors bk-conn-qf-sf bk-conn-top"></div>
          ${col("Semifinal", sf.slice(0,1).map(m=>matchCard(m,"lg")))}
          <div class="bk-connectors bk-conn-sf-f bk-conn-top"></div>
        </div>

        <!-- CENTRO: FINAL + CAMPEÓN -->
        <div class="bk-center">
          <div class="bk-final-label">🏆 GRAN FINAL</div>
          <div class="bk-final-date-sub">19 Jul · MetLife Stadium</div>
          ${matchCard(finalMatch || null, "xl")}
          ${champHtml}
        </div>

        <!-- MITAD INFERIOR -->
        <div class="bk-half bk-half--bot">
          <div class="bk-connectors bk-conn-sf-f bk-conn-bot"></div>
          ${col("Semifinal", sf.slice(1,2).map(m=>matchCard(m,"lg")))}
          <div class="bk-connectors bk-conn-qf-sf bk-conn-bot"></div>
          ${col("Cuartos", qf.slice(2,4).map(m=>matchCard(m)))}
          <div class="bk-connectors bk-conn-16-qf bk-conn-bot"></div>
          ${col("Octavos", r16.slice(4,8).map(m=>matchCard(m)))}
          <div class="bk-connectors bk-conn-32-16 bk-conn-bot"></div>
          ${col("Ronda de 32", r32.slice(8,16).map(m=>matchCard(m)))}
        </div>

      </div>
      ${tpHtml}
    </div>
    <p class="bk-updated">⟳ Actualizado ${new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})} · Los equipos aparecen conforme avanza el torneo · <span style="color:#f59e0b">■</span> equipo de la familia</p>
    `;
};
