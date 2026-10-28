import { state } from './state.js';

const ROUTE_HANDLERS = {};

export function registerRoute(name, handler) {
  ROUTE_HANDLERS[name] = handler;
}

export function initRouter() {
  window.addEventListener('hashchange', applyRoute);
}

function applyRoute() {
  if (!state.usuarioLogado) return;

  const fallback = state.usuarioAtual.perfil === 'admin' ? 'mapa' : 'perfil';
  const hash = window.location.hash.replace('#', '') || fallback;

  document.querySelectorAll('.aba-secao').forEach((el) => (el.style.display = 'none'));
  document.querySelectorAll('.nav-button').forEach((btn) => btn.classList.remove('ativo'));

  const aba = document.getElementById('aba-' + hash);
  const link = document.getElementById('link-' + hash);
  if (aba) aba.style.display = 'block';
  if (link) link.classList.add('ativo');

  const handler = ROUTE_HANDLERS[hash];
  if (handler) handler();
}