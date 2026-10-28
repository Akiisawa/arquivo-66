// =========================================================
// 1. FIREBASE CONFIG
// =========================================================
const firebaseConfig = {
    apiKey: "AIzaSyA4SwLSMFS7qE8R0T9i0-YWhE88dbz8kvw",
    authDomain: "rpg-ordem-dc772.firebaseapp.com",
    databaseURL: "https://rpg-ordem-dc772-default-rtdb.firebaseio.com",
    projectId: "rpg-ordem-dc772",
    storageBucket: "rpg-ordem-dc772.firebasestorage.app",
    messagingSenderId: "893978535559",
    appId: "1:893978535559:web:b9486f8c1f6dd557e8ba22"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- VARIÁVEIS DO SISTEMA GLOBAIS ---
window.SESSAO_ATUAL = "";
window.refSessao = null;
const MEU_UID_MASTER = "4Ep6cHGpZVdPihKQ1q3wIg3Of1z1"; 
window.isMuted = false;
window.bancoInventario = [];
window.bancoUsuarios = [];
window.incidentesGoiadas = [];
window.bancoAgentes = [];
window.bancoArquivos = [];
window.bancoRelatorios = [];
window.bancoEntidades = [];

// --- ESTADOS DO MAPA / UI ---
window.usuarioLogado = false;
window.usuarioAtual = { perfil: '', id: '', patente: 1, agentesVinc: [] };
window.indexItemSelecionado = null;
window.base64TempMedia = "";
window.agenteSendoEditado = null;
window.chatAtivo = 'global';
window.chatUnsubscribe = null;
window.chatsLocais = {};
window.periciasTempFicha = {};
window.pinProcesso = { id: '', pin: '' };
window.logIdx = 0;

const logsBoot = ["CONNECTING TO ORDO REALITAS MAIN SERVER...", "BYPASSING PARANORMAL FIREWALL L3...", "VERIFYING ENCRYPTION KEYS (AES-256)...", "SYNCING CLOUD DATABASE...", "INTERFACE READY..."];

// --- INICIALIZAÇÃO GERAL ---
document.addEventListener("DOMContentLoaded", () => {
    const introEl = document.getElementById("tela-intro");
    if(introEl) introEl.style.display = "none";
    
    const savedSession = localStorage.getItem('rpg_sessao_atual');
    if (savedSession && document.getElementById('input-codigo-sessao')) {
        document.getElementById('input-codigo-sessao').value = savedSession;
    }

    

    const style = document.createElement('style');
    style.innerHTML = `
        #dice-toast { z-index: 999999 !important; }
        #chat-floating-btn { position:fixed; bottom:20px; right:20px; width:45px; height:45px; background:#07090c; border:2px solid var(--verde-terminal, #42ff42); border-radius:4px; display:none; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 0 10px rgba(66,255,66,0.2); z-index:9999; color:var(--verde-terminal, #42ff42); font-size:16px; font-weight:bold; font-family:monospace; transition: 0.3s; }
        #chat-floating-btn:hover { background:var(--verde-terminal, #42ff42); color:#000; box-shadow:0 0 20px rgba(66,255,66,0.4); }
        #chat-window { position:fixed; bottom:75px; right:20px; width:320px; height:450px; background:#07090c; border:1px solid #1c2630; border-radius:4px; z-index:9998; display:none; flex-direction:column; box-shadow:0 10px 30px rgba(0,0,0,0.8); font-family:monospace; }
        .chat-header { background:#1c2630; display:flex; overflow-x:auto; border-bottom:1px solid #333; }
        .chat-tab { background:#000; color:#888; padding:10px; font-size:0.7rem; cursor:pointer; border-right:1px solid #333; white-space:nowrap; flex-grow:1; text-align:center; }
        .chat-tab.active { background:var(--verde-terminal, #42ff42); color:#000; font-weight:bold; }
        .chat-messages { flex-grow:1; padding:10px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; scroll-behavior: smooth; }
        .chat-msg { background:#111820; padding:8px; border-left:2px solid #5b6f82; font-size:0.75rem; color:#ccc; word-wrap:break-word; }
        .chat-msg.me { border-left:none; border-right:2px solid var(--verde-terminal, #42ff42); text-align:right; }
        .chat-msg span.autor { font-weight:bold; color:var(--amber-alert, #ffb000); display:block; font-size:0.65rem; margin-bottom:3px; }
        .chat-msg.me span.autor { color:var(--verde-terminal, #42ff42); }
        .chat-input-area { display:flex; border-top:1px solid #1c2630; }
        .chat-input-area input { flex-grow:1; background:#000; border:none; color:#fff; padding:12px; font-family:monospace; outline:none; }
        .chat-input-area button { background:var(--verde-terminal, #42ff42); color:#000; border:none; padding:0 15px; cursor:pointer; font-weight:bold; font-size:1.2rem; }
    `;
    document.head.appendChild(style);

    const chatBtn = document.createElement('div');
    chatBtn.id = 'chat-floating-btn';
    chatBtn.innerHTML = '>_';
    chatBtn.onclick = window.toggleChatWindow;
    document.body.appendChild(chatBtn);

    const chatWin = document.createElement('div');
    chatWin.id = 'chat-window';
    chatWin.innerHTML = `
        <div class="chat-header" id="chat-header-tabs"></div>
        <div class="chat-messages" id="chat-messages-area"></div>
        <div class="chat-input-area">
            <input type="text" id="chat-input-text" placeholder="Transmitir mensagem..." onkeypress="if(event.key==='Enter') enviarMensagemChat()">
            <button onclick="enviarMensagemChat()">></button>
        </div>
    `;
    document.body.appendChild(chatWin);
    
    let loginProcesso = document.getElementById('login-processo');
    if(loginProcesso) {
        let btnVoltar = document.createElement('button');
        btnVoltar.id = 'btn-sair-sessao';
        btnVoltar.className = 'btn-fbi-action btn-fbi-delete';
        btnVoltar.style.marginTop = '15px';
        btnVoltar.innerHTML = '<i class="fa-solid fa-power-off"></i> SAIR DA SESSÃO';
        btnVoltar.onclick = window.voltarParaSessoes;
        loginProcesso.appendChild(btnVoltar);
    }
});

// --- SISTEMA DE ÁUDIO ---
const AudioContext = window.AudioContext || window.webkitAudioContext; let audioCtx;
window.initAudio = function() { if(!audioCtx) audioCtx = new AudioContext(); if(audioCtx.state === 'suspended') audioCtx.resume(); };
window.toggleMute = function() {
    window.isMuted = !window.isMuted;
    let icon = document.getElementById('icone-mute');
    if(window.isMuted) { if(icon){icon.className = "fa-solid fa-volume-xmark"; icon.style.color = "var(--vermelho-critica)";} } 
    else { if(icon){icon.className = "fa-solid fa-volume-high"; icon.style.color = "var(--fbi-text)";} window.somClick(); }
}
function playBeep(freq, type, duration, vol=0.05) { if(window.isMuted || !audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); gain.gain.setValueAtTime(vol, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration); }
window.somClick = function() { playBeep(500, 'square', 0.05); }; 
window.somErro = function() { playBeep(150, 'sawtooth', 0.4, 0.1); setTimeout(()=>playBeep(150, 'sawtooth', 0.4, 0.1), 200); }; 
window.somSucesso = function() { playBeep(800, 'sine', 0.1); setTimeout(()=>playBeep(1200, 'sine', 0.15), 100); };
document.addEventListener('click', (e) => { if(window.initAudio) window.initAudio(); if(e.target.tagName === 'BUTTON' || e.target.closest('.pin-btn') || e.target.tagName === 'TR') window.somClick(); });

// --- FUNÇÕES DE AUTENTICAÇÃO ---
window.alternarTelaAuth = function(tela) {
    window.somClick();
    document.getElementById('box-login').style.display = tela === 'login' ? 'block' : 'none';
    document.getElementById('box-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
}
window.logarEmail = async function() {
    let email = document.getElementById('login-email').value;
    let pass = document.getElementById('login-senha').value;
    if(!email || !pass) { window.mostrarSysToast("PREENCHA E-MAIL E SENHA", true); return; }
    try { await firebase.auth().signInWithEmailAndPassword(email, pass); window.somSucesso(); } 
    catch(e) { window.mostrarSysToast("ERRO: CREDENCIAIS INVÁLIDAS", true); }
}
window.registrarEmail = async function() {
    let email = document.getElementById('cad-email').value;
    let pass = document.getElementById('cad-senha').value;
    let passConf = document.getElementById('cad-senha-confirma').value;
    if(!email || !pass) { window.mostrarSysToast("PREENCHA TODOS OS DADOS", true); return; }
    if(pass !== passConf) { window.somErro(); window.mostrarSysToast("AS SENHAS NÃO COINCIDEM", true); return; }
    try { await firebase.auth().createUserWithEmailAndPassword(email, pass); window.mostrarSysToast("CONTA REGISTRADA COM SUCESSO!"); } 
    catch(e) { window.mostrarSysToast("ERRO: " + e.message, true); }
}
window.recuperarSenha = async function() {
    let email = document.getElementById('login-email').value;
    if(!email) { window.mostrarSysToast("DIGITE SEU E-MAIL NA CAIXA ACIMA ANTES DE RECUPERAR", true); return; }
    try { await firebase.auth().sendPasswordResetEmail(email); window.somSucesso(); window.mostrarSysToast("E-MAIL DE RECUPERAÇÃO ENVIADO! VERIFIQUE SUA CAIXA."); } 
    catch(e) { window.somErro(); window.mostrarSysToast("ERRO: CONTA NÃO ENCONTRADA OU INVÁLIDA.", true); }
}
window.deslogarFirebaseAuth = function() {
    window.somClick();
    firebase.auth().signOut().then(() => { window.SESSAO_ATUAL = ""; localStorage.removeItem('rpg_sessao_atual'); });
}

// --- GERENCIAMENTO DE SESSÕES ---
window.mostrarToastSessao = function(msg, erro = false) {
    const t = document.getElementById('toast-sessao');
    if(!t) return window.mostrarSysToast(msg, erro);
    t.innerText = msg; 
    t.style.background = erro ? "var(--vermelho-critica, #ff3333)" : "var(--amber-alert, #ffb000)";
    t.style.color = erro ? "#fff" : "#000";
    t.style.display = 'block';
    if(erro) window.somErro(); else window.somClick();
    setTimeout(() => t.style.display = 'none', 3000); 
}
// Função movida para auth-patch.js
window.criarNovaSessao = async function() {
    const user = firebase.auth().currentUser;
    if (!user) { window.mostrarSysToast("ERRO: LOGIN NECESSÁRIO.", true); return; }
    try {
        let inputSessao = document.getElementById('input-codigo-sessao');
        const snapshot = await db.collection("sessoes").where("ownerUid", "==", user.uid).get();
        if (!snapshot.empty) {
            let sessaoExistente = snapshot.docs[0].id;
            window.mostrarSysToast("ACESSO NEGADO: VOCÊ JÁ POSSUI UMA SALA ATIVA!", true);
            window.somErro(); if (inputSessao) inputSessao.value = sessaoExistente;
            return; 
        }
        let randomCod = "NET-" + Math.floor(1000 + Math.random() * 9000);
        let randomPin = Math.floor(100000 + Math.random() * 900000).toString();
        await db.collection("sessoes").doc(randomCod).set({ criadaEm: Date.now(), status: "ATIVA", ownerUid: user.uid, members: [user.uid] });
        await db.collection("sessoes").doc(randomCod).collection("dados").doc("usuarios").set({ lista: [{ id: "ADMIN", pin: randomPin, perfil: "admin", patente: 4, agentesVinc: [] }] });
        window.somSucesso(); if (inputSessao) inputSessao.value = randomCod;
        let overlay = document.createElement("div");
        overlay.id = "alerta-nova-sessao";
        overlay.className = "fbi-overlay-absoluto";
        overlay.innerHTML = `<div class="fbi-caixa-alerta"><h2 style="color:var(--verde-terminal); margin-bottom:15px; font-size:1.5rem;">SALA ESTABELECIDA</h2><h1 style="color:var(--verde-terminal); font-size:3.5rem; letter-spacing:3px; margin: 0 0 20px 0;">${randomCod}</h1><div style="background:#1c2630; padding:20px; border-left:4px solid var(--amber-alert); margin-bottom:20px; text-align: left;"><p style="color:#fff; font-size: 1.2rem; margin-bottom:10px;"><strong>LOGIN:</strong> ADMIN</p><p style="color:#fff; font-size: 1.2rem;"><strong>SENHA:</strong> <span style="color:var(--amber-alert);">${randomPin}</span></p></div><p style="color:var(--vermelho-critica); font-weight:bold; margin-bottom: 20px;">⚠️ SALVE ESTA SENHA ANTES DE CONTINUAR!</p><button class="btn-fbi-action" style="width:100%; padding:15px; font-size:1.1rem; background:var(--verde-terminal); color:#000; margin-bottom:10px;" onclick="this.parentElement.parentElement.remove(); window.iniciarRotinaDeBoot('${randomCod}')">ENTRAR NA SALA</button><button class="btn-fbi-action secundario" style="width:100%; padding:10px;" onclick="this.parentElement.parentElement.remove();">FECHAR AVISO</button></div>`;
        document.body.appendChild(overlay);
    } catch (e) { window.mostrarSysToast("ERRO GRAVE AO CRIAR SESSÃO.", true); }
}

window.iniciarRotinaDeBoot = function(cod) {
    window.SESSAO_ATUAL = cod;
    localStorage.setItem('rpg_sessao_atual', cod);
    window.refSessao = db.collection("sessoes").doc(cod).collection("dados");
    document.getElementById('tela-sessao').style.display = 'none';
    const introEl = document.getElementById('tela-intro');
    if(introEl) introEl.style.display = 'flex';
    window.rodarBoot(); 
}
window.rodarBoot = async function() {
    if (window.logIdx < logsBoot.length - 1) { 
        document.getElementById("linhas-log").innerHTML += `<div>> ${logsBoot[window.logIdx]}</div>`; 
        document.getElementById("progresso-fbi").style.width = ((window.logIdx / logsBoot.length) * 100) + "%"; 
        window.logIdx++; 
        setTimeout(window.rodarBoot, 450);
    } else if (window.logIdx === logsBoot.length - 1) {
        document.getElementById("linhas-log").innerHTML += `<div>> ${logsBoot[window.logIdx]}</div>`; 
        await window.carregarDadosDaNuvem(); 
        window.logIdx++; 
        setTimeout(window.rodarBoot, 400);
    } else { 
        document.getElementById("progresso-fbi").style.width = "100%"; 
        setTimeout(() => { 
            document.getElementById("tela-intro").style.display = "none"; 
            document.getElementById("tela-login").style.display = "flex"; 
            document.getElementById("login-instrucao").innerText = "SALA: " + window.SESSAO_ATUAL;
        }, 500); 
    }
}

window.iniciarLogin = function() { document.getElementById('perfis-botoes').style.display = 'none'; document.getElementById('login-processo').style.display = 'flex'; document.getElementById('agente-id-input').style.display = 'block'; document.getElementById('pinpad-container').style.display = 'none'; document.getElementById('login-instrucao').innerText = ""; document.getElementById('agente-id-input').focus(); document.getElementById('agente-id-input').onkeydown = function(e) { if(e.key === 'Enter') { window.pinProcesso.id = this.value.toUpperCase().trim(); if(window.pinProcesso.id === '') return; document.getElementById('agente-id-input').style.display = 'none'; document.getElementById('pinpad-container').style.display = 'block'; } }; }
window.digitarPin = function(numero) { if(window.pinProcesso.pin.length < 6) { window.pinProcesso.pin += numero; document.getElementById('pin-display').value = window.pinProcesso.pin.replace(/./g, '*'); } }
window.cancelarLogin = function() { document.getElementById('perfis-botoes').style.display = 'flex'; document.getElementById('login-processo').style.display = 'none'; document.getElementById('agente-id-input').value = ''; document.getElementById('pin-display').value = ''; window.pinProcesso.pin = ''; window.pinProcesso.id = ''; document.getElementById('login-instrucao').innerText = "SALA: " + window.SESSAO_ATUAL; }

document.addEventListener('keydown', (e) => {
    const pinPad = document.getElementById('pinpad-container');
    const idInput = document.getElementById('agente-id-input');
    if (idInput && idInput.style.display === 'block' && document.activeElement === idInput) return;
    if (!pinPad || pinPad.style.display !== 'block') return;
    if (e.key >= '0' && e.key <= '9') { window.digitarPin(e.key); } 
    else if (e.key === 'Backspace') { window.pinProcesso.pin = window.pinProcesso.pin.slice(0, -1); document.getElementById('pin-display').value = window.pinProcesso.pin.replace(/./g, '*'); } 
    else if (e.key === 'Enter') { e.preventDefault(); if (window.pinProcesso.pin.length === 6) window.validarLogin(); } 
    else if (e.key === 'Escape') { window.cancelarLogin(); }
});

window.voltarParaSessoes = function() {
    window.somClick();
    const telaLogin = document.getElementById("tela-login");
    const telaSessao = document.getElementById("tela-sessao");
    if(telaLogin) telaLogin.style.display = "none";
    window.SESSAO_ATUAL = ""; localStorage.removeItem('rpg_sessao_atual');
    if(telaSessao) telaSessao.style.display = "flex";
    if(typeof window.iniciarChuvaCodigo==='function') window.iniciarChuvaCodigo();
}

window.validarLogin = async function() {
    const user = window.bancoUsuarios.find(u => u.id === window.pinProcesso.id && u.pin === window.pinProcesso.pin);
    if (!user) { window.somErro(); window.mostrarSysToast("ACESSO NEGADO: CREDENCIAIS INVÁLIDAS", true); window.pinProcesso.pin = ''; document.getElementById('pin-display').value = ''; return; }
    const authUser = firebase.auth().currentUser;
    if(authUser) { await db.collection("sessoes").doc(window.SESSAO_ATUAL).update({ members: firebase.firestore.FieldValue.arrayUnion(authUser.uid) }).catch(e => console.log("Aviso: Falha ao add member. Se vc é admin, ignore.")); }
    window.somSucesso(); window.usuarioLogado = true; window.usuarioAtual = { perfil: user.perfil, id: user.id, patente: parseInt(user.patente) || 1, agentesVinc: user.agentesVinc || [] };
    document.getElementById("tela-login").style.display = "none"; document.getElementById("app-principal").style.display = "flex";
    let nomePatente = window.getNomePatente(window.usuarioAtual.patente);
    if(user.perfil === 'admin') {
        document.getElementById("credencial-display").innerText = `FUNDADOR // ID: ${user.id} // SESSÃO: ${window.SESSAO_ATUAL}`; 
        let banner = document.getElementById("admin-banner");
        banner.style.display = "block";
        if(authUser && authUser.uid === MEU_UID_MASTER) { banner.innerHTML = `PAINEL DE FUNDADOR ATIVADO <button id="btn-master-interno" class="btn-fbi-action btn-fbi-delete" style="padding: 2px 10px; font-size: 0.65rem; margin-left: 15px; width: auto; display: inline-block; cursor: pointer;" onclick="abrirPainelMasterInterno()">SUPERVISÃO DE SESSÕES</button>`; } 
        else { banner.innerHTML = `PAINEL DE FUNDADOR ATIVADO`; }
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'inline-block'); document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'none');
        window.location.hash = "#mapa";
    } else {
        document.getElementById("credencial-display").innerText = `AGENTE // ID: ${user.id} (${nomePatente})`;
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'none'); document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'flex');
        window.location.hash = "#perfil";
    }
    document.querySelectorAll('.nav-button.admin-only').forEach(b => b.style.display = user.perfil === 'admin' ? 'flex' : 'none');
    document.getElementById('chat-floating-btn').style.display = 'flex';
    window.iniciarListenerChats(); window.renderizarChatTabs();
    window.atualizarCentroComando(); window.dispatchEvent(new Event('hashchange'));
}

window.fazerLogout = function() { 
    window.somClick(); window.usuarioLogado = false; window.usuarioAtual = { perfil: '', id: '', patente: 1, agentesVinc: [] }; 
    document.getElementById('app-principal').style.display = 'none'; document.getElementById('admin-banner').style.display = 'none';  
    document.getElementById('chat-floating-btn').style.display = 'none'; document.getElementById('chat-window').style.display = 'none';
    if(window.chatUnsubscribe) window.chatUnsubscribe();
    window.cancelarLogin(); window.location.hash = ''; 
    window.logIdx = 0; document.getElementById("linhas-log").innerHTML = ''; 
    document.getElementById('tela-login').style.display = 'flex'; 
}

window.fecharModal = function() { document.getElementById('modal-dinamico').style.display = 'none'; window.indexItemSelecionado = null; };
function posicionarModalMapa() { const modal = document.getElementById('modal-dinamico'); modal.style.position = 'fixed'; modal.style.right = '20px'; modal.style.left = 'auto'; modal.style.top = '20px'; modal.style.transform = 'none'; }
window.posicionarModalCentro = function() { const modal = document.getElementById('modal-dinamico'); modal.style.position = 'fixed'; modal.style.left = '50%'; modal.style.right = 'auto'; modal.style.top = '80px'; modal.style.transform = 'translateX(-50%)'; }

window.mostrarSysToast = function(msg, isError = false) {
    let t = document.getElementById('sys-toast'); 
    if(!t) { alert(msg); return; }
    t.innerText = msg; 
    t.style.borderColor = isError ? "var(--vermelho-critica)" : "var(--verde-terminal)"; 
    t.style.color = isError ? "var(--vermelho-critica)" : "var(--verde-terminal)"; 
    t.style.boxShadow = isError ? "0 0 15px rgba(255, 51, 51, 0.3)" : "0 0 15px rgba(66, 255, 66, 0.2)"; 
    t.style.display = 'block'; 
    if(isError) window.somErro(); else window.somClick();
    setTimeout(() => { t.style.display = 'none'; }, 3500);
}

window.chamarConfirmacao = function(mensagem, callback) { window.somErro(); document.getElementById('msg-confirmacao').innerText = mensagem; window.confirmCallback = callback; document.getElementById('modal-confirmacao').style.display = 'block'; }
if(document.getElementById('btn-confirma-sim')) document.getElementById('btn-confirma-sim').onclick = () => { document.getElementById('modal-confirmacao').style.display = 'none'; if(window.confirmCallback) window.confirmCallback(); }
if(document.getElementById('btn-confirma-nao')) document.getElementById('btn-confirma-nao').onclick = () => { document.getElementById('modal-confirmacao').style.display = 'none'; }
window.getNomePatente = function(nivel) { if(nivel == 1) return "RECRUTA"; if(nivel == 2) return "AGENTE"; if(nivel == 3) return "AGENTE ESPECIAL"; if(nivel >= 4) return "FUNDADOR"; return "NOVATO"; }
window.mascaraData = function(input) { let v = input.value.replace(/\D/g, ""); if (v.length > 8) v = v.slice(0, 8); if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3"); else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2"); input.value = v; }

const configPericias = { "Atletismo": { attr: "FOR", penalty: false }, "Luta": { attr: "FOR", penalty: false }, "Acrobacia": { attr: "AGI", penalty: false }, "Furtividade": { attr: "AGI", penalty: false }, "Iniciativa": { attr: "AGI", penalty: false }, "Pilotagem": { attr: "AGI", penalty: true }, "Pontaria": { attr: "AGI", penalty: false }, "Reflexos": { attr: "AGI", penalty: false }, "Crime": { attr: "AGI", penalty: false }, "Atualidades": { attr: "INT", penalty: false }, "Ciências": { attr: "INT", penalty: true }, "Investigação": { attr: "INT", penalty: false }, "Medicina": { attr: "INT", penalty: true }, "Ocultismo": { attr: "INT", penalty: true }, "Profissão": { attr: "INT", penalty: true }, "Tecnologia": { attr: "INT", penalty: true }, "Sobrevivência": { attr: "INT", penalty: false }, "Tática": { attr: "INT", penalty: true }, "Adestramento": { attr: "PRE", penalty: true }, "Artes": { attr: "PRE", penalty: true }, "Diplomacia": { attr: "PRE", penalty: false }, "Enganação": { attr: "PRE", penalty: false }, "Intimidação": { attr: "PRE", penalty: false }, "Intuição": { attr: "PRE", penalty: false }, "Religião": { attr: "PRE", penalty: true }, "Vontade": { attr: "PRE", penalty: false }, "Percepção": { attr: "PRE", penalty:false }, "Fortitude": { attr: "VIG", penalty: false } };
window.periciasBase = Object.keys(configPericias).sort();

window.rolarPericia = function(nome, nivel, qtdDados) { let conf = configPericias[nome]; let mod = 0; if (nivel == 1) mod = 3; else if (nivel == 2) mod = 6; else if (nivel == 0 && conf && conf.penalty) mod = -3; let numDados = parseInt(qtdDados) || 0; let rolls = []; let rCount = numDados > 0 ? numDados : 2; for(let i=0; i<rCount; i++) { rolls.push(Math.floor(Math.random() * 20) + 1); } let selectedRoll = numDados > 0 ? Math.max(...rolls) : Math.min(...rolls); let total = selectedRoll + mod; let strRolls = rolls.join(', '); let calcText = numDados > 0 ? `[${numDados}d20] (${strRolls}) -> Maior: ${selectedRoll} | Mod: ${mod >= 0 ? '+'+mod : mod}` : `[2d20] (${strRolls}) -> Menor: ${selectedRoll} | Mod: ${mod >= 0 ? '+'+mod : mod}`; window.mostrarRolagem(nome, selectedRoll, mod, total, calcText); }
window.mostrarRolagem = function(periciaNome, roll, mod, total, calcText) { const toast = document.getElementById('dice-toast'); document.getElementById('toast-pericia').innerText = "TESTE DE " + periciaNome; document.getElementById('toast-total').innerText = total; document.getElementById('toast-calc').innerText = calcText; toast.style.display = 'flex'; window.somSucesso(); setTimeout(() => { toast.style.display = 'none'; }, 4000); }

window.carregarDadosDaNuvem = async function() {
    try {
        const docRefInventario = await window.refSessao.doc("inventario").get(); 
        if(docRefInventario.exists && docRefInventario.data().lista) window.bancoInventario = docRefInventario.data().lista;
        const docRefUsuarios = await window.refSessao.doc("usuarios").get(); if(docRefUsuarios.exists && docRefUsuarios.data().lista) window.bancoUsuarios = docRefUsuarios.data().lista;
        const docRefAgentes = await window.refSessao.doc("agentes").get(); if(docRefAgentes.exists && docRefAgentes.data().lista) window.bancoAgentes = docRefAgentes.data().lista;
        const docRefMissoes = await window.refSessao.doc("missoes").get(); if(docRefMissoes.exists && docRefMissoes.data().lista) window.incidentesGoiadas = docRefMissoes.data().lista;
        const docRefArquivos = await window.refSessao.doc("arquivos").get(); if(docRefArquivos.exists && docRefArquivos.data().lista) window.bancoArquivos = docRefArquivos.data().lista;
        const docRefRelatorios = await window.refSessao.doc("relatorios").get(); if(docRefRelatorios.exists && docRefRelatorios.data().lista) window.bancoRelatorios = docRefRelatorios.data().lista;
        const docRefEntidades = await window.refSessao.doc("entidades").get(); if(docRefEntidades.exists && docRefEntidades.data().lista) window.bancoEntidades = docRefEntidades.data().lista;
        
        window.bancoUsuarios.forEach(u => { if(u.agenteVinc && !Array.isArray(u.agentesVinc)) { u.agentesVinc = [u.agenteVinc]; delete u.agenteVinc; } if(!u.agentesVinc) u.agentesVinc = []; });
        window.bancoAgentes.forEach(ag => { if(ag.aprovado === undefined) ag.aprovado = true; });
    } catch(e) { console.error("Erro ao puxar dados da sessão:", e); }
}

window.salvarBancos = async function() {
    try {
        await window.refSessao.doc("inventario").set({ lista: window.bancoInventario });
        await window.refSessao.doc("missoes").set({ lista: window.incidentesGoiadas });
        await window.refSessao.doc("agentes").set({ lista: window.bancoAgentes });
        await window.refSessao.doc("arquivos").set({ lista: window.bancoArquivos });
        await window.refSessao.doc("usuarios").set({ lista: window.bancoUsuarios });
        await window.refSessao.doc("relatorios").set({ lista: window.bancoRelatorios });
        await window.refSessao.doc("entidades").set({ lista: window.bancoEntidades });
        
        if (window.usuarioAtual && window.usuarioAtual.perfil === 'admin') {
            const user = firebase.auth().currentUser;
            if(user) { await db.collection("sessoes").doc(window.SESSAO_ATUAL).set({ ultimaAlteracao: Date.now(), ownerUid: user.uid }, { merge: true }); }
        }
        window.atualizarCentroComando(); window.renderizarChatTabs();
        if(typeof window.syncMissionsToGlobe === 'function') window.syncMissionsToGlobe();
    } catch (e) { window.mostrarSysToast("ERRO: BANCO DE DADOS CHEIO OU PERMISSÃO NEGADA.", true); }
}

window.atualizarCentroComando = function() {
    if(!window.usuarioLogado) return;
    let ativos = 0, criticos = 0, emCampo = 0, mia = 0, kia = 0;
    window.incidentesGoiadas.forEach(c => { if(c.status === 'ATIVA') { ativos++; if(c.ameaca === 'CRÍTICA') criticos++; } });
    window.bancoAgentes.forEach(ag => { if(ag.status === 'ATIVO' && ag.aprovado) emCampo++; else if(ag.status.includes('M.I.A')) mia++; else if(ag.status.includes('K.I.A')) kia++; });
    let hudAtivos = document.getElementById('hud-ativos'); if(hudAtivos) hudAtivos.innerText = ativos; 
    let hudCriticos = document.getElementById('hud-criticos'); if(hudCriticos) hudCriticos.innerText = criticos;
    let hudEmCampo = document.getElementById('hud-emcampo'); if(hudEmCampo) hudEmCampo.innerText = emCampo; 
    let hudMia = document.getElementById('hud-mia'); if(hudMia) hudMia.innerText = mia; 
    let hudKia = document.getElementById('hud-kia'); if(hudKia) hudKia.innerText = kia;
}

else{window.mostrarToastSessao("INSIRA UM ID DE ACESSO.",true);}}

window.addEventListener('hashchange', function() {
    if(!window.usuarioLogado) return;
    const hash = window.location.hash.replace('#', '') || (window.usuarioAtual.perfil === 'admin' ? 'mapa' : 'perfil');
    window.fecharModal(); 
    document.querySelectorAll('.aba-secao').forEach(el => el.style.display = 'none'); 
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('ativo'));
    const abaAtiva = document.getElementById('aba-' + hash); 
    const linkAtivo = document.getElementById('link-' + hash);
    if(abaAtiva) abaAtiva.style.display = 'block'; 
    if(linkAtivo) linkAtivo.classList.add('ativo');
    if(hash === 'agentes' || hash === 'memorial') { if(typeof window.renderizarAgentes === 'function') window.renderizarAgentes(); if(typeof window.renderizarMemorialModular === 'function') window.renderizarMemorialModular(); }
    if(hash === 'perfil') window.renderizarPerfil();
    if(hash === 'entidades') window.renderEntidades();
    if(hash === 'arquivos') window.renderArquivos();
    if(hash === 'registros') window.renderUsuarios();
    if(hash === 'relatorios') window.renderRelatorios();
    if(hash !== 'ficha-completa') window.agenteSendoEditado = null; 
    if(hash === 'inventario' && typeof window.renderInventario === 'function') window.renderInventario();
});

// CHAT
window.iniciarListenerChats = function() {
    if(!window.chatAtivo) window.chatAtivo = 'global';
    if(window.chatUnsubscribe) window.chatUnsubscribe();
    window.chatUnsubscribe = window.refSessao.doc("chats").onSnapshot(doc => {
        if(doc.exists) { window.chatsLocais = doc.data(); } else { window.chatsLocais = {}; window.refSessao.doc("chats").set({}); }
        window.renderizarMensagensChat();
    });
}
window.toggleChatWindow = function() { let win = document.getElementById('chat-window'); win.style.display = win.style.display === 'flex' ? 'none' : 'flex'; if(win.style.display==='flex'){window.renderizarChatTabs();window.renderizarMensagensChat();} }
window.mudarChatTab = function(tab) { window.chatAtivo = tab; window.renderizarChatTabs(); window.renderizarMensagensChat(); }
window.renderizarChatTabs = function(){let header=document.getElementById('chat-header-tabs');if(!header)return;let html=`<div class="chat-tab ${window.chatAtivo==='global'?'active':''}" onclick="mudarChatTab('global')">GLOBAL</div>`;if(window.usuarioAtual?.perfil==='admin'){let agentes=[];if(typeof agentesLocais!=='undefined'){agentes=agentesLocais.map(a=>a.nome||a.id).filter(Boolean);}else if(typeof window.bancoAgentes!=='undefined'){agentes=Object.values(window.bancoAgentes).map(a=>a.nome||a.id).filter(Boolean);}agentes.forEach(nome=>{let canal='fundador_'+nome;html+=`<div class="chat-tab ${window.chatAtivo===canal?'active':''}" onclick="mudarChatTab('${canal}')">${nome}</div>`;});}else{let meuNome=window.usuarioAtual?.agentesVinc?.[0]||window.usuarioAtual?.id;let canal='fundador_'+meuNome;html+=`<div class="chat-tab ${window.chatAtivo===canal?'active':''}" onclick="mudarChatTab('${canal}')">FUNDADOR</div>`;}window.incidentesGoiadas.forEach(caso=>{if(caso.status==='ATIVA'){let agentesCaso=caso.agente?caso.agente.split(',').map(a=>a.trim()):[];let permitido=window.usuarioAtual.perfil==='admin'||window.usuarioAtual.agentesVinc?.some(a=>agentesCaso.includes(a));if(permitido){html+=`<div class="chat-tab ${window.chatAtivo===caso.cod?'active':''}" onclick="mudarChatTab('${caso.cod}')">${caso.cod}</div>`;}}});header.innerHTML=html;}
window.renderizarMensagensChat = function() { let area = document.getElementById('chat-messages-area'); let mensagens = window.chatsLocais[window.chatAtivo] || []; let html = ''; mensagens.forEach(m => { let isMe = (m.autor === 'FUNDADOR' && window.usuarioAtual.perfil === 'admin') || (window.usuarioAtual.agentesVinc.includes(m.autor) || m.autor === window.usuarioAtual.id); html += `<div class="chat-msg ${isMe?'me':''}"><span class="autor">${m.autor}</span>${m.texto}</div>`; }); area.innerHTML = html; area.scrollTop = area.scrollHeight; }
window.enviarMensagemChat = async function(){let input=document.getElementById('chat-input-text');let msg=input.value.trim();if(!msg)return;input.value='';let nomeAutor=window.usuarioAtual.perfil==='admin'?'FUNDADOR':(window.usuarioAtual.agentesVinc.length>0?window.usuarioAtual.agentesVinc[0]:window.usuarioAtual.id);await window.refSessao.doc("chats").set({[window.chatAtivo]:firebase.firestore.FieldValue.arrayUnion({autor:nomeAutor,texto:msg,tempo:Date.now()})},{merge:true});}

// CRIAÇÃO DE MISSÃO (GLOBO 3D)
window.abrirFormularioCriacao = function(lat, lng) {
    if(typeof window.posicionarModalCentro === 'function') window.posicionarModalCentro();
    window.base64TempMedia = "";
    document.getElementById('titulo-modal').innerText = "NOVA AMEAÇA DETECTADA";
    let checkboxes = typeof window.gerarListaAgentesCheckboxes === 'function' ? window.gerarListaAgentesCheckboxes() : '';
    let html = '<div class="dossie-linha"><span>MUNICÍPIO / LOCAL</span><input type="text" id="novo-cidade"></div>';
    html += '<div class="dossie-linha-grid"><div><span>TÍTULO DA OPERAÇÃO</span><input type="text" id="novo-titulo"></div><div><span>Nº DE VAGAS</span><input type="number" id="novo-vagas" value="4"></div></div>';
    html += '<div class="dossie-linha"><span>DESIGNAR AGENTES DISPONÍVEIS</span>' + checkboxes + '</div>';
    html += '<div class="dossie-linha"><span>EVIDÊNCIA (FOTO/VÍDEO)</span><input type="file" accept="image/*,video/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div>';
    html += '<div class="dossie-linha"><span>AMEAÇA</span><select id="novo-ameaca"><option value="MÉDIA">MÉDIA</option><option value="ALTA">ALTA</option><option value="CRÍTICA">CRÍTICA</option></select></div>';
    html += '<div class="dossie-linha"><span>BRIEFING / RESUMO</span><textarea id="novo-resumo"></textarea></div>';
    html += '<button class="btn-fbi-action" onclick="window.criarNovoCaso(' + lat + ', ' + lng + ')">CRIAR MISSÃO</button>';
    document.getElementById('conteudo-modal').innerHTML = html;
    document.getElementById('modal-dinamico').style.display = 'flex';
};

window.criarNovoCaso = function(lat, lng) {
    if(typeof window.somSucesso === 'function') window.somSucesso();
    window.incidentesGoiadas.push({
        cidade: document.getElementById('novo-cidade').value || "Desconhecida",
        coordenadas: [lat, lng],
        cod: "CASE_" + Math.floor(Math.random()*1000),
        titulo: document.getElementById('novo-titulo').value || "Anomalia",
        vagas: document.getElementById('novo-vagas').value || 4,
        voluntarios: [],
        ameaca: document.getElementById('novo-ameaca').value,
        agente: typeof window.getAgentesSelecionados === 'function' ? window.getAgentesSelecionados() : "Nenhum",
        imagem: window.base64TempMedia,
        resumo: document.getElementById('novo-resumo').value || "",
        status: "ATIVA"
    });
    if(typeof window.salvarBancos === 'function') window.salvarBancos();
    if(typeof window.fecharModal === 'function') window.fecharModal();
    if(typeof window.syncMissionsToGlobe === 'function') window.syncMissionsToGlobe();
};



// =========================================================
// FUNÇÕES DE RENDERIZAÇÃO E MODAIS (Restauradas)
// =========================================================

window.lidarComUploadMidia = function(event) {
    const file = event.target.files[0]; if(!file) return;
    const preview = document.getElementById('preview-upload');
    const reader = new FileReader();
    reader.onload = e => {
        if(file.type.startsWith('video/')) {
            window.base64TempMedia = e.target.result;
            if(preview) preview.innerHTML = `<span style="color:var(--amber-alert)">Vídeo carregado.</span>`;
            return;
        }
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 800; let w = img.width, h = img.height;
            if(w > h && w > MAX) { h *= MAX/w; w = MAX; } else if(h > MAX) { w *= MAX/h; h = MAX; }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            window.base64TempMedia = canvas.toDataURL('image/jpeg', 0.7);
            if(preview) preview.innerHTML = `<img src="${window.base64TempMedia}" style="max-width:100%;border:1px solid #333;border-radius:6px;">`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.renderizarMidia = function(base64Str) {
    if(!base64Str) return '';
    if(base64Str.startsWith('data:video')) return `<video controls class="img-missao"><source src="${base64Str}"></video>`;
    return `<img src="${base64Str}" class="img-missao">`;
}

window.gerarListaAgentesCheckboxes = function(sel_str = "") {
    let html = `<div class="agentes-lista-checkbox">`;
    let ativos = window.bancoAgentes.filter(a => a.status === 'ATIVO' && a.aprovado !== false);
    if(ativos.length === 0) return `<div class="agentes-lista-checkbox"><span style="color:#666; font-size:0.7rem;">Nenhum agente aprovado.</span></div>`;
    ativos.forEach(ag => { let ch = sel_str && sel_str.includes(ag.nome) ? "checked" : ""; html += `<label><input type="checkbox" class="check-agente-missao" value="${ag.nome}" ${ch}> ${ag.nome} (${ag.id_ilustrativo || 'N/A'})</label>`; });
    return html + `</div>`;
}

window.getAgentesSelecionados = function() {
    let checks = document.querySelectorAll('.check-agente-missao');
    let nomes = []; checks.forEach(c => { if(c.checked) nomes.push(c.value); });
    return nomes.length > 0 ? nomes.join(', ') : "Nenhum";
}

window.renderizarPerfil = function() {
    const grid = document.getElementById('grid-meu-perfil');
    const aba = document.getElementById('aba-perfil');
    if (!grid) return;

    if (aba && !document.getElementById('btn-criar-ficha-perfil')) {
        let btn = document.createElement('button');
        btn.id = 'btn-criar-ficha-perfil';
        btn.className = 'btn-fbi-action';
        btn.style.cssText = 'position: absolute; right: 20px; top: 15px; width: auto; padding: 8px 15px; margin: 0; font-size: 0.8rem;';
        btn.innerHTML = '+ REGISTRAR AGENTE';
        btn.onclick = window.abrirFormularioAgente;
        aba.appendChild(btn);
    }

    let html = ``; let temFicha = false;
    window.bancoAgentes.forEach((ag, index) => {
        if(window.usuarioAtual.agentesVinc.includes(ag.nome)) {
            temFicha = true;
            let badgePendente = !ag.aprovado ? '<span class="tag-pendente">EM ANÁLISE</span>' : '';
            let fotoAgente = ag.foto || ag.imagem || "";
            let fotoHtml = fotoAgente ? `<div class="foto-agente-fbi"><img src="${fotoAgente}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>` : `<div class="foto-agente-fbi"></div>`;
            let btnAction = `<button onclick="abrirFichaCompleta(${index})" class="btn-fbi-action secundario" style="padding:6px 15px; font-size:0.7rem; margin:0; width:auto;">FICHA COMPLETA</button>`;
            html += `<div class="fbi-card ${ag.status !== 'ATIVO' ? 'memorial' : ''}" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 15px; width: 220px; box-sizing: border-box;"> ${fotoHtml} <div style="width:100%; margin-top:10px;"> <h3 style="${ag.status !== 'ATIVO' ? 'color:#ccc;' : 'color:#fff;'} margin: 0 0 5px 0;">${ag.nome}</h3> <span style="font-size:0.65rem; color:var(--verde-terminal); margin-bottom:5px; display:block;">ID: ${ag.id_ilustrativo || 'N/A'}</span> ${ag.status !== 'ATIVO' ? `<span class="${ag.status.includes('M.I.A')?'tag-mia':'tag-morte'}">${ag.status}</span>` : `<p style="color:var(--amber-alert); font-size:0.75rem; font-weight:bold; margin: 0 0 10px 0;">${(ag.cargo||'AGENTE').toUpperCase()}</p>`} ${badgePendente} <div style="display:flex; flex-direction:column; gap:8px; align-items:center; margin-top:10px;"> ${btnAction} </div> </div> </div>`;
        }
    });
    if(!temFicha) html += "<p style='color:var(--amber-alert); padding: 20px; grid-column: 1 / -1; margin-top: 20px;'>Nenhuma ficha vinculada.</p>";
    grid.innerHTML = html;
}

window.abrirFormularioAgente = function() {
    window.posicionarModalCentro(); window.base64TempMedia = "";
    document.getElementById('titulo-modal').innerText = "CADASTRAR AGENTE";
    document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha-grid"><div><span>NOME COMPLETO</span><input type="text" id="ag-nome"></div><div><span>CARGO</span><input type="text" id="ag-cargo"></div></div><div class="dossie-linha"><span>FOTO (ID)</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarNovoAgente()">CRIAR FICHA VAZIA</button>`;
    document.getElementById('modal-dinamico').style.display = 'flex';
}

window.salvarNovoAgente = function() {
    let p = {}; window.periciasBase.forEach(x => p[x] = 0);
    let isAprovado = (window.usuarioAtual.perfil === 'admin');
    window.bancoAgentes.push({ id_ilustrativo: "AGT-" + Math.floor(1000 + Math.random() * 9000), nome: (document.getElementById('ag-nome').value || "DESCONHECIDO").toUpperCase(), cargo: (document.getElementById('ag-cargo').value || "AGENTE").toUpperCase(), idade: 25, altura: "1.75m", nacionalidade: "", data_nasc: "", status: "ATIVO", foto: window.base64TempMedia||"", resumo: "", atributos: {for:1, agi:1, int:1, pre:1, vig:1}, pericias: p, aprovado: isAprovado });
    if(window.usuarioAtual.perfil !== 'admin') { window.usuarioAtual.agentesVinc.push(window.bancoAgentes[window.bancoAgentes.length - 1].nome); let idx = window.bancoUsuarios.findIndex(u => u.id === window.usuarioAtual.id); if(idx !== -1) window.bancoUsuarios[idx].agentesVinc.push(window.bancoAgentes[window.bancoAgentes.length - 1].nome); }
    window.salvarBancos(); window.fecharModal(); if(typeof window.renderizarAgentesModular === 'function') window.renderizarAgentesModular(); else if(typeof window.renderizarAgentes === 'function') window.renderizarAgentes(); 
    if(!isAprovado){ window.mostrarSysToast("ENVIADA PARA APROVAÇÃO."); window.location.hash="#perfil"; }
}

window.abrirFichaCompleta = function(indexAgente, editMode = false) {
    window.agenteSendoEditado = indexAgente; const ag = window.bancoAgentes[indexAgente];
    if(!ag.atributos) ag.atributos = { for:1, agi:1, int:1, pre:1, vig:1 };
    if(!ag.pericias) { ag.pericias = {}; window.periciasBase.forEach(p => ag.pericias[p] = 0); }
    if(!ag.data_nasc) ag.data_nasc = ""; if(!ag.nacionalidade) ag.nacionalidade = "";
    let isOwnerOrAdmin = window.usuarioAtual.perfil === 'admin' || window.usuarioAtual.agentesVinc.includes(ag.nome);
    
    let renderCampoInput = (field, val, type='text', extra='') => editMode ? `<input type="${type}" id="ficha_field_${field}" value="${val}" ${extra}>` : `<strong style="display:block; padding:5px 0;">${val}</strong>`;
    let renderCampoText = (field, val) => editMode ? `<textarea id="ficha_field_${field}" style="background:transparent; border:1px solid #333; color:#fff; font-size:0.85rem; padding:5px; height:80px; width:100%;">${val}</textarea>` : `<p style="font-weight:normal; font-size:0.8rem; white-space:pre-wrap; padding:5px 0;">${val}</p>`;
    let renderCampoAttr = (attr, val) => editMode ? `<input type="number" id="ficha_attr_${attr}" value="${val}" class="ficha-attr-input">` : `<span class="ficha-attr-val" style="padding:10px; display:inline-block;">${val}</span>`;
    
    let fotoAgente = ag.foto || ag.imagem || "";
    let fotoHtml = fotoAgente ? `<img src="${fotoAgente}" class="ficha-foto-grande">` : `<div class="ficha-foto-grande" style="display:flex;align-items:center;justify-content:center;color:#333;">SEM FOTO</div>`;
    
    let periciasHtml = ''; window.periciasBase.forEach(p => { let lvl = ag.pericias[p] || 0; let conf = window.configPericias ? window.configPericias[p] : {attr:'FOR', penalty:false}; let attrVal = ag.atributos[conf.attr.toLowerCase()] || 1; let selectHtml = editMode ? `<select onchange="updatePericiaLocal('${p}', this.value)" style="width:55px; padding:2px; margin:0; font-size:0.7rem; border-color:#333;"><option value="0" ${lvl==0?'selected':''}>Des.</option><option value="1" ${lvl==1?'selected':''}>Tre.</option><option value="2" ${lvl==2?'selected':''}>Vet.</option></select>` : ''; periciasHtml += `<div class="ficha-pericia-item pericia-${lvl}"><button class="btn-roll-pericia" onclick="rolarPericia('${p}', ${lvl}, ${attrVal})">[${conf.attr}] ${p}</button>${selectHtml}</div>`; });
    
    let adminAprovacaoPanel = (!ag.aprovado && window.usuarioAtual.perfil === 'admin') ? `<div style="background:#1c2630; padding:15px; margin-bottom:15px; border-left:4px solid var(--amber-alert); display:flex; gap:10px;"><button class="btn-fbi-action" style="background:var(--verde-terminal); color:#000; margin:0;" onclick="window.aprovarAgenteModular(${indexAgente})">APROVAR FICHA</button><button class="btn-fbi-action btn-fbi-delete" style="margin:0;" onclick="window.excluirAgenteDefinitivo(${indexAgente})">REJEITAR</button></div>` : '';
    let editBtnPanel = (!editMode && isOwnerOrAdmin) ? `<button class="btn-fbi-action" style="background:var(--amber-alert); color:#000; width:100%; padding:10px; margin-top:15px;" onclick="abrirFichaCompleta(${indexAgente}, true)"><i class="fa-solid fa-pen"></i> ALTERAR FICHA</button>` : '';
    
    let htmlCompleto = ` <div class="ficha-layout"> <div> ${adminAprovacaoPanel} <div class="ficha-bloco"><div class="ficha-bloco-titulo">FOTO DE IDENTIFICAÇÃO</div>${fotoHtml}<div class="ficha-id-badge"><span style="color:var(--amber-alert); font-size:0.7rem; font-weight:bold; display:block;">AGENTE ${ag.status !== 'ATIVO' ? 'INATIVO' : 'ESPECIAL'}</span><h3 style="color:#fff; text-transform:uppercase; margin:5px 0;">${ag.nome}</h3><span style="font-family:monospace; color:#888;">ID: ${ag.id_ilustrativo || 'N/A'}</span></div></div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">INFORMAÇÕES PESSOAIS</div><div class="ficha-dado-inline"><span>DATA NASC.</span>${renderCampoInput('data_nasc', ag.data_nasc, 'text', 'oninput="mascaraData(this)" placeholder="DD/MM/AAAA" maxlength="10"')}</div><div class="ficha-dado-inline"><span>IDADE</span>${renderCampoInput('idade', ag.idade, 'number')}</div><div class="ficha-dado-inline"><span>NACIONALIDADE</span>${renderCampoInput('nacionalidade', ag.nacionalidade)}</div><div class="ficha-dado-inline"><span>ALTURA</span>${renderCampoInput('altura', ag.altura)}</div></div> </div> <div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">IDENTIFICAÇÃO OPERACIONAL</div><div class="ficha-dado-inline"><span>NOME COMPLETO</span>${renderCampoInput('nome', ag.nome)}</div><div class="ficha-dado-inline"><span>CARGO</span>${renderCampoInput('cargo', ag.cargo || 'AGENTE')}</div><div class="ficha-dado-inline"><span>STATUS</span><strong style="color:${ag.status==='ATIVO'?'var(--verde-terminal)':'var(--vermelho-critica)'}">${ag.status}</strong></div></div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">HISTÓRICO E OBSERVAÇÕES</div><div class="ficha-dado-bloco">${renderCampoText('resumo', ag.resumo)}</div></div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">PERÍCIAS DE CAMPO</div><div class="ficha-pericias-grid">${periciasHtml}</div></div> </div> <div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">ATRIBUTOS BASE</div><div class="ficha-atributos-container"><div class="ficha-attr-box">${renderCampoAttr('for', ag.atributos.for)}<span class="ficha-attr-name">FOR</span></div><div class="ficha-attr-box">${renderCampoAttr('agi', ag.atributos.agi)}<span class="ficha-attr-name">AGI</span></div><div class="ficha-attr-box">${renderCampoAttr('int', ag.atributos.int)}<span class="ficha-attr-name">INT</span></div><div class="ficha-attr-box">${renderCampoAttr('pre', ag.atributos.pre)}<span class="ficha-attr-name">PRE</span></div><div class="ficha-attr-box">${renderCampoAttr('vig', ag.atributos.vig)}<span class="ficha-attr-name">VIG</span></div></div></div><div class="ficha-bloco" style="margin-top:15px;border-color:var(--amber-alert);"><div class="ficha-bloco-titulo" style="color:var(--amber-alert);"><i class="fa-solid fa-toolbox"></i> EQUIPAMENTO OPERACIONAL</div><div id="inventario-agente">${typeof window.gerarHtmlInventarioDoAgente==='function'?window.gerarHtmlInventarioDoAgente(ag.nome):''}</div></div>${editBtnPanel}</div> </div>`;
    document.getElementById('conteudo-ficha-completa').innerHTML = htmlCompleto;
    document.querySelectorAll('.btn-salvar-ficha').forEach(b => { b.style.display = editMode ? 'inline-block' : 'none'; });
    document.querySelectorAll('.aba-secao').forEach(el => el.style.display = 'none'); document.getElementById('aba-ficha-completa').style.display = 'block'; window.location.hash = "#ficha-completa";
}

window.voltarDaFicha = function() { if(window.usuarioAtual.perfil === 'admin') window.location.hash = "#agentes"; else window.location.hash = "#perfil"; }
window.updatePericiaLocal = function(pericia, val) { if(!window.periciasTempFicha) window.periciasTempFicha = {}; window.periciasTempFicha[pericia] = parseInt(val); }
window.salvarAlteracoesFichaAtual = function() { if(window.agenteSendoEditado === null) return; const ag = window.bancoAgentes[window.agenteSendoEditado]; ['for','agi','int','pre','vig'].forEach(attr => { let el = document.getElementById('ficha_attr_' + attr); if(el) ag.atributos[attr] = parseInt(el.value) || 1; }); ['nome','cargo','data_nasc','idade','nacionalidade','altura','resumo'].forEach(f => { let el = document.getElementById('ficha_field_' + f); if(el) { if (f === 'nome' || f === 'cargo') ag[f] = el.value.toUpperCase(); else ag[f] = el.value; } }); if(window.periciasTempFicha) Object.keys(window.periciasTempFicha).forEach(p => { ag.pericias[p] = window.periciasTempFicha[p]; }); window.periciasTempFicha = {}; if (window.usuarioAtual.perfil !== 'admin') { ag.aprovado = false; window.mostrarSysToast("ENVIADO PARA APROVAÇÃO."); window.voltarDaFicha(); } else { ag.aprovado = true; window.mostrarSysToast("SALVO."); window.abrirFichaCompleta(window.agenteSendoEditado); } window.salvarBancos(); }

window.editarAgenteRapido = function(index) {
    window.posicionarModalCentro(); window.indexItemSelecionado = index; const ag = window.bancoAgentes[index]; window.base64TempMedia = ag.foto || "";
    document.getElementById('titulo-modal').innerText = "OPERAÇÕES: " + ag.nome;
    document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha"><span>NOVA FOTO</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarFotoEStatusAgente()">ATUALIZAR FOTO</button><div style="display:flex; gap:10px; margin-top:10px;"><button class="btn-fbi-action btn-fbi-delete" onclick="declararBaixaAgente('K.I.A (MORTO)')">MARCAR K.I.A.</button><button class="btn-fbi-action" style="background:#ffb000; color:#000;" onclick="declararBaixaAgente('M.I.A (DESAPARECIDO)')">MARCAR M.I.A.</button></div>${ag.status !== 'ATIVO' ? `<button class="btn-fbi-action secundario" style="margin-top:10px;" onclick="declararBaixaAgente('ATIVO')">RESTAURAR COMO ATIVO</button>` : ''} <button class="btn-fbi-action btn-fbi-delete" style="width:100%; margin-top:15px;" onclick="window.excluirAgenteDefinitivo(${index})">EXCLUIR FICHA PERMANENTEMENTE</button>`;
    document.getElementById('modal-dinamico').style.display = 'flex';
}
window.salvarFotoEStatusAgente = function(){ const ag = window.bancoAgentes[window.indexItemSelecionado]; if(window.base64TempMedia){ ag.foto=window.base64TempMedia; } window.salvarBancos(); if(typeof window.renderizarAgentesModular === 'function') window.renderizarAgentesModular(); else if(typeof window.renderizarAgentes === 'function') window.renderizarAgentes(); window.fecharModal(); window.mostrarSysToast("FOTO ATUALIZADA."); }
window.declararBaixaAgente = function(s) { window.bancoAgentes[window.indexItemSelecionado].status = s; window.salvarBancos(); window.fecharModal(); if(typeof window.renderizarAgentesModular === 'function') window.renderizarAgentesModular(); else if(typeof window.renderizarAgentes === 'function') window.renderizarAgentes(); }
window.excluirAgenteDefinitivo = function(idx) { window.chamarConfirmacao("APAGAR FICHA PERMANENTEMENTE?", () => { window.bancoAgentes.splice(idx, 1); window.salvarBancos(); window.fecharModal(); if(typeof window.renderizarAgentesModular === 'function') window.renderizarAgentesModular(); else if(typeof window.renderizarAgentes === 'function') window.renderizarAgentes(); window.location.hash = "#agentes"; }); }

// --- ENTIDADES ---
window.getCorElemento = function(ele) { if(ele==='SANGUE') return 'var(--ele-sangue)'; if(ele==='MORTE') return 'var(--ele-morte)'; if(ele==='ENERGIA') return 'var(--ele-energia)'; if(ele==='CONHECIMENTO') return 'var(--ele-conhecimento)'; return 'var(--ele-medo)'; }
window.renderEntidades = function(){
    const grid=document.getElementById("grid-entidades"); if(!grid) return; let html="";
    window.bancoEntidades.forEach((ent,idx)=>{
        if(!ent.aprovado && window.usuarioAtual.perfil!=="admin") return;
        let fotoHtml=ent.foto?`<div class="foto-agente-fbi"><img src="${ent.foto}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`:`<div class="foto-agente-fbi"></div>`;
        let corElem=window.getCorElemento(ent.elemento);
        let descHtml=ent.descricao?`<div style="font-size:.75rem;color:#a6b7c9;margin-top:12px;border-top:1px dashed #1c2630;padding-top:10px;white-space:normal;word-break:break-word;overflow-wrap:anywhere;max-height:90px;overflow:auto;">${ent.descricao}</div>`:'';
        let btnAdmin=window.usuarioAtual.perfil==="admin"?`<div style="display:flex;gap:10px;margin-top:15px;"><button class="btn-fbi-action secundario" style="margin:0;padding:6px;flex:1;" onclick="editarEntidade(${idx})">EDITAR</button><button class="btn-fbi-action btn-fbi-delete" style="margin:0;padding:6px;flex:1;" onclick="apagarEntidade(${idx})">REMOVER</button></div>`:'';
        html+=`<div class="fbi-card" style="border-left:4px solid ${corElem};width:340px;display:flex;flex-direction:column;padding:18px;box-sizing:border-box;"><div style="display:flex;gap:15px;align-items:flex-start;">${fotoHtml}<div style="flex:1;min-width:0;"><h3 style="color:#fff;margin:0 0 8px 0;word-break:break-word;">${ent.nome}</h3><span class="tag-elemento" style="background:${corElem};color:#fff;">${ent.elemento}</span><p style="color:var(--vermelho-critica);font-size:.75rem;font-weight:bold;margin-top:10px;">NÍVEL DE AMEAÇA: ${ent.vd}</p></div></div>${descHtml}${btnAdmin}</div>`;
    });
    grid.innerHTML=html;
}
window.abrirFormularioEntidade = function(){
    window.posicionarModalCentro(); window.base64TempMedia="";
    document.getElementById("titulo-modal").innerText="CATALOGAR NOVA AMEAÇA";
    document.getElementById("conteudo-modal").innerHTML=`<div class="dossie-linha-grid"><div><span>NOME DA ENTIDADE</span><input type="text" id="nova-ent-nome"></div><div><span>NÍVEL DE AMEAÇA</span><input type="number" id="nova-ent-vd" value="10"></div></div><div class="dossie-linha"><span>ELEMENTO PRINCIPAL</span><select id="nova-ent-elemento"><option value="SANGUE">SANGUE</option><option value="MORTE">MORTE</option><option value="ENERGIA">ENERGIA</option><option value="CONHECIMENTO">CONHECIMENTO</option><option value="MEDO">MEDO</option></select></div><div class="dossie-linha"><span>DESCRIÇÃO / COMPORTAMENTO</span><textarea id="nova-ent-desc" style="height:80px;"></textarea></div><div class="dossie-linha"><span>FOTO / REFERÊNCIA</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarNovaEntidade()">REGISTRAR NO BESTIÁRIO</button>`;
    document.getElementById('modal-dinamico').style.display="flex";
}
window.salvarNovaEntidade = function(){
    let aprovado=window.usuarioAtual.perfil==="admin";
    let nome=(document.getElementById("nova-ent-nome").value||"ENTIDADE DESCONHECIDA").toUpperCase();
    let vd=document.getElementById("nova-ent-vd").value||10;
    let elemento=document.getElementById("nova-ent-elemento").value;
    let descricao=document.getElementById("nova-ent-desc").value;
    window.bancoEntidades.push({nome:nome,vd:vd,elemento:elemento,descricao:descricao,foto:window.base64TempMedia||"",aprovado:aprovado});
    window.base64TempMedia=""; window.salvarBancos(); window.fecharModal(); window.renderEntidades();
    window.mostrarSysToast(aprovado?"AMEAÇA CATALOGADA.":"ENVIADA PARA APROVAÇÃO.");
}
window.editarEntidade = function(idx){
    window.indexItemSelecionado=idx; let ent=window.bancoEntidades[idx]; window.base64TempMedia=ent.foto||"";
    document.getElementById("titulo-modal").innerText="EDITAR AMEAÇA: "+ent.nome;
    document.getElementById("conteudo-modal").innerHTML=`<div class="dossie-linha-grid"><div><span>NOME DA ENTIDADE</span><input type="text" id="edit-ent-nome" value="${ent.nome}"></div><div><span>NÍVEL DE AMEAÇA</span><input type="number" id="edit-ent-vd" value="${ent.vd}"></div></div><div class="dossie-linha"><span>ELEMENTO PRINCIPAL</span><select id="edit-ent-elemento"><option value="SANGUE" ${ent.elemento==="SANGUE"?"selected":""}>SANGUE</option><option value="MORTE" ${ent.elemento==="MORTE"?"selected":""}>MORTE</option><option value="ENERGIA" ${ent.elemento==="ENERGIA"?"selected":""}>ENERGIA</option><option value="CONHECIMENTO" ${ent.elemento==="CONHECIMENTO"?"selected":""}>CONHECIMENTO</option><option value="MEDO" ${ent.elemento==="MEDO"?"selected":""}>MEDO</option></select></div><div class="dossie-linha"><span>DESCRIÇÃO</span><textarea id="edit-ent-desc" style="height:80px;">${ent.descricao||""}</textarea></div><div class="dossie-linha"><span>NOVA FOTO</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload">${ent.foto?`<img src="${ent.foto}" style="max-width:180px;border:1px solid #333;">`:''}</div></div><button class="btn-fbi-action" onclick="salvarEdicaoEntidade()">SALVAR ALTERAÇÕES</button>`;
    document.getElementById('modal-dinamico').style.display="flex";
}
window.salvarEdicaoEntidade = function() { let ent = window.bancoEntidades[window.indexItemSelecionado]; ent.nome = document.getElementById('edit-ent-nome').value.toUpperCase().trim() || "ENTIDADE DESCONHECIDA"; ent.vd = document.getElementById('edit-ent-vd').value || "0"; ent.elemento = document.getElementById('edit-ent-elemento').value; ent.descricao = document.getElementById('edit-ent-desc').value; if(window.base64TempMedia)ent.foto=window.base64TempMedia; window.base64TempMedia=""; window.salvarBancos(); window.fecharModal(); window.renderEntidades(); }
window.apagarEntidade = function(idx) { window.chamarConfirmacao("APAGAR REGISTRO DA ENTIDADE?", () => { window.bancoEntidades.splice(idx, 1); window.salvarBancos(); window.renderEntidades(); }); }

// --- ARQUIVOS ---
window.getReqLvlDoc = function(acesso) { if(acesso === 'SEGREDO') return 3; if(acesso === 'RESTRITO') return 2; return 1; }
window.renderArquivos = function() {
    let tbody = document.getElementById('tbody-arquivos'); if(!tbody) return;
    let arqsVisiveis = window.bancoArquivos.filter(a => a.status === 'APROVADO' || window.usuarioAtual.perfil === 'admin' || a.autorId === window.usuarioAtual.id);
    let html = "";
    arqsVisiveis.forEach((arq, idx) => {
        let idReal = window.bancoArquivos.findIndex(x => x === arq);
        let reqLvl = window.getReqLvlDoc(arq.acesso);
        let lockStatus = (window.usuarioAtual.perfil !== 'admin' && window.usuarioAtual.patente < reqLvl) ? '<i class="fa-solid fa-lock"></i> ' : '<i class="fa-solid fa-file-lines"></i> ';
        let corStatus = arq.status === 'APROVADO' ? 'var(--verde-terminal)' : (arq.status === 'REPROVADO' ? 'var(--vermelho-critica)' : 'var(--amber-alert)');
        html += `<tr onclick="abrirArquivo(${idReal})"><td><strong>${arq.cod}</strong></td><td style="color:var(--fbi-text);">${lockStatus}${arq.titulo}</td><td>${arq.acesso}</td><td style="color:${corStatus}; font-weight:bold;">${arq.status}</td></tr>`;
    });
    tbody.innerHTML = html;
}
window.abrirFormularioArquivo = function() {
    window.posicionarModalCentro(); window.base64TempMedia="";
    document.getElementById('titulo-modal').innerText="NOVO DOCUMENTO";
    document.getElementById('conteudo-modal').innerHTML=`<div class="dossie-linha-grid"><div><span>CÓDIGO DO DOCUMENTO</span><input type="text" id="novo-arq-cod" value="DOC-${Math.floor(1000+Math.random()*9000)}"></div><div><span>NÍVEL DE ACESSO</span><select id="novo-arq-acesso"><option value="LIBERADO">LIBERADO</option><option value="RESTRITO">RESTRITO</option><option value="SEGREDO">SEGREDO DA ORDEM</option></select></div></div><div class="dossie-linha"><span>TÍTULO</span><input type="text" id="novo-arq-titulo"></div><div class="dossie-linha"><span>CONTEÚDO</span><textarea id="novo-arq-conteudo" style="height:100px;"></textarea></div><div class="dossie-linha"><span>ANEXO (FOTO/VÍDEO)</span><input type="file" accept="image/*,video/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarNovoArquivo()">REGISTRAR DOCUMENTO</button>`;
    document.getElementById('modal-dinamico').style.display='flex';
}
window.salvarNovoArquivo = function() {
    let status = window.usuarioAtual.perfil === 'admin' ? 'APROVADO' : 'PENDENTE';
    window.bancoArquivos.push({ autorId: window.usuarioAtual.id, cod: document.getElementById('novo-arq-cod').value, titulo: document.getElementById('novo-arq-titulo').value, acesso: document.getElementById('novo-arq-acesso').value, midia: window.base64TempMedia, conteudo: document.getElementById('novo-arq-conteudo').value, status: status });
    window.salvarBancos(); window.fecharModal(); window.renderArquivos();
}
window.abrirArquivo = function(idx) {
    const arq = window.bancoArquivos[idx];
    let reqLvl = window.getReqLvlDoc(arq.acesso);
    if (window.usuarioAtual.perfil !== 'admin' && window.usuarioAtual.patente < reqLvl) { window.somErro(); return; }
    window.posicionarModalCentro(); window.base64TempMedia = arq.midia || "";
    document.getElementById('titulo-modal').innerText = "DOC: " + arq.cod;
    let midiaHtml = window.renderizarMidia(arq.midia);
    if (window.usuarioAtual.perfil === 'admin') {
        let botoesAprovacao = arq.status === 'PENDENTE' ? `<div style="display:flex; gap:10px;"><button class="btn-fbi-action" style="background:var(--verde-terminal); color:#000;" onclick="alterarStatusDoc(${idx}, 'APROVADO')">APROVAR</button><button class="btn-fbi-action btn-fbi-delete" onclick="alterarStatusDoc(${idx}, 'REPROVADO')">REPROVAR</button></div>` : '';
        document.getElementById('conteudo-modal').innerHTML = ` <div class="dossie-linha-grid"><div><span>STATUS</span><strong style="color:${arq.status==='APROVADO'?'var(--verde-terminal)':(arq.status==='REPROVADO'?'var(--vermelho-critica)':'var(--amber-alert)')}">${arq.status}</strong></div></div> <div class="dossie-linha-grid"><div><span>CÓDIGO</span><input type="text" id="edit-arq-cod" value="${arq.cod}"></div><div><span>ACESSO</span><select id="edit-arq-acesso"><option value="LIBERADO" ${arq.acesso==='LIBERADO'?'selected':''}>LIBERADO</option><option value="RESTRITO" ${arq.acesso==='RESTRITO'?'selected':''}>RESTRITO</option><option value="SEGREDO" ${arq.acesso==='SEGREDO'?'selected':''}>SEGREDO DA ORDEM</option></select></div></div> <div class="dossie-linha"><span>TÍTULO</span><input type="text" id="edit-arq-titulo" value="${arq.titulo}"></div><div class="dossie-linha"><span>CONTEÚDO</span><textarea id="edit-arq-conteudo" style="height:100px;">${arq.conteudo}</textarea></div> ${botoesAprovacao} <button class="btn-fbi-action secundario" style="margin-top:10px;" onclick="salvarEdicaoArquivo(${idx})">SALVAR EDIÇÕES</button> <button class="btn-fbi-action btn-fbi-delete" style="margin-top:10px;" onclick="apagarArquivo(${idx})">APAGAR DOC</button> `;
    } else {
        let corSt = arq.status === 'REPROVADO' ? 'var(--vermelho-critica)' : (arq.status === 'APROVADO' ? 'var(--verde-terminal)' : 'var(--amber-alert)');
        document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha"><span>STATUS: <strong style="color:${corSt}">${arq.status}</strong></span></div><div class="dossie-linha"><span>TÍTULO</span><strong>${arq.titulo}</strong></div><div style="text-align:center;">${midiaHtml}</div><div class="dossie-linha" style="margin-top:15px;"><p style="white-space:pre-wrap; background:#07090c; padding:20px; border-left:3px solid var(--borda-fbi);">${arq.conteudo}</p></div>`;
    }
    document.getElementById('modal-dinamico').style.display = 'flex';
}
window.salvarEdicaoArquivo = function(idx) { let arq = window.bancoArquivos[idx]; arq.cod = document.getElementById('edit-arq-cod').value; arq.titulo = document.getElementById('edit-arq-titulo').value; arq.acesso = document.getElementById('edit-arq-acesso').value; arq.conteudo = document.getElementById('edit-arq-conteudo').value; window.salvarBancos(); window.fecharModal(); window.renderArquivos(); }
window.alterarStatusDoc = function(idx, status) { window.bancoArquivos[idx].status = status; window.salvarBancos(); window.fecharModal(); window.renderArquivos(); }
window.apagarArquivo = function(idx) { window.chamarConfirmacao("APAGAR ARQUIVO?", () => { window.bancoArquivos.splice(idx, 1); window.salvarBancos(); window.fecharModal(); window.renderArquivos(); }); }

// --- RELATÓRIOS ---
window.renderRelatorios = function() {
    let container = document.getElementById('lista-relatorios'); if(!container) return;
    let relsVisiveis = window.bancoRelatorios.filter(r => r.visibilidade !== 'PRIVADO' || window.usuarioAtual.perfil === 'admin' || r.autorId === window.usuarioAtual.id);
    if(relsVisiveis.length === 0) { container.innerHTML = '<p style="color:#666;">Nenhum relatório.</p>'; return; }
    let html = "";
    [...relsVisiveis].reverse().forEach(rel => {
        let imgHTML = rel.midia ? `<div style="margin-top:10px; text-align:center;">${window.renderizarMidia(rel.midia)}</div>` : "";
        let badgePrivado = rel.visibilidade === 'PRIVADO' ? `<span style="background:var(--vermelho-critica); color:#fff; font-size:0.6rem; padding:2px 5px; border-radius:2px; margin-right:10px;">CONFIDENCIAL</span>` : '';
        let btnAcoes = '';
        if(window.usuarioAtual.perfil === 'admin' || window.usuarioAtual.id === rel.autorId) { let idReal = window.bancoRelatorios.findIndex(x => x === rel); btnAcoes = `<div style="margin-top:10px; border-top:1px solid #1c2630; padding-top:10px; text-align:right;"><button class="btn-fbi-action secundario" style="width:auto; padding:4px 10px;" onclick="editarRelatorio(${idReal})"><i class="fa-solid fa-pen"></i> Editar</button><button class="btn-fbi-action btn-fbi-delete" style="width:auto; padding:4px 10px; margin-left:5px;" onclick="apagarRelatorio(${idReal})"><i class="fa-solid fa-trash"></i></button></div>`; }
        html += `<div style="background:var(--janela-fbi); border:1px solid var(--borda-fbi); border-left:3px solid ${rel.visibilidade==='PRIVADO'?'var(--vermelho-critica)':'var(--verde-terminal)'}; padding:20px; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; border-bottom:1px dashed rgba(166,183,201,0.1); padding-bottom:5px; margin-bottom:10px; font-size:0.75rem;"><span style="color:var(--fbi-text); font-weight:bold;">${badgePrivado}AUTOR: ${rel.autorNome}</span><span style="color:#5b6f82;">${rel.data}</span></div><div style="font-size:0.85rem; line-height:1.6; white-space:pre-wrap; color:var(--texto-claro);">${rel.texto}${imgHTML}</div>${btnAcoes}</div>`;
    });
    container.innerHTML = html;
}
window.abrirFormularioRelatorio = function() {
    window.posicionarModalCentro(); window.base64TempMedia = "";
    document.getElementById('titulo-modal').innerText = "DIÁRIO DE CAMPO";
    document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha-grid"><div><span>VISIBILIDADE</span><select id="novo-rel-vis"><option value="PUBLICO">PÚBLICO</option><option value="PRIVADO">CONFIDENCIAL</option></select></div><div><span>EVIDÊNCIA</span><input type="file" accept="image/*,video/*" onchange="lidarComUploadMidia(event)"></div></div><div class="dossie-linha"><span>RELATO</span><textarea id="novo-rel-texto" style="height:200px;"></textarea></div><button class="btn-fbi-action" onclick="salvarRelatorio()">SUBMETER</button>`;
    document.getElementById('modal-dinamico').style.display = 'flex';
}
window.salvarRelatorio = function() { let nomeAutor = window.usuarioAtual.agentesVinc.length > 0 ? window.usuarioAtual.agentesVinc[0] : window.usuarioAtual.id; window.bancoRelatorios.push({ autorId: window.usuarioAtual.id, autorNome: nomeAutor, data: new Date().toLocaleDateString('pt-BR'), texto: document.getElementById('novo-rel-texto').value, midia: window.base64TempMedia, visibilidade: document.getElementById('novo-rel-vis').value }); window.salvarBancos(); window.fecharModal(); window.renderRelatorios(); }
window.editarRelatorio = function(idx) { let rel = window.bancoRelatorios[idx]; window.posicionarModalCentro(); window.base64TempMedia = rel.midia || ""; document.getElementById('titulo-modal').innerText = "EDITAR RELATÓRIO"; document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha-grid"><div><span>VISIBILIDADE</span><select id="edit-rel-vis"><option value="PUBLICO" ${rel.visibilidade==='PUBLICO'?'selected':''}>PÚBLICO</option><option value="PRIVADO" ${rel.visibilidade==='PRIVADO'?'selected':''}>CONFIDENCIAL</option></select></div><div><span>EVIDÊNCIA</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"></div></div><div class="dossie-linha"><span>TEXTO</span><textarea id="edit-rel-texto" style="height:150px;">${rel.texto}</textarea></div><button class="btn-fbi-action" onclick="salvarEdicaoRelatorio(${idx})">SALVAR</button>`; document.getElementById('modal-dinamico').style.display = 'flex'; }
window.salvarEdicaoRelatorio = function(idx) { window.bancoRelatorios[idx].texto = document.getElementById('edit-rel-texto').value; window.bancoRelatorios[idx].visibilidade = document.getElementById('edit-rel-vis').value; if(window.base64TempMedia !== "") window.bancoRelatorios[idx].midia = window.base64TempMedia; window.salvarBancos(); window.fecharModal(); window.renderRelatorios(); }
window.apagarRelatorio = function(idx) { window.chamarConfirmacao("APAGAR RELATÓRIO?", () => { window.bancoRelatorios.splice(idx, 1); window.salvarBancos(); window.renderRelatorios(); }); }

// --- USUÁRIOS ---
window.atualizarPatentesSelect = function(perfilValue, patenteSelectId) { let patSel = document.getElementById(patenteSelectId); let valAtual = patSel.value; if(perfilValue === 'admin') { patSel.innerHTML = '<option value="4">4 - FUNDADOR</option>'; } else { patSel.innerHTML = '<option value="1">1 - RECRUTA</option><option value="2">2 - AGENTE</option><option value="3">3 - AGENTE ESPECIAL</option>'; if(valAtual < 4) patSel.value = valAtual; } }
window.gerarCheckboxesMultiAgentesLogin = function(lista) { let html = `<div class="agentes-lista-checkbox" style="max-height:100px;">`; if(window.bancoAgentes.length === 0) return html + `<span>Nenhum agente.</span></div>`; window.bancoAgentes.forEach(ag => { let checked = lista.includes(ag.nome) ? "checked" : ""; html += `<label><input type="checkbox" class="check-multi-agente-login" value="${ag.nome}" ${checked}> ${ag.nome} (${ag.id_ilustrativo || 'N/A'})</label>`; }); return html + `</div>`; }
window.getMultiAgentesLogin = function() { let c = document.querySelectorAll('.check-multi-agente-login'); let n = []; c.forEach(x => { if(x.checked) n.push(x.value); }); return n; }
window.renderUsuarios = function() { let tbody = document.getElementById('tbody-usuarios'); if(!tbody) return; let html = ""; window.bancoUsuarios.forEach((usr, idx) => { let agNomes = usr.agentesVinc && usr.agentesVinc.length > 0 ? usr.agentesVinc.join(', ') : 'NENHUM'; let btn = usr.id === 'ADMIN' ? `<button class="btn-fbi-action secundario" style="padding:4px; margin:0;" onclick="editarUsuario(${idx})">EDITAR</button>` : `<div style="display:flex; gap:5px;"><button class="btn-fbi-action secundario" style="padding:4px; margin:0;" onclick="editarUsuario(${idx})">EDITAR</button><button class="btn-fbi-action btn-fbi-delete" style="padding:4px; margin:0;" onclick="excluirUsuario(${idx})">EXCLUIR</button></div>`; html += `<tr><td><strong>${usr.id}</strong></td><td style="color:var(--verde-terminal); font-size:0.7rem;">${agNomes}</td><td>${window.getNomePatente(usr.patente)} (Nvl ${usr.patente || 1})</td><td>${btn}</td></tr>`; }); tbody.innerHTML = html; }
window.abrirFormularioUsuario = function() { window.posicionarModalCentro(); document.getElementById('titulo-modal').innerText = "NOVO LOGIN"; document.getElementById('conteudo-modal').innerHTML = ` <div class="dossie-linha"><span>ID (LOGIN)</span><input type="text" id="novo-usr-id" style="text-transform:uppercase;"></div> <div class="dossie-linha"><span>PIN (6 NÚMEROS)</span><input type="password" id="novo-usr-pin" placeholder="Ex: 123456"></div> <div class="dossie-linha"><span>VINCULAR FICHAS</span>${window.gerarCheckboxesMultiAgentesLogin([])}</div> <div class="dossie-linha-grid"> <div><span>PERFIL</span><select id="novo-usr-perfil" onchange="atualizarPatentesSelect(this.value, 'novo-usr-patente')"><option value="agente">AGENTE</option><option value="admin">FUNDADOR</option></select></div> <div><span>PATENTE</span><select id="novo-usr-patente"><option value="1">1 - RECRUTA</option><option value="2">2 - AGENTE</option><option value="3">3 - AGENTE ESPECIAL</option></select></div> </div><button class="btn-fbi-action" onclick="salvarNovoUsuario()">CRIAR CREDENCIAL</button> `; document.getElementById('modal-dinamico').style.display = 'flex'; }
window.salvarNovoUsuario = function() { let nId = document.getElementById('novo-usr-id').value.toUpperCase().trim(); let nPin = document.getElementById('novo-usr-pin').value.toString(); if(nId === '' || nPin.length !== 6) { window.somErro(); window.mostrarSysToast("ERRO: PIN 6 DÍGITOS", true); return; } window.somSucesso(); window.bancoUsuarios.push({ id: nId, pin: nPin, perfil: document.getElementById('novo-usr-perfil').value, patente: document.getElementById('novo-usr-patente').value, agentesVinc: window.getMultiAgentesLogin() }); window.salvarBancos(); window.fecharModal(); window.renderUsuarios(); }
window.editarUsuario = function(idx) { window.indexItemSelecionado = idx; let usr = window.bancoUsuarios[idx]; window.posicionarModalCentro(); document.getElementById('titulo-modal').innerText = "EDITAR LOGIN"; let lock = usr.id === 'ADMIN' ? 'disabled' : ''; document.getElementById('conteudo-modal').innerHTML = ` <div class="dossie-linha"><span>ID</span><input type="text" id="edit-usr-id" value="${usr.id}" ${lock}></div> <div class="dossie-linha"><span>NOVO PIN</span><input type="password" id="edit-usr-pin" placeholder="******"></div> <div class="dossie-linha"><span>VINCULAR FICHAS</span>${window.gerarCheckboxesMultiAgentesLogin(usr.agentesVinc || [])}</div> <div class="dossie-linha-grid"> <div><span>PERFIL</span><select id="edit-usr-perfil" onchange="atualizarPatentesSelect(this.value, 'edit-usr-patente')" ${lock}><option value="agente" ${usr.perfil==='agente'?'selected':''}>AGENTE</option><option value="admin" ${usr.perfil==='admin'?'selected':''}>FUNDADOR</option></select></div> <div><span>PATENTE</span><select id="edit-usr-patente"></select></div> </div><button class="btn-fbi-action" onclick="salvarEdicaoUsuario()">SALVAR ALTERAÇÕES</button> `; let perfilSelect = document.getElementById('edit-usr-perfil'); window.atualizarPatentesSelect(perfilSelect.value, 'edit-usr-patente'); document.getElementById('edit-usr-patente').value = usr.patente; document.getElementById('modal-dinamico').style.display = 'flex'; }
window.salvarEdicaoUsuario = function() { let usr = window.bancoUsuarios[window.indexItemSelecionado]; if(usr.id !== 'ADMIN') { usr.id = document.getElementById('edit-usr-id').value.toUpperCase().trim(); usr.perfil = document.getElementById('edit-usr-perfil').value; } let nPin = document.getElementById('edit-usr-pin').value.toString(); if(nPin.length > 0) { if(nPin.length !== 6) { window.somErro(); window.mostrarSysToast("PIN DEVE TER 6 NÚMEROS.", true); return; } usr.pin = nPin; } usr.patente = document.getElementById('edit-usr-patente').value; usr.agentesVinc = window.getMultiAgentesLogin(); window.somSucesso(); window.salvarBancos(); window.fecharModal(); window.renderUsuarios(); }
window.excluirUsuario = function(idx) { window.chamarConfirmacao("REVOGAR LOGIN?", () => { window.bancoUsuarios.splice(idx, 1); window.salvarBancos(); window.renderUsuarios(); }); }


// Fallback final
console.log('[Legacy] Script finalizado.');
