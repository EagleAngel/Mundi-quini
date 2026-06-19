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
let liveScores = {};   // enriquecido por la API
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
        data.matches.forEach(m => {
            if (!m.score) return;
            const key = `${es(m.team1)}|${es(m.team2)}`;
            map[key] = {
                homeScore: m.score.ft[0], awayScore: m.score.ft[1],
                htHome: m.score.ht?.[0] ?? null, htAway: m.score.ht?.[1] ?? null,
                goals1: m.goals1 || [], goals2: m.goals2 || [],
            };
        });
        liveScores = map;
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

// ── Eliminados ─────────────────────────────────────────────────────────
function computeAutoEliminated() {
    const stats = {};
    getMatches().forEach(m => {
        if (m.homeScore === null || m.awayScore === null) return;
        [m.home, m.away].forEach(t => { if (!stats[t]) stats[t]={pts:0,played:0,lost:0}; stats[t].played++; });
        if      (m.homeScore > m.awayScore) { stats[m.home].pts+=3; stats[m.away].lost++; }
        else if (m.homeScore < m.awayScore) { stats[m.away].pts+=3; stats[m.home].lost++; }
        else { stats[m.home].pts+=1; stats[m.away].pts+=1; }
    });
    const auto = [];
    Object.entries(stats).forEach(([t,s]) => {
        if (s.played>=3 && s.lost===3)               auto.push(t);
        if (s.played>=2 && s.lost>=2 && s.pts===0)  auto.push(t);
    });
    return [...new Set(auto)];
}
function getAllEliminated() {
    return [...new Set([...computeAutoEliminated(), ...manualEliminated])];
}

// ── Firebase ───────────────────────────────────────────────────────────
function listenSettings() {
    onSnapshot(doc(db, "settings", "tournament"), snap => {
        if (snap.exists()) {
            const d = snap.data();
            manualEliminated = d.manualEliminated || [];
            const sel = document.getElementById("championSelect");
            if (sel && d.champion) sel.value = d.champion;
        }
        renderAll();
    });
}
async function saveSettings() {
    const sel = document.getElementById("championSelect");
    await setDoc(doc(db,"settings","tournament"), {
        champion: sel?.value || "",
        manualEliminated,
    });
}
window.toggleEliminated = function(team) {
    const idx = manualEliminated.indexOf(team);
    if (idx===-1) manualEliminated.push(team); else manualEliminated.splice(idx,1);
    saveSettings();
};

// ── Render principal ───────────────────────────────────────────────────
function renderAll() {
    const elim = getAllEliminated();
    renderSummary(elim);
    renderTodayMatches(elim);   // ← NUEVO: partidos del día en Resumen
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
    const sel   = document.getElementById("championSelect");
    const champ = sel?.value || "";
    const found = champ && participantsData.find(p=>p.teams.includes(champ));
    document.getElementById("winner").textContent = found ? found.name : "-";
}

// ── 🆕 Partidos hoy / en vivo en la pestaña Resumen ───────────────────
function renderTodayMatches(elim) {
    const container = document.getElementById("todayMatches");
    if (!container) return;

    const matches  = getMatches();
    const now      = new Date();
    const todayStr = now.toISOString().slice(0,10);

    const live  = [];
    const today = [];

    matches.forEach(m => {
        const kickoff  = new Date(m.isoDate);
        const dateStr  = m.isoDate.slice(0,10);
        const diffMin  = (now - kickoff) / 60000;
        const played   = m.homeScore !== null && m.awayScore !== null;

        if (!played && diffMin >= -5 && diffMin <= 110) {
            live.push({ ...m, kickoff });
        } else if (dateStr === todayStr) {
            today.push({ ...m, kickoff, played });
        }
    });

    const toShow   = live.length > 0 ? live : today;
    const isLiveSection = live.length > 0;

    if (toShow.length === 0) {
        container.innerHTML = `<p class="no-matches">Sin partidos hoy 📅</p>`;
        return;
    }

    const makeCard = m => {
        const homeElim  = elim.includes(m.home);
        const awayElim  = elim.includes(m.away);
        const homeOwner = participantsData.find(p=>p.teams.includes(m.home))?.name||"";
        const awayOwner = participantsData.find(p=>p.teams.includes(m.away))?.name||"";
        const isLive    = isLiveSection;
        const played    = m.homeScore !== null && m.awayScore !== null;

        let score;
        if (played) {
            const hw = m.homeScore > m.awayScore, aw = m.awayScore > m.homeScore;
            score = `<div class="td-score-wrap">
                        <div class="td-nums">
                            <span class="td-sc ${hw?"win":""}">${m.homeScore}</span>
                            <span class="td-sep">-</span>
                            <span class="td-sc ${aw?"win":""}">${m.awayScore}</span>
                        </div>
                        ${m.htHome!==null?`<div class="td-ht">MT ${m.htHome}-${m.htAway}</div>`:""}
                        <div class="td-final">Final</div>
                     </div>`;
        } else if (isLive) {
            score = `<div class="td-score-wrap"><div class="td-live">🔴 EN VIVO</div></div>`;
        } else {
            const hora = m.kickoff.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
            score = `<div class="td-score-wrap"><div class="td-time">${hora}</div></div>`;
        }

        return `<div class="today-card ${isLive&&!played?"today-live":""}">
            <div class="td-team ${homeElim?"elim-team":""}">
                <span class="td-name">${m.home}</span>
                ${homeOwner?`<span class="td-owner">👤 ${homeOwner}</span>`:""}
            </div>
            ${score}
            <div class="td-team right ${awayElim?"elim-team":""}">
                <span class="td-name">${m.away}</span>
                ${awayOwner?`<span class="td-owner">👤 ${awayOwner}</span>`:""}
            </div>
        </div>`;
    };

    const heading = isLiveSection
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
            const badge  = isAuto?"🔴":manualEliminated.includes(team)?"🟡":"";
            html += `<span class="team ${isElim?"eliminated":""}" onclick="toggleEliminated('${team}')"
                title="${isAuto?"Eliminado por resultados":isElim?"Eliminado manual (clic para restaurar)":"Clic para eliminar"}">
                ${badge} ${team}</span>`;
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
        </div>`).join("");
}

// ── Calendario ─────────────────────────────────────────────────────────
function renderMatches(elim) {
    const container = document.getElementById("matchesContainer");
    container.innerHTML = "";
    const matches = getMatches();
    const now     = new Date();

    const byDate = {};
    matches.forEach(m => {
        const d     = new Date(m.isoDate);
        const label = d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});
        if (!byDate[label]) byDate[label]=[];
        byDate[label].push({...m, kickoff:d});
    });

    Object.entries(byDate).forEach(([dateLabel, games]) => {
        const hdr = document.createElement("h3");
        hdr.className   = "date-header";
        hdr.textContent = dateLabel.charAt(0).toUpperCase()+dateLabel.slice(1);
        container.appendChild(hdr);

        games.forEach(m => {
            const played   = m.homeScore!==null && m.awayScore!==null;
            const diffMin  = (now-m.kickoff)/60000;
            const liveFlag = !played && diffMin>=-5 && diffMin<=110;
            const homeElim  = elim.includes(m.home);
            const awayElim  = elim.includes(m.away);
            const homeOwner = participantsData.find(p=>p.teams.includes(m.home))?.name||"";
            const awayOwner = participantsData.find(p=>p.teams.includes(m.away))?.name||"";
            const goalStr   = goals=>goals.length?goals.map(g=>`<span class="goalscorer">⚽ ${g.name}${g.penalty?" (P)":""} ${g.minute}'</span>`).join(""):"";

            let scoreBlock;
            if (played) {
                const hw=m.homeScore>m.awayScore, aw=m.awayScore>m.homeScore;
                scoreBlock=`<div class="score-box">
                    <div class="score-nums"><span class="sc ${hw?"win":""}">${m.homeScore}</span><span class="sc-sep">-</span><span class="sc ${aw?"win":""}">${m.awayScore}</span></div>
                    ${m.htHome!==null?`<div class="ht-score">MT ${m.htHome}-${m.htAway}</div>`:""}
                    <div class="final-badge">Final</div></div>`;
            } else if (liveFlag) {
                scoreBlock=`<div class="score-box"><div class="live-badge">🔴 EN VIVO</div></div>`;
            } else {
                const hora=m.kickoff.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
                scoreBlock=`<div class="score-box"><div class="kick-time">${hora}</div></div>`;
            }

            const card=document.createElement("div");
            card.className=`match-card ${played?"played":""} ${liveFlag?"live-card":""}`;
            card.innerHTML=`
                <div class="match-team ${homeElim?"elim-team":""}">
                    <div class="team-name">${m.home}</div>
                    ${homeOwner?`<div class="owner">👤 ${homeOwner}</div>`:""}
                    <div class="goals-list">${goalStr(m.goals1||[])}</div>
                </div>
                ${scoreBlock}
                <div class="match-team right ${awayElim?"elim-team":""}">
                    <div class="team-name">${m.away}</div>
                    ${awayOwner?`<div class="owner">👤 ${awayOwner}</div>`:""}
                    <div class="goals-list">${goalStr(m.goals2||[])}</div>
                </div>`;
            container.appendChild(card);
        });
    });
}

// ── Gráfica ────────────────────────────────────────────────────────────
function renderChart(elim) {
    const labels = participantsData.map(p=>p.name);
    const values = participantsData.map(p=>p.teams.filter(t=>!elim.includes(t)).length);
    if (chart) chart.destroy();
    chart=new Chart(document.getElementById("probabilityChart"),{
        type:"bar",
        data:{labels,datasets:[{label:"Equipos vivos",data:values,
            backgroundColor:values.map(v=>v===0?"#ef4444":v===1?"#f97316":"#22c55e"),borderRadius:6}]},
        options:{responsive:true,
            plugins:{legend:{labels:{color:"white"}}},
            scales:{x:{ticks:{color:"white"}},y:{ticks:{color:"white",stepSize:1},beginAtZero:true}}}
    });
}

// ── Campeón ────────────────────────────────────────────────────────────
function initChampionSelect() {
    const sel=document.getElementById("championSelect");
    if (!sel) return;
    [...new Set(participantsData.flatMap(p=>p.teams))].sort().forEach(t=>{
        const opt=document.createElement("option");
        opt.value=opt.textContent=t; sel.appendChild(opt);
    });
    sel.addEventListener("change",saveSettings);
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
        });
    });
}

// ── Init ───────────────────────────────────────────────────────────────
initTabs();
initChampionSelect();
renderAll();
fetchLiveScores().then(()=>renderAll());
listenSettings();
setInterval(()=>fetchLiveScores().then(()=>renderAll()), 3*60*1000);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
