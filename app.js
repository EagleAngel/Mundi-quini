import { db, collection, onSnapshot, doc, setDoc } from "./firebase.js";

// ── URL de la API gratuita (sin API key) ──────────────────────────────
const API_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Mapa de nombres inglés → español (para coincidir con data.js)
const NAME_MAP = {
    "Algeria":             "Argelia",
    "Argentina":           "Argentina",
    "Australia":           "Australia",
    "Austria":             "Austria",
    "Belgium":             "Bélgica",
    "Bosnia & Herzegovina":"Bosnia y Herzegovina",
    "Brazil":              "Brasil",
    "Canada":              "Canadá",
    "Cape Verde":          "Cabo Verde",
    "Colombia":            "Colombia",
    "Croatia":             "Croacia",
    "Curaçao":             "Curazao",
    "Czech Republic":      "Chequia",
    "DR Congo":            "RD del Congo",
    "Ecuador":             "Ecuador",
    "Egypt":               "Egipto",
    "England":             "Inglaterra",
    "France":              "Francia",
    "Germany":             "Alemania",
    "Ghana":               "Ghana",
    "Haiti":               "Haití",
    "Iran":                "Irán",
    "Iraq":                "Irak",
    "Ivory Coast":         "Costa de Marfil",
    "Japan":               "Japón",
    "Jordan":              "Jordania",
    "Mexico":              "México",
    "Morocco":             "Marruecos",
    "Netherlands":         "Países Bajos",
    "New Zealand":         "Nueva Zelanda",
    "Norway":              "Noruega",
    "Panama":              "Panamá",
    "Paraguay":            "Paraguay",
    "Portugal":            "Portugal",
    "Qatar":               "Qatar",
    "Saudi Arabia":        "Arabia Saudita",
    "Scotland":            "Escocia",
    "Senegal":             "Senegal",
    "South Africa":        "Sudáfrica",
    "South Korea":         "Corea del Sur",
    "Spain":               "España",
    "Sweden":              "Suecia",
    "Switzerland":         "Suiza",
    "Tunisia":             "Túnez",
    "Turkey":              "Turquía",
    "USA":                 "Estados Unidos",
    "Uruguay":             "Uruguay",
    "Uzbekistan":          "Uzbekistán",
};
const es = name => NAME_MAP[name] || name;

// ── Estado global ──────────────────────────────────────────────────────
let liveMatches      = [];   // datos frescos de la API
let eliminatedTeams  = [];   // calculados automáticamente
let manualEliminated = [];   // marcados manualmente
let firestoreChampion= "";
let chart;
let lastFetch        = 0;
const CACHE_MS       = 3 * 60 * 1000; // refresca cada 3 min

// ── Fetch API ──────────────────────────────────────────────────────────
async function fetchMatches() {
    const now = Date.now();
    if (now - lastFetch < CACHE_MS && liveMatches.length > 0) return; // usar cache

    showStatus("⏳ Actualizando marcadores...");
    try {
        const res  = await fetch(API_URL + "?t=" + now); // cache-bust
        const data = await res.json();

        liveMatches = data.matches.map(m => ({
            date:      m.date,
            time:      m.time || "",
            home:      es(m.team1),
            away:      es(m.team2),
            homeScore: m.score ? m.score.ft[0] : null,
            awayScore: m.score ? m.score.ft[1] : null,
            htHome:    m.score?.ht ? m.score.ht[0] : null,
            htAway:    m.score?.ht ? m.score.ht[1] : null,
            goals1:    m.goals1 || [],
            goals2:    m.goals2 || [],
            group:     m.group  || "",
            ground:    m.ground || "",
            round:     m.round  || "",
        }));

        lastFetch = now;
        showStatus("✅ Actualizado: " + new Date().toLocaleTimeString("es-MX"));
    } catch (e) {
        showStatus("⚠️ Sin conexión — usando datos en caché");
    }
}

function showStatus(msg) {
    const el = document.getElementById("apiStatus");
    if (el) el.textContent = msg;
}

// ── Eliminación automática ─────────────────────────────────────────────
function computeAutoEliminated() {
    const stats = {};
    liveMatches.forEach(m => {
        if (m.homeScore === null) return;
        [m.home, m.away].forEach(t => {
            if (!stats[t]) stats[t] = { pts: 0, played: 0, lost: 0 };
            stats[t].played++;
        });
        if (m.homeScore > m.awayScore)      { stats[m.home].pts += 3; stats[m.away].lost++; }
        else if (m.homeScore < m.awayScore) { stats[m.away].pts += 3; stats[m.home].lost++; }
        else                                { stats[m.home].pts += 1; stats[m.away].pts += 1; }
    });

    const auto = [];
    Object.entries(stats).forEach(([team, s]) => {
        // Perdió los 3 partidos de grupo
        if (s.played >= 3 && s.lost >= 3) auto.push(team);
        // Perdió 2 con 0 puntos → matemáticamente eliminado
        if (s.played >= 2 && s.lost >= 2 && s.pts === 0) auto.push(team);
    });
    return [...new Set(auto)];
}

function updateEliminated() {
    const auto = computeAutoEliminated();
    eliminatedTeams = [...new Set([...auto, ...manualEliminated])];
}

// ── Firebase ───────────────────────────────────────────────────────────
function listenSettings() {
    onSnapshot(doc(db, "settings", "tournament"), snap => {
        if (snap.exists()) {
            const d = snap.data();
            manualEliminated   = d.manualEliminated || [];
            firestoreChampion  = d.champion || "";
            const sel = document.getElementById("championSelect");
            if (sel) sel.value = firestoreChampion;
        }
        updateEliminated();
        renderAll();
    });
}

async function saveSettings() {
    const sel = document.getElementById("championSelect");
    await setDoc(doc(db, "settings", "tournament"), {
        champion:         sel ? sel.value : "",
        manualEliminated: manualEliminated,
    });
}

// ── Toggle manual ──────────────────────────────────────────────────────
window.toggleEliminated = function(team) {
    const idx = manualEliminated.indexOf(team);
    if (idx === -1) manualEliminated.push(team);
    else            manualEliminated.splice(idx, 1);
    saveSettings();
};

// ── Render ─────────────────────────────────────────────────────────────
function renderAll() {
    renderSummary();
    renderParticipants();
    renderRanking();
    renderMatches();
    // Solo re-dibuja gráfica si está visible
    if (document.getElementById("estadisticas").classList.contains("active")) renderChart();
}

function renderSummary() {
    const allTeams = [...new Set(participantsData.flatMap(p => p.teams))];
    document.getElementById("totalPlayers").textContent    = participantsData.length;
    document.getElementById("aliveTeamsCount").textContent = allTeams.length - eliminatedTeams.length;

    const sel   = document.getElementById("championSelect");
    const champ = sel ? sel.value : "";
    let winner  = "-";
    if (champ) {
        const found = participantsData.find(p => p.teams.includes(champ));
        if (found) winner = found.name;
    }
    document.getElementById("winner").textContent = winner;
}

function renderParticipants() {
    const autoElim = computeAutoEliminated();
    const container = document.getElementById("participantsContainer");
    container.innerHTML = "";
    participantsData.forEach(player => {
        const aliveCount  = player.teams.filter(t => !eliminatedTeams.includes(t)).length;
        const statusClass = aliveCount > 0 ? "alive" : "dead";
        let html = `<div class="participant">
            <h3>${player.name} <span class="${statusClass}">(${aliveCount} vivo${aliveCount !== 1 ? "s" : ""})</span></h3>`;
        player.teams.forEach(team => {
            const elim   = eliminatedTeams.includes(team);
            const isAuto = autoElim.includes(team);
            const badge  = isAuto ? "🔴" : manualEliminated.includes(team) ? "🟡" : "";
            const title  = isAuto
                ? "Eliminado automáticamente del torneo"
                : manualEliminated.includes(team)
                ? "Eliminado manualmente — clic para restaurar"
                : "Clic para marcar como eliminado";
            html += `<span class="team ${elim ? "eliminated" : ""}" onclick="toggleEliminated('${team}')" title="${title}">
                        ${badge} ${team}
                     </span>`;
        });
        html += `</div>`;
        container.innerHTML += html;
    });
}

function renderRanking() {
    const ranking = participantsData.map(p => ({
        name:  p.name,
        alive: p.teams.filter(t => !eliminatedTeams.includes(t)).length,
    })).sort((a, b) => b.alive - a.alive);

    const medals = ["🥇", "🥈", "🥉"];
    document.getElementById("ranking").innerHTML = ranking.map((p, i) => `
        <div class="ranking-item" style="animation-delay:${i * 45}ms">
            <span class="pos">${medals[i] || "#" + (i + 1)}</span>
            <span class="name">${p.name}</span>
            <span class="pts">${p.alive} equipo${p.alive !== 1 ? "s" : ""} vivo${p.alive !== 1 ? "s" : ""}</span>
        </div>`).join("");
}

// ── Calendario con marcadores en vivo ─────────────────────────────────
function renderMatches() {
    const container = document.getElementById("matchesContainer");
    container.innerHTML = "";

    // Agrupar por fecha
    const byDate = {};
    liveMatches.forEach(m => {
        const d = new Date(m.date + "T12:00:00"); // evitar desfase de timezone
        const label = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
        if (!byDate[label]) byDate[label] = [];
        byDate[label].push(m);
    });

    const now = new Date();

    Object.entries(byDate).forEach(([dateLabel, games]) => {
        const header = document.createElement("h3");
        header.className   = "date-header";
        header.textContent = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
        container.appendChild(header);

        games.forEach(m => {
            const homeElim  = eliminatedTeams.includes(m.home);
            const awayElim  = eliminatedTeams.includes(m.away);
            const played    = m.homeScore !== null && m.awayScore !== null;

            // Detectar EN VIVO (±110 min de la hora del partido)
            let liveFlag = false;
            if (!played && m.time) {
                try {
                    const offset   = parseInt(m.time.split("UTC")[1]) || -6;
                    const timeStr  = m.time.split(" ")[0];
                    const [hh, mm] = timeStr.split(":").map(Number);
                    const kickoff  = new Date(m.date);
                    kickoff.setHours(hh - offset, mm, 0, 0);
                    const diff = (now - kickoff) / 60000;
                    liveFlag = diff >= -5 && diff <= 110;
                } catch {}
            }

            const homeOwner = participantsData.find(p => p.teams.includes(m.home))?.name || "";
            const awayOwner = participantsData.find(p => p.teams.includes(m.away))?.name || "";

            // Goleadores
            const goalStr = (goals, side) =>
                goals.length ? goals.map(g =>
                    `<span class="goalscorer">${side === "home" ? "" : ""}⚽ ${g.name}${g.penalty ? " (P)" : ""} ${g.minute}'</span>`
                ).join("") : "";

            let scoreBlock;
            if (played) {
                const hw = m.homeScore > m.awayScore;
                const aw = m.awayScore > m.homeScore;
                scoreBlock = `
                    <div class="score-box">
                        <div class="score-nums">
                            <span class="sc ${hw ? "win" : ""}">${m.homeScore}</span>
                            <span class="sc-sep">-</span>
                            <span class="sc ${aw ? "win" : ""}">${m.awayScore}</span>
                        </div>
                        ${m.htHome !== null ? `<div class="ht-score">MT: ${m.htHome}-${m.htAway}</div>` : ""}
                        <div class="final-badge">Final</div>
                    </div>`;
            } else if (liveFlag) {
                scoreBlock = `<div class="score-box"><div class="live-badge">🔴 EN VIVO</div></div>`;
            } else {
                const hora = m.time ? m.time.split(" ")[0] : "";
                scoreBlock = `<div class="score-box"><div class="kick-time">${hora}<br><span style="font-size:.7rem;opacity:.5">${m.ground}</span></div></div>`;
            }

            const card = document.createElement("div");
            card.className = `match-card ${played ? "played" : ""} ${liveFlag ? "live-card" : ""}`;
            card.innerHTML = `
                <div class="match-team ${homeElim ? "elim-team" : ""}">
                    <div class="team-name">${m.home}</div>
                    ${homeOwner ? `<div class="owner">👤 ${homeOwner}</div>` : ""}
                    <div class="goals-list">${goalStr(m.goals1, "home")}</div>
                </div>
                ${scoreBlock}
                <div class="match-team right ${awayElim ? "elim-team" : ""}">
                    <div class="team-name">${m.away}</div>
                    ${awayOwner ? `<div class="owner">👤 ${awayOwner}</div>` : ""}
                    <div class="goals-list">${goalStr(m.goals2, "away")}</div>
                </div>`;
            container.appendChild(card);
        });
    });
}

// ── Gráfica ────────────────────────────────────────────────────────────
function renderChart() {
    const labels = participantsData.map(p => p.name);
    const values = participantsData.map(p =>
        p.teams.filter(t => !eliminatedTeams.includes(t)).length
    );
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("probabilityChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Equipos vivos",
                data: values,
                backgroundColor: values.map(v => v === 0 ? "#ef4444" : v === 1 ? "#f97316" : "#22c55e"),
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "white" } } },
            scales: {
                x: { ticks: { color: "white" } },
                y: { ticks: { color: "white", stepSize: 1 }, beginAtZero: true }
            }
        }
    });
}

// ── Selector campeón ───────────────────────────────────────────────────
function initChampionSelect() {
    const sel = document.getElementById("championSelect");
    if (!sel) return;
    const allTeams = [...new Set(participantsData.flatMap(p => p.teams))].sort();
    allTeams.forEach(t => {
        const opt = document.createElement("option");
        opt.value = opt.textContent = t;
        sel.appendChild(opt);
    });
    sel.addEventListener("change", saveSettings);
}

// ── Tabs ───────────────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.getElementById(btn.dataset.tab).classList.add("active");
            btn.classList.add("active");
            if (btn.dataset.tab === "estadisticas") renderChart();
        });
    });
}

// ── Auto-refresh cada 3 min ────────────────────────────────────────────
async function refresh() {
    await fetchMatches();
    updateEliminated();
    renderAll();
}

setInterval(refresh, CACHE_MS);

// ── Init ───────────────────────────────────────────────────────────────
initTabs();
initChampionSelect();
await fetchMatches();        // primer carga de la API
listenSettings();            // escuchar Firebase (llama renderAll internamente)

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
