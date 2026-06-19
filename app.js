import { db, collection, onSnapshot, doc, setDoc } from "./firebase.js";

// ── Estado global ──────────────────────────────────────────────────────
let eliminatedTeams   = [];
let manualEliminated  = [];   // eliminados manualmente por admin
let firestoreChampion = "";
let chart;

// ── Calcular eliminados automáticamente del calendario ─────────────────
function computeAutoEliminated() {
    // Un equipo queda eliminado si:
    //   - Ya jugó sus 3 partidos de grupo Y no clasifica
    //   (simplificado: perdió 2 partidos → no puede clasificar)
    // Para la quiniela de supervivencia usamos la lógica más sencilla:
    //   perdió ≥ 2 partidos = eliminado automático
    const stats = {};
    allMatches.forEach(m => {
        if (m.homeScore === null) return;   // no jugado
        [m.home, m.away].forEach(t => {
            if (!stats[t]) stats[t] = { pts: 0, played: 0, lost: 0 };
            stats[t].played++;
        });
        if (m.homeScore > m.awayScore) {
            stats[m.home].pts  += 3; stats[m.away].lost++;
        } else if (m.homeScore < m.awayScore) {
            stats[m.away].pts  += 3; stats[m.home].lost++;
        } else {
            stats[m.home].pts  += 1; stats[m.away].pts += 1;
        }
    });

    const autoElim = [];
    // Equipos que matemáticamente no pueden clasificar (lost >= 2 con 0 pts, o perdieron los 3)
    Object.entries(stats).forEach(([team, s]) => {
        // Perdió los 3 partidos → eliminado
        if (s.played === 3 && s.lost === 3) autoElim.push(team);
        // Perdió 2 con 0 puntos y ya jugó al menos 2 → no puede llegar a 6 pts para clasificar
        if (s.played >= 2 && s.lost >= 2 && s.pts === 0) autoElim.push(team);
    });
    return [...new Set(autoElim)];
}

// ── Merge: auto + manual ───────────────────────────────────────────────
function updateEliminatedList() {
    const auto = computeAutoEliminated();
    eliminatedTeams = [...new Set([...auto, ...manualEliminated])];
}

// ── Firebase ───────────────────────────────────────────────────────────
function listenSettings() {
    onSnapshot(doc(db, "settings", "tournament"), snap => {
        if (snap.exists()) {
            const d = snap.data();
            manualEliminated  = d.manualEliminated || [];
            firestoreChampion = d.champion || "";
            const sel = document.getElementById("championSelect");
            if (sel) sel.value = firestoreChampion;
        }
        updateEliminatedList();
        renderAll();
    });
}

async function saveSettings() {
    const sel = document.getElementById("championSelect");
    await setDoc(doc(db, "settings", "tournament"), {
        champion:        sel ? sel.value : "",
        manualEliminated: manualEliminated
    });
}

// ── Toggle manual (admin) ──────────────────────────────────────────────
window.toggleEliminated = function(team) {
    const idx = manualEliminated.indexOf(team);
    if (idx === -1) manualEliminated.push(team);
    else            manualEliminated.splice(idx, 1);
    saveSettings();
};

// ── Render completo ────────────────────────────────────────────────────
function renderAll() {
    renderSummary();
    renderParticipants();
    renderRanking();
    renderMatches();
    renderChart();
}

function renderSummary() {
    const allTeams = [...new Set(participantsData.flatMap(p => p.teams))];
    document.getElementById("totalPlayers").textContent    = participantsData.length;
    document.getElementById("aliveTeamsCount").textContent = allTeams.length - eliminatedTeams.length;

    const sel     = document.getElementById("championSelect");
    const champ   = sel ? sel.value : "";
    let winner    = "-";
    if (champ) {
        const found = participantsData.find(p => p.teams.includes(champ));
        if (found) winner = found.name;
    }
    document.getElementById("winner").textContent = winner;
}

function renderParticipants() {
    const container = document.getElementById("participantsContainer");
    container.innerHTML = "";
    participantsData.forEach(player => {
        const aliveCount = player.teams.filter(t => !eliminatedTeams.includes(t)).length;
        const statusClass = aliveCount > 0 ? "alive" : "dead";
        let html = `<div class="participant">
            <h3>${player.name} <span class="${statusClass}">(${aliveCount} vivos)</span></h3>`;
        player.teams.forEach(team => {
            const elim = eliminatedTeams.includes(team);
            const isAuto = computeAutoEliminated().includes(team);
            const badge  = isAuto ? "🔴" : elim ? "🟡" : "";
            html += `<span class="team ${elim ? "eliminated" : ""}"
                          onclick="toggleEliminated('${team}')"
                          title="${isAuto ? "Eliminado automáticamente" : elim ? "Eliminado manualmente (clic para restaurar)" : "Clic para eliminar manualmente"}">
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
        alive: p.teams.filter(t => !eliminatedTeams.includes(t)).length
    })).sort((a, b) => b.alive - a.alive);

    document.getElementById("ranking").innerHTML = ranking.map((p, i) => `
        <div class="ranking-item" style="animation-delay:${i * 50}ms">
            <span class="pos">#${i + 1}</span>
            <span class="name">${p.name}</span>
            <span class="pts">${p.alive} equipo${p.alive !== 1 ? "s" : ""} vivo${p.alive !== 1 ? "s" : ""}</span>
        </div>`).join("");
}

// ── Calendario con marcadores ──────────────────────────────────────────
function renderMatches() {
    const container = document.getElementById("matchesContainer");
    container.innerHTML = "";

    // Agrupar por fecha (día)
    const byDate = {};
    allMatches.forEach(m => {
        const d = new Date(m.isoDate);
        const label = d.toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" });
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
            const homeElim = eliminatedTeams.includes(m.home);
            const awayElim = eliminatedTeams.includes(m.away);
            const matchDate = new Date(m.isoDate);
            const played    = m.homeScore !== null && m.awayScore !== null;
            const live      = !played && Math.abs(now - matchDate) < 110 * 60 * 1000; // ±110 min

            // Quién tiene ese equipo
            const homeOwner = participantsData.find(p => p.teams.includes(m.home))?.name || "";
            const awayOwner = participantsData.find(p => p.teams.includes(m.away))?.name || "";

            let scoreHtml;
            if (played) {
                const homeWin = m.homeScore > m.awayScore;
                const awayWin = m.awayScore > m.homeScore;
                scoreHtml = `<span class="score ${homeWin?"win":""}>${m.homeScore}</span>
                             <span class="score-sep">-</span>
                             <span class="score ${awayWin?"win":""}>${m.awayScore}</span>`;
            } else if (live) {
                const hora = matchDate.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
                scoreHtml = `<span class="live-badge">🔴 EN VIVO · ${hora}</span>`;
            } else {
                const hora = matchDate.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
                scoreHtml = `<span class="kick-time">${hora}</span>`;
            }

            const card = document.createElement("div");
            card.className = `match-card ${played?"played":""} ${live?"live-card":""}`;
            card.innerHTML = `
                <div class="match-team ${homeElim?"elim-team":""}">
                    <span class="team-name">${m.home}</span>
                    ${homeOwner ? `<span class="owner">${homeOwner}</span>` : ""}
                </div>
                <div class="match-score">${scoreHtml}</div>
                <div class="match-team right ${awayElim?"elim-team":""}">
                    <span class="team-name">${m.away}</span>
                    ${awayOwner ? `<span class="owner">${awayOwner}</span>` : ""}
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
            datasets:[{
                label: "Equipos vivos",
                data: values,
                backgroundColor: values.map(v => v===0?"#ef4444":v===1?"#f97316":"#22c55e")
            }]
        },
        options:{
            responsive:true,
            plugins:{ legend:{ labels:{ color:"white" } } },
            scales:{
                x:{ ticks:{ color:"white" } },
                y:{ ticks:{ color:"white", stepSize:1 }, beginAtZero:true }
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

// ── Auto-refresh cada 5 min (para marcadores en vivo) ─────────────────
setInterval(() => {
    // Aquí podrías hacer fetch a una API de marcadores real.
    // Por ahora solo re-renderiza (para actualizar el badge "EN VIVO")
    renderMatches();
}, 5 * 60 * 1000);

// ── Init ───────────────────────────────────────────────────────────────
initTabs();
initChampionSelect();
listenSettings();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
