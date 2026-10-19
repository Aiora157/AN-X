/* ======================================================
   SEMANA — visão semanal compacta + detalhe por garçom
   ====================================================== */

let semanaRef = startOfWeek(new Date());
let semanaDados = { eventos: [], escalas: [], inicio: null, fim: null };
let subAbaSemana = 'eventos'; // Controla qual sub-aba está ativa

function mudarSemana(delta) {
  semanaRef = addDays(semanaRef, delta * 7);
  carregarSemana();
}

function mudarSubSemana(sub, el) {
  subAbaSemana = sub;
  document.querySelectorAll('#tab-semana .chips-sub .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  carregarSemana();
}

/* ======================================================
   FILTRO DE SEMANA (Modal)
   ====================================================== */
function abrirModalFiltroSemana() {
  document.body.classList.add('modal-open');
  const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const anos = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  
  const mesAtual = semanaRef.getMonth();
  const anoAtual = semanaRef.getFullYear();
  
  // Gera as semanas do mês atual da semanaRef
  const semanas = obterSemanasDoMes(mesAtual, anoAtual);
  const valorSemanaAtual = isoDate(semanaRef);

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal" style="max-width: 400px;">
        <h3>Escolher Semana</h3>
        <div class="filtro-modal-body">
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
                ${semanas.map(s => `<option value="${s.valor}" ${s.valor === valorSemanaAtual ? 'selected' : ''}>${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="actions">
          <button type="button" class="btn secondary" onclick="fecharModal()" style="flex:1;">Cancelar</button>
          <button type="button" class="btn primary" onclick="aplicarFiltroSemana()" style="flex:2;">Aplicar</button>
        </div>
      </div>
    </div>
  `;
}

function obterSemanasDoMes(mes, ano) {
  const semanas = [];
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  
  let d = startOfWeek(primeiroDia);

  while (d <= ultimoDia) {
    const ini = new Date(d);
    const fim = addDays(ini, 6);
    const valor = isoDate(ini);
    const label = `${fmtDataCurta(valor)} - ${fmtDataCurta(isoDate(fim))} ${ano}`;
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
  
  if (semanas.some(s => s.valor === valorAtual)) {
    selectSemana.value = valorAtual;
  }
}

function aplicarFiltroSemana() {
  const dataStr = $('filtro-data-semana').value;
  if (!dataStr) return;

  semanaRef = new Date(dataStr + 'T00:00:00');
  fecharModal();
  carregarSemana();
}

/* ======================================================
   CARREGAR DADOS DA SEMANA
   ====================================================== */
async function carregarSemana() {
  const inicio = semanaRef;
  const fim = addDays(inicio, 6);
  
  // Atualiza o texto do botão com o ícone de chevron
  $('semana-range').innerHTML = `
    <span>${fmtDataCurta(isoDate(inicio))} – ${fmtDataCurta(isoDate(fim))} ${inicio.getFullYear()}</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  `;

  const { data: eventos } = await db
    .from('eventos')
    .select('*')
    .gte('data', isoDate(inicio))
    .lte('data', isoDate(fim))
    .order('data');

  const eventosSemana = eventos || [];
  const eventoIds = eventosSemana.map(e => e.id);

  let escalasSemana = [];
  if (eventoIds.length > 0) {
    const { data } = await db
      .from('escalas')
      .select('garcom_id, evento_id, hora_chegada, garcons(nome)')
      .in('evento_id', eventoIds);
    escalasSemana = data || [];
  }

  semanaDados = {
    eventos: eventosSemana,
    escalas: escalasSemana,
    inicio: isoDate(inicio),
    fim: isoDate(fim),
  };

  const diasAbrev = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const hojeISO = hoje();

  /* ---------- GERA O HTML DOS DIAS ---------- */
  const diasHTML = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(inicio, i);
    const iso = isoDate(d);
    const eventosDia = eventosSemana
      .filter(e => e.data === iso)
      .sort((a, b) => (a.horario || '').localeCompare(b.horario || ''));

    const isHoje = iso === hojeISO;

    const eventosHTML = eventosDia.length === 0
      ? '<span class="event-pill-empty">Sem eventos</span>'
      : eventosDia.map(e => {
          const hora = e.horario ? e.horario.slice(0, 5) : '';
          const nomeHora = hora ? `${e.nome} - ${hora}` : e.nome;
          
          return `
            <span class="event-pill ${tipoClasse(e.tipo)}">
              ${nomeHora}
            </span>
          `;
        }).join('');

    return `
      <div class="day-row ${isHoje ? 'today' : ''}">
        <div class="day-label">
          <span class="day-name">${diasAbrev[d.getDay()]}</span>
          <span class="day-num">${fmtDataCurta(iso)}</span>
        </div>
        <div class="day-events">${eventosHTML}</div>
      </div>
    `;
  }).join('');

  /* ---------- GERA O HTML DO RANKING DE GARÇONS ---------- */
  const contagem = {};
  escalasSemana.forEach(s => {
    const id = s.garcom_id;
    if (!contagem[id]) {
      contagem[id] = { id, nome: s.garcons?.nome || '?', qtd: 0 };
    }
    contagem[id].qtd++;
  });
  const ranking = Object.values(contagem).sort((a, b) => b.qtd - a.qtd);

  const rankingHTML = ranking.length === 0
    ? '<p class="muted">Nenhum garçom escalado nesta semana.</p>'
    : ranking.map((g, i) => `
        <div class="rank-row" style="cursor:pointer;" onclick="abrirDetalheGarcomSemana('${g.id}')">
          <div class="rank-num ${i === 0 ? 'top' : ''}">${i + 1}</div>
          <div class="item-info"><p class="name" style="font-size:14px;">${g.nome}</p></div>
          <span class="count">${g.qtd} evento${g.qtd > 1 ? 's' : ''}</span>
          <span class="seta">›</span>
        </div>
      `).join('');

  /* ---------- RENDERIZA DE ACORDO COM A SUB-ABA ---------- */
  if (subAbaSemana === 'eventos') {
    $('semana-conteudo').innerHTML = `
      <h3 class="section" style="margin-top:0;">Semana</h3>
      <div class="week-list">${diasHTML}</div>
    `;
  } else {
    $('semana-conteudo').innerHTML = `
      <h3 class="section" style="margin-top:0;">Escala de Garçons</h3>
      ${rankingHTML}
    `;
  }
}

/* ======================================================
   DETALHE DO GARÇOM (modal)
   ====================================================== */
function abrirDetalheGarcomSemana(garcomId) {
  document.body.classList.add('modal-open'); // Bloqueia rolagem
  const escalasDoGarcom = semanaDados.escalas.filter(s => s.garcom_id === garcomId);
  const eventosDoGarcom = escalasDoGarcom
    .map(s => {
      const ev = semanaDados.eventos.find(e => e.id === s.evento_id);
      return ev ? { ev, escala: s } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.ev.data.localeCompare(b.ev.data) || (a.ev.horario || '').localeCompare(b.ev.horario || ''));

  const nome = escalasDoGarcom[0]?.garcons?.nome || 'Garçom';
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const eventosHTML = eventosDoGarcom.length === 0
    ? '<p class="muted" style="text-align:center; padding:20px 0;">Nenhum evento nesta semana.</p>'
    : eventosDoGarcom.map(({ ev, escala }) => {
        const d = new Date(ev.data + 'T00:00:00');
        const inicioStr = (ev.horario || '').slice(0, 5);
        const horaChegada = escala.hora_chegada || ev.horario;
        const chegadaStr = (horaChegada || '').slice(0, 5);
        const diferente = escala.hora_chegada && escala.hora_chegada !== ev.horario;

        const textoHorario = diferente
          ? `Início: ${inicioStr} · Chegada: <span class="hora-atrasada">${chegadaStr}</span>`
          : `Chegada: ${chegadaStr}`;

        return `
          <div class="card" style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:6px;">
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
            <p class="card-sub" style="margin:2px 0 0;">
              ${eventosDoGarcom.length} evento${eventosDoGarcom.length !== 1 ? 's' : ''} nesta semana
            </p>
          </div>
        </div>

        ${eventosHTML}

        <div class="actions">
          ${eventosDoGarcom.length > 0 ? `
            <button class="btn primary" onclick="copiarEscalaGarcom('${garcomId}')" style="flex:2;">
              Copiar para WhatsApp
            </button>
          ` : ''}
          <button class="btn secondary" onclick="fecharModal()" style="flex:1;">Fechar</button>
        </div>
      </div>
    </div>
  `;
}

/* ======================================================
   COPIAR ESCALA PRO WHATSAPP
   ====================================================== */
async function copiarEscalaGarcom(garcomId) {
  const escalasDoGarcom = semanaDados.escalas.filter(s => s.garcom_id === garcomId);
  const eventosDoGarcom = escalasDoGarcom
    .map(s => {
      const ev = semanaDados.eventos.find(e => e.id === s.evento_id);
      return ev ? { ev, escala: s } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.ev.data.localeCompare(b.ev.data) || (a.ev.horario || '').localeCompare(b.ev.horario || ''));

  const nome = escalasDoGarcom[0]?.garcons?.nome || 'Garçom';
  const texto = formatarEscalaWhatsApp(nome, eventosDoGarcom);
  const ok = await copiarParaClipboard(texto);

  if (ok) {
    toast('Copiado! Cole no WhatsApp.');
  } else {
    alert('Não foi possível copiar automaticamente. Copie o texto abaixo:\n\n' + texto);
  }
}

function formatarEscalaWhatsApp(nome, itens) {
  const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];

  const porData = {};
  itens.forEach(({ ev, escala }) => {
    if (!porData[ev.data]) porData[ev.data] = [];
    porData[ev.data].push({ ev, escala });
  });

  const datasOrdenadas = Object.keys(porData).sort();

  const blocos = datasOrdenadas.map(data => {
    const d = new Date(data + 'T00:00:00');
    const dia = diasSemana[d.getDay()];
    const dataBR = formatarDataBR(data);

    const linhasEventos = porData[data].map(({ ev, escala }) => {
      const chegada = (escala.hora_chegada || ev.horario || '').slice(0, 5);
      const tipo = ev.tipo ? `(${ev.tipo}) ` : '';
      return `${tipo}${ev.nome} - Entrada às ${chegada}`;
    }).join('\n');

    return `*${dia}* ${dataBR}\n${linhasEventos}`;
  });

  return `*${nome}*\nEscala da semana:\n\n${blocos.join('\n\n')}`;
}

function formatarDataBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

async function copiarParaClipboard(texto) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (_) { /* fallback */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, texto.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}