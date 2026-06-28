import { db, doc, setDoc, onSnapshot } from "./firebase.js";

const API_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const NAME_MAP = {
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
const es = n => NAME_MAP[n] || n;

// ── Estado ─────────────────────────────────────────────────────────────
let manualEliminated = [];
let liveScores   = {};
let autoChampion = "";
let prevEliminated = [];
let chart;

// ── Mezcla datos locales + API ─────────────────────────────────────────
function getMatches() {
    return allMatches.map(m => {
        const key  = `${m.home}|${m.away}`;
        const live = liveScores[key];
        return live
            ? { ...m, homeScore: live.homeScore, awayScore: live.awayScore,
                htHome: live.htHome, htAway: live.htAway,
                goals1: live.goals1, goals2: live.goals2 }
            : { ...m, htHome: null, htAway: null, goals1: [], goals2: [] };
    });
}

// ── Fetch API ──────────────────────────────────────────────────────────
async function fetchLiveScores() {
    showStatus("⏳ Actualizando...");
    try {
        const res = await fetch(API_URL + "?t=" + Date.now());
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const map = {};
        let champion = "";
        data.matches.forEach(m => {
            if (!m.score) return;
            const homeEs = es(m.team1);
            const awayEs = es(m.team2);
            map[`${homeEs}|${awayEs}`] = {
                homeScore: m.score.ft[0], awayScore: m.score.ft[1],
                htHome: m.score.ht?.[0] ?? null, htAway: m.score.ht?.[1] ?? null,
                goals1: m.goals1 || [], goals2: m.goals2 || [],
            };
            if (m.round === "Final") {
                champion = m.score.ft[0] > m.score.ft[1] ? homeEs : awayEs;
            }
        });
        liveScores   = map;
        autoChampion = champion;
        const ts = new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
        showStatus(`✅ Actualizado ${ts} · ${Object.keys(map).length} resultados`);
    } catch(e) {
        showStatus("⚠️ Sin API — datos locales");
    }
}
function showStatus(msg) {
    const el = document.getElementById("apiStatus");
    if (el) el.textContent = msg;
}

// ── Eliminados automáticos (lógica de clasificación real) ─────────────
function computeAutoEliminated() {
    const matches = getMatches();

    // 1. Construir tabla por grupo con todos los partidos jugados
    const groups = {};
    matches.forEach(m => {
        if (m.homeScore === null || m.awayScore === null) return;
        if (!m.group) return; // solo fase de grupos
        [m.home, m.away].forEach(t => {
            if (!groups[t]) groups[t] = { pts:0, gd:0, gf:0, played:0, group:m.group };
        });
        groups[m.home].gf += m.homeScore; groups[m.home].gd += (m.homeScore - m.awayScore); groups[m.home].played++;
        groups[m.away].gf += m.awayScore; groups[m.away].gd += (m.awayScore - m.homeScore); groups[m.away].played++;
        if      (m.homeScore > m.awayScore) { groups[m.home].pts+=3; }
        else if (m.homeScore < m.awayScore) { groups[m.away].pts+=3; }
        else    { groups[m.home].pts+=1; groups[m.away].pts+=1; }
    });

    // Si no hay datos de grupos aún, retornar vacío
    if (Object.keys(groups).length === 0) return [];

    // 2. Agrupar equipos por grupo
    const byGroup = {};
    Object.entries(groups).forEach(([team, s]) => {
        if (!byGroup[s.group]) byGroup[s.group] = [];
        byGroup[s.group].push([team, s]);
    });

    // Solo procesar grupos completos (3 partidos por equipo = 4 equipos con played>=3... o al menos todos con played=3)
    const completeGroups = Object.entries(byGroup).filter(([g, teams]) =>
        teams.length === 4 && teams.every(([,s]) => s.played === 3)
    );

    if (completeGroups.length === 0) {
        // Grupos incompletos: solo eliminar los matemáticamente imposibles
        const auto = [];
        Object.entries(groups).forEach(([t,s]) => {
            if (s.played>=3 && s.pts===0) auto.push(t);
            if (s.played>=2 && s.pts===0 && (3-s.played)*3 < 4) auto.push(t); // no puede llegar a 4 pts
        });
        return [...new Set(auto)];
    }

    // 3. Clasificar: 1° y 2° de cada grupo + 8 mejores terceros
    const classif = new Set();
    const thirds  = [];
    const elim    = [];

    completeGroups.forEach(([g, teams]) => {
        const ranked = teams.sort((a,b) => b[1].pts-a[1].pts || b[1].gd-a[1].gd || b[1].gf-a[1].gf);
        classif.add(ranked[0][0]); // 1°
        classif.add(ranked[1][0]); // 2°
        thirds.push(ranked[2]);    // 3° candidato
        elim.push(ranked[3][0]);   // 4° eliminado directo
    });

    // 8 mejores terceros clasifican (Mundial 2026: 12 grupos → 8 mejores terceros)
    if (completeGroups.length === 12) {
        const sortedThirds = thirds.sort((a,b) => b[1].pts-a[1].pts || b[1].gd-a[1].gd || b[1].gf-a[1].gf);
        sortedThirds.forEach(([team,], i) => {
            if (i < 8) classif.add(team);
            else       elim.push(team);
        });
    }

    // También marcar como eliminados los que perdieron en Ronda de 32 en adelante
    matches.forEach(m => {
        if (m.homeScore === null || m.awayScore === null) return;
        if (m.group) return; // ignorar fase de grupos aquí
        // Perdedor de partido eliminatorio
        if (m.homeScore < m.awayScore) elim.push(m.home);
        else if (m.homeScore > m.awayScore) elim.push(m.away);
        // Empate con penales: el app.js no tiene penales en allMatches, la API sí
    });

    return [...new Set(elim)];
}
function getAllEliminated() {
    return computeAutoEliminated();
}

// ── Firebase ───────────────────────────────────────────────────────────
function listenSettings() {
    onSnapshot(doc(db,"settings","tournament"), snap => {
        if (snap.exists()) {
            const sel = document.getElementById("championSelect");
            if (sel && snap.data().champion) sel.value = snap.data().champion;
        }
        renderAll();
    });
}
async function saveSettings() {
    const sel = document.getElementById("championSelect");
    await setDoc(doc(db,"settings","tournament"), {
        champion: sel ? sel.value : "",
    });
}

// ── Alerta de eliminación ──────────────────────────────────────────────
function checkNewEliminations(elim) {
    const newly = elim.filter(t => !prevEliminated.includes(t));
    if (!newly.length) { prevEliminated = [...elim]; return; }
    newly.forEach(team => {
        const owner = participantsData.find(p => p.teams.includes(team));
        if (!owner) return;
        const f = window.getFlag ? window.getFlag(team) : "";
        showEliminationAlert(f, team, owner.name);
    });
    prevEliminated = [...elim];
}
function showEliminationAlert(flag, team, owner) {
    document.querySelectorAll(".elim-alert").forEach(e => e.remove());
    const d = document.createElement("div");
    d.className = "elim-alert";
    d.innerHTML = `<div class="elim-alert-inner">
        <span class="elim-skull">💀</span>
        <div class="elim-alert-text">
            <strong>${flag} ${team}</strong> fue eliminado
            <span class="elim-alert-owner">Le tocó a ${owner}</span>
        </div>
        <button class="elim-close" onclick="this.closest('.elim-alert').remove()">✕</button>
    </div>`;
    document.body.appendChild(d);
    setTimeout(() => { d.classList.add("elim-alert--out"); setTimeout(() => d.remove(), 400); }, 6000);
}

// ── Compartir por WhatsApp ─────────────────────────────────────────────
window.shareWhatsApp = function() {
    const elim = getAllEliminated();
    const rnk  = participantsData
        .map(p => ({ name: p.name, alive: p.teams.filter(t => !elim.includes(t)).length }))
        .sort((a,b) => b.alive - a.alive);
    const med   = ["🥇","🥈","🥉"];
    const lines = rnk.map((p,i) =>
        `${med[i]||(i+1)+"°"} ${p.name} — ${p.alive} equipo${p.alive!==1?"s":""} vivo${p.alive!==1?"s":""}`
    ).join("\n");
    const tot  = [...new Set(participantsData.flatMap(p=>p.teams))].length;
    const txt  = `🏆 *Quiniela Familiar Mundial 2026*\n\n${lines}\n\n⚽ ${elim.length} de ${tot} equipos eliminados\n_${new Date().toLocaleDateString("es-MX",{day:"numeric",month:"short"})}_`;
    window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
};

// ── Render principal ───────────────────────────────────────────────────
function renderAll() {
    const elim = getAllEliminated();
    checkNewEliminations(elim);
    renderSummary(elim);
    renderTodayMatches(elim);
    renderParticipants(elim);
    renderRanking(elim);
    renderMatches(elim);
    if (document.getElementById("estadisticas").classList.contains("active")) renderChart(elim);
}

// ── Resumen ────────────────────────────────────────────────────────────
function renderSummary(elim) {
    const allTeams = [...new Set(participantsData.flatMap(p=>p.teams))];
    document.getElementById("totalPlayers").textContent    = participantsData.length;
    document.getElementById("aliveTeamsCount").textContent = allTeams.length - elim.length;

    const champBox = document.getElementById("championBox");
    if (!champBox) return;
    if (autoChampion) {
        const winner = participantsData.find(p => p.teams.includes(autoChampion));
        champBox.innerHTML = `<div class="champion-reveal">
            <div class="champ-trophy">🏆</div>
            <div class="champ-team">${window.getFlag?window.getFlag(autoChampion):""} ${autoChampion}</div>
            <div class="champ-label">Campeón Mundial 2026</div>
            ${winner?`<div class="champ-winner">🎉 Ganador: <strong>${winner.name}</strong></div>`:""}
        </div>`;
    } else {
        const alive = [...new Set(participantsData
            .flatMap(p => p.teams.filter(t => !elim.includes(t))))].slice(0,6);
        champBox.innerHTML = `<div class="champ-pending">
            <span class="champ-pending-label">🏆 Campeón</span>
            <span class="champ-pending-value">Por definirse</span>
            <div class="champ-candidates">${alive.map(t=>`<span class="candidate">${window.getFlag?window.getFlag(t):""} ${t}</span>`).join("")}</div>
        </div>`;
    }
}

// ── Partidos de hoy / en vivo ──────────────────────────────────────────
function renderTodayMatches(elim) {
    const container = document.getElementById("todayMatches");
    if (!container) return;
    const matches  = getMatches();
    const now      = new Date();
    const todayStr = now.toISOString().slice(0,10);
    const live = [], today = [];
    matches.forEach(m => {
        const kickoff = new Date(m.isoDate);
        const diffMin = (now - kickoff) / 60000;
        const played  = m.homeScore !== null && m.awayScore !== null;
        if (!played && diffMin >= -5 && diffMin <= 110) live.push({...m, kickoff});
        else if (m.isoDate.slice(0,10) === todayStr)    today.push({...m, kickoff, played});
    });
    const toShow = live.length > 0 ? live : today;
    const isLive = live.length > 0;
    if (toShow.length === 0) { container.innerHTML = `<p class="no-matches">Sin partidos hoy 📅</p>`; return; }

    const makeCard = m => {
        const played    = m.homeScore !== null && m.awayScore !== null;
        const homeElim  = elim.includes(m.home);
        const awayElim  = elim.includes(m.away);
        const homeOwner = participantsData.find(p=>p.teams.includes(m.home))?.name||"";
        const awayOwner = participantsData.find(p=>p.teams.includes(m.away))?.name||"";
        let score;
        if (played) {
            const hw = m.homeScore > m.awayScore, aw = m.awayScore > m.homeScore;
            score = `<div class="td-score-wrap">
                <div class="td-nums"><span class="td-sc ${hw?"win":""}">${m.homeScore}</span><span class="td-sep">-</span><span class="td-sc ${aw?"win":""}">${m.awayScore}</span></div>
                ${m.htHome!==null?`<div class="td-ht">MT ${m.htHome}-${m.htAway}</div>`:""}
                <div class="td-final">Final</div></div>`;
        } else if (isLive) {
            score = `<div class="td-score-wrap"><a class="td-live-link" href="https://www.google.com/search?q=mundial+futbol+2026+en+vivo" target="_blank" rel="noopener"><div class="td-live">🔴 EN VIVO</div></a></div>`;
        } else {
            const hora = m.kickoff.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
            score = `<div class="td-score-wrap"><div class="td-time">${hora}</div></div>`;
        }
        return `<div class="today-card ${isLive&&!played?"today-live":""}">
            <div class="td-team ${homeElim?"elim-team":""}">
                <span class="td-name">${window.getFlag?window.getFlag(m.home):""} ${m.home}</span>
                ${homeOwner?`<span class="td-owner">👤 ${homeOwner}</span>`:""}
            </div>
            ${score}
            <div class="td-team right ${awayElim?"elim-team":""}">
                <span class="td-name">${window.getFlag?window.getFlag(m.away):""} ${m.away}</span>
                ${awayOwner?`<span class="td-owner">👤 ${awayOwner}</span>`:""}
            </div>
        </div>`;
    };
    const heading = isLive
        ? `<div class="today-heading live-heading"><span class="pulse-dot"></span> En vivo ahora</div>`
        : `<div class="today-heading">📅 Partidos de hoy</div>`;
    container.innerHTML = heading + toShow.map(makeCard).join("");
}

// ── Participantes ──────────────────────────────────────────────────────
function renderParticipants(elim) {
    const autoElim  = computeAutoEliminated();
    const container = document.getElementById("participantsContainer");
    container.innerHTML = "";
    participantsData.forEach(player => {
        const alive = player.teams.filter(t=>!elim.includes(t)).length;
        let html = `<div class="participant">
            <h3>${player.name} <span class="${alive>0?"alive":"dead"}">(${alive} vivo${alive!==1?"s":""})</span></h3>`;
        player.teams.forEach(team => {
            const isElim = elim.includes(team);
            const isAuto = autoElim.includes(team);
            const badge  = isAuto ? "🔴" : "";
            const flag   = window.getFlag ? window.getFlag(team) : "";
            html += `<span class="team ${isElim?"eliminated":""}" title="${isAuto?"Eliminado del torneo":""}">
                ${flag} ${badge} ${team}</span>`;
        });
        html += `</div>`;
        container.innerHTML += html;
    });
}

// ── Ranking ────────────────────────────────────────────────────────────
function renderRanking(elim) {
    const medals  = ["🥇","🥈","🥉"];
    const ranking = participantsData
        .map(p=>({name:p.name, alive:p.teams.filter(t=>!elim.includes(t)).length}))
        .sort((a,b)=>b.alive-a.alive);
    document.getElementById("ranking").innerHTML = ranking.map((p,i)=>`
        <div class="ranking-item" style="animation-delay:${i*45}ms">
            <span class="pos">${medals[i]||"#"+(i+1)}</span>
            <span class="name">${p.name}</span>
            <span class="pts">${p.alive} equipo${p.alive!==1?"s":""} vivo${p.alive!==1?"s":""}</span>
        </div>`).join("") +
        `<button class="whatsapp-btn" onclick="shareWhatsApp()">📲 Compartir por WhatsApp</button>`;
}

// ── Calendario ─────────────────────────────────────────────────────────
function renderMatches(elim) {
    const container = document.getElementById("matchesContainer");
    container.innerHTML = "";
    const matches  = getMatches();
    const now      = new Date();
    const todayStr = now.toISOString().slice(0,10);
    const live = [], upcoming = [], past = [];

    matches.forEach(m => {
        const kickoff = new Date(m.isoDate);
        const played  = m.homeScore !== null && m.awayScore !== null;
        const diffMin = (now - kickoff) / 60000;
        const isLive  = !played && diffMin >= -5 && diffMin <= 110;
        if (isLive)        live.push({...m, kickoff});
        else if (!played)  upcoming.push({...m, kickoff});
        else               past.push({...m, kickoff});
    });
    upcoming.sort((a,b) => a.kickoff - b.kickoff);
    past.sort((a,b)     => b.kickoff - a.kickoff);

    const goalStr = goals => goals.length
        ? goals.map(g=>`<span class="goalscorer">⚽ ${g.name}${g.penalty?" (P)":""} ${g.minute}'</span>`).join("") : "";

    function buildCard(m, isLive) {
        const played    = m.homeScore !== null && m.awayScore !== null;
        const homeElim  = elim.includes(m.home);
        const awayElim  = elim.includes(m.away);
        const homeOwner = participantsData.find(p=>p.teams.includes(m.home))?.name||"";
        const awayOwner = participantsData.find(p=>p.teams.includes(m.away))?.name||"";
        const groupTag  = m.group ? `<span class="match-group-tag">Grupo ${m.group}</span>` : "";
        let scoreBlock;
        if (played) {
            const hw = m.homeScore > m.awayScore, aw = m.awayScore > m.homeScore;
            scoreBlock = `<div class="score-box">
                <div class="score-nums"><span class="sc ${hw?"win":""}">${m.homeScore}</span><span class="sc-sep">-</span><span class="sc ${aw?"win":""}">${m.awayScore}</span></div>
                ${m.htHome!==null?`<div class="ht-score">MT ${m.htHome}-${m.htAway}</div>`:""}
                <div class="final-badge">Final</div></div>`;
        } else if (isLive) {
            scoreBlock = `<div class="score-box"><a class="live-link" href="https://www.google.com/search?q=mundial+futbol+2026+en+vivo" target="_blank" rel="noopener"><div class="live-badge">🔴 EN VIVO</div></a></div>`;
        } else {
            const hora   = m.kickoff.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
            const dayTag = m.isoDate.slice(0,10)===todayStr ? `<span class="today-tag">Hoy</span>` : "";
            scoreBlock = `<div class="score-box"><div class="kick-time">${dayTag}${hora}</div></div>`;
        }
        const card = document.createElement("div");
        card.className = `match-card ${played?"played":""} ${isLive?"live-card":""}`;
        card.innerHTML = `${groupTag}
            <div class="match-team ${homeElim?"elim-team":""}">
                <div class="team-name">${window.getFlag?window.getFlag(m.home):""} ${m.home}</div>
                ${homeOwner?`<div class="owner">👤 ${homeOwner}</div>`:""}
                <div class="goals-list">${goalStr(m.goals1||[])}</div>
            </div>
            ${scoreBlock}
            <div class="match-team right ${awayElim?"elim-team":""}">
                <div class="team-name">${window.getFlag?window.getFlag(m.away):""} ${m.away}</div>
                ${awayOwner?`<div class="owner">👤 ${awayOwner}</div>`:""}
                <div class="goals-list">${goalStr(m.goals2||[])}</div>
            </div>`;
        return card;
    }

    function addSection(label, icon, items, isLiveSection=false, collapsible=false) {
        if (items.length === 0) return;
        const header = document.createElement("div");
        header.className = `cal-section-header ${isLiveSection?"cal-live-header":""}`;
        header.innerHTML = `<span>${icon} ${label}</span><span class="cal-count">${items.length} partido${items.length!==1?"s":""}</span>`;
        container.appendChild(header);

        const body = document.createElement("div");
        body.className = "cal-section-body" + (collapsible ? " cal-collapsed" : "");
        if (collapsible) body.id = "past-body";
        container.appendChild(body);

        const byDate = {};
        items.forEach(m => {
            const key = m.isoDate.slice(0,10);
            if (!byDate[key]) byDate[key] = {
                label: m.kickoff.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"}),
                games: []
            };
            byDate[key].games.push(m);
        });

        const sorted = Object.keys(byDate).sort(collapsible ? (a,b)=>b.localeCompare(a) : (a,b)=>a.localeCompare(b));
        sorted.forEach(isoDay => {
            const {label: dayLabel, games} = byDate[isoDay];
            const dateHdr = document.createElement("div");
            dateHdr.className = "date-header";
            dateHdr.textContent = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
            body.appendChild(dateHdr);
            games.forEach(m => body.appendChild(buildCard(m, isLiveSection)));
        });

        if (collapsible) {
            const btn = document.createElement("button");
            btn.className = "cal-expand-btn";
            btn.textContent = "▼ Ver partidos anteriores";
            btn.onclick = () => {
                body.classList.toggle("cal-collapsed");
                btn.textContent = body.classList.contains("cal-collapsed") ? "▼ Ver partidos anteriores" : "▲ Ocultar anteriores";
            };
            container.appendChild(btn);
        }
    }

    addSection("En vivo",   "🔴", live,     true,  false);
    addSection("Próximos",  "📅", upcoming, false, false);
    addSection("Resultados","✅", past,     false, true);
}

// ── Gráfica ────────────────────────────────────────────────────────────
function renderChart(elim) {
    const labels = participantsData.map(p=>p.name);
    const values = participantsData.map(p=>p.teams.filter(t=>!elim.includes(t)).length);
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("probabilityChart"),{
        type:"bar",
        data:{labels,datasets:[{label:"Equipos vivos",data:values,
            backgroundColor:values.map(v=>v===0?"#ef4444":v===1?"#f97316":"#22c55e"),borderRadius:6}]},
        options:{responsive:true,
            plugins:{legend:{labels:{color:"white"}}},
            scales:{x:{ticks:{color:"white"}},y:{ticks:{color:"white",stepSize:1},beginAtZero:true}}}
    });
}

// ── Tabs ───────────────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn=>{
        btn.addEventListener("click",()=>{
            document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));
            document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
            document.getElementById(btn.dataset.tab).classList.add("active");
            btn.classList.add("active");
            if (btn.dataset.tab==="estadisticas") renderChart(getAllEliminated());
            if (btn.dataset.tab==="eliminatoria" && window.renderBracket) {
                window.renderBracket();
                clearInterval(window._bracketTimer);
                window._bracketTimer = setInterval(window.renderBracket, 5*60*1000);
            } else if (btn.dataset.tab !== "eliminatoria") {
                clearInterval(window._bracketTimer);
            }
        });
    });
}

// ── Init ───────────────────────────────────────────────────────────────
initTabs();
renderAll();
fetchLiveScores().then(()=>renderAll());
listenSettings();
setInterval(()=>fetchLiveScores().then(()=>renderAll()), 3*60*1000);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
