/* ======================================================
   EVENTOS — CRUD + ESCALAÇÃO + edição + agrupamento
   ====================================================== */

const TIPOS_EVENTO = [
  'Confraternização',
  'Científico',
  'Aniversário',
  'Casamento',
  'Batizado',
  'Corporativo',
  'Comemorativo',
  'Formatura'
];

let eventosCache = [];
let eventosEscalasCache = {}; // { evento_id: [escalas] }
let eventoEditandoId = null;

/* ---------- Helper para ordenar garçons ---------- */
function ordenarEscalas(escalas, ev) {
  return (escalas || []).slice().sort((a, b) => {
    const aAtrasado = a.hora_chegada && a.hora_chegada !== ev.horario;
    const bAtrasado = b.hora_chegada && b.hora_chegada !== ev.horario;

    if (aAtrasado && !bAtrasado) return 1;
    if (!aAtrasado && bAtrasado) return -1;

    return (a.garcons?.nome || '').localeCompare(b.garcons?.nome || '', 'pt-BR');
  });
}

async function carregarEventos() {
  const { data: eventos, error } = await db
    .from('eventos')
    .select('*')
    .order('data', { ascending: true });

  if (error) {
    $('lista-eventos').innerHTML = `<div class="erro">${error.message}</div>`;
    return;
  }

  const { data: escalas } = await db.from('escalas').select('*, garcons(nome)');
  const porEvento = {};
  (escalas || []).forEach(s => {
    if (!porEvento[s.evento_id]) porEvento[s.evento_id] = [];
    porEvento[s.evento_id].push(s);
  });

  eventosCache = eventos || [];
  
  eventosCache.forEach(ev => {
    if (porEvento[ev.id]) {
      porEvento[ev.id] = ordenarEscalas(porEvento[ev.id], ev);
    }
  });

  eventosEscalasCache = porEvento;
  renderEventos();
}

/* ---------- Helpers de exibição ---------- */
function nomeGarcomHTML(s, ev) {
  const atrasado = s.hora_chegada && s.hora_chegada !== ev.horario;
  const horarioStr = atrasado ? ` (${(s.hora_chegada || '').slice(0, 5)})` : '';
  
  return atrasado
    ? `<span class="nome-atrasado">${s.garcons.nome}${horarioStr}</span>`
    : `<span>${s.garcons.nome}</span>`;
}

function listaNomesHTML(escalas, ev) {
  if (!escalas || escalas.length === 0) {
    return '<span class="muted">Nenhum escalado</span>';
  }
  return escalas.map(s => nomeGarcomHTML(s, ev)).join(', ');
}

function renderEventoCard(ev) {
  const escalas = eventosEscalasCache[ev.id] || [];
  const total = escalas.length;
  const vagas = ev.vagas || 0;
  const completo = total >= vagas;

  return `
    <div class="card" style="cursor:pointer;" onclick="abrirEvento('${ev.id}')">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
        <div style="flex:1; min-width:0;">
          <p class="card-title">${ev.nome}</p>
          <p class="card-sub">Início: ${(ev.horario || '').slice(0, 5)}</p>
        </div>
        <span class="badge ${tipoClasse(ev.tipo)}">${ev.tipo || '—'}</span>
      </div>
      
      <div class="vagas-linha">
        <span class="vagas-num ${completo ? 'completo' : 'incompleto'}">${total}/${vagas}</span>
        <span class="vagas-names">${listaNomesHTML(escalas, ev)}</span>
        ${total > 0 ? `
          <button class="btn-copy-scale" onclick="event.stopPropagation(); copiarEscalaRapida('${ev.id}')" title="Copiar Escala">
            ⚓
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderEventos() {
  const el = $('lista-eventos');
  const h = hoje();
  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  const eventosAtivos = eventosCache.filter(ev => ev.data >= h);

  if (eventosAtivos.length === 0) {
    el.innerHTML = `<div class="card" style="text-align:center; color:var(--text-muted);">Nenhum evento futuro ou para hoje.</div>`;
    return;
  }

  const porData = {};
  eventosAtivos.forEach(ev => {
    if (!porData[ev.data]) porData[ev.data] = [];
    porData[ev.data].push(ev);
  });

  const datasOrdenadas = Object.keys(porData).sort((a, b) => a.localeCompare(b));

  el.innerHTML = datasOrdenadas.map(data => {
    // Cria o objeto Date garantindo o fuso horário local
    const d = new Date(data + 'T00:00:00');
    const diaAbrev = diasSemana[d.getDay()];
    const dataFormatada = d.toLocaleDateString('pt-BR').replace(/\//g, '.'); // Troca / por .

    const eventosDoDia = porData[data].slice().sort((a, b) =>
      (a.horario || '').localeCompare(b.horario || '')
    );
    const multiplo = eventosDoDia.length > 1;

    return `
      <div class="grupo-dia">
        <p class="grupo-dia-titulo">
          <span class="titulo-data">${diaAbrev} ${dataFormatada}</span>
          ${multiplo ? `<span class="titulo-count">${eventosDoDia.length} eventos</span>` : ''}
        </p>
        ${eventosDoDia.map(ev => renderEventoCard(ev)).join('')}
      </div>
    `;
  }).join('');
}

/* ======================================================
   COPIAR ESCALA RÁPIDA (Aba Eventos)
   ====================================================== */
async function copiarEscalaRapida(evId) {
  const ev = eventosCache.find(e => e.id === evId);
  if (!ev) return;

  const escalas = eventosEscalasCache[evId] || [];
  
  if (escalas.length === 0) {
    return toast('Nenhum garçom escalado neste evento.');
  }

  const nomes = escalas.map(s => s.garcons.nome).join(', ');
  const horarioFormatado = (ev.horario || '').slice(0, 5);
  
  const textoEquipe = escalas.length === 1 ? 'Garçom extra' : 'Equipe extra';
  
  const texto = `${textoEquipe} às ${horarioFormatado}\n${nomes}`;

  const ok = await copiarParaClipboard(texto);
  if (ok) {
    toast('Escala copiada!');
  } else {
    alert('Não foi possível copiar automaticamente. Copie o texto abaixo:\n\n' + texto);
  }
}

/* ======================================================
   CUSTOM DROPDOWN (Tipo de Evento)
   ====================================================== */
function toggleCustomSelect(e) {
  if (e) e.stopPropagation();
  const options = document.getElementById('custom-options-tipo');
  if (options) {
    options.classList.toggle('show');
  }
}

function escolherTipoEvento(tipo, el) {
  document.getElementById('ev-tipo').value = tipo;
  document.getElementById('ev-tipo-label').innerHTML = `<span class="badge ${tipoClasse(tipo)}">${tipo}</span>`;
  document.getElementById('custom-options-tipo').classList.remove('show');
}

document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.custom-select-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    const options = document.getElementById('custom-options-tipo');
    if (options) options.classList.remove('show');
  }
});

/* ---------- Modal: Novo / Editar evento ---------- */
function abrirModalEvento(id = null) {
  eventoEditandoId = id || null;
  document.body.classList.add('modal-open'); 
  const ev = id ? eventosCache.find(e => e.id === id) : null;

  const dataValor = ev ? ev.data : hoje();
  const horarioValor = ev ? (ev.horario || '').slice(0, 5) : '18:00';
  const tipoValor = ev ? ev.tipo : '';
  const vagasValor = ev ? ev.vagas : 1;

  const horasOptions = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, '0') + ':00';
    const sel = h === horarioValor ? 'selected' : (i === 18 && !ev ? 'selected' : '');
    return `<option value="${h}" ${sel}>${h}</option>`;
  }).join('');

  const tiposHTML = TIPOS_EVENTO.map(t => `
    <div class="custom-select-item" onclick="escolherTipoEvento('${t}', this)">
      <span class="badge ${tipoClasse(t)}">${t}</span>
    </div>
  `).join('');

  const labelTipo = tipoValor 
    ? `<span class="badge ${tipoClasse(tipoValor)}">${tipoValor}</span>` 
    : `<span class="custom-select-placeholder">Selecione o tipo...</span>`;

  const sugestoes = [...new Set(eventosCache.map(e => e.nome))];
  const sugestoesHTML = sugestoes.map(n => `<option value="${n}">`).join('');

  const titulo = ev ? 'Editar evento' : 'Novo evento';
  const textoBotao = ev ? 'Salvar alterações' : 'Criar evento';

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal">
        <h3>${titulo}</h3>
        <form onsubmit="salvarEvento(event)">
          <div class="field">
            <label>Nome do evento</label>
            <input id="ev-nome" list="sugestoes-eventos" placeholder="Ex: Casamento Silva"
                   value="${ev ? ev.nome.replace(/"/g, '&quot;') : ''}" required>
            <datalist id="sugestoes-eventos">${sugestoesHTML}</datalist>
          </div>
          
          <div class="row">
            <div class="field">
              <label>Data</label>
              <div class="input-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <input id="ev-data" type="date" value="${dataValor}" required
                       onclick="try{this.showPicker()}catch(e){}">
              </div>
            </div>
            
            <div class="field">
              <label>Horário</label>
              <div class="input-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <select id="ev-horario" required style="padding-left: 44px;">${horasOptions}</select>
              </div>
            </div>
          </div>

          <div class="field">
            <label>Tipo de evento</label>
            <div class="custom-select-wrapper">
              <div class="custom-select" onclick="toggleCustomSelect(event)">
                <div id="ev-tipo-label">${labelTipo}</div>
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div class="custom-options" id="custom-options-tipo">
                ${tiposHTML}
              </div>
            </div>
            <input type="hidden" id="ev-tipo" value="${tipoValor}" required>
          </div>

          <div class="field">
            <label>Vagas (nº de garçons)</label>
            <input id="ev-vagas" type="number" min="1" value="${vagasValor}" required>
          </div>
          
          <div class="actions">
            <button type="button" class="btn secondary" onclick="fecharModal()" style="flex:1;">Cancelar</button>
            <button type="submit" class="btn primary" style="flex:2;">${textoBotao}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function fecharModal() {
  document.body.classList.remove('modal-open');
  $('modal-container').innerHTML = '';
}

async function salvarEvento(e) {
  e.preventDefault();
  const payload = {
    nome: $('ev-nome').value.trim(),
    data: $('ev-data').value,
    horario: $('ev-horario').value,
    tipo: $('ev-tipo').value,
    vagas: parseInt($('ev-vagas').value) || 1,
  };

  if (!payload.tipo) {
    toast('Selecione o tipo de evento.');
    return;
  }

  if (eventoEditandoId) {
    const idEdicao = eventoEditandoId;
    eventoEditandoId = null;

    const { error } = await db.from('eventos').update(payload).eq('id', idEdicao);
    if (error) return alert(error.message);

    toast('Evento atualizado!');
    await Promise.all([carregarEventos(), abrirEvento(idEdicao)]);
  } else {
    const { error } = await db.from('eventos').insert(payload);
    if (error) return alert(error.message);

    fecharModal();
    toast('Evento criado!');
    carregarEventos();
  }
}

/* ---------- Modal: Detalhe do evento ---------- */
async function abrirEvento(id, somenteLeitura = false) {
  document.body.classList.add('modal-open');
  const { data: ev } = await db.from('eventos').select('*').eq('id', id).single();
  const { data: escalas } = await db
    .from('escalas')
    .select('*, garcons(nome, cpf, telefone)')
    .eq('evento_id', id);

  const escalasOrdenadas = ordenarEscalas(escalas, ev);

  const totalEscalados = escalasOrdenadas.length;
  const vagas = ev.vagas || 0;
  const preenchidas = totalEscalados >= vagas;
  const faltam = Math.max(0, vagas - totalEscalados);

  const escaladosIds = escalasOrdenadas.map(s => s.garcom_id);
  const todosGarcons = garconsCache.length === 0
    ? (await db.from('garcons').select('*').order('nome')).data || []
    : garconsCache;
  const disponiveis = todosGarcons.filter(g => g.ativo !== false);
  const naoEscalados = disponiveis.filter(g => !escaladosIds.includes(g.id));

  const statusVagas = preenchidas
    ? `<span style="color:var(--success); font-weight:700;">Vagas preenchidas</span>`
    : `<span style="color:#FF4D4D; font-weight:700;">Faltam ${faltam} garçom${faltam > 1 ? 's' : ''}</span>`;

  const escaladosHTML = escalasOrdenadas.length === 0
    ? '<p class="muted" style="margin-bottom:16px;">Ninguém escalado ainda.</p>'
    : `
      <div class="escalados-inline">
        ${escalasOrdenadas.map(s => {
          const horaChegada = s.hora_chegada || ev.horario;
          const diferente = s.hora_chegada && s.hora_chegada !== ev.horario;
          const clsNome = diferente ? 'nome-atrasado' : '';
          const botaoRemover = somenteLeitura ? '' : `
            <button type="button" class="btn-remove-tag" onclick="removerEscala('${s.id}', '${ev.id}')" title="Remover">&times;</button>
          `;
          
          const horarioTexto = diferente ? ` (${(horaChegada || '').slice(0, 5)})` : '';

          return `
            <div class="waiter-tag ${diferente ? 'atrasado' : ''}">
              <span class="${clsNome}">${s.garcons.nome}${horarioTexto}</span>
              ${botaoRemover}
            </div>
          `;
        }).join('')}
      </div>
    `;

  const secaoAdicionar = somenteLeitura ? '' : `
    <h3 style="margin:16px 0 8px; font-size:15px;">Adicionar garçom</h3>
    <div class="adicionar-row">
      <select id="sel-garcom" ${preenchidas ? 'disabled' : ''}>
        <option value="">Selecione...</option>
        ${naoEscalados.map(g => `<option value="${g.id}">${g.nome}</option>`).join('')}
      </select>
      <select id="chegada-garcom" ${preenchidas ? 'disabled' : ''}>
        ${Array.from({ length: 24 }, (_, i) => {
          const h = String(i).padStart(2, '0') + ':00';
          const sel = h === (ev.horario || '').slice(0, 5) ? 'selected' : '';
          return `<option value="${h}" ${sel}>${h}</option>`;
        }).join('')}
      </select>
    </div>
    <button class="btn primary" style="margin-top:12px;" onclick="escalarGarcom('${ev.id}')" ${(naoEscalados.length === 0 || preenchidas) ? 'disabled' : ''}>
      ${preenchidas ? 'Todas as vagas já foram preenchidas' : (naoEscalados.length === 0 ? 'Nenhum garçom ativo disponível' : 'Adicionar à escala')}
    </button>
  `;

  const rodape = somenteLeitura
    ? `<div class="actions">
         <button class="btn secondary" onclick="fecharModal()" style="flex:1;">Fechar</button>
       </div>`
    : `<div class="actions">
         <button class="btn secondary" onclick="abrirModalEvento('${ev.id}')" style="flex:1;">Editar</button>
         <button class="btn danger" onclick="excluirEvento('${ev.id}')" style="flex:1;">Excluir</button>
         <button class="btn primary" onclick="fecharModal()" style="flex:1;">Fechar</button>
       </div>`;

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px;">
          <h3 style="margin:0; flex:1;">${ev.nome}</h3>
          <span class="badge ${tipoClasse(ev.tipo)}">${ev.tipo || '—'}</span>
        </div>
        <p class="muted" style="margin:0 0 4px;">Data: ${fmtData(ev.data)} · Início: ${(ev.horario || '').slice(0, 5)}</p>
        <div class="vagas-linha" style="margin-top:8px; margin-bottom:16px;">
          <span class="vagas-num ${preenchidas ? 'completo' : 'incompleto'}">${totalEscalados}/${vagas}</span>
          <span style="font-size:13px; font-weight:600;">${statusVagas}</span>
        </div>

        <h3 style="margin:16px 0 8px; font-size:15px;">Escalados</h3>
        ${escaladosHTML}

        ${secaoAdicionar}

        ${rodape}
      </div>
    </div>
  `;
}

async function escalarGarcom(eventoId) {
  const garcomId = $('sel-garcom').value;
  if (!garcomId) return;

  const chegadaValor = $('chegada-garcom').value || null;

  const { data: ev } = await db.from('eventos').select('*').eq('id', eventoId).single();
  
  const { data: escalasAtuais } = await db.from('escalas').select('*').eq('evento_id', eventoId);
  if (escalasAtuais && escalasAtuais.length >= ev.vagas) {
    return alert('Todas as vagas para este evento já foram preenchidas.');
  }

  const { data: eventosMesmoDia } = await db.from('eventos').select('*').eq('data', ev.data);
  const idsMesmoDia = eventosMesmoDia.map(e => e.id);

  const { data: escalasGarcom } = await db
    .from('escalas')
    .select('*, eventos(nome)')
    .eq('garcom_id', garcomId)
    .in('evento_id', idsMesmoDia);

  const conflitos = (escalasGarcom || []).filter(c => c.evento_id !== eventoId);

  if (conflitos.length > 0) {
    const nomes = conflitos.map(c => c.eventos?.nome || 'outro evento').join(', ');
    if (!confirm(`Este garçom já está escalado no mesmo dia em: ${nomes}.\n\nDeseja adicionar mesmo assim?`)) return;
  }

  const payload = {
    evento_id: eventoId,
    garcom_id: garcomId,
    hora_chegada: chegadaValor,
  };

  const { error } = await db.from('escalas').insert(payload);
  if (error) return alert(error.message);
  toast('Adicionado!');

  await Promise.all([abrirEvento(eventoId), carregarEventos()]);
  recarregarAbaSeNecessario();
}

async function removerEscala(escalaId, eventoId) {
  const { error } = await db.from('escalas').delete().eq('id', escalaId);
  if (error) return alert(error.message);
  toast('Removido!');

  await Promise.all([abrirEvento(eventoId), carregarEventos()]);
  recarregarAbaSeNecessario();
}

async function excluirEvento(id) {
  if (!confirm('Excluir evento e todas as escalas dele?')) return;
  await db.from('eventos').delete().eq('id', id);
  fecharModal();
  toast('Evento excluído');
  carregarEventos();
  recarregarAbaSeNecessario();
}

function recarregarAbaSeNecessario() {
  if (typeof abaAtual === 'undefined') return;
  if (abaAtual === 'semana') carregarSemana();
  if (abaAtual === 'historico') carregarHistorico();
}