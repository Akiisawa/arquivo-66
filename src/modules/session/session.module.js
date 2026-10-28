import { state, salvarSessaoLocal, limparSessaoLocal } from '../../core/state.js';
import { auth } from '../../config/firebase.js';
import { buscarSessaoPorDono, sessaoExiste, criarSessao } from '../../services/session.service.js';
import { carregarDadosDaNuvem } from '../../services/database.service.js';
import { mostrarSysToast, mostrarToastSessao } from '../../utils/toast.js';
import { somSucesso, somErro } from '../../core/audio.js';
import { $ } from '../../utils/dom.js';

const LOGS_BOOT = [
  'CONNECTING TO ORDO REALITAS MAIN SERVER...',
  'BYPASSING PARANORMAL FIREWALL L3...',
  'VERIFYING ENCRYPTION KEYS (AES-256)...',
  'SYNCING CLOUD DATABASE...',
  'INTERFACE READY...',
];

let logIdx = 0;

export async function iniciarRotinaDeBoot(cod) {
  state.sessaoAtual = cod;
  salvarSessaoLocal(cod);
  state.refSessao = window.firebase.firestore()
    .collection('sessoes').doc(cod).collection('dados');

  $('#tela-sessao').style.display = 'none';
  const intro = $('#tela-intro');
  if (intro) intro.style.display = 'flex';

  logIdx = 0;
  $('#linhas-log').innerHTML = '';
  await rodarBoot();
}

async function rodarBoot() {
  if (logIdx < LOGS_BOOT.length - 1) {
    $('#linhas-log').innerHTML += '<div>> ' + LOGS_BOOT[logIdx] + '</div>';
    $('#progresso-fbi').style.width = ((logIdx / LOGS_BOOT.length) * 100) + '%';
    logIdx++;
    return setTimeout(rodarBoot, 450);
  }
  if (logIdx === LOGS_BOOT.length - 1) {
    $('#linhas-log').innerHTML += '<div>> ' + LOGS_BOOT[logIdx] + '</div>';
    await carregarDadosDaNuvem();
    logIdx++;
    return setTimeout(rodarBoot, 400);
  }
  $('#progresso-fbi').style.width = '100%';
  setTimeout(() => {
    $('#tela-intro').style.display = 'none';
    $('#tela-login').style.display = 'flex';
    $('#login-instrucao').innerText = 'SALA: ' + state.sessaoAtual;
  }, 500);
}

export async function entrarSessaoExistente() {
  const cod = $('#input-codigo-sessao').value.toUpperCase().trim();
  if (!cod) return mostrarToastSessao('ERRO: INSIRA UM CODIGO.', true);
  const existe = await sessaoExiste(cod);
  if (!existe) return mostrarToastSessao('SALA NAO ENCONTRADA.', true);
  iniciarRotinaDeBoot(cod);
}

export async function criarNovaSessao() {
  const user = auth.currentUser;
  if (!user) return mostrarSysToast('ERRO: LOGIN NECESSARIO.', true);

  const existente = await buscarSessaoPorDono(user.uid);
  if (existente) {
    mostrarSysToast('ACESSO NEGADO: VOCE JA POSSUI UMA SALA ATIVA!', true);
    somErro();
    $('#input-codigo-sessao').value = existente;
    return;
  }

  const cod = 'NET-' + Math.floor(1000 + Math.random() * 9000);
  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  await criarSessao(cod, user.uid, pin);
  somSucesso();
  $('#input-codigo-sessao').value = cod;

  const overlayHtml = [
    '<div class="fbi-caixa-alerta">',
    '  <h2 style="color:var(--verde-terminal); margin-bottom:15px; font-size:1.5rem;">SALA ESTABELECIDA</h2>',
    '  <h1 style="color:var(--verde-terminal); font-size:3.5rem; letter-spacing:3px; margin: 0 0 20px 0;">' + cod + '</h1>',
    '  <div style="background:#1c2630; padding:20px; border-left:4px solid var(--amber-alert); margin-bottom:20px; text-align: left;">',
    '    <p style="color:#fff; font-size: 1.2rem; margin-bottom:10px;"><strong>LOGIN:</strong> ADMIN</p>',
    '    <p style="color:#fff; font-size: 1.2rem;"><strong>SENHA:</strong> <span style="color:var(--amber-alert);">' + pin + '</span></p>',
    '  </div>',
    '  <p style="color:var(--vermelho-critica); font-weight:bold; margin-bottom: 20px;">SALVE ESTA SENHA!</p>',
    '  <button class="btn-fbi-action" style="width:100%; padding:15px; background:var(--verde-terminal); color:#000; margin-bottom:10px;"',
    '    onclick="this.parentElement.parentElement.remove(); window.iniciarRotinaDeBoot(\'' + cod + '\')">ENTRAR NA SALA</button>',
    '  <button class="btn-fbi-action secundario" style="width:100%; padding:10px;"',
    '    onclick="this.parentElement.parentElement.remove();">FECHAR AVISO</button>',
    '</div>',
  ].join('\n');

  const overlay = document.createElement('div');
  overlay.id = 'alerta-nova-sessao';
  overlay.className = 'fbi-overlay-absoluto';
  overlay.innerHTML = overlayHtml;
  document.body.appendChild(overlay);
}

export async function voltarParaSessoes() {
  limparSessaoLocal();
  $('#tela-login').style.display = 'none';
  $('#tela-sessao').style.display = 'flex';
}

export function initSessionModule() {
  Object.assign(window, {
    entrarSessaoExistente,
    criarNovaSessao,
    voltarParaSessoes,
    iniciarRotinaDeBoot,
    confirmarAcesso: () => {
      const el = $('#input-codigo-sessao');
      const v = el && el.value.trim();
      if (v) entrarSessaoExistente();
      else mostrarToastSessao('INSIRA UM ID DE ACESSO.', true);
    },
  });
}