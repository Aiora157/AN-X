/* ======================================================
   DASHBOARD — Sub-abas + Infográfico + Comparativo
   ====================================================== */

let modoEventos = 'top3'; 
let modoGarcons = 'top3';
let customEventos = [];
let customGarcons = [];

let dadosDashboard = { eventos: [], garcons: [] };
let subAbaDashboard = 'eventos';

async function carregarDashboard() {
  const { data: eventos } = await db.from('eventos').select('*');
  const { data: escalas } = await db.from('escalas').select('*, garcons(nome)');

  // Processar Eventos
  const countEventos = {};
  (eventos || []).forEach(ev => {
    const nome = ev.nome.trim();
    countEventos[nome] = (countEventos[nome] || 0) + 1;
  });
  dadosDashboard.eventos = Object.entries(countEventos)
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  // Processar Garçons
  const countGarcons = {};
  (escalas || []).forEach(s => {
    const nome = s.garcons?.nome || 'Desconhecido';
    countGarcons[nome] = (countGarcons[nome] || 0) + 1;
  });
  dadosDashboard.garcons = Object.entries(countGarcons)
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  renderizarDashboard();
}

function mudarSubDashboard(sub, el) {
  subAbaDashboard = sub;
  const container = el.parentElement;
  container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  document.getElementById('dash-sub-eventos').classList.remove('active');
  document.getElementById('dash-sub-garcons').classList.remove('active');

  if (sub === 'eventos') {
    document.getElementById('dash-sub-eventos').classList.add('active');
  } else {
    document.getElementById('dash-sub-garcons').classList.add('active');
  }
  renderizarDashboard();
}

function mudarLimiteDashboard(tipo, limite, el) {
  if (tipo === 'eventos') modoEventos = 'top' + limite;
  if (tipo === 'garcons') modoGarcons = 'top' + limite;

  const container = el.parentElement;
  container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  renderizarDashboard();
}

/* ======================================================
   MODAL DE COMPARATIVO
   ====================================================== */
function abrirModalComparativo(tipo, el) {
  document.body.classList.add('modal-open'); // Bloqueia rolagem
  const dados = tipo === 'eventos' ? dadosDashboard.eventos : dadosDashboard.garcons;
  const selecionadosAtuais = tipo === 'eventos' ? customEventos : customGarcons;

  if (dados.length === 0) {
    return alert('Nenhum dado registrado para comparar.');
  }

  const titulo = tipo === 'eventos' ? 'Comparar Eventos' : 'Comparar Garçons';

  const checklistHTML = dados.map(item => {
    const isChecked = selecionadosAtuais.includes(item.nome) ? 'checked' : '';
    return `
      <label class="check-item">
        <input type="checkbox" value="${item.nome}" ${isChecked}>
        <span>${item.nome} (${item.qtd})</span>
      </label>
    `;
  }).join('');

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal">
        <h3>${titulo}</h3>
        <p class="muted" style="margin-bottom:16px;">Selecione quem você deseja comparar:</p>
        <div class="check-list">
          ${checklistHTML}
        </div>
        <div class="actions">
          <button type="button" class="btn secondary" onclick="fecharModal()" style="flex:1;">Cancelar</button>
          <button type="button" class="btn primary" onclick="confirmarComparativo('${tipo}', this)" style="flex:2;">Aplicar Comparação</button>
        </div>
      </div>
    </div>
  `;
}

function confirmarComparativo(tipo, btnConfirmar) {
  const modal = btnConfirmar.closest('.modal');
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
  const selecionados = Array.from(checkboxes).map(cb => cb.value);

  if (tipo === 'eventos') {
    customEventos = selecionados;
    modoEventos = 'custom';
  } else {
    customGarcons = selecionados;
    modoGarcons = 'custom';
  }

  // Atualiza a classe visual dos chips
  const subAbaId = tipo === 'eventos' ? 'dash-sub-eventos' : 'dash-sub-garcons';
  const containerChips = document.getElementById(subAbaId);
  containerChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  
  // Encontra o chip "Comparativo" e ativa ele
  const chips = containerChips.querySelectorAll('.chip');
  chips[chips.length - 1].classList.add('active');

  fecharModal();
  renderizarDashboard();
}

/* ======================================================
   RENDERIZAÇÃO DOS GRÁFICOS
   ====================================================== */
function renderizarDashboard() {
  if (subAbaDashboard === 'eventos') {
    renderizarInfografico(dadosDashboard.eventos, modoEventos, customEventos, 'infografico-eventos');
  } else {
    renderizarInfografico(dadosDashboard.garcons, modoGarcons, customGarcons, 'infografico-garcons');
  }
}

function renderizarInfografico(dados, modo, customList, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let dadosFiltrados = [];

  if (modo === 'custom') {
    // Filtra mantendo a ordem original de quantidade (maior para menor)
    dadosFiltrados = dados.filter(d => customList.includes(d.nome));
  } else {
    const limite = parseInt(modo.replace('top', ''));
    dadosFiltrados = dados.slice(0, limite);
  }

  // Se estiver vazio (por exemplo, desmarcou tudo), limpa o container
  if (dadosFiltrados.length === 0) {
    container.innerHTML = ''; 
    return;
  }

  const maxQtd = Math.max(...dadosFiltrados.map(d => d.qtd));

  container.innerHTML = dadosFiltrados.map((d, index) => {
    const num = index + 1;
    
    let altura = 280;
    if (maxQtd > 1) {
      const proporcao = d.qtd / maxQtd;
      altura = 240 + (proporcao * 140); 
    }

    const margemTopo = index * 18;

    return `
      <div class="info-card" style="height: ${altura}px; margin-top: ${margemTopo}px;">
        <div class="info-card-number">${num}</div>
        <div class="info-card-content">
          <h3 class="info-card-title">${d.nome}</h3>
          <p class="info-card-subtitle">${d.qtd} evento${d.qtd > 1 ? 's' : ''}</p>
        </div>
      </div>
    `;
  }).join('');
}