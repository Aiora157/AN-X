/* ======================================================
   HISTÓRICO — visões Evento e Garçom + filtros dinâmicos
   ====================================================== */

let subHistorico = 'evento';
let periodoHistorico = 'mes';
let buscaHistorico = '';

// Variáveis de Filtro
let filtroData = hoje(); // Guarda o domingo da semana selecionada
let filtroMes = new Date().getMonth();
let filtroAno = new Date().getFullYear();
let filtroTipo = 'todos';

function mudarSubHistorico(sub, el) {
  subHistorico = sub;
  document.querySelectorAll('.chips-sub .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  
  const inputBusca = $('busca-historico');
  if (inputBusca) {
    inputBusca.value = '';
    buscaHistorico = '';
    inputBusca.placeholder = sub === 'evento' ? 'Buscar evento...' : 'Buscar garçom...';
  }

  carregarHistorico();
}

function mudarPeriodo(per, el) {
  periodoHistorico = per;
  document.querySelectorAll('.chips-periodo .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  
  // Reseta os filtros ao trocar de período
  filtroData = hoje();
  filtroMes = new Date().getMonth();
  filtroAno = new Date().getFullYear();
  filtroTipo = 'todos';
  
  carregarHistorico();
}

function atualizarBuscaHistorico(valor) {
  buscaHistorico = String(valor || '').toLowerCase().trim();
  carregarHistorico();
}

/* ======================================================
   CUSTOM DROPDOWN (Filtros de Tipo)
   ====================================================== */
function toggleCustomSelectFiltro(e) {
  if (e) e.stopPropagation();
  const options = document.getElementById('custom-options-filtro');
  if (options) {
    options.classList.toggle('show');
  }
}

function escolherTipoFiltro(valor, label) {
  document.getElementById('filtro-tipo').value = valor;
  
  const htmlLabel = valor === 'todos' 
    ? `<span class="custom-select-placeholder">Todos os tipos</span>` 
    : `<span class="badge ${tipoClasse(valor)}">${label}</span>`;
    
  document.getElementById('filtro-tipo-label').innerHTML = htmlLabel;
  document.getElementById('custom-options-filtro').classList.remove('show');
}

document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.custom-select-wrapper-filtro');
  if (wrapper && !wrapper.contains(e.target)) {
    const options = document.getElementById('custom-options-filtro');
    if (options) options.classList.remove('show');
  }
});

/* ======================================================
   LÓGICA DE SEMANAS DO MÊS
   ====================================================== */
function obterSemanasDoMes(mes, ano) {
  const semanas = [];
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  
  // Pega o domingo que inicia a semana do primeiro dia do mês
  let d = startOfWeek(primeiroDia);

  while (d <= ultimoDia) {
    const ini = new Date(d);
    const fim = addDays(ini, 6);
    const valor = isoDate(ini);
    const label = `Semana de ${fmtDataCurta(valor)} a ${fmtDataCurta(isoDate(fim))}`;
    semanas.push({ valor, label });
    d = addDays(d, 7);
  }
  return semanas;
}

function atualizarSemanasNoFiltro() {
  const mes = parseInt($('filtro-semana-mes').value);
  const ano = parseInt($('filtro-semana-ano').value);
  const semanas = obterSemanasDoMes(mes, ano);
  
  const selectSemana = $('filtro-data-semana');
  const valorAtual = selectSemana.value;
  
  selectSemana.innerHTML = semanas.map(s => `<option value="${s.valor}">${s.label}</option>`).join('');
  
  // Tenta manter a semana selecionada se ela ainda existir no novo mês
  if (semanas.some(s => s.valor === valorAtual)) {
    selectSemana.value = valorAtual;
  }
}

/* ======================================================
   MODAL DE FILTROS
   ====================================================== */
function abrirModalFiltros() {
  document.body.classList.add('modal-open');
  const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const anos = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  
  let htmlTempo = '';
  
  if (periodoHistorico === 'semana') {
    // Descobre o mês e ano atual baseado na data do filtro
    const dFiltro = new Date(filtroData + 'T00:00:00');
    const mesAtual = dFiltro.getMonth();
    const anoAtual = dFiltro.getFullYear();
    
    // Gera as semanas com base no mês/ano atual
    const semanas = obterSemanasDoMes(mesAtual, anoAtual);
    const temSemana = semanas.some(s => s.valor === filtroData);
    if (!temSemana && semanas.length > 0) filtroData = semanas[0].valor;

    htmlTempo = `
      <div class="row">
        <div class="field">
          <label>Mês</label>
          <div class="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <select id="filtro-semana-mes" style="padding-left: 44px;" onchange="atualizarSemanasNoFiltro()">
              ${mesesNomes.map((m, i) => `<option value="${i}" ${i === mesAtual ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Ano</label>
          <div class="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <select id="filtro-semana-ano" style="padding-left: 44px;" onchange="atualizarSemanasNoFiltro()">
              ${anos.map(a => `<option value="${a}" ${a === anoAtual ? 'selected' : ''}>${a}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label>Semana</label>
        <div class="input-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <select id="filtro-data-semana" style="padding-left: 44px;">
            ${semanas.map(s => `<option value="${s.valor}" ${s.valor === filtroData ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  } else if (periodoHistorico === 'mes') {
    htmlTempo = `
      <div class="row">
        <div class="field">
          <label>Mês</label>
          <div class="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <select id="filtro-mes" style="padding-left: 44px;">
              ${mesesNomes.map((m, i) => `<option value="${i}" ${i==filtroMes?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Ano</label>
          <div class="input-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <select id="filtro-ano" style="padding-left: 44px;">
              ${anos.map(a => `<option value="${a}" ${a==filtroAno?'selected':''}>${a}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    `;
  } else if (periodoHistorico === 'ano') {
    htmlTempo = `
      <div class="field">
        <label>Ano</label>
        <div class="input-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <select id="filtro-ano" style="padding-left: 44px;">
            ${anos.map(a => `<option value="${a}" ${a==filtroAno?'selected':''}>${a}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
  }
  
  let htmlTipo = '';
  if (subHistorico === 'evento') {
    const labelTipo = filtroTipo === 'todos' 
      ? `<span class="custom-select-placeholder">Todos os tipos</span>` 
      : `<span class="badge ${tipoClasse(filtroTipo)}">${filtroTipo}</span>`;

    const tiposHTMLFiltro = ['Todos os tipos', ...TIPOS_EVENTO].map(t => {
      const isTodos = t === 'Todos os tipos';
      const val = isTodos ? 'todos' : t;
      const badgeClass = isTodos ? '' : tipoClasse(t);
      const badgeStyle = isTodos ? 'style="background:var(--bg-hover); color:var(--text); border-color:var(--border);"' : '';
      return `
        <div class="custom-select-item" onclick="escolherTipoFiltro('${val}', '${t}')">
          <span class="badge ${badgeClass}" ${badgeStyle}>${t}</span>
        </div>
      `;
    }).join('');

    htmlTipo = `
      <div class="field" style="margin-top: 12px;">
        <label>Tipo de Evento</label>
        <div class="custom-select-wrapper-filtro" style="position: relative; user-select: none;">
          <div class="custom-select" onclick="toggleCustomSelectFiltro(event)">
            <div id="filtro-tipo-label">${labelTipo}</div>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <div class="custom-options" id="custom-options-filtro">
            ${tiposHTMLFiltro}
          </div>
        </div>
        <input type="hidden" id="filtro-tipo" value="${filtroTipo}">
      </div>
    `;
  }
  
  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal" style="max-width: 400px;">
        <h3>Filtros</h3>
        <div class="filtro-modal-body">
          ${htmlTempo}
          ${htmlTipo}
        </div>
        <div class="actions">
          <button type="button" class="btn secondary" onclick="fecharModal()" style="flex:1;">Cancelar</button>
          <button type="button" class="btn primary" onclick="aplicarFiltros()" style="flex:2;">Aplicar Filtros</button>
        </div>
      </div>
    </div>
  `;
}

function aplicarFiltros() {
  if (periodoHistorico === 'semana') {
    filtroData = $('filtro-data-semana').value;
  } else if (periodoHistorico === 'mes') {
    filtroMes = parseInt($('filtro-mes').value);
    filtroAno = parseInt($('filtro-ano').value);
  } else if (periodoHistorico === 'ano') {
    filtroAno = parseInt($('filtro-ano').value);
  }
  
  if (subHistorico === 'evento') {
    filtroTipo = $('filtro-tipo').value;
  }
  
  fecharModal();
  carregarHistorico();
}

/* ---------- Cálculo de Período baseado nos filtros ---------- */
function obterRangePeriodo() {
  let inicio, fim, label;

  if (periodoHistorico === 'semana') {
    const d = new Date(filtroData + 'T00:00:00');
    const ini = startOfWeek(d);
    const f = addDays(ini, 6);
    inicio = isoDate(ini);
    fim = isoDate(f);
    label = `Semana de ${fmtDataCurta(inicio)} a ${fmtDataCurta(fim)}`;
  } else if (periodoHistorico === 'mes') {
    const ini = new Date(filtroAno, filtroMes, 1);
    const f = new Date(filtroAno, filtroMes + 1, 0);
    inicio = isoDate(ini);
    fim = isoDate(f);
    label = ini.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } else {
    const ini = new Date(filtroAno, 0, 1);
    const f = new Date(filtroAno, 11, 31);
    inicio = isoDate(ini);
    fim = isoDate(f);
    label = `Ano ${filtroAno}`;
  }
  return { inicio, fim, label };
}

async function carregarHistorico() {
  const btnFiltro = $('btn-abrir-filtros');
  if (btnFiltro) {
    if (subHistorico === 'evento' && filtroTipo !== 'todos') {
      btnFiltro.classList.add('active');
    } else {
      btnFiltro.classList.remove('active');
    }
  }

  const { inicio, fim, label } = obterRangePeriodo();

  const { data: eventos } = await db
    .from('eventos')
    .select('*')
    .gte('data', inicio)
    .lte('data', fim)
    .order('data', { ascending: false });

  let eventosPeriodo = eventos || [];
  
  if (subHistorico === 'evento' && filtroTipo !== 'todos') {
    eventosPeriodo = eventosPeriodo.filter(e => e.tipo === filtroTipo);
  }

  const eventoIds = eventosPeriodo.map(e => e.id);

  let escalas = [];
  if (eventoIds.length > 0) {
    const { data } = await db
      .from('escalas')
      .select('garcom_id, evento_id, garcons(nome)')
      .in('evento_id', eventoIds);
    escalas = data || [];
  }

  const el = $('historico-conteudo');

  if (subHistorico === 'evento') {
    const eventosFiltrados = buscaHistorico
      ? eventosPeriodo.filter(e =>
          (e.nome || '').toLowerCase().includes(buscaHistorico) ||
          (e.tipo || '').toLowerCase().includes(buscaHistorico))
      : eventosPeriodo;

    el.innerHTML = `
      <p class="muted" style="margin-top:0;">
        ${label} · ${eventosFiltrados.length} evento${eventosFiltrados.length !== 1 ? 's' : ''}
        ${buscaHistorico ? `<br><small>Busca: "${buscaHistorico}"</small>` : ''}
      </p>
      ${eventosFiltrados.length === 0
        ? `<div class="card" style="text-align:center;color:#71717a;">
             ${buscaHistorico ? 'Nenhum evento encontrado com esse termo.' : 'Nenhum evento no período.'}
           </div>`
        : eventosFiltrados.map(e => {
          const qtdGarcons = escalas.filter(s => s.evento_id === e.id).length;
          return `
            <div class="card" style="cursor:pointer;" onclick="abrirEvento('${e.id}', true)">
              <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:4px;">
                <p class="card-title" style="margin:0; flex:1;">${e.nome}</p>
                <span class="badge ${tipoClasse(e.tipo)}">${e.tipo || '—'}</span>
              </div>
              <p class="card-sub">${fmtData(e.data)} · ${(e.horario || '').slice(0, 5)} · ${qtdGarcons} garçom${qtdGarcons !== 1 ? 's' : ''}</p>
            </div>
          `;
        }).join('')}
    `;
  } else {
    const contagem = {};
    escalas.forEach(s => {
      const id = s.garcom_id;
      if (!id) return;
      if (!contagem[id]) {
        contagem[id] = { id, nome: s.garcons?.nome || '?', qtd: 0 };
      }
      contagem[id].qtd++;
    });
    
    let lista = Object.values(contagem).sort((a, b) => b.qtd - a.qtd);

    if (buscaHistorico) {
      lista = lista.filter(g => g.nome.toLowerCase().includes(buscaHistorico));
    }

    el.innerHTML = `
      <p class="muted" style="margin-top:0;">
        ${label} · ${lista.length} garçom${lista.length !== 1 ? 's' : ''} ativo${lista.length !== 1 ? 's' : ''}
        ${buscaHistorico ? `<br><small>Busca: "${buscaHistorico}"</small>` : ''}
      </p>
      ${lista.length === 0
        ? `<div class="card" style="text-align:center;color:#71717a;">
             ${buscaHistorico ? 'Nenhum garçom encontrado.' : 'Nenhum garçom escalado no período.'}
           </div>`
        : lista.map((g, i) => `
          <div class="rank-row" style="cursor:pointer;" onclick="abrirDetalheGarcomHistorico('${g.id}')">
            <div class="rank-num ${i === 0 ? 'top' : ''}">${i + 1}</div>
            <div class="item-info"><p class="name" style="font-size:14px;">${g.nome}</p></div>
            <span class="count">${g.qtd} evento${g.qtd > 1 ? 's' : ''}</span>
            <span class="seta">›</span>
          </div>
        `).join('')}
    `;
  }
}

/* ---------- Detalhe do garçom no Histórico (somente leitura) ---------- */
async function abrirDetalheGarcomHistorico(garcomId) {
  document.body.classList.add('modal-open');
  const { inicio, fim, label } = obterRangePeriodo();

  const { data: escalasGarcom } = await db
    .from('escalas')
    .select('garcom_id, evento_id, hora_chegada, garcons(nome)')
    .eq('garcom_id', garcomId);

  const nome = escalasGarcom?.[0]?.garcons?.nome || 'Garçom';
  const eventoIds = (escalasGarcom || []).map(s => s.evento_id);

  let eventos = [];
  if (eventoIds.length > 0) {
    const { data: evs } = await db.from('eventos').select('*').in('id', eventoIds);
    eventos = (evs || [])
      .filter(ev => ev.data >= inicio && ev.data <= fim)
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  const escalaPorEvento = {};
  (escalasGarcom || []).forEach(s => { escalaPorEvento[s.evento_id] = s; });

  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const eventosHTML = eventos.length === 0
    ? '<p class="muted" style="text-align:center; padding:20px 0;">Nenhum evento neste período.</p>'
    : eventos.map(ev => {
        const d = new Date(ev.data + 'T00:00:00');
        const escala = escalaPorEvento[ev.id];
        const inicioStr = (ev.horario || '').slice(0, 5);
        const chegada = escala?.hora_chegada || ev.horario;
        const chegadaStr = (chegada || '').slice(0, 5);
        const diferente = escala?.hora_chegada && escala.hora_chegada !== ev.horario;
        const textoHorario = diferente
          ? `Início: ${inicioStr} · Chegada: <span class="hora-atrasada">${chegadaStr}</span>`
          : `Início: ${inicioStr}`;

        return `
          <div class="card" style="cursor:pointer; margin-bottom:8px;"
               onclick="fecharModal(); setTimeout(()=>abrirEvento('${ev.id}', true), 50);">
            <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:4px;">
              <p class="card-title" style="margin:0; flex:1;">${ev.nome}</p>
              <span class="badge ${tipoClasse(ev.tipo)}">${ev.tipo || '—'}</span>
            </div>
            <p class="card-sub">${diasSemana[d.getDay()]}, ${fmtData(ev.data)}</p>
            <p class="card-sub">${textoHorario}</p>
          </div>
        `;
      }).join('');

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal">
        <div class="item-row" style="margin-bottom:16px;">
          <div class="avatar" style="width:48px; height:48px; font-size:18px;">
            ${nome.charAt(0).toUpperCase()}
          </div>
          <div class="item-info">
            <h3 style="margin:0; font-size:17px;">${nome}</h3>
            <p class="card-sub" style="margin:2px 0 0;">${label} · ${eventos.length} evento${eventos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        ${eventosHTML}

        <div class="actions">
          <button class="btn secondary" onclick="fecharModal()" style="flex:1;">Fechar</button>
        </div>
      </div>
    </div>
  `;
}