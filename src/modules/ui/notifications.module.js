import { state } from '../../core/state.js';

export function initNotificationsModule() {
  window.toggleNotifications = () => {
    const panel = document.getElementById('notification-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
      renderNotificacoes();
    }
  };

  // Escuta cliques fora do painel para fechar
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notification-panel');
    const bell = document.getElementById('notification-bell');
    if (panel && panel.style.display === 'block' && !panel.contains(e.target) && !bell.contains(e.target)) {
      panel.style.display = 'none';
    }
  });

  // Atualiza as notificações a cada 10 segundos
  setInterval(updateBadge, 10000);
  
  // Expõe globalmente para ser chamado sempre que salvarBancos() rodar
  window.updateNotifications = updateBadge;
  updateBadge();
}

function getNotificacoes() {
  if (state.usuarioAtual.perfil !== 'admin') return [];
  let notifs = [];

  // 1. Agentes Pendentes
  const pendentes = state.bancoAgentes.filter(a => !a.aprovado);
  if (pendentes.length > 0) {
    notifs.push({
      titulo: `${pendentes.length} Agente(s) Pendente(s)`,
      desc: 'Aguardando aprovação na base.',
      link: '#agentes',
      icone: 'fa-user-clock',
      cor: 'var(--amber-alert)'
    });
  }

  // 2. Requisições de Inventário
  const reqInv = state.bancoInventario.filter(i => i.solicitantes && i.solicitantes.length > 0);
  if (reqInv.length > 0) {
    notifs.push({
      titulo: `${reqInv.length} Requisição(ões) de Item`,
      desc: 'Agentes solicitaram equipamentos.',
      link: '#inventario',
      icone: 'fa-box-open',
      cor: 'var(--azul-seguro)'
    });
  }

  return notifs;
}

function updateBadge() {
  const notifs = getNotificacoes();
  const badge = document.getElementById('notif-badge');
  if (!badge) return;

  if (notifs.length > 0) {
    badge.style.display = 'block';
    badge.innerText = notifs.length;
  } else {
    badge.style.display = 'none';
  }
}

function renderNotificacoes() {
  const list = document.getElementById('notification-list');
  const notifs = getNotificacoes();

  if (notifs.length === 0) {
    list.innerHTML = '<div style="color: #666; font-size: 0.75rem; text-align: center; padding: 20px;">Nenhum alerta pendente.</div>';
    return;
  }

  list.innerHTML = notifs.map(n => `
    <div onclick="document.getElementById('notification-panel').style.display='none'; window.location.hash='${n.link.replace('#', '')}';" 
         style="background: #090c10; padding: 10px; border-left: 2px solid ${n.cor}; cursor: pointer; transition: 0.2s;"
         onmouseenter="this.style.background='#1c2630'" onmouseleave="this.style.background='#090c10'">
      <div style="color: ${n.cor}; font-size: 0.75rem; font-weight: bold; margin-bottom: 4px;">
        <i class="fa-solid ${n.icone}"></i> ${n.titulo}
      </div>
      <div style="color: #a6b7c9; font-size: 0.65rem;">${n.desc}</div>
    </div>
  `).join('');
}
