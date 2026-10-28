import { state } from '../../core/state.js';
import { ouvirChats, enviarMensagem } from '../../services/chat.service.js';
import { $, escapeHtml } from '../../utils/dom.js';

export function initChatModule() {
  ouvirChats(() => {
    renderizarTabs();
    renderizarMensagens();
  });

  window.toggleChatWindow = () => {
    const win = $('#chat-window');
    win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
    if (win.style.display === 'flex') { renderizarTabs(); renderizarMensagens(); }
  };

  window.mudarChatTab = (tab) => {
    state.chatAtivo = tab;
    renderizarTabs();
    renderizarMensagens();
  };

  window.enviarMensagemChat = async () => {
    const input = $('#chat-input-text');
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    const autor = state.usuarioAtual.perfil === 'admin'
      ? 'FUNDADOR'
      : (state.usuarioAtual.agentesVinc[0] || state.usuarioAtual.id);
    await enviarMensagem(state.chatAtivo, autor, texto);
  };
}

function renderizarTabs() {
  const header = $('#chat-header-tabs');
  if (!header) return;
  let html = '<div class="chat-tab ' + (state.chatAtivo === 'global' ? 'active' : '') + '" onclick="mudarChatTab(\'global\')">GLOBAL</div>';

  if (state.usuarioAtual.perfil === 'admin') {
    state.bancoAgentes.forEach((ag) => {
      const canal = 'fundador_' + ag.nome;
      html += '<div class="chat-tab ' + (state.chatAtivo === canal ? 'active' : '') + '" onclick="mudarChatTab(\'' + canal + '\')">' + escapeHtml(ag.nome) + '</div>';
    });
  } else {
    const nome = state.usuarioAtual.agentesVinc[0] || state.usuarioAtual.id;
    const canal = 'fundador_' + nome;
    html += '<div class="chat-tab ' + (state.chatAtivo === canal ? 'active' : '') + '" onclick="mudarChatTab(\'' + canal + '\')">FUNDADOR</div>';
  }
  header.innerHTML = html;
}

function renderizarMensagens() {
  const area = $('#chat-messages-area');
  if (!area) return;
  const msgs = state.chatsLocais[state.chatAtivo] || [];
  area.innerHTML = msgs.map((m) => {
    const isMe = (m.autor === 'FUNDADOR' && state.usuarioAtual.perfil === 'admin')
      || state.usuarioAtual.agentesVinc.indexOf(m.autor) !== -1
      || m.autor === state.usuarioAtual.id;
    return '<div class="chat-msg ' + (isMe ? 'me' : '') + '">' +
      '<span class="autor">' + escapeHtml(m.autor) + '</span>' + escapeHtml(m.texto) +
      '</div>';
  }).join('');
  area.scrollTop = area.scrollHeight;
}