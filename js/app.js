/* ======================================================
   ÂNCORA · Navegação + Camada de interações
   ====================================================== */

let abaAtual = 'eventos';

/* ---------- CONTROLE DO MENU DROPDOWN ---------- */
function toggleMenu() {
  const nav = document.getElementById('main-nav');
  const brand = document.querySelector('.brand');
  
  if (nav && brand) {
    nav.classList.toggle('show');
    brand.classList.toggle('menu-open');
  }
}

/* ---------- NAVEGAÇÃO ---------- */
function mudarAba(aba) {
  abaAtual = aba;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('nav.top-nav button').forEach(b => b.classList.remove('active'));

  $('tab-' + aba).classList.add('active');
  document.querySelector(`nav.top-nav button[data-tab="${aba}"]`).classList.add('active');

  // Fecha o menu ao clicar em uma aba
  const nav = document.getElementById('main-nav');
  const brand = document.querySelector('.brand');
  if (nav && nav.classList.contains('show')) {
    nav.classList.remove('show');
    brand.classList.remove('menu-open');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (aba === 'eventos') carregarEventos();
  if (aba === 'semana') carregarSemana();
  if (aba === 'historico') carregarHistorico();
  if (aba === 'dashboard') carregarDashboard();
  if (aba === 'cadastrar') carregarGarcons();
}

/* ======================================================
   RIPPLE (Removido do .brand para evitar bug visual)
   ====================================================== */
document.addEventListener('pointerdown', (e) => {
  // O '.brand' foi removido daqui
  const el = e.target.closest('.btn, .btn-hero, .btn-text, .chip, nav.top-nav button, .week-nav button');
  if (!el) return;

  const style = window.getComputedStyle(el);
  if (style.position === 'static') el.style.position = 'relative';
  if (style.overflow === 'visible') el.style.overflow = 'hidden';

  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';

  const fundoEscuro = el.classList.contains('active') || el.classList.contains('primary');
  ripple.style.background = fundoEscuro
    ? 'rgba(0, 0, 0, 0.15)'
    : 'rgba(255, 255, 255, 0.15)';

  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

/* ======================================================
   SCROLL REVEAL
   ====================================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('is-visible');
      }, index * 30);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

const revealMutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      const targets = node.matches?.('.card, .rank-row, .day-row, .chart-card')
        ? [node]
        : Array.from(node.querySelectorAll?.('.card, .rank-row, .day-row, .chart-card') || []);
      targets.forEach((el) => {
        if (!el.classList.contains('reveal') && !el.classList.contains('is-visible')) {
          el.classList.add('reveal');
          revealObserver.observe(el);
        }
      });
    });
  });
});

revealMutationObserver.observe(document.body, { childList: true, subtree: true });

/* ======================================================
   INICIALIZAÇÃO
   ====================================================== */
mudarAba('eventos');

// Controla a duração da Tela de Abertura (Splash Screen)
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  }
}, 3000);