import { state } from '../../core/state.js';
import { salvarBancos } from '../../services/database.service.js';
import { mostrarSysToast } from '../../utils/toast.js';
import { somSucesso } from '../../core/audio.js';

function criarCardHTML(ag, indexReal, isMemorial = false) {
    const cargoSeguro = ag.cargo && ag.cargo !== 'undefined' ? ag.cargo : 'AGENTE';
    const fotoAgente = ag.foto || ag.imagem || "";
    
    const fotoHtml = fotoAgente 
      ? `<img src="${fotoAgente}" alt="${ag.nome}">` 
      : `<i class="fa-solid fa-user-secret no-photo"></i>`;

    let badgeColor = 'var(--verde-terminal)';
    let badgeText = 'ATIVO';

    if (!ag.aprovado) { badgeColor = 'var(--amber-alert)'; badgeText = 'PENDENTE'; }
    else if (ag.status.includes('K.I.A')) { badgeColor = 'var(--vermelho-critica)'; badgeText = 'K.I.A'; }
    else if (ag.status.includes('M.I.A')) { badgeColor = 'var(--amber-alert)'; badgeText = 'M.I.A'; }

    let quickActions = '';
    if (!ag.aprovado && state.usuarioAtual.perfil === 'admin' && !isMemorial) {
        quickActions = `<button class="btn-card-v btn-approve-v" onclick="event.stopPropagation(); window.aprovarAgenteModular(${indexReal})">APROVAR</button>`;
    }

    return `
      <div class="agent-card-v" style="${isMemorial ? 'filter: grayscale(100%) opacity(0.8); border-color: #4a1515;' : ''}">
        <div class="agent-photo-box">
            ${fotoHtml}
            <div class="scanline"></div>
            <div class="agent-badge-v" style="color: ${badgeColor};">${badgeText}</div>
        </div>
        <div class="agent-info-v">
            <div class="agent-header-v">
                <h3 class="agent-name-v">${ag.nome}</h3>
                <span class="agent-name-badge" style="color: ${badgeColor};">${badgeText}</span>
            </div>
            <span class="agent-id-v">ID: ${ag.id_ilustrativo || 'N/A'}</span>
            
            <div class="agent-role-v">
                <i class="fa-solid fa-id-badge"></i> CARGO: <strong>${cargoSeguro.toUpperCase()}</strong>
            </div>
            
            <div class="agent-actions-v" style="flex-direction: column;">
                ${quickActions}
                <div style="display:flex; gap:8px; width:100%;">
                    <button class="btn-card-v" onclick="abrirFichaCompleta(${indexReal})">FICHA</button>
                    <button class="btn-card-v btn-edit-v" onclick="editarAgenteRapido(${indexReal})" title="Editar"><i class="fa-solid fa-gear"></i></button>
                </div>
            </div>
        </div>
      </div>
    `;
}

export function renderizarAgentesModular() {
  const grid = document.getElementById('grid-agentes-ativos');
  if (!grid) return;

  const todosAgentes = window.bancoAgentes || [];
  const agentesVivos = todosAgentes.filter(a => !a.status.includes('K.I.A') && !a.status.includes('M.I.A'));

  if (agentesVivos.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; border: 1px dashed #333; color: #666; font-family: monospace;">NENHUM REGISTRO ENCONTRADO.</div>`;
    return;
  }

  grid.innerHTML = agentesVivos.map(ag => {
      const indexReal = todosAgentes.findIndex(a => a === ag);
      return criarCardHTML(ag, indexReal, false);
  }).join('');
}

export function renderizarMemorialModular() {
  const grid = document.getElementById('grid-agentes-mortos');
  if (!grid) return;

  const todosAgentes = window.bancoAgentes || [];
  const agentesMortos = todosAgentes.filter(a => a.status.includes('K.I.A') || a.status.includes('M.I.A'));

  if (agentesMortos.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; border: 1px dashed #4a1515; color: #ff5555; font-family: monospace;">NENHUMA BAIXA REGISTRADA.</div>`;
    return;
  }

  grid.innerHTML = agentesMortos.map(ag => {
      const indexReal = todosAgentes.findIndex(a => a === ag);
      return criarCardHTML(ag, indexReal, true);
  }).join('');
}

window.aprovarAgenteModular = (index) => {
  window.bancoAgentes[index].aprovado = true;
  window.bancoAgentes[index].status = 'ATIVO';
  salvarBancos();
  renderizarAgentesModular();
  if (window.updateNotifications) window.updateNotifications();
  mostrarSysToast("AGENTE APROVADO.");
  somSucesso();
};

export function initAgentsModule() {
  window.renderizarAgentes = renderizarAgentesModular;
  window.renderizarAgentesModular = renderizarAgentesModular;
  window.renderizarMemorialModular = renderizarMemorialModular;
  
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#agentes') renderizarAgentesModular();
    if (window.location.hash === '#memorial') renderizarMemorialModular();
  });
  
  setTimeout(() => {
      renderizarAgentesModular();
      renderizarMemorialModular();
  }, 1000);
}