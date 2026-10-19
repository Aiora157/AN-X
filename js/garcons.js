/* ======================================================
   GARÇONS — lista simples + detalhe em modal + form em modal
   ====================================================== */

let garconsCache = [];
let garcomEditando = null;
let contagemEventosCache = {};

async function carregarGarcons() {
  const { data: garcons, error } = await db.from('garcons').select('*');
  if (error) {
    $('lista-garcons').innerHTML = `<div class="erro">${error.message}</div>`;
    return;
  }

  const { data: escalas } = await db.from('escalas').select('garcom_id');
  const contagem = {};
  (escalas || []).forEach(s => {
    contagem[s.garcom_id] = (contagem[s.garcom_id] || 0) + 1;
  });
  contagemEventosCache = contagem;

  garconsCache = (garcons || []).slice().sort((a, b) => {
    const ca = contagem[a.id] || 0;
    const cb = contagem[b.id] || 0;
    if (cb !== ca) return cb - ca;
    const na = a.nome || a.nome_completo || '';
    const nb = b.nome || b.nome_completo || '';
    return na.localeCompare(nb, 'pt-BR');
  });

  renderGarcons();
}

function nomeCurtoGarcom(g) {
  if (g.nome) return g.nome;
  const partes = (g.nome_completo || '').split(/\s+/).filter(Boolean);
  return partes.slice(0, 2).join(' ') || '?';
}

function renderGarcons() {
  const el = $('lista-garcons');
  $('g-titulo-lista').textContent = `Garçons cadastrados (${garconsCache.length})`;

  if (garconsCache.length === 0) {
    el.innerHTML = `<div class="card" style="text-align:center; color:#8888a0;">Nenhum garçom cadastrado. Clique em "Novo garçom".</div>`;
    return;
  }

  el.innerHTML = garconsCache.map(g => {
    const estaAtivo = g.ativo !== false;
    const nome = nomeCurtoGarcom(g);
    return `
      <div class="card" style="cursor:pointer; ${!estaAtivo ? 'opacity:.6;' : ''}"
           onclick="abrirDetalheGarcom('${g.id}')">
        <div class="item-row">
          <div class="avatar" style="${!estaAtivo ? 'background:#1a1a2a; color:#4a4a5c; border-color:rgba(255,255,255,0.08); box-shadow:none;' : ''}">
            ${nome.charAt(0).toUpperCase()}
          </div>
          <div class="item-info">
            <p class="name">
              ${nome}${!estaAtivo ? '<span class="badge-inativo">Inativo</span>' : ''}
            </p>
          </div>
          <span style="font-size:18px; color:#4a4a5c; margin-left:4px;">›</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ======================================================
   DETALHE DO GARÇOM
   ====================================================== */
function abrirDetalheGarcom(id) {
  document.body.classList.add('modal-open'); // Bloqueia rolagem
  const g = garconsCache.find(x => x.id === id);
  if (!g) return;

  const estaAtivo = g.ativo !== false;
  const nome = nomeCurtoGarcom(g);
  const nomeCompleto = g.nome_completo || g.nome || '—';
  const cpfDisplay = g.cpf ? fmtCPF(g.cpf) : '—';
  const telDisplay = g.telefone ? fmtTel(g.telefone) : '—';

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModal()">
      <div class="modal">
        <div class="item-row" style="margin-bottom:16px;">
          <div class="avatar" style="width:48px; height:48px; font-size:18px; ${!estaAtivo ? 'background:#1a1a2a; color:#4a4a5c; border-color:rgba(255,255,255,0.08); box-shadow:none;' : ''}">
            ${nome.charAt(0).toUpperCase()}
          </div>
          <div class="item-info">
            <h3 style="margin:0; font-size:17px;">
              ${nome}${!estaAtivo ? '<span class="badge-inativo">Inativo</span>' : ''}
            </h3>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(0,212,255,0.12); border-radius:10px; padding:14px; margin-bottom:16px;">
          <div style="margin-bottom:10px;">
            <!-- ALTERAÇÃO AQUI: Cor do título mudou para var(--warning) -->
            <p style="font-size:11px; font-weight:700; color:var(--warning); margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Garçom</p>
            <p style="margin:0; font-size:15px; color:#e8e8f0;">${nome}</p>
          </div>
          <div style="margin-bottom:10px;">
            <p style="font-size:11px; font-weight:700; color:var(--warning); margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Nome completo</p>
            <p style="margin:0; font-size:15px; color:#e8e8f0;">${nomeCompleto}</p>
          </div>
          <div style="margin-bottom:10px;">
            <p style="font-size:11px; font-weight:700; color:var(--warning); margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">CPF</p>
            <p style="margin:0; font-size:15px; color:#e8e8f0;">${cpfDisplay}</p>
          </div>
          <div>
            <p style="font-size:11px; font-weight:700; color:var(--warning); margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Contato</p>
            <p style="margin:0; font-size:15px; color:#e8e8f0;">${telDisplay}</p>
          </div>
        </div>

        <div class="actions" style="flex-wrap:wrap;">
          <button class="btn secondary" onclick="abrirModalGarcom('${g.id}')" style="flex:1; min-width:80px;">Editar</button>
          <button class="btn ${estaAtivo ? 'secondary' : 'primary'}" onclick="toggleAtivoGarcom('${g.id}')" style="flex:1; min-width:80px;">
            ${estaAtivo ? 'Desativar' : 'Ativar'}
          </button>
          <button class="btn danger" onclick="excluirGarcom('${g.id}')" style="flex:1; min-width:80px;">Excluir</button>
        </div>
        <div class="actions">
          <button class="btn secondary" onclick="fecharModal()" style="flex:1;">Fechar</button>
        </div>
      </div>
    </div>
  `;
}

/* ======================================================
   FORM: NOVO / EDITAR GARÇOM (modal)
   ====================================================== */
function abrirModalGarcom(id = null) {
  document.body.classList.add('modal-open'); // Bloqueia rolagem
  garcomEditando = id || null;
  const g = id ? garconsCache.find(x => x.id === id) : null;

  const titulo = g ? 'Editar garçom' : 'Novo garçom';
  const textoBotao = g ? 'Salvar alterações' : 'Cadastrar';
  const nomeVal = g ? (g.nome || '').replace(/"/g, '&quot;') : '';
  const nomeCompletoVal = g ? (g.nome_completo || g.nome || '').replace(/"/g, '&quot;') : '';
  const cpfVal = g && g.cpf ? fmtCPF(g.cpf) : '';
  const telVal = g && g.telefone ? fmtTel(g.telefone) : '';

  $('modal-container').innerHTML = `
    <div class="modal-bg show" onclick="if(event.target===this) fecharModalGarcom()">
      <div class="modal">
        <h3>${titulo}</h3>
        <form onsubmit="salvarGarcom(event)" novalidate>
          <div class="field">
            <label>Garçom</label>
            <input id="g-nome" placeholder="João" value="${nomeVal}" required>
            <p style="font-size:11px; color:#8888a0; margin:4px 0 0;">Só o nome ou nome e sobrenome.</p>
          </div>
          <div class="field">
            <label>Nome completo</label>
            <input id="g-nome-completo" placeholder="João Pedro Silva Santos" value="${nomeCompletoVal}" required>
          </div>
          <div class="field">
            <label>CPF</label>
            <input id="g-cpf" placeholder="000.000.000-00" inputmode="numeric" value="${cpfVal}" required autocomplete="off">
          </div>
          <div class="field">
            <label>Contato</label>
            <input id="g-tel" placeholder="(11) 99999-9999" inputmode="tel" value="${telVal}" required autocomplete="off">
          </div>
          <div id="g-erro"></div>
          <div class="actions">
            <button type="button" class="btn secondary" onclick="fecharModalGarcom()" style="flex:1;">Cancelar</button>
            <button type="submit" class="btn primary" id="g-btn" style="flex:2;">${textoBotao}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  setTimeout(() => {
    const el = $('g-nome');
    if (el) el.focus();
  }, 80);
}

function fecharModalGarcom() {
  document.body.classList.remove('modal-open'); // Libera a rolagem
  garcomEditando = null;
  $('modal-container').innerHTML = '';
}

/* ======================================================
   AÇÕES
   ====================================================== */
async function toggleAtivoGarcom(id) {
  const g = garconsCache.find(x => x.id === id);
  if (!g) return;
  const estaAtivo = g.ativo !== false;
  const novoAtivo = !estaAtivo;

  const { error } = await db.from('garcons').update({ ativo: novoAtivo }).eq('id', id);
  if (error) return alert(error.message);

  toast(novoAtivo ? 'Ativado para eventos' : 'Desativado para eventos');
  await carregarGarcons();
  abrirDetalheGarcom(id);
}

async function salvarGarcom(e) {
  e.preventDefault();
  const erroEl = $('g-erro');
  const nome = $('g-nome').value.trim();
  const nomeCompleto = $('g-nome-completo').value.trim();
  const cpf = $('g-cpf').value.replace(/\D/g, '');
  const telefone = $('g-tel').value.replace(/\D/g, '');

  erroEl.innerHTML = '';

  if (!nome) return erroEl.innerHTML = '<div class="erro">Informe o nome do garçom.</div>';
  if (!nomeCompleto) return erroEl.innerHTML = '<div class="erro">Informe o nome completo.</div>';

  if (cpf.length !== 11) {
    return erroEl.innerHTML = '<div class="erro">CPF incompleto. Use o formato 000.000.000-00.</div>';
  }
  if (!validarCPF(cpf)) {
    return erroEl.innerHTML = '<div class="erro">CPF inválido. Confira os números.</div>';
  }

  if (telefone.length < 10 || telefone.length > 11) {
    return erroEl.innerHTML = '<div class="erro">Contato inválido. Use DDD + número (ex: (11) 99999-9999).</div>';
  }

  $('g-btn').disabled = true;

  const eraEdicao = !!garcomEditando;
  const idEdicao = garcomEditando;
  const payload = { nome, nome_completo: nomeCompleto, cpf, telefone };

  const { error } = eraEdicao
    ? await db.from('garcons').update(payload).eq('id', idEdicao)
    : await db.from('garcons').insert({ ...payload, ativo: true });

  $('g-btn').disabled = false;

  if (error) {
    erroEl.innerHTML = error.code === '23505'
      ? '<div class="erro">Já existe garçom com esse CPF.</div>'
      : `<div class="erro">${error.message}</div>`;
    return;
  }

  fecharModalGarcom();
  toast(eraEdicao ? 'Atualizado!' : 'Cadastrado!');
  await carregarGarcons();

  if (eraEdicao && idEdicao) {
    abrirDetalheGarcom(idEdicao);
  }

  if (typeof recarregarAbaSeNecessario === 'function') recarregarAbaSeNecessario();
}

async function excluirGarcom(id) {
  if (!confirm('Excluir este garçom? Escalas vinculadas também serão removidas.')) return;
  await db.from('garcons').delete().eq('id', id);
  fecharModal();
  toast('Excluído');
  carregarGarcons();

  if (typeof recarregarAbaSeNecessario === 'function') recarregarAbaSeNecessario();
}

/* ======================================================
   MÁSCARAS — aplicadas enquanto digita
   ====================================================== */
document.addEventListener('input', (e) => {
  if (e.target.id === 'g-cpf') {
    e.target.value = fmtCPF(e.target.value);
  }
  if (e.target.id === 'g-tel') {
    e.target.value = fmtTel(e.target.value);
  }
});