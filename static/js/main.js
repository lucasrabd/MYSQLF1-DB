const API = "http://localhost:5000/api";

/* ── UTILS ──────────────────────────────────────────────── */
async function get(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function post(path, data) {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return r.json();
}
async function put(path, data) {
  const r = await fetch(API + path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  return r.json();
}
async function del(path) {
  const r = await fetch(API + path, { method: "DELETE" });
  return r.json();
}

function toast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove("show"), 3000);
}

function loader(id) {
  document.getElementById(id).innerHTML = `<div class="loader">Carregando dados</div>`;
}

function posBadge(pos) {
  if (!pos) return `<span class="tag">DNF</span>`;
  const cls = pos === 1 ? "pos-1" : pos === 2 ? "pos-2" : pos === 3 ? "pos-3" : "pos-n";
  return `<span class="pos-badge ${cls}">${pos}</span>`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

/* ── DB STATUS CHECK ────────────────────────────────────── */
async function checkDB() {
  const el = document.getElementById("dbStatus");
  try {
    await get("/stats");
    el.querySelector(".dot").className = "dot online";
    el.querySelector(".status-label").textContent = "MySQL OK";
  } catch {
    el.querySelector(".dot").className = "dot offline";
    el.querySelector(".status-label").textContent = "Sem conexão";
  }
}

/* ── NAV ────────────────────────────────────────────────── */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.getElementById(`view-${view}`).classList.add("active");
    loadView(view);
  });
});

const loaded = {};
function loadView(view) {
  if (loaded[view] && view !== "dashboard") return; // cache (except dashboard)
  loaded[view] = true;
  if      (view === "dashboard")     loadDashboard();
  else if (view === "pilotos")       loadPilotos();
  else if (view === "equipes")       loadEquipes();
  else if (view === "corridas")      loadCorridas();
  else if (view === "circuitos")     loadCircuitos();
  else if (view === "classificacao") loadClassificacao();
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */
async function loadDashboard() {
  try {
    const [stats, classP, classC, pitstops] = await Promise.all([
      get("/stats"),
      get("/classificacao/pilotos"),
      get("/classificacao/construtores"),
      get("/pitstops/media"),
    ]);

    // Stats cards
    document.getElementById("statsGrid").innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Corridas</div>
        <div class="stat-value">${stats.total_corridas}</div>
        <div class="stat-sub">temporada 2024</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pilotos</div>
        <div class="stat-value">${stats.total_pilotos}</div>
        <div class="stat-sub">no grid</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Equipes</div>
        <div class="stat-value">${stats.total_equipes}</div>
        <div class="stat-sub">construtores</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pit Stops</div>
        <div class="stat-value">${stats.total_pitstops}</div>
        <div class="stat-sub">registrados</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Líder Pilotos</div>
        <div class="stat-value" style="font-size:1.4rem">${stats.lider_pilotos?.nome || "—"}</div>
        <div class="stat-sub">${stats.lider_pilotos?.pts || 0} pts</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Líder Construtores</div>
        <div class="stat-value" style="font-size:1.4rem">${stats.lider_construtores?.nome || "—"}</div>
        <div class="stat-sub">${stats.lider_construtores?.pts || 0} pts</div>
      </div>
    `;

    // Top pilotos
    document.getElementById("dashPilotosBody").innerHTML = `
      <table class="f1-table">
        <thead><tr><th>P</th><th>Piloto</th><th>Equipe</th><th>Pts</th><th>V</th></tr></thead>
        <tbody>
          ${classP.slice(0,8).map((p,i) => `
            <tr>
              <td>${posBadge(i+1)}</td>
              <td>${p.nome}</td>
              <td style="color:var(--muted);font-size:.8rem">${p.equipe}</td>
              <td><span class="points-pill">${p.total_pontos}</span></td>
              <td style="color:var(--gold)">${p.vitorias}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;

    // Construtores
    document.getElementById("dashEquipesBody").innerHTML = `
      <table class="f1-table">
        <thead><tr><th>P</th><th>Equipe</th><th>Motor</th><th>Pts</th></tr></thead>
        <tbody>
          ${classC.slice(0,6).map((e,i) => `
            <tr>
              <td>${posBadge(i+1)}</td>
              <td>${e.nome}</td>
              <td style="color:var(--muted);font-size:.8rem">${e.motor}</td>
              <td><span class="points-pill">${e.total_pontos}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>`;

    // Pit stops bar chart
    const maxPit = Math.max(...pitstops.map(p => p.media_seg));
    document.getElementById("dashPitstopsBody").innerHTML = `
      <div style="padding:.5rem 0">
        ${pitstops.map(p => `
          <div class="pitstop-bar-row">
            <span class="pitstop-team">${p.equipe}</span>
            <div class="pitstop-bar-outer">
              <div class="pitstop-bar-inner" style="width:${(p.media_seg/maxPit*100).toFixed(1)}%"></div>
            </div>
            <span class="pitstop-val">${p.media_seg}s</span>
          </div>`).join("")}
      </div>`;

  } catch (e) {
    document.getElementById("statsGrid").innerHTML = `<div class="empty">⚠ Não foi possível conectar ao backend Flask. <br>Inicie com <code>python app.py</code> e certifique-se que o MySQL está rodando.</div>`;
  }
}

/* ══════════════════════════════════════════════════════════
   PILOTOS
══════════════════════════════════════════════════════════ */
let pilotosData = [];
let equipesList = [];
let editingPilotoId = null;

async function loadPilotos() {
  loader("pilotosGrid");
  try {
    [pilotosData, equipesList] = await Promise.all([get("/pilotos"), get("/equipes")]);
    renderPilotos();
    // populate select
    const sel = document.getElementById("fEquipe");
    sel.innerHTML = equipesList.map(e => `<option value="${e.id_equipe}">${e.nome}</option>`).join("");
  } catch { document.getElementById("pilotosGrid").innerHTML = `<div class="empty">Erro ao carregar pilotos.</div>`; }
}

function renderPilotos() {
  document.getElementById("pilotosGrid").innerHTML = pilotosData.map(p => `
    <div class="pilot-card" data-id="${p.id_piloto}">
      <div class="pilot-card-top">
        <div>
          <div class="pilot-name">${p.nome}</div>
          <div class="pilot-team">${p.equipe}</div>
        </div>
        <div class="pilot-actions">
          <button class="btn-icon btn-edit" title="Editar" onclick="openEditPiloto(event,${p.id_piloto})">✎</button>
          <button class="btn-icon btn-del" title="Remover" onclick="deletePiloto(event,${p.id_piloto})">✕</button>
        </div>
      </div>
      <div class="pilot-number">${p.numero}</div>
      <div class="pilot-card-bottom">
        <div>
          <span class="pilot-pts">${p.pontos_temporada}</span>
          <span class="pilot-pts-label">PONTOS</span>
        </div>
        <span class="pilot-nat">${p.nacionalidade}</span>
        <span class="tag">#${p.numero}</span>
      </div>
    </div>`).join("");

  document.querySelectorAll(".pilot-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".btn-icon")) return;
      openPilotoDetalhe(parseInt(card.dataset.id));
    });
  });
}

async function openPilotoDetalhe(id) {
  const p = await get(`/pilotos/${id}`);
  document.getElementById("modalPilotoContent").innerHTML = `
    <div style="margin-bottom:1.5rem">
      <div style="font-family:var(--font-head);font-size:.7rem;letter-spacing:3px;color:var(--red);margin-bottom:.25rem">PERFIL DO PILOTO</div>
      <h2 style="font-family:var(--font-head);font-size:2.5rem;font-weight:900">${p.nome}</h2>
      <div style="color:var(--muted);font-size:.85rem;margin-top:.25rem">${p.equipe} · ${p.motor}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
      <div><div style="font-size:.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Número</div><div style="font-family:var(--font-head);font-size:2rem;font-weight:900">#${p.numero}</div></div>
      <div><div style="font-size:.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Pontos</div><div style="font-family:var(--font-head);font-size:2rem;font-weight:900;color:var(--red)">${p.pontos_temporada}</div></div>
      <div><div style="font-size:.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Nac.</div><div style="font-size:.9rem;margin-top:.3rem">${p.nacionalidade}</div></div>
      <div><div style="font-size:.65rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase">Nascimento</div><div style="font-size:.9rem;margin-top:.3rem">${fmtDate(p.data_nascimento)}</div></div>
    </div>
    <div style="font-family:var(--font-head);font-size:.7rem;letter-spacing:3px;color:var(--red);margin-bottom:.75rem">RESULTADOS 2024</div>
    ${p.resultados?.length ? `
    <table class="f1-table">
      <thead><tr><th>Corrida</th><th>Circuito</th><th>País</th><th>Pos</th><th>Pts</th><th>Tempo</th></tr></thead>
      <tbody>${p.resultados.map(r => `
        <tr>
          <td>${r.corrida}</td>
          <td style="color:var(--muted);font-size:.8rem">${r.circuito}</td>
          <td style="color:var(--muted);font-size:.8rem">${r.pais}</td>
          <td>${posBadge(r.posicao)}</td>
          <td>${r.pontos ? `<span class="points-pill">${r.pontos}</span>` : "—"}</td>
          <td style="font-family:var(--font-mono);font-size:.75rem;color:var(--muted)">${r.tempo_total || "—"}${r.volta_rapida ? ' <span class="fast-lap" title="Volta Rápida">⚡</span>' : ""}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : `<div class="empty">Sem resultados registrados.</div>`}
  `;
  document.getElementById("modalPilotoDetalhe").classList.add("open");
}

document.getElementById("closeModalPiloto").onclick = () => document.getElementById("modalPilotoDetalhe").classList.remove("open");
document.getElementById("modalPilotoDetalhe").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove("open"); });

document.getElementById("btnAddPiloto").onclick = () => {
  editingPilotoId = null;
  document.getElementById("formPilotoTitle").textContent = "NOVO PILOTO";
  ["fNome","fNac","fNum","fNasc","fPontos"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("modalPilotoForm").classList.add("open");
};

function openEditPiloto(e, id) {
  e.stopPropagation();
  const p = pilotosData.find(x => x.id_piloto === id);
  if (!p) return;
  editingPilotoId = id;
  document.getElementById("formPilotoTitle").textContent = "EDITAR PILOTO";
  document.getElementById("fNome").value   = p.nome;
  document.getElementById("fNac").value    = p.nacionalidade;
  document.getElementById("fNum").value    = p.numero;
  document.getElementById("fNasc").value   = p.data_nascimento || "";
  document.getElementById("fPontos").value = p.pontos_temporada;
  document.getElementById("fEquipe").value = equipesList.find(eq => eq.nome === p.equipe)?.id_equipe || equipesList[0]?.id_equipe;
  document.getElementById("modalPilotoForm").classList.add("open");
}

document.getElementById("closeModalForm").onclick    = () => document.getElementById("modalPilotoForm").classList.remove("open");
document.getElementById("cancelFormPiloto").onclick  = () => document.getElementById("modalPilotoForm").classList.remove("open");
document.getElementById("modalPilotoForm").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove("open"); });

document.getElementById("saveFormPiloto").onclick = async () => {
  const data = {
    nome: document.getElementById("fNome").value.trim(),
    nacionalidade: document.getElementById("fNac").value.trim(),
    numero: parseInt(document.getElementById("fNum").value),
    data_nascimento: document.getElementById("fNasc").value || null,
    id_equipe: parseInt(document.getElementById("fEquipe").value),
    pontos_temporada: parseInt(document.getElementById("fPontos").value) || 0,
  };
  if (!data.nome || !data.numero) { toast("Preencha nome e número.", "error"); return; }
  try {
    if (editingPilotoId) await put(`/pilotos/${editingPilotoId}`, data);
    else await post("/pilotos", data);
    document.getElementById("modalPilotoForm").classList.remove("open");
    toast(editingPilotoId ? "Piloto atualizado!" : "Piloto adicionado!");
    loaded.pilotos = false;
    loadPilotos();
  } catch { toast("Erro ao salvar.", "error"); }
};

async function deletePiloto(e, id) {
  e.stopPropagation();
  if (!confirm("Remover este piloto?")) return;
  try {
    await del(`/pilotos/${id}`);
    toast("Piloto removido.");
    loaded.pilotos = false;
    loadPilotos();
  } catch { toast("Erro ao remover.", "error"); }
}

/* ══════════════════════════════════════════════════════════
   EQUIPES
══════════════════════════════════════════════════════════ */
async function loadEquipes() {
  loader("equipesList");
  try {
    const equipes = await get("/equipes");
    document.getElementById("equipesList").innerHTML = `
      <div class="equipe-row" style="border-left-color:transparent;padding:.5rem 1.5rem;margin-bottom:.25rem">
        <span style="font-size:.7rem;letter-spacing:2px;color:var(--muted)">EQUIPE</span>
        <span style="font-size:.7rem;letter-spacing:2px;color:var(--muted)">PAÍS</span>
        <span style="font-size:.7rem;letter-spacing:2px;color:var(--muted)">MOTOR</span>
        <span style="font-size:.7rem;letter-spacing:2px;color:var(--muted)">PILOTOS</span>
        <span style="font-size:.7rem;letter-spacing:2px;color:var(--muted)">PONTOS</span>
        <span></span>
      </div>
      ${equipes.map((e,i) => `
        <div class="equipe-row">
          <div>
            <div class="equipe-name">${e.nome}</div>
            <div style="font-size:.7rem;color:var(--muted);margin-top:.1rem">desde ${e.fundacao}</div>
          </div>
          <span class="equipe-meta">${e.pais}</span>
          <span class="equipe-meta">${e.motor}</span>
          <span class="equipe-meta">${e.num_pilotos}</span>
          <span class="equipe-pts">${e.pontos_calculados}</span>
          <span>${posBadge(i+1)}</span>
        </div>`).join("")}`;
  } catch { document.getElementById("equipesList").innerHTML = `<div class="empty">Erro ao carregar equipes.</div>`; }
}

/* ══════════════════════════════════════════════════════════
   CORRIDAS
══════════════════════════════════════════════════════════ */
async function loadCorridas() {
  loader("corridasList");
  try {
    const corridas = await get("/corridas");
    document.getElementById("corridasList").innerHTML = corridas.map((c,i) => `
      <div class="corrida-row" data-id="${c.id_corrida}">
        <div class="corrida-round">${String(i+1).padStart(2,"0")}</div>
        <div>
          <div class="corrida-name">${c.nome}</div>
          <div class="corrida-circuit">${c.circuito} · ${c.cidade}, ${c.pais}</div>
        </div>
        <div>
          <div style="font-size:.8rem;color:var(--muted)">${c.extensao_km} km · ${c.numero_voltas} voltas</div>
        </div>
        <div class="corrida-date">${fmtDate(c.data_corrida)}</div>
        <div><span class="tag">${c.temporada}</span></div>
      </div>`).join("");

    document.querySelectorAll(".corrida-row").forEach(row => {
      row.addEventListener("click", () => openCorridaDetalhe(parseInt(row.dataset.id)));
    });
  } catch { document.getElementById("corridasList").innerHTML = `<div class="empty">Erro ao carregar corridas.</div>`; }
}

async function openCorridaDetalhe(id) {
  document.getElementById("modalCorridaContent").innerHTML = `<div class="loader">Carregando resultado</div>`;
  document.getElementById("modalCorrida").classList.add("open");
  try {
    const c = await get(`/corridas/${id}`);
    document.getElementById("modalCorridaContent").innerHTML = `
      <div style="margin-bottom:1.5rem">
        <div style="font-family:var(--font-head);font-size:.7rem;letter-spacing:3px;color:var(--red);margin-bottom:.25rem">RESULTADO DA CORRIDA</div>
        <h2 style="font-family:var(--font-head);font-size:2.2rem;font-weight:900">${c.nome}</h2>
        <div style="color:var(--muted);font-size:.85rem;margin-top:.25rem">${c.circuito} · ${c.cidade}, ${c.pais} · ${fmtDate(c.data_corrida)}</div>
        <div style="margin-top:.5rem;font-size:.8rem;color:var(--muted)">${c.extensao_km} km por volta · ${c.numero_voltas} voltas</div>
      </div>
      <table class="f1-table">
        <thead>
          <tr><th>Pos</th><th>#</th><th>Piloto</th><th>Equipe</th><th>Pts</th><th>Tempo / Info</th></tr>
        </thead>
        <tbody>
          ${c.resultados.map(r => `
            <tr>
              <td>${posBadge(r.posicao)}</td>
              <td style="font-family:var(--font-mono);color:var(--muted)">${r.numero}</td>
              <td>${r.piloto}</td>
              <td style="color:var(--muted);font-size:.8rem">${r.equipe}</td>
              <td>${r.pontos ? `<span class="points-pill">${r.pontos}</span>` : "—"}</td>
              <td style="font-family:var(--font-mono);font-size:.75rem;color:var(--muted)">
                ${r.abandonou ? `<span class="tag red">DNF</span>` : r.tempo_total || "—"}
                ${r.volta_rapida ? ` <span class="fast-lap" title="Volta Rápida">⚡ VR</span>` : ""}
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  } catch { document.getElementById("modalCorridaContent").innerHTML = `<div class="empty">Erro ao carregar resultado.</div>`; }
}

document.getElementById("closeModalCorrida").onclick = () => document.getElementById("modalCorrida").classList.remove("open");
document.getElementById("modalCorrida").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove("open"); });

/* ══════════════════════════════════════════════════════════
   CIRCUITOS
══════════════════════════════════════════════════════════ */
async function loadCircuitos() {
  loader("circuitosGrid");
  try {
    const circuitos = await get("/circuitos");
    document.getElementById("circuitosGrid").innerHTML = circuitos.map(c => `
      <div class="circuit-card">
        <div class="circuit-name">${c.nome}</div>
        <div class="circuit-loc">${c.cidade} · ${c.pais}</div>
        <div class="circuit-stats">
          <div class="circuit-stat-item"><label>Extensão</label><span>${c.extensao_km} km</span></div>
          <div class="circuit-stat-item"><label>Voltas</label><span>${c.numero_voltas}</span></div>
          <div class="circuit-stat-item"><label>Dist. Total</label><span>${(c.extensao_km * c.numero_voltas).toFixed(2)} km</span></div>
        </div>
      </div>`).join("");
  } catch { document.getElementById("circuitosGrid").innerHTML = `<div class="empty">Erro ao carregar circuitos.</div>`; }
}

/* ══════════════════════════════════════════════════════════
   CLASSIFICAÇÃO
══════════════════════════════════════════════════════════ */
let classTab = "pilotos";

document.querySelectorAll(".class-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".class-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    classTab = tab.dataset.tab;
    renderClassTab();
  });
});

async function loadClassificacao() {
  try {
    window._classP = await get("/classificacao/pilotos");
    window._classC = await get("/classificacao/construtores");
    renderClassTab();
  } catch { document.getElementById("classTabContent").innerHTML = `<div class="empty">Erro ao carregar classificação.</div>`; }
}

function renderClassTab() {
  const el = document.getElementById("classTabContent");
  if (classTab === "pilotos") {
    const data = window._classP || [];
    el.innerHTML = `
      <div class="class-table-wrap">
        <table class="f1-table" style="width:100%">
          <thead><tr><th>Pos</th><th>Piloto</th><th>Nac.</th><th>Equipe</th><th>Pts</th><th>Vitórias</th><th>Pódios</th><th>VR</th></tr></thead>
          <tbody>
            ${data.map((p,i) => `
              <tr>
                <td>${posBadge(i+1)}</td>
                <td style="font-weight:600">${p.nome}</td>
                <td style="color:var(--muted);font-size:.8rem">${p.nacionalidade}</td>
                <td style="color:var(--muted);font-size:.8rem">${p.equipe}</td>
                <td><span class="points-pill">${p.total_pontos}</span></td>
                <td style="color:var(--gold);font-family:var(--font-head);font-weight:700">${p.vitorias}</td>
                <td style="color:var(--muted)">${p.podios}</td>
                <td style="color:#a855f7">${p.voltas_rapidas}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  } else {
    const data = window._classC || [];
    el.innerHTML = `
      <div class="class-table-wrap">
        <table class="f1-table" style="width:100%">
          <thead><tr><th>Pos</th><th>Equipe</th><th>País</th><th>Motor</th><th>Pontos</th><th>Vitórias</th></tr></thead>
          <tbody>
            ${data.map((c,i) => `
              <tr>
                <td>${posBadge(i+1)}</td>
                <td style="font-weight:600">${c.nome}</td>
                <td style="color:var(--muted);font-size:.8rem">${c.pais}</td>
                <td style="color:var(--muted);font-size:.8rem">${c.motor}</td>
                <td><span class="points-pill">${c.total_pontos}</span></td>
                <td style="color:var(--gold);font-family:var(--font-head);font-weight:700">${c.vitorias}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  }
}

/* ── INIT ───────────────────────────────────────────────── */
checkDB();
loadView("dashboard");
setInterval(checkDB, 30000);
