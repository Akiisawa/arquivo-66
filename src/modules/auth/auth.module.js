import { auth } from '../../config/firebase.js';
import { logarEmail, registrarEmail, recuperarSenha } from '../../services/auth.service.js';
import { mostrarSysToast } from '../../utils/toast.js';
import { somSucesso, somErro, somClick } from '../../core/audio.js';
import { $ } from '../../utils/dom.js';

function alternarTelaAuth(tela) {
  somClick();
  $('#box-login').style.display = tela === 'login' ? 'block' : 'none';
  $('#box-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
}

async function handleLogin() {
  const email = $('#login-email').value;
  const senha = $('#login-senha').value;
  if (!email || !senha) return mostrarSysToast('PREENCHA E-MAIL E SENHA', true);
  try {
    await logarEmail(email, senha);
    somSucesso();
  } catch {
    somErro();
    mostrarSysToast('ERRO: CREDENCIAIS INVALIDAS', true);
  }
}

async function handleRegistro() {
  const email = $('#cad-email').value;
  const pass = $('#cad-senha').value;
  const conf = $('#cad-senha-confirma').value;
  if (!email || !pass) return mostrarSysToast('PREENCHA TODOS OS DADOS', true);
  if (pass !== conf) { somErro(); return mostrarSysToast('AS SENHAS NAO COINCIDEM', true); }
  try {
    await registrarEmail(email, pass);
    mostrarSysToast('CONTA REGISTRADA COM SUCESSO!');
  } catch (e) {
    mostrarSysToast('ERRO: ' + e.message, true);
  }
}

async function handleRecuperar() {
  const email = $('#login-email').value;
  if (!email) return mostrarSysToast('DIGITE SEU E-MAIL NA CAIXA ACIMA ANTES DE RECUPERAR', true);
  try {
    await recuperarSenha(email);
    somSucesso();
    mostrarSysToast('E-MAIL DE RECUPERACAO ENVIADO!');
  } catch {
    somErro();
    mostrarSysToast('ERRO: CONTA NAO ENCONTRADA.', true);
  }
}

export function initAuthModule() {
  Object.assign(window, {
    alternarTelaAuth,
    logarEmail: handleLogin,
    registrarEmail: handleRegistro,
    recuperarSenha: handleRecuperar,
    deslogarFirebaseAuth: async () => {
      somClick();
      await auth.signOut();
    },
  });
}