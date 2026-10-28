import { somClick, somErro } from '../core/audio.js';

export function mostrarSysToast(msg, isError) {
  const t = document.getElementById('sys-toast');
  if (!t) { alert(msg); return; }

  t.innerText = msg;
  t.style.borderColor = isError ? 'var(--vermelho-critica)' : 'var(--verde-terminal)';
  t.style.color       = isError ? 'var(--vermelho-critica)' : 'var(--verde-terminal)';
  t.style.boxShadow   = isError ? '0 0 15px rgba(255,51,51,.3)' : '0 0 15px rgba(66,255,66,.2)';
  t.style.display = 'block';
  isError ? somErro() : somClick();
  setTimeout(() => (t.style.display = 'none'), 3500);
}

export function mostrarToastSessao(msg, erro) {
  const t = document.getElementById('toast-sessao');
  if (!t) return mostrarSysToast(msg, erro);
  t.innerText = msg;
  t.style.background = erro ? 'var(--vermelho-critica)' : 'var(--amber-alert)';
  t.style.color = erro ? '#fff' : '#000';
  t.style.display = 'block';
  erro ? somErro() : somClick();
  setTimeout(() => (t.style.display = 'none'), 3000);
}