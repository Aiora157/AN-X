/* ======================================================
   MODO TESTE — dados salvos no localStorage do navegador
   Quando for pra produção, troque este arquivo pelo
   cliente real do Supabase (versão comentada no final).
   ====================================================== */

const _store = {
  _get(tabela) {
    try {
      return JSON.parse(localStorage.getItem('ancora_' + tabela) || '[]');
    } catch { return []; }
  },
  _set(tabela, dados) {
    localStorage.setItem('ancora_' + tabela, JSON.stringify(dados));
  },
  _uid() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }
};

function _matchFiltro(item, f) {
  const v = item[f.col];
  if (f.tipo === 'eq') return v === f.val;
  if (f.tipo === 'gte') return v >= f.val;
  if (f.tipo === 'lte') return v <= f.val;
  if (f.tipo === 'in') return f.val.includes(v);
  return true;
}

function _aplicarJoin(tabela, linhas, selectStr) {
  const m = selectStr.match(/(\w+)(?:!inner)?\(([^)]+)\)/);
  if (!m) return linhas;
  const [, tabelaJoin, camposStr] = m;
  const campos = camposStr.split(',').map(c => c.trim());

  const rel = { garcons: 'garcom_id', eventos: 'evento_id' }[tabelaJoin];
  if (!rel || tabela !== 'escalas') return linhas;

  const relacionada = _store._get(tabelaJoin);
  return linhas.map(l => {
    const ref = relacionada.find(r => r.id === l[rel]);
    if (!ref) return { ...l, [tabelaJoin]: null };
    const filtrado = {};
    campos.forEach(c => { filtrado[c] = ref[c]; });
    return { ...l, [tabelaJoin]: filtrado };
  });
}

function _executar(state) {
  let dados = _store._get(state.tabela);

  if (state.operacao === 'delete') {
    const restantes = dados.filter(item => !state.filtros.every(f => _matchFiltro(item, f)));
    _store._set(state.tabela, restantes);

    // Cascade: se apagou evento, apaga escalas
    if (state.tabela === 'eventos') {
      const escalas = _store._get('escalas');
      const eventosRestantes = new Set(restantes.map(e => e.id));
      _store._set('escalas', escalas.filter(s => eventosRestantes.has(s.evento_id)));
    }
    if (state.tabela === 'garcons') {
      const escalas = _store._get('escalas');
      const garconsRestantes = new Set(restantes.map(g => g.id));
      _store._set('escalas', escalas.filter(s => garconsRestantes.has(s.garcom_id)));
    }
    return { data: null, error: null };
  }

  if (state.operacao === 'insert') {
    const novo = { id: _store._uid(), criado_em: new Date().toISOString(), ...state.payload };
    if (state.tabela === 'garcons' && dados.some(g => g.cpf === novo.cpf)) {
      return { data: null, error: { code: '23505', message: 'Já existe garçom com esse CPF.' } };
    }
    if (state.tabela === 'escalas' && dados.some(e => e.evento_id === novo.evento_id && e.garcom_id === novo.garcom_id)) {
      return { data: null, error: { code: '23505', message: 'Garçom já está escalado neste evento.' } };
    }
    dados.push(novo);
    _store._set(state.tabela, dados);
    return { data: [novo], error: null };
  }

  if (state.operacao === 'update') {
    dados = dados.map(item =>
      state.filtros.every(f => _matchFiltro(item, f)) ? { ...item, ...state.payload } : item
    );
    _store._set(state.tabela, dados);
    return { data: null, error: null };
  }

  // SELECT
  let resultado = dados.filter(item => state.filtros.every(f => _matchFiltro(item, f)));
  resultado = _aplicarJoin(state.tabela, resultado, state.selectCampos);

  if (state.ordenacao) {
    const { col, ascending } = state.ordenacao;
    resultado.sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });
  }

  if (state.singleMode) {
    if (resultado.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'Nenhum resultado.' } };
    }
    return { data: resultado[0], error: null };
  }
  return { data: resultado, error: null };
}

function _createQuery(tabela) {
  const state = {
    tabela, filtros: [], ordenacao: null,
    selectCampos: '*', operacao: 'select',
    payload: null, singleMode: false,
  };
  const q = {
    select(campos = '*') { state.selectCampos = campos; return q; },
    eq(c, v) { state.filtros.push({ tipo: 'eq', col: c, val: v }); return q; },
    gte(c, v) { state.filtros.push({ tipo: 'gte', col: c, val: v }); return q; },
    lte(c, v) { state.filtros.push({ tipo: 'lte', col: c, val: v }); return q; },
    in(c, vs) { state.filtros.push({ tipo: 'in', col: c, val: vs }); return q; },
    order(c, o = {}) { state.ordenacao = { col: c, ascending: o.ascending !== false }; return q; },
    single() { state.singleMode = true; return q; },
    maybeSingle() { state.singleMode = true; return q; },
    insert(p) { state.operacao = 'insert'; state.payload = p; return q; },
    update(p) { state.operacao = 'update'; state.payload = p; return q; },
    delete() { state.operacao = 'delete'; return q; },
    then(resolve, reject) {
      return Promise.resolve(_executar(state)).then(resolve, reject);
    }
  };
  return q;
}

// API pública (idêntica à do Supabase)
const db = { from: (t) => _createQuery(t) };

/* ---------- Utilitário para testes ---------- */
function resetarDados() {
  if (!confirm('Isso apaga TODOS os dados de teste (garçons, eventos e escalas). Continuar?')) return;
  ['garcons', 'eventos', 'escalas'].forEach(t => localStorage.removeItem('ancora_' + t));
  location.reload();
}

/* ======================================================
   QUANDO FOR PRODUÇÃO — substitua o conteúdo acima por:

   const db = supabase.createClient(
     'https://SEU_PROJETO.supabase.co',
     'SUA_ANON_KEY'
   );

   E descomente o CDN do Supabase no index.html.
   ====================================================== */