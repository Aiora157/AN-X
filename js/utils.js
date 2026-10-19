/* ======================================================
   HELPERS GERAIS
   ====================================================== */

// Atalho pra getElementById
const $ = (id) => document.getElementById(id);

// Toast de notificação
const toast = (msg) => {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 2200);
};

/* ---------- Formatação ---------- */
const fmtCPF = (v) => {
  const n = String(v).replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const fmtTel = (v) => {
  const n = String(v).replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

const fmtData = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDataCurta = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

/* ---------- Validação ---------- */
const validarCPF = (cpf) => {
  const n = String(cpf).replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +n[i] * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10) r = 0;
  if (r !== +n[9]) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +n[i] * (11 - i);
  r = (s * 10) % 11;
  if (r === 10) r = 0;
  return r === +n[10];
};

/* ---------- Datas ---------- */
const hoje = () => new Date().toISOString().slice(0, 10);
const isoDate = (d) => d.toISOString().slice(0, 10);

const startOfWeek = (d) => {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/* ---------- Tipo de evento → classe de cor ---------- */
function tipoClasse(tipo) {
  const map = {
    'Confraternização': 'c-confra',
    'Casamento':        'c-casamento',
    'Científico':       'c-cientifico',
    'Batizado':         'c-batizado',
    'Corporativo':      'c-corporativo',
    'Aniversário':      'c-aniversario',
    'Comemorativo':     'c-comemorativo',
    'Formatura':        'c-formatura',
  };
  return map[tipo] || '';
}