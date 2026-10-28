import { state } from '../../core/state.js';
import { salvarBancos } from '../../services/database.service.js';
import { mostrarSysToast } from '../../utils/toast.js';
import { somSucesso, somErro } from '../../core/audio.js';

export function renderizarAgentesModular() {
  const grid = document.getElementById('grid-agentes-ativos');
  if (!grid) return;

  const filtro = document.getElementById('filtro-agentes')?.value || 'TODOS';
  const busca = (document.getElementById('busca-agentes')?.value || '').toLowerCase();
  
  let agentesFiltrados = state.bancoAgentes;

  if (filtro === 'PENDENTES') {
    agentesFiltrados = agentesFiltrados.filter(a => !a.aprovado);
  } else if (filtro === 'ATIVOS') {
    agentesFiltrados = agentesFiltrados.filter(a => a.aprovado && a.status === 'ATIVO');
  }

  if (busca) {
    agentesFiltrados = agentesFiltrados.filter(a => 
      (a.nome || '').toLowerCase().includes(busca) || 
      (a.id_ilustrativo || '').toLowerCase().includes(busca)
    );
  }

  let html = "";

  if (agentesFiltrados.length === 0) {
    grid.innerHTML = `<p style="color:var(--amber-alert); grid-column:1/-1;">Nenhum agente encontrado com estes filtros.</p>`;
    return;
  }

  agentesFiltrados.forEach((ag) => {
    const indexReal = state.bancoAgentes.findIndex(a => a === ag);
    const cargoSeguro = ag.cargo && ag.cargo !== 'undefined' ? ag.cargo : 'AGENTE';
    const badgePendente = !ag.aprovado ? '<span class="tag-pendente" style="margin-bottom:5px; display:inline-block;">PENDENTE</span>' : '';
    const fotoAgente = ag.foto || ag.imagem || "";
    const fotoHtml = fotoAgente 
      ? `<div class="foto-agente-fbi"><img src="${fotoAgente}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>` 
      : `<div class="foto-agente-fbi"></div>`;

    let botoesAdmin = '';
    if (!ag.aprovado && state.usuarioAtual.perfil === 'admin') {
      botoesAdmin = `
        <div style="display: flex; gap: 5px; width: 100%; margin-bottom: 5px;">
            <button class="btn-fbi-action" style="background:var(--verde-terminal); color:#000; padding:5px; margin:0;" onclick="window.aprovarAgenteModular(${indexReal})">APROVAR</button>
            <button class="btn-fbi-action btn-fbi-delete" style="padding:5px; margin:0;" onclick="window.rejeitarAgenteModular(${indexReal})">REJEITAR</button>
        </div>
      `;
    }

    html += `
      <div class="fbi-card ${ag.status !== 'ATIVO' ? 'memorial' : ''}" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 15px; width: 220px; box-sizing: border-box;"> 
        ${fotoHtml} 
        <div style="width:100%; margin-top:10px;"> 
          <h3 style="${ag.status !== 'ATIVO' ? 'color:#ccc; text-decoration: line-through;' : 'color:#fff;'} margin: 0 0 5px 0;">${ag.nome}</h3> 
          <span style="font-size:0.65rem; color:var(--verde-terminal); margin-bottom:5px; display:block;">ID: ${ag.id_ilustrativo || 'N/A'}</span> 
          
          ${badgePendente}
          
          ${ag.status !== 'ATIVO' 
            ? `<span class="${ag.status.includes('M.I.A')?'tag-mia':'tag-morte'}">${ag.status}</span>` 
            : `<p style="color:var(--amber-alert); font-size:0.75rem; font-weight:bold; margin: 0 0 10px 0;">${cargoSeguro.toUpperCase()}</p>`} 
          
          <div style="display:flex; flex-direction:column; gap:8px; align-items:center; margin-top:auto; width: 100%;"> 
            ${botoesAdmin}
            <button onclick="abrirFichaCompleta(${indexReal})" class="btn-fbi-action secundario" style="padding:6px 15px; font-size:0.7rem; margin:0; width:100%;">FICHA COMPLETA</button> 
            <button onclick="editarAgenteRapido(${indexReal})" class="btn-fbi-action" style="background:#1c2630; padding:6px 15px; font-size:0.7rem; margin:0; width:100%;">OPÇÕES / STATUS</button> 
          </div> 
        </div> 
      </div>
    `;
  });

  grid.innerHTML = html;
}

window.aprovarAgenteModular = (index) => {
  state.bancoAgentes[index].aprovado = true;
  state.bancoAgentes[index].status = 'ATIVO';
  salvarBancos();
  renderizarAgentesModular();
  if (window.updateNotifications) window.updateNotifications();
  mostrarSysToast("AGENTE APROVADO.");
  somSucesso();
};

window.rejeitarAgenteModular = (index) => {
  if(confirm("Tem certeza que deseja EXCLUIR a ficha deste agente?")) {
    state.bancoAgentes.splice(index, 1);
    salvarBancos();
    renderizarAgentesModular();
    if (window.updateNotifications) window.updateNotifications();
    mostrarSysToast("FICHA EXCLUÍDA.", true);
    somErro();
  }
};

export function initAgentsModule() {
  window.renderizarAgentes = renderizarAgentesModular;
  window.renderizarAgentesModular = renderizarAgentesModular;
  
  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#agentes' || window.location.hash === '#memorial') {
      renderizarAgentesModular();
    }
  });
}
