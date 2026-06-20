// ══════════════════════════════════════════════════════════
//  BRACKET VISUAL — Mundial 2026
//  Layout clásico espejo: izquierda → centro ← derecha
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
    if (/^W\d+$/.test(name))     return `W${name.slice(1)}`;
    if (/^L\d+$/.test(name))     return `L${name.slice(1)}`;
    if (/^\d[A-L]$/.test(name))  return `${name[0]}° G-${name[1]}`;
    if (name.includes("/"))       return `Mejor 3°`;
    return bkes(name);
}
function teamLabel(name) {
    return isReal(name) ? bkes(name) : fmtTeam(name);
}
function isFamilyTeam(nameEs) {
    return window.participantsData?.some(p => p.teams.includes(nameEs)) || false;
}
function ownerOf(nameEs) {
    return window.participantsData?.find(p => p.teams.includes(nameEs))?.name || "";
}
function flag(name) {
    return (isReal(name) && window.getFlag) ? window.getFlag(bkes(name)) : "";
}

// ── Tarjeta de partido ─────────────────────────────────────
// mirror=false → score a la DERECHA (lado izquierdo del bracket)
// mirror=true  → score a la IZQUIERDA (lado derecho del bracket, espejo)
function matchCard(m, { size = "md", mirror = false } = {}) {
    if (!m) return `<div class="bk-card bk-card--${size} bk-empty"><div class="bk-slot"></div><div class="bk-slot"></div></div>`;

    const played  = m.hs !== null;
    const homeEs  = teamLabel(m.home);
    const awayEs  = teamLabel(m.away);
    const homeFlag = flag(m.home);
    const awayFlag = flag(m.away);
    const homeFam = isReal(m.home) && isFamilyTeam(bkes(m.home));
    const awayFam = isReal(m.away) && isFamilyTeam(bkes(m.away));
    const owH = homeFam ? ownerOf(bkes(m.home)) : "";
    const owA = awayFam ? ownerOf(bkes(m.away)) : "";

    let hw = false, aw = false;
    if (played) {
        hw = m.hs > m.as || (m.hs === m.as && m.hp > m.ap);
        aw = !hw;
    }

    const dateStr = m.date
        ? new Date(m.date + "T12:00:00").toLocaleDateString("es-MX", { day:"numeric", month:"short" })
        : "";

    // slot: en modo espejo el score va a la izquierda y el nombre a la derecha
    function slot(nameEs, nameFlag, isWin, isFam, isRealTeam, score, penStr, owner) {
        const scHtml  = played
            ? `<span class="bk-sc ${isWin ? "bk-w" : ""}">${score}${penStr}</span>`
            : `<span class="bk-date-tag">${dateStr}</span>`;
        const owHtml  = owner ? `<span class="bk-ow">${owner}</span>` : "";
        const nameHtml = `<span class="bk-name">${nameFlag} ${nameEs}</span>`;

        if (mirror) {
            // espejo: [score] [owner] [nombre]
            return `<div class="bk-slot bk-slot--mirror ${isWin?"bk-winner":""} ${isFam?"bk-fam":""} ${!isRealTeam?"bk-tbd":""}">
                ${scHtml}
                ${owHtml}
                ${nameHtml}
            </div>`;
        } else {
            // normal: [nombre] [owner] [score]
            return `<div class="bk-slot ${isWin?"bk-winner":""} ${isFam?"bk-fam":""} ${!isRealTeam?"bk-tbd":""}">
                ${nameHtml}
                ${owHtml}
                ${scHtml}
            </div>`;
        }
    }

    const penH = m.hp != null ? ` (${m.hp}p)` : "";
    const penA = m.ap != null ? ` (${m.ap}p)` : "";

    return `<div class="bk-card bk-card--${size} ${mirror ? "bk-card--mirror" : ""}">
        ${slot(homeEs, homeFlag, hw, homeFam, isReal(m.home), m.hs ?? "", penH, owH)}
        ${slot(awayEs, awayFlag, aw, awayFam, isReal(m.away), m.as ?? "", penA, owA)}
    </div>`;
}

// ── Columna de ronda ───────────────────────────────────────
function col(label, cards, mirror = false) {
    return `<div class="bk-col ${mirror ? "bk-col--mirror" : ""}">
        <div class="bk-col-label">${label}</div>
        <div class="bk-col-matches">${cards.join("")}</div>
    </div>`;
}

// ── Render principal ───────────────────────────────────────
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
                date: m.date, home: m.team1, away: m.team2,
                hs: sc?.[0] ?? null, as: sc?.[1] ?? null,
                hp: pk?.[0] ?? null, ap: pk?.[1] ?? null,
            });
        });
    } catch(e) {
        wrap.innerHTML = `<div class="bk-loading">⚠️ No se pudo cargar el bracket</div>`;
        return;
    }

    const r32 = rounds["Round of 32"];
    const r16 = rounds["Round of 16"];
    const qf  = rounds["Quarter-final"];
    const sf  = rounds["Semi-final"];
    const fin = rounds["Final"][0] || null;
    const tp  = rounds["Match for third place"][0] || null;

    // Mitad izquierda: r32[0-7], r16[0-3], qf[0-1], sf[0]   → score a la DERECHA
    // Mitad derecha:   r32[8-15], r16[4-7], qf[2-3], sf[1]   → score a la IZQUIERDA (espejo)

    const leftR32 = r32.slice(0,8).map(m => matchCard(m, { mirror: false }));
    const leftR16 = r16.slice(0,4).map(m => matchCard(m, { mirror: false }));
    const leftQF  = qf.slice(0,2).map(m  => matchCard(m, { mirror: false }));
    const leftSF  = sf.slice(0,1).map(m  => matchCard(m, { size:"lg", mirror: false }));

    const rightSF  = sf.slice(1,2).map(m  => matchCard(m, { size:"lg", mirror: true }));
    const rightQF  = qf.slice(2,4).map(m  => matchCard(m, { mirror: true }));
    const rightR16 = r16.slice(4,8).map(m => matchCard(m, { mirror: true }));
    const rightR32 = r32.slice(8,16).map(m=> matchCard(m, { mirror: true }));

    // Campeón
    let champHtml = "";
    if (fin && fin.hs !== null) {
        const hw = fin.hs > fin.as || (fin.hs === fin.as && fin.hp > fin.ap);
        const champName  = hw ? bkes(fin.home) : bkes(fin.away);
        const champFlag  = window.getFlag ? window.getFlag(champName) : "";
        const champOwner = isFamilyTeam(champName) ? ownerOf(champName) : "";
        champHtml = `<div class="bk-champion">
            <div class="bk-champ-trophy">🏆</div>
            <div class="bk-champ-name">${champFlag} ${champName}</div>
            <div class="bk-champ-label">Campeón Mundial 2026</div>
            ${champOwner ? `<div class="bk-champ-owner">🎉 ${champOwner}</div>` : ""}
        </div>`;
    } else {
        champHtml = `<div class="bk-champion bk-champion--pending">
            <div class="bk-champ-trophy">🏆</div>
            <div class="bk-champ-label">Por definirse</div>
            <div class="bk-final-date">19 Jul · MetLife Stadium</div>
        </div>`;
    }

    // Tercer lugar
    const tpHtml = tp ? `<div class="bk-third-place">
        <div class="bk-tp-label">🥉 Tercer Lugar · ${tp.date ? new Date(tp.date+"T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"long"}):"18 Jul"}</div>
        <div class="bk-tp-cards">
            ${matchCard(tp, { size:"sm", mirror: false })}
        </div>
    </div>` : "";

    wrap.innerHTML = `
    <div class="bk-scroll-wrap">
      <div class="bk-bracket">

        <!-- ── LADO IZQUIERDO (score →derecha) ── -->
        ${col("Ronda de 32", leftR32)}
        <div class="bk-conn"></div>
        ${col("Octavos", leftR16)}
        <div class="bk-conn"></div>
        ${col("Cuartos", leftQF)}
        <div class="bk-conn"></div>
        ${col("Semifinal", leftSF)}
        <div class="bk-conn bk-conn--sf"></div>

        <!-- ── CENTRO ── -->
        <div class="bk-center">
            <div class="bk-final-badge">🏆 GRAN FINAL</div>
            <div class="bk-final-venue">19 Jul · MetLife Stadium</div>
            ${matchCard(fin, { size:"xl", mirror: false })}
            ${champHtml}
        </div>

        <!-- ── LADO DERECHO (score ←izquierda, espejo) ── -->
        <div class="bk-conn bk-conn--sf"></div>
        ${col("Semifinal", rightSF, true)}
        <div class="bk-conn"></div>
        ${col("Cuartos", rightQF, true)}
        <div class="bk-conn"></div>
        ${col("Octavos", rightR16, true)}
        <div class="bk-conn"></div>
        ${col("Ronda de 32", rightR32, true)}

      </div>
      ${tpHtml}
    </div>
    <p class="bk-updated">⟳ ${new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})} · Equipos aparecen conforme avanza el torneo · <span style="color:#f59e0b">■</span> equipo de la familia</p>`;
};
