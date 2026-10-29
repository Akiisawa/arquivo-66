// =========================================================
// 1. FIREBASE CONFIG (Mantenha as suas chaves aqui)
// =========================================================
var firebaseConfig = {
    apiKey: "AIzaSyA4SwLSMFS7qE8R0T9i0-YWhE88dbz8kvw",
    authDomain: "rpg-ordem-dc772.firebaseapp.com",
    databaseURL: "https://rpg-ordem-dc772-default-rtdb.firebaseio.com",
    projectId: "rpg-ordem-dc772",
    storageBucket: "rpg-ordem-dc772.firebasestorage.app",
    messagingSenderId: "893978535559",
    appId: "1:893978535559:web:b9486f8c1f6dd557e8ba22"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

// --- VARIÁVEIS DO SISTEMA ---
var SESSAO_ATUAL = "";
var refSessao = null; 
var MEU_UID_MASTER = "4Ep6cHGpZVdPihKQ1q3wIg3Of1z1"; 
var isMuted = false;
window.bancoInventario = [];

// --- INICIALIZAÇÃO GERAL ---
document.addEventListener("DOMContentLoaded", () => {
    var introEl = document.getElementById("tela-intro");
    if(introEl) introEl.style.display = "none";
    
    var savedSession = localStorage.getItem('rpg_sessao_atual');
    if (savedSession && document.getElementById('input-codigo-sessao')) {
        document.getElementById('input-codigo-sessao').value = savedSession;
    }

// LISTENER DE AUTH GLOBAL (O PORTEIRO)
    firebase.auth().onAuthStateChanged(async (user) => {
        // INJETA O AVISO (TOAST) CASO NÃO EXISTA
        if (!document.getElementById('sys-toast')) {
            var toastBox = document.createElement('div');
            toastBox.id = 'sys-toast';
            toastBox.style.cssText = 'display:none; position:fixed; top:20px; right:20px; background:#07090c; border:1px solid; padding:15px 25px; z-index:9999999999; font-family:monospace; border-radius:4px; font-weight:bold; box-shadow: 0 5px 15px rgba(0,0,0,0.5);';
            document.body.appendChild(toastBox);
        }

        var telaAuth = document.getElementById('tela-auth');
        var telaSessao = document.getElementById('tela-sessao');
        
        if(user) {
            if(telaAuth) telaAuth.style.display = 'none';
            if(telaSessao && SESSAO_ATUAL === "") {
                telaSessao.style.display = 'flex';
                
                // MÁGICA 1: Busca se o usuário já tem sala e preenche automático!
                try {
                    var snapshot = await db.collection("sessoes").where("ownerUid", "==", user.uid).get();
                    if (!snapshot.empty) {
                        var minhaSessao = snapshot.docs[0].id;
                        var inputSessao = document.getElementById('input-codigo-sessao');
                        if (inputSessao) inputSessao.value = minhaSessao;
                    }
                } catch(e) { console.error("Erro ao buscar sessão existente:", e); }
            }
        } else {
            if(telaAuth) telaAuth.style.display = 'flex';
            if(telaSessao) telaSessao.style.display = 'none';
        }
    });

    var style = document.createElement('style');
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
        .tag-pendente { background: var(--amber-alert); color: #000; padding: 2px 5px; font-size: 0.6rem; border-radius: 3px; font-weight: bold; margin-left: 5px; display:inline-block; margin-top:5px;}
    `;
    document.head.appendChild(style);

    var chatBtn = document.createElement('div');
    chatBtn.id = 'chat-floating-btn';
    chatBtn.innerHTML = '>_';
    chatBtn.onclick = toggleChatWindow;
    document.body.appendChild(chatBtn);

    var chatWin = document.createElement('div');
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
    
    var loginProcesso = document.getElementById('login-processo');
    if(loginProcesso) {
        var btnVoltar = document.createElement('button');
        btnVoltar.id = 'btn-sair-sessao'; // ID adicionado para podermos esconder depois
        btnVoltar.className = 'btn-fbi-action btn-fbi-delete'; // Classe alterada para ficar vermelho
        btnVoltar.style.marginTop = '15px';
        btnVoltar.innerHTML = '<i class="fa-solid fa-power-off"></i> SAIR DA SESSÃO';
        btnVoltar.onclick = voltarParaSessoes;
        loginProcesso.appendChild(btnVoltar);
    }
});

// --- SISTEMA DE ÁUDIO & MUTE ---
var AudioContext = window.AudioContext || window.webkitAudioContext; var audioCtx;
function initAudio() { if(!audioCtx) audioCtx = new AudioContext(); if(audioCtx.state === 'suspended') audioCtx.resume(); }
window.toggleMute = function() {
    isMuted = !isMuted;
    var icon = document.getElementById('icone-mute');
    if(isMuted) { icon.className = "fa-solid fa-volume-xmark"; icon.style.color = "var(--vermelho-critica)"; } 
    else { icon.className = "fa-solid fa-volume-high"; icon.style.color = "var(--fbi-text)"; somClick(); }
}
function playBeep(freq, type, duration, vol=0.05) { if(isMuted) return; if(!audioCtx) return; var osc = audioCtx.createOscillator(); var gain = audioCtx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime); gain.gain.setValueAtTime(vol, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration); }
function somClick() { playBeep(500, 'square', 0.05); } function somErro() { playBeep(150, 'sawtooth', 0.4, 0.1); setTimeout(()=>playBeep(150, 'sawtooth', 0.4, 0.1), 200); } function somSucesso() { playBeep(800, 'sine', 0.1); setTimeout(()=>playBeep(1200, 'sine', 0.15), 100); }
document.addEventListener('click', (e) => { initAudio(); if(e.target.tagName === 'BUTTON' || e.target.closest('.pin-btn') || e.target.tagName === 'TR') somClick(); });

// --- FUNÇÕES DE AUTENTICAÇÃO REAL (FIREBASE) ---
window.alternarTelaAuth = function(tela) {
    somClick();
    document.getElementById('box-login').style.display = tela === 'login' ? 'block' : 'none';
    document.getElementById('box-cadastro').style.display = tela === 'cadastro' ? 'block' : 'none';
}

window.logarEmail = async function() {
    var email = document.getElementById('login-email').value;
    var pass = document.getElementById('login-senha').value;
    if(!email || !pass) { mostrarSysToast("PREENCHA E-MAIL E SENHA", true); return; }
    try { await firebase.auth().signInWithEmailAndPassword(email, pass); somSucesso(); } 
    catch(e) { mostrarSysToast("ERRO: CREDENCIAIS INVÁLIDAS", true); }
}

// --- RECUPERAÇÃO DE SENHA ---
window.recuperarSenha = async function() {
    var email = document.getElementById('login-email').value;
    
    // Exige que o e-mail esteja preenchido na caixa de texto
    if(!email) { 
        mostrarSysToast("DIGITE SEU E-MAIL NA CAIXA ACIMA ANTES DE RECUPERAR", true); 
        return; 
    }
    
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        somSucesso();
        mostrarSysToast("E-MAIL DE RECUPERAÇÃO ENVIADO! VERIFIQUE SUA CAIXA.");
    } catch(e) {
        somErro();
        console.error("Erro recuperação:", e);
        mostrarSysToast("ERRO: CONTA NÃO ENCONTRADA OU INVÁLIDA.", true);
    }
}

// --- LOGOFF / DESCONECTAR (CORRIGIDO) ---
window.deslogarFirebaseAuth = function() {
    somClick();
    firebase.auth().signOut().then(() => {
        // CORREÇÃO: Limpa a sala armazenada na memória do navegador
        SESSAO_ATUAL = "";
        localStorage.removeItem('rpg_sessao_atual');
        
        // Retorna para a tela principal (O 'onAuthStateChanged' fará isso)
    }).catch((e) => {
        console.error("Erro ao deslogar:", e);
    });
}

window.registrarEmail = async function() {
    var email = document.getElementById('cad-email').value;
    var pass = document.getElementById('cad-senha').value;
    var passConf = document.getElementById('cad-senha-confirma').value;
    
    if(!email || !pass) { mostrarSysToast("PREENCHA TODOS OS DADOS", true); return; }
    if(pass !== passConf) { somErro(); mostrarSysToast("AS SENHAS NÃO COINCIDEM", true); return; }
    
    try {
        await firebase.auth().createUserWithEmailAndPassword(email, pass);
        mostrarSysToast("CONTA REGISTRADA COM SUCESSO!");
    } catch(e) { mostrarSysToast("ERRO: " + e.message, true); }
}

window.deslogarFirebaseAuth = function() {
    firebase.auth().signOut().then(() => {
        SESSAO_ATUAL = "";
        localStorage.removeItem('rpg_sessao_atual');
    });
}

// --- SISTEMA DE GERENCIAMENTO DE SESSÕES ---
function mostrarToastSessao(msg, erro = false) {
    var t = document.getElementById('toast-sessao');
    if(!t) return;
    t.innerText = msg; 
    t.style.background = erro ? "var(--vermelho-critica, #ff3333)" : "var(--amber-alert, #ffb000)";
    t.style.color = erro ? "#fff" : "#000";
    t.style.display = 'block';
    if(erro) somErro(); else somClick();
    setTimeout(() => t.style.display = 'none', 3000); 
}

window.entrarSessaoExistente = async function() {
    if(typeof window.pararChuvaCodigo==='function')window.pararChuvaCodigo();
    var cod = document.getElementById('input-codigo-sessao').value.toUpperCase().trim();
    if(!cod) { mostrarToastSessao("ERRO: INSIRA UM CÓDIGO.", true); return; }
    
    var doc = await db.collection("sessoes").doc(cod).get();
    if(!doc.exists) { mostrarToastSessao("SALA NÃO ENCONTRADA. VERIFIQUE O CÓDIGO.", true); return; }
    
    iniciarRotinaDeBoot(cod);
}

window.criarNovaSessao = async function() {
    var user = firebase.auth().currentUser;
    if (!user) { mostrarSysToast("ERRO: LOGIN NECESSÁRIO.", true); return; }

    try {
        var inputSessao = document.getElementById('input-codigo-sessao');
        
        // 1. VERIFICAÇÃO DE SEGURANÇA: O usuário já tem uma sessão?
        var snapshot = await db.collection("sessoes").where("ownerUid", "==", user.uid).get();
        if (!snapshot.empty) {
            var sessaoExistente = snapshot.docs[0].id;
            mostrarSysToast("ACESSO NEGADO: VOCÊ JÁ POSSUI UMA SALA ATIVA!", true);
            somErro();
            // Preenche o campo com a sala que ele já tinha
            if (inputSessao) inputSessao.value = sessaoExistente;
            return; // Bloqueia e encerra a função aqui!
        }

        // 2. SE NÃO TIVER SALA, ELE CRIA UMA NOVA
        var randomCod = "NET-" + Math.floor(1000 + Math.random() * 9000);
        var randomPin = Math.floor(100000 + Math.random() * 900000).toString();
        
        await db.collection("sessoes").doc(randomCod).set({ 
            criadaEm: Date.now(), 
            status: "ATIVA",
            ownerUid: user.uid,
            members: [user.uid]
        });
        
        var defaultAdmin = [{ id: "ADMIN", pin: randomPin, perfil: "admin", patente: 4, agentesVinc: [] }];
        await db.collection("sessoes").doc(randomCod).collection("dados").doc("usuarios").set({ lista: defaultAdmin });
        
        somSucesso();
        
        // MÁGICA 2: Preenche o código novo automaticamente no campo!
        if (inputSessao) inputSessao.value = randomCod;
        
        // Limpa avisos anteriores se houver
        var alertaAntigo = document.getElementById('alerta-nova-sessao');
        if(alertaAntigo) alertaAntigo.remove();

        // Dispara o alerta Absoluto na tela (aquele que resolvemos juntos)
        var overlay = document.createElement("div");
        overlay.id = "alerta-nova-sessao";
        overlay.className = "fbi-overlay-absoluto";
        
        overlay.innerHTML = `
            <div class="fbi-caixa-alerta">
                <h2 style="color:var(--verde-terminal); margin-bottom:15px; font-size:1.5rem;">SALA ESTABELECIDA</h2>
                <h1 style="color:var(--verde-terminal); font-size:3.5rem; letter-spacing:3px; margin: 0 0 20px 0;">${randomCod}</h1>
                
                <div style="background:#1c2630; padding:20px; border-left:4px solid var(--amber-alert); margin-bottom:20px; text-align: left;">
                    <p style="color:#fff; font-size: 1.2rem; margin-bottom:10px;"><strong>LOGIN:</strong> ADMIN</p>
                    <p style="color:#fff; font-size: 1.2rem;"><strong>SENHA:</strong> <span style="color:var(--amber-alert);">${randomPin}</span></p>
                </div>
                
                <p style="color:var(--vermelho-critica); font-weight:bold; margin-bottom: 20px;">⚠️ SALVE ESTA SENHA ANTES DE CONTINUAR!</p>
                
                <button class="btn-fbi-action" style="width:100%; padding:15px; font-size:1.1rem; background:var(--verde-terminal); color:#000; margin-bottom:10px;" 
                    onclick="this.parentElement.parentElement.remove(); iniciarRotinaDeBoot('${randomCod}')">ENTRAR NA SALA</button>
                    
                <button class="btn-fbi-action secundario" style="width:100%; padding:10px;" 
                    onclick="this.parentElement.parentElement.remove();">FECHAR AVISO</button>
            </div>
        `;
        
        document.body.appendChild(overlay);

    } catch (e) {
        console.error(e);
        mostrarSysToast("ERRO GRAVE AO CRIAR SESSÃO.", true);
    }
}

function iniciarRotinaDeBoot(cod) {
    SESSAO_ATUAL = cod;
    localStorage.setItem('rpg_sessao_atual', cod);
    refSessao = db.collection("sessoes").doc(SESSAO_ATUAL).collection("dados");
    
    document.getElementById('tela-sessao').style.display = 'none';
    var introEl = document.getElementById('tela-intro');
    if(introEl) introEl.style.display = 'flex';
    
    rodarBoot(); 
}

var logsBoot = ["CONNECTING TO ORDO REALITAS MAIN SERVER...", "BYPASSING PARANORMAL FIREWALL L3...", "VERIFYING ENCRYPTION KEYS (AES-256)...", "SYNCING CLOUD DATABASE...", "INTERFACE READY..."];
var logIdx = 0; 

async function rodarBoot() {
    if (logIdx < logsBoot.length - 1) { 
        document.getElementById("linhas-log").innerHTML += `<div>> ${logsBoot[logIdx]}</div>`; 
        document.getElementById("progresso-fbi").style.width = ((logIdx / logsBoot.length) * 100) + "%"; 
        logIdx++; 
        setTimeout(rodarBoot, 100);
    } else if (logIdx === logsBoot.length - 1) {
        document.getElementById("linhas-log").innerHTML += `<div>> ${logsBoot[logIdx]}</div>`; 
        await carregarDadosDaNuvem(); 
        logIdx++; 
        setTimeout(rodarBoot, 100);
    } else { 
        document.getElementById("progresso-fbi").style.width = "100%"; 
        setTimeout(() => { 
            document.getElementById("tela-intro").style.display = "none"; 
            document.getElementById("tela-login").style.display = "flex"; 
            document.getElementById("login-instrucao").innerText = "SALA: " + SESSAO_ATUAL;
        }, 200); 
    }
}

var pinProcesso = { id: '', pin: '' };

function iniciarLogin() { document.getElementById('perfis-botoes').style.display = 'none'; document.getElementById('login-processo').style.display = 'flex'; document.getElementById('agente-id-input').style.display = 'block'; document.getElementById('pinpad-container').style.display = 'none'; document.getElementById('login-instrucao').innerText = ""; document.getElementById('agente-id-input').focus(); document.getElementById('agente-id-input').onkeydown = function(e) { if(e.key === 'Enter') { pinProcesso.id = this.value.toUpperCase().trim(); if(pinProcesso.id === '') return; document.getElementById('agente-id-input').style.display = 'none'; document.getElementById('pinpad-container').style.display = 'block'; } }; }
function digitarPin(numero) { if(pinProcesso.pin.length < 6) { pinProcesso.pin += numero; document.getElementById('pin-display').value = pinProcesso.pin.replace(/./g, '*'); } }
function cancelarLogin() { document.getElementById('perfis-botoes').style.display = 'flex'; document.getElementById('login-processo').style.display = 'none'; document.getElementById('agente-id-input').value = ''; document.getElementById('pin-display').value = ''; pinProcesso.pin = ''; pinProcesso.id = ''; document.getElementById('login-instrucao').innerText = "SALA: " + SESSAO_ATUAL; }

window.voltarParaSessoes = function() {
    somClick();
    var telaLogin = document.getElementById("tela-login");
    var telaSessao = document.getElementById("tela-sessao");
    
    if(telaLogin) telaLogin.style.display = "none";
    
    SESSAO_ATUAL = "";
    localStorage.removeItem('rpg_sessao_atual');
    
    if(telaSessao) telaSessao.style.display = "flex";

    if(typeof window.iniciarChuvaCodigo==='function')window.iniciarChuvaCodigo();
}

window.validarLogin = async function() {
    var user = bancoUsuarios.find(u => u.id === pinProcesso.id && u.pin === pinProcesso.pin);
    if (!user) { somErro(); mostrarSysToast("ACESSO NEGADO: CREDENCIAIS INVÁLIDAS", true); pinProcesso.pin = ''; document.getElementById('pin-display').value = ''; return; }
    
    var authUser = firebase.auth().currentUser;
    if(authUser) {
        // Registra o jogador na lista de membros para a segurança Firestore funcionar
        await db.collection("sessoes").doc(SESSAO_ATUAL).update({
            members: firebase.firestore.FieldValue.arrayUnion(authUser.uid)
        }).catch(e => console.log("Aviso: Falha ao add member. Se vc é admin, ignore."));
    }

    somSucesso(); usuarioLogado = true; usuarioAtual = { perfil: user.perfil, id: user.id, patente: parseInt(user.patente) || 1, agentesVinc: user.agentesVinc || [] };
    document.getElementById("tela-login").style.display = "none"; document.getElementById("app-principal").style.display = "flex";
    
    var nomePatente = getNomePatente(usuarioAtual.patente);
    if(user.perfil === 'admin') {
        document.getElementById("credencial-display").innerText = `FUNDADOR // ID: ${user.id} // SESSÃO: ${SESSAO_ATUAL}`; 
        
        var banner = document.getElementById("admin-banner");
        banner.style.display = "block";
        if(authUser && authUser.uid === MEU_UID_MASTER) {
            banner.innerHTML = `PAINEL DE FUNDADOR ATIVADO <button id="btn-master-interno" class="btn-fbi-action btn-fbi-delete" style="padding: 2px 10px; font-size: 0.65rem; margin-left: 15px; width: auto; display: inline-block; cursor: pointer;" onclick="abrirPainelMasterInterno()">SUPERVISÃO DE SESSÕES</button>`;
        } else {
            banner.innerHTML = `PAINEL DE FUNDADOR ATIVADO`; 
        }

        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'inline-block'); document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'none');
        window.location.hash = "#mapa";
    } else {
        document.getElementById("credencial-display").innerText = `AGENTE // ID: ${user.id} (${nomePatente})`;
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'none'); document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'flex');
        window.location.hash = "#perfil";
    }
    document.querySelectorAll('.nav-button.admin-only').forEach(b => b.style.display = user.perfil === 'admin' ? 'flex' : 'none');
    
    document.getElementById('chat-floating-btn').style.display = 'flex';
    iniciarListenerChats(); renderizarChatTabs();
    
    inicializarMapa(); atualizarCentroComando(); window.dispatchEvent(new Event('hashchange'));
}

function fazerLogout() { 
    somClick(); usuarioLogado = false; usuarioAtual = { perfil: '', id: '', patente: 1, agentesVinc: [] }; 
    document.getElementById('app-principal').style.display = 'none'; document.getElementById('admin-banner').style.display = 'none';  
    document.getElementById('chat-floating-btn').style.display = 'none'; document.getElementById('chat-window').style.display = 'none';
    if(chatUnsubscribe) chatUnsubscribe();
    cancelarLogin(); window.location.hash = ''; 
    logIdx = 0; document.getElementById("linhas-log").innerHTML = ''; 
    
    // Conforme pedido: Quando clicar em desconectar, retorna para a tela do PIN da sala logada.
    document.getElementById('tela-login').style.display = 'flex'; 
}

var modalDinamico = document.getElementById('modal-dinamico'); var headerArrastavel = document.getElementById('header-arrastavel');
var isDragging = false, offsetLeft, offsetTop;
if(headerArrastavel) headerArrastavel.addEventListener('mousedown', (e) => { isDragging = true; var rect = modalDinamico.getBoundingClientRect(); offsetLeft = e.clientX - rect.left; offsetTop = e.clientY - rect.top; modalDinamico.style.right = 'auto'; modalDinamico.style.bottom = 'auto'; modalDinamico.style.transform = 'none'; modalDinamico.style.position = 'fixed'; modalDinamico.style.left = rect.left + 'px'; modalDinamico.style.top = rect.top + 'px'; });
document.addEventListener('mousemove', (e) => { if(!isDragging) return; modalDinamico.style.left = (e.clientX - offsetLeft) + 'px'; modalDinamico.style.top = (e.clientY - offsetTop) + 'px'; }); document.addEventListener('mouseup', () => { isDragging = false; });
function posicionarModalMapa() { modalDinamico.style.position = 'fixed'; modalDinamico.style.right = '20px'; modalDinamico.style.left = 'auto'; modalDinamico.style.top = '20px'; modalDinamico.style.transform = 'none'; }
function posicionarModalCentro() { modalDinamico.style.position = 'fixed'; modalDinamico.style.left = '50%'; modalDinamico.style.right = 'auto'; modalDinamico.style.top = '80px'; modalDinamico.style.transform = 'translateX(-50%)'; }

function mostrarSysToast(msg, isError = false) {
    var t = document.getElementById('sys-toast'); 
    if(!t) {
        // Fallback caso o toast de sistema não exista no HTML
        alert(msg);
        return;
    }
    t.innerText = msg; 
    t.style.borderColor = isError ? "var(--vermelho-critica)" : "var(--verde-terminal)"; 
    t.style.color = isError ? "var(--vermelho-critica)" : "var(--verde-terminal)"; 
    t.style.boxShadow = isError ? "0 0 15px rgba(255, 51, 51, 0.3)" : "0 0 15px rgba(66, 255, 66, 0.2)"; 
    t.style.display = 'block'; 
    if(isError) somErro(); else somClick();
    setTimeout(() => { t.style.display = 'none'; }, 3500);
}

function mostrarToastSessao(msg, erro = false) {
    var t = document.getElementById('toast-sessao');
    if(!t) { mostrarSysToast(msg, erro); return; } // Redireciona se o toast de sessão não existir
    t.innerText = msg; 
    t.style.background = erro ? "var(--vermelho-critica, #ff3333)" : "var(--amber-alert, #ffb000)";
    t.style.color = erro ? "#fff" : "#000";
    t.style.display = 'block';
    
    // CORREÇÃO: O setTimeout agora roda independentemente de ser erro ou sucesso
    if(erro) somErro(); else somClick();
    setTimeout(() => t.style.display = 'none', 3000);
}

var confirmCallback = null;
function chamarConfirmacao(mensagem, callback) { somErro(); document.getElementById('msg-confirmacao').innerText = mensagem; confirmCallback = callback; document.getElementById('modal-confirmacao').style.display = 'block'; }
if(document.getElementById('btn-confirma-sim')) document.getElementById('btn-confirma-sim').onclick = () => { document.getElementById('modal-confirmacao').style.display = 'none'; if(confirmCallback) confirmCallback(); }
if(document.getElementById('btn-confirma-nao')) document.getElementById('btn-confirma-nao').onclick = () => { document.getElementById('modal-confirmacao').style.display = 'none'; }
function piscarErroAcesso() { somErro(); var body = document.body; body.classList.add('acesso-negado-bg'); setTimeout(() => { body.classList.remove('acesso-negado-bg'); }, 1500); }
function getNomePatente(nivel) { if(nivel == 1) return "RECRUTA"; if(nivel == 2) return "AGENTE"; if(nivel == 3) return "AGENTE ESPECIAL"; if(nivel >= 4) return "FUNDADOR"; return "NOVATO"; }

function mascaraData(input) { var v = input.value.replace(/\D/g, ""); if (v.length > 8) v = v.slice(0, 8); if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, "$1/$2/$3"); else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, "$1/$2"); input.value = v; }

var configPericias = { "Atletismo": { attr: "FOR", penalty: false }, "Luta": { attr: "FOR", penalty: false }, "Acrobacia": { attr: "AGI", penalty: false }, "Furtividade": { attr: "AGI", penalty: false }, "Iniciativa": { attr: "AGI", penalty: false }, "Pilotagem": { attr: "AGI", penalty: true }, "Pontaria": { attr: "AGI", penalty: false }, "Reflexos": { attr: "AGI", penalty: false }, "Crime": { attr: "AGI", penalty: false }, "Atualidades": { attr: "INT", penalty: false }, "Ciências": { attr: "INT", penalty: true }, "Investigação": { attr: "INT", penalty: false }, "Medicina": { attr: "INT", penalty: true }, "Ocultismo": { attr: "INT", penalty: true }, "Profissão": { attr: "INT", penalty: true }, "Tecnologia": { attr: "INT", penalty: true }, "Sobrevivência": { attr: "INT", penalty: false }, "Tática": { attr: "INT", penalty: true }, "Adestramento": { attr: "PRE", penalty: true }, "Artes": { attr: "PRE", penalty: true }, "Diplomacia": { attr: "PRE", penalty: false }, "Enganação": { attr: "PRE", penalty: false }, "Intimidação": { attr: "PRE", penalty: false }, "Intuição": { attr: "PRE", penalty: false }, "Religião": { attr: "PRE", penalty: true }, "Vontade": { attr: "PRE", penalty: false }, "Percepção": { attr: "PRE", penalty:false }, "Fortitude": { attr: "VIG", penalty: false } };
var periciasBase = Object.keys(configPericias).sort();

function rolarPericia(nome, nivel, qtdDados) { var conf = configPericias[nome]; var mod = 0; if (nivel == 1) mod = 3; else if (nivel == 2) mod = 6; else if (nivel == 0 && conf && conf.penalty) mod = -3; var numDados = parseInt(qtdDados) || 0; var rolls = []; var rCount = numDados > 0 ? numDados : 2; for(var i=0; i<rCount; i++) { rolls.push(Math.floor(Math.random() * 20) + 1); } var selectedRoll = numDados > 0 ? Math.max(...rolls) : Math.min(...rolls); var total = selectedRoll + mod; var strRolls = rolls.join(', '); var calcText = numDados > 0 ? `[${numDados}d20] (${strRolls}) -> Maior: ${selectedRoll} | Mod: ${mod >= 0 ? '+'+mod : mod}` : `[2d20] (${strRolls}) -> Menor: ${selectedRoll} | Mod: ${mod >= 0 ? '+'+mod : mod}`; mostrarRolagem(nome, selectedRoll, mod, total, calcText); }
function mostrarRolagem(periciaNome, roll, mod, total, calcText) { var toast = document.getElementById('dice-toast'); document.getElementById('toast-pericia').innerText = "TESTE DE " + periciaNome; document.getElementById('toast-total').innerText = total; document.getElementById('toast-calc').innerText = calcText; toast.style.display = 'flex'; somSucesso(); setTimeout(() => { toast.style.display = 'none'; }, 4000); }

var usuarioLogado = false; var usuarioAtual = { perfil: '', id: '', patente: 1, agentesVinc: [] };
var map, camadaMarcadores, tempMarker = null, indexItemSelecionado = null, base64TempMedia = ""; 
var agenteSendoEditado = null; 

var bancoUsuarios = [];
var incidentesGoiadas = []; var bancoAgentes = []; var bancoArquivos = [];
var bancoRelatorios = []; var bancoEntidades = [];

var chatAtivo = 'global';
var chatUnsubscribe = null;
var chatsLocais = {};

async function carregarDadosDaNuvem() {
    try {
        var docRefInventario = await refSessao.doc("inventario").get(); 
        if(docRefInventario.exists && docRefInventario.data().lista) {
            bancoInventario = docRefInventario.data().lista;
        } else {
            bancoInventario = [];
        }
    } catch(e) { console.error("Erro ao carregar inventário", e); }
    try {
        var docRefUsuarios = await refSessao.doc("usuarios").get(); if(docRefUsuarios.exists && docRefUsuarios.data().lista) bancoUsuarios = docRefUsuarios.data().lista;
        var docRefAgentes = await refSessao.doc("agentes").get(); if(docRefAgentes.exists && docRefAgentes.data().lista) bancoAgentes = docRefAgentes.data().lista;
        var docRefMissoes = await refSessao.doc("missoes").get(); if(docRefMissoes.exists && docRefMissoes.data().lista) incidentesGoiadas = docRefMissoes.data().lista;
        var docRefArquivos = await refSessao.doc("arquivos").get(); if(docRefArquivos.exists && docRefArquivos.data().lista) bancoArquivos = docRefArquivos.data().lista;
        var docRefRelatorios = await refSessao.doc("relatorios").get(); if(docRefRelatorios.exists && docRefRelatorios.data().lista) bancoRelatorios = docRefRelatorios.data().lista;
        var docRefEntidades = await refSessao.doc("entidades").get(); if(docRefEntidades.exists && docRefEntidades.data().lista) bancoEntidades = docRefEntidades.data().lista;
        
        bancoUsuarios.forEach(u => { if(u.agenteVinc && !Array.isArray(u.agentesVinc)) { u.agentesVinc = [u.agenteVinc]; delete u.agenteVinc; } if(!u.agentesVinc) u.agentesVinc = []; });
        bancoAgentes.forEach(ag => { if(ag.aprovado === undefined) ag.aprovado = true; });
    } catch(e) { console.error("Erro ao puxar dados da sessão:", e); }
}

async function salvarBancos() {
    try {
        await refSessao.doc("inventario").set({ lista: bancoInventario });
    } catch(e) { console.error("Erro ao salvar inventário", e); }
    try {
        await refSessao.doc("missoes").set({ lista: incidentesGoiadas });
        await refSessao.doc("agentes").set({ lista: bancoAgentes });
        await refSessao.doc("arquivos").set({ lista: bancoArquivos });
        await refSessao.doc("usuarios").set({ lista: bancoUsuarios });
        await refSessao.doc("relatorios").set({ lista: bancoRelatorios });
        await refSessao.doc("entidades").set({ lista: bancoEntidades });
        
        if (usuarioAtual && usuarioAtual.perfil === 'admin') {
            var user = firebase.auth().currentUser;
            if(user) {
                await db.collection("sessoes").doc(SESSAO_ATUAL).set({ 
                    ultimaAlteracao: Date.now(),
                    ownerUid: user.uid 
                }, { merge: true });
            }
        }
        atualizarCentroComando(); renderizarChatTabs();
    } catch (e) { mostrarSysToast("ERRO: BANCO DE DADOS CHEIO OU PERMISSÃO NEGADA.", true); }
}

function atualizarCentroComando() {
    if(!usuarioLogado) return;
    var ativos = 0, criticos = 0, emCampo = 0, mia = 0, kia = 0;
    incidentesGoiadas.forEach(c => { if(c.status === 'ATIVA') { ativos++; if(c.ameaca === 'CRÍTICA') criticos++; } });
    bancoAgentes.forEach(ag => { if(ag.status === 'ATIVO' && ag.aprovado) emCampo++; else if(ag.status.includes('M.I.A')) mia++; else if(ag.status.includes('K.I.A')) kia++; });
    var hA = document.getElementById('hud-ativos'); if(hA) hA.innerText = ativos; var hC = document.getElementById('hud-criticos'); if(hC) hC.innerText = criticos;
    var hE = document.getElementById('hud-emcampo'); if(hE) hE.innerText = emCampo; var hM = document.getElementById('hud-mia'); if(hM) hM.innerText = mia; var hK = document.getElementById('hud-kia'); if(hK) hK.innerText = kia;
}

window.confirmarAcesso=function(){var cod=document.getElementById('input-codigo-sessao');if(cod&&cod.value.trim()){entrarSessaoExistente();}else{mostrarToastSessao("INSIRA UM ID DE ACESSO.",true);}}

window.addEventListener('hashchange', function() {
    if(!usuarioLogado) return;
    
    // Deixe apenas esta linha do hash original do seu código:
    var hash = window.location.hash.replace('#', '') || (usuarioAtual.perfil === 'admin' ? 'mapa' : 'perfil');
    
    fecharModal(); 
    document.querySelectorAll('.aba-secao').forEach(el => el.style.display = 'none'); 
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('ativo'));
    
    var abaAtiva = document.getElementById('aba-' + hash); 
    var linkAtivo = document.getElementById('link-' + hash);
    if(abaAtiva) abaAtiva.style.display = 'block'; 
    if(linkAtivo) linkAtivo.classList.add('ativo');

    if(hash === 'mapa' && map) setTimeout(() => { map.invalidateSize(); atualizarCentroComando(); }, 100);
    if(hash === 'agentes' || hash === 'memorial') renderizarAgentes();
    if(hash === 'perfil') renderizarPerfil();
    if(hash === 'entidades') renderEntidades();
    if(hash === 'arquivos') renderArquivos();
    if(hash === 'registros') renderUsuarios();
    if(hash === 'relatorios') renderRelatorios();
    if(hash !== 'ficha-completa') agenteSendoEditado = null; 
    if(hash === 'inventario') window.renderInventario();
});

// --- CHAT ---
function iniciarListenerChats() {
    if(!chatAtivo)chatAtivo='global';
    if(chatUnsubscribe) chatUnsubscribe();
    chatUnsubscribe = refSessao.doc("chats").onSnapshot(doc => {
        if(doc.exists) { chatsLocais = doc.data(); } else { chatsLocais = {}; refSessao.doc("chats").set({}); }
        renderizarMensagensChat();
    });
}

function toggleChatWindow() { var win = document.getElementById('chat-window'); win.style.display = win.style.display === 'flex' ? 'none' : 'flex'; if(win.style.display==='flex'){renderizarChatTabs();renderizarMensagensChat();} }
window.mudarChatTab = function(tab) { chatAtivo = tab; renderizarChatTabs(); renderizarMensagensChat(); }
function renderizarChatTabs(){var header=document.getElementById('chat-header-tabs');if(!header)return;var html=`<div class="chat-tab ${chatAtivo==='global'?'active':''}" onclick="mudarChatTab('global')">GLOBAL</div>`;if(usuarioAtual?.perfil==='admin'){var agentes=[];if(typeof agentesLocais!=='undefined'){agentes=agentesLocais.map(a=>a.nome||a.id).filter(Boolean);}else if(typeof bancoAgentes!=='undefined'){agentes=Object.values(bancoAgentes).map(a=>a.nome||a.id).filter(Boolean);}agentes.forEach(nome=>{var canal='fundador_'+nome;html+=`<div class="chat-tab ${chatAtivo===canal?'active':''}" onclick="mudarChatTab('${canal}')">${nome}</div>`;});}else{var meuNome=usuarioAtual?.agentesVinc?.[0]||usuarioAtual?.id;var canal='fundador_'+meuNome;html+=`<div class="chat-tab ${chatAtivo===canal?'active':''}" onclick="mudarChatTab('${canal}')">FUNDADOR</div>`;}incidentesGoiadas.forEach(caso=>{if(caso.status==='ATIVA'){var agentesCaso=caso.agente?caso.agente.split(',').map(a=>a.trim()):[];var permitido=usuarioAtual.perfil==='admin'||usuarioAtual.agentesVinc?.some(a=>agentesCaso.includes(a));if(permitido){html+=`<div class="chat-tab ${chatAtivo===caso.cod?'active':''}" onclick="mudarChatTab('${caso.cod}')">${caso.cod}</div>`;}}});header.innerHTML=html;}
function renderizarMensagensChat() { var area = document.getElementById('chat-messages-area'); var mensagens = chatsLocais[chatAtivo] || []; var html = ''; mensagens.forEach(m => { var isMe = (m.autor === 'FUNDADOR' && usuarioAtual.perfil === 'admin') || (usuarioAtual.agentesVinc.includes(m.autor) || m.autor === usuarioAtual.id); html += `<div class="chat-msg ${isMe?'me':''}"><span class="autor">${m.autor}</span>${m.texto}</div>`; }); area.innerHTML = html; area.scrollTop = area.scrollHeight; }
window.enviarMensagemChat=async function(){var input=document.getElementById('chat-input-text');var msg=input.value.trim();if(!msg)return;input.value='';var nomeAutor=usuarioAtual.perfil==='admin'?'FUNDADOR':(usuarioAtual.agentesVinc.length>0?usuarioAtual.agentesVinc[0]:usuarioAtual.id);await refSessao.doc("chats").set({[chatAtivo]:firebase.firestore.FieldValue.arrayUnion({autor:nomeAutor,texto:msg,tempo:Date.now()})},{merge:true});}

// --- MAPA ---

function inicializarMapa(){ if(!document.getElementById('map')) return;if(map!==undefined){map.remove();}map=L.map('map',{zoomControl:false,worldCopyJump:false,maxBounds:[[-85,-180],[85,180]],maxBoundsViscosity:1,minZoom:3}).setView([-15.93,-49.25],3);L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{noWrap:true}).addTo(map);camadaMarcadores=L.layerGroup().addTo(map);renderizarPontosNoMapa();map.on('contextmenu',function(e){if(usuarioAtual.perfil!=='admin')return;if(tempMarker)map.removeLayer(tempMarker);tempMarker=L.marker(e.latlng,{icon:L.divIcon({className:'',html:'<div class="temp-marker-dot"></div>',iconSize:[14,14]})}).addTo(map);indexItemSelecionado=null;abrirFormularioCriacao(e.latlng.lat,e.latlng.lng);});}

function renderizarPontosNoMapa() { if(!document.getElementById('map') || typeof camadaMarcadores === 'undefined' || !camadaMarcadores) return; camadaMarcadores.clearLayers(); incidentesGoiadas.forEach((caso, index) => { var cor = 'var(--azul-seguro)'; if (caso.status === 'CONCLUÍDA') cor = 'var(--verde-terminal)'; else if (caso.ameaca === 'ALTA') cor = 'var(--amber-alert)'; else if (caso.ameaca === 'CRÍTICA') cor = 'var(--vermelho-critica)'; var divClass = index === indexItemSelecionado ? "marker-pisca" : ""; var boxShad = index === indexItemSelecionado ? "none" : `0 0 10px ${cor}`; var fbiIcon = L.divIcon({ className: 'custom-fbi-marker', html: `<div class="${divClass}" style="width:12px; height:12px; background:${cor}; border-radius:50%; box-shadow: ${boxShad};"></div>`, iconSize: [12, 12] }); var marker = L.marker(caso.coordenadas, { icon: fbiIcon }); marker.on('click', () => { indexItemSelecionado = index; map.flyTo(caso.coordenadas, 12, { duration: 1.5 }); renderizarPontosNoMapa(); mostrarDossieJanela(caso); }); camadaMarcadores.addLayer(marker); }); }

function fecharModal() { modalDinamico.style.display = 'none'; if(window.tempMarker && typeof window.map !== 'undefined' && window.map) { window.map.removeLayer(window.tempMarker); window.tempMarker = null; } indexItemSelecionado = null; if(document.getElementById('aba-mapa').style.display !== 'none') renderizarPontosNoMapa(); }

function lidarComUploadMidia(event){var file=event.target.files[0];if(!file)return;var preview=document.getElementById('preview-upload');var reader=new FileReader();reader.onload=e=>{if(file.type.startsWith('video/')){window.base64TempMedia=e.target.result;if(preview)preview.innerHTML=`<span style="color:var(--amber-alert)">Vídeo carregado.</span>`;return;}var img=new Image();img.onload=()=>{var canvas=document.createElement('canvas');var MAX=800;var w=img.width,h=img.height;if(w>h&&w>MAX){h*=MAX/w;w=MAX}else if(h>MAX){w*=MAX/h;h=MAX}canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);window.base64TempMedia=canvas.toDataURL('image/jpeg',0.7);if(preview)preview.innerHTML=`<img src="${window.base64TempMedia}" style="max-width:100%;border:1px solid #333;border-radius:6px;">`;};img.src=e.target.result};reader.readAsDataURL(file);}
function renderizarMidia(base64Str) { if(!base64Str) return ''; if(base64Str.startsWith('data:video')) return `<video controls class="img-missao"><source src="${base64Str}"></video>`; return `<img src="${base64Str}" class="img-missao">`; }
function gerarListaAgentesCheckboxes(sel_str = "") { var html = `<div class="agentes-lista-checkbox">`; var ativos = bancoAgentes.filter(a => a.status === 'ATIVO' && a.aprovado); if(ativos.length === 0) return `<div class="agentes-lista-checkbox"><span style="color:#666; font-size:0.7rem;">Nenhum agente aprovado.</span></div>`; ativos.forEach(ag => { var ch = sel_str.includes(ag.nome) ? "checked" : ""; html += `<label><input type="checkbox" class="check-agente-missao" value="${ag.nome}" ${ch}> ${ag.nome} (${ag.id_ilustrativo || 'N/A'})</label>`; }); return html + `</div>`; }
function getAgentesSelecionados() { var checks = document.querySelectorAll('.check-agente-missao'); var nomes = []; checks.forEach(c => { if(c.checked) nomes.push(c.value); }); return nomes.length > 0 ? nomes.join(', ') : "Nenhum"; }

window.meVoluntariar = function(idx, nomeAgente) { if(!incidentesGoiadas[idx].voluntarios) incidentesGoiadas[idx].voluntarios = []; incidentesGoiadas[idx].voluntarios.push(nomeAgente); salvarBancos(); mostrarDossieJanela(incidentesGoiadas[idx]); mostrarSysToast("PEDIDO DE VOLUNTARIADO ENVIADO AO FUNDADOR."); };
window.aceitarVoluntario = function(idx, nomeAgente) { var caso = incidentesGoiadas[idx]; caso.voluntarios = caso.voluntarios.filter(v => v !== nomeAgente); var ags = caso.agente && caso.agente !== 'Nenhum' ? caso.agente.split(',').map(x=>x.trim()).filter(x=>x!=="") : []; if(!ags.includes(nomeAgente)) ags.push(nomeAgente); caso.agente = ags.length > 0 ? ags.join(', ') : 'Nenhum'; salvarBancos(); mostrarDossieJanela(caso); mostrarSysToast(nomeAgente + " FOI DESIGNADO."); };
window.mostrarOpcoesVoluntario = function() { var btn = document.getElementById('btn-voluntariar-inicial'); var div = document.getElementById('div-opcoes-voluntario'); if(btn) btn.style.display = 'none'; if(div) div.style.display = 'block'; };

function mostrarDossieJanela(caso) { 
    var reqLvl = 1; if(caso.ameaca === 'ALTA') reqLvl = 2; else if(caso.ameaca === 'CRÍTICA') reqLvl = 3; 
    if(usuarioAtual.perfil !== 'admin' && usuarioAtual.patente < reqLvl) { piscarErroAcesso(); chamarConfirmacao(`ACESSO NEGADO.\n\nESTE CASO REQUER PATENTE NÍVEL ${reqLvl}.`, null); return; } 
    posicionarModalMapa(); base64TempMedia = caso.imagem || ""; document.getElementById('titulo-modal').innerText = caso.status === 'CONCLUÍDA' ? "ARQUIVO ENCERRADO" : "REGISTRO DE MISSÃO"; 
    
    var imgDisplay = renderizarMidia(caso.imagem); var adminCampos = ''; var vagasTotais = caso.vagas || 4; var agentesAtuais = caso.agente && caso.agente !== 'Nenhum' ? caso.agente.split(',').map(x=>x.trim()).filter(x=>x!=="") : []; var vagasOcupadas = agentesAtuais.length;

    if (usuarioAtual.perfil === 'admin') { 
        var volHtml = ''; if (caso.voluntarios && caso.voluntarios.length > 0) { volHtml = `<div class="dossie-linha"><span>VOLUNTÁRIOS AGUARDANDO</span>` + caso.voluntarios.map(v => `<div style="display:flex; justify-content:space-between; align-items:center; background:#1c2630; padding:5px; margin-bottom:5px; border-left:2px solid var(--amber-alert);"><span style="color:#fff; font-size:0.75rem;">${v}</span><button class="btn-fbi-action" style="width:auto; margin:0; padding:4px 8px; background:var(--verde-terminal); color:#000;" onclick="aceitarVoluntario(${indexItemSelecionado}, '${v}')">ACEITAR</button></div>`).join('') + `</div>`; }
        adminCampos = `
            <div class="dossie-linha-grid"><div><span style="display:inline-block; margin-right:8px;">CÓDIGO</span><input type="text" id="edit-cod" value="${caso.cod}"></div><div><span style="display:inline-block; margin-right:8px;">VAGAS</span><input type="number" id="edit-vagas" value="${vagasTotais}"></div></div>
            <div class="dossie-linha-grid"><div><span>AMEAÇA</span><select id="edit-ameaca"><option value="MÉDIA" ${caso.ameaca==='MÉDIA'?'selected':''}>MÉDIA</option><option value="ALTA" ${caso.ameaca==='ALTA'?'selected':''}>ALTA</option><option value="CRÍTICA" ${caso.ameaca==='CRÍTICA'?'selected':''}>CRÍTICA</option></select></div><div><span>INCIDENTE</span><input type="text" id="edit-titulo" value="${caso.titulo}"></div></div>
            ${volHtml} <div class="dossie-linha"><span>DESIGNAR AGENTES (Desmarque p/ retirar)</span>${gerarListaAgentesCheckboxes(caso.agente)}</div> <div class="dossie-linha"><span>EVIDÊNCIA (OPCIONAL)</span><input type="file" accept="image/*,video/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div> <div class="dossie-linha"><span>RESUMO</span><textarea id="edit-resumo">${caso.resumo}</textarea></div>
            <button class="btn-fbi-action" onclick="salvarAlteracoesMissao()">SALVAR DADOS</button> ${caso.status !== 'CONCLUÍDA' ? `<button class="btn-fbi-action btn-fbi-complete" onclick="concluirCaso()">FINALIZAR MISSÃO</button>` : `<button class="btn-fbi-action secundario" onclick="reabrirCaso()">REABRIR MISSÃO</button>`} <button class="btn-fbi-action btn-fbi-delete" onclick="excluirCaso()">APAGAR REGISTRO</button>`; 
    } else { 
        var colorTag = caso.status === 'CONCLUÍDA' ? 'var(--verde-terminal)' : 'var(--amber-alert)'; var corVagas = vagasOcupadas < vagasTotais ? 'var(--verde-terminal)' : 'var(--vermelho-critica)'; var btnVoluntariar = "";
        var eligibleAgents = []; var waitingAgents = [];
        usuarioAtual.agentesVinc.forEach(vinc => { if (!agentesAtuais.includes(vinc) && !(caso.voluntarios && caso.voluntarios.includes(vinc))) { eligibleAgents.push(vinc); } else if (caso.voluntarios && caso.voluntarios.includes(vinc)) { waitingAgents.push(vinc); } });

        if (caso.status === 'ATIVA') {
            if (vagasOcupadas < vagasTotais) {
                if (eligibleAgents.length > 0) {
                    var selectOptions = eligibleAgents.map(a => `<option value="${a}">${a}</option>`).join('');
                    btnVoluntariar += `
                        <div style="margin-top:15px; border-top:1px dashed rgba(166,183,201,0.1); padding-top:15px; text-align:center;">
                            <button id="btn-voluntariar-inicial" class="btn-fbi-action" style="background:#1c2630; width:100%;" onclick="mostrarOpcoesVoluntario()">ME VOLUNTARIAR</button>
                            <div id="div-opcoes-voluntario" style="display:none; text-align:left;">
                                <span style="font-size:0.75rem; color:#a6b7c9; display:block; margin-bottom:10px;">SELECIONE O AGENTE PARA VOLUNTARIAR:</span>
                                <div style="display:flex; gap:10px; align-items:center;">
                                    <select id="select-voluntario" style="flex-grow:1; background:transparent; color:#fff; border:1px solid #1c2630; padding:8px; font-size:0.8rem;">${selectOptions}</select>
                                    <button class="btn-fbi-action" style="margin:0; width:auto; padding:8px 15px; background:var(--verde-terminal); color:#000;" onclick="meVoluntariar(${indexItemSelecionado}, document.getElementById('select-voluntario').value)">CONFIRMAR</button>
                                </div>
                            </div>
                        </div>`;
                }
            } else { btnVoluntariar += `<p style="color:var(--vermelho-critica); font-size:0.75rem; margin-top:15px; font-weight:bold; text-align:center;">> EQUIPE COMPLETA (${vagasOcupadas} / ${vagasTotais})</p>`; }
            if (waitingAgents.length > 0) { btnVoluntariar += `<p style="color:var(--amber-alert); font-size:0.75rem; margin-top:10px; font-weight:bold; text-align:center;">> VOLUNTARIADO EM ANÁLISE: ${waitingAgents.join(', ')}</p>`; }
        }
        adminCampos = `<div class="dossie-linha-grid"> <div><span style="display:inline-block; margin-right:8px;">STATUS</span><strong style="color:${colorTag}">${caso.status}</strong></div> <div><span style="display:inline-block; margin-right:8px;">VAGAS</span><strong style="color:${corVagas}; text-shadow: 0 0 8px ${corVagas};">${vagasOcupadas} / ${vagasTotais}</strong></div> </div> <div class="dossie-linha"><span style="display:inline-block; margin-right:8px;">CÓDIGO</span><strong>${caso.cod}</strong></div> <div class="dossie-linha"><span style="display:inline-block; margin-right:8px;">INCIDENTE</span><strong>${caso.titulo}</strong></div> <div class="dossie-linha"><span style="display:inline-block; margin-right:8px;">AGENTES DESIGNADOS</span><strong>${caso.agente || 'Nenhum'}</strong></div> <div class="dossie-linha"><span>RESUMO</span><p>${caso.resumo}</p></div> ${btnVoluntariar}`; 
    } 
    document.getElementById('conteudo-modal').innerHTML = `${imgDisplay} <div style="margin-top:10px;"></div> ${adminCampos}`; modalDinamico.style.display = 'flex'; 
}

function abrirFormularioCriacao(lat, lng) { posicionarModalMapa(); base64TempMedia = ""; document.getElementById('titulo-modal').innerText = "NOVA AMEAÇA DETECTADA"; document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha"><span>MUNICÍPIO / LOCAL</span><input type="text" id="novo-cidade"></div><div class="dossie-linha-grid"><div><span>TÍTULO DA OPERAÇÃO</span><input type="text" id="novo-titulo"></div><div><span>Nº DE VAGAS</span><input type="number" id="novo-vagas" value="4"></div></div><div class="dossie-linha"><span>DESIGNAR AGENTES DISPONÍVEIS</span>${gerarListaAgentesCheckboxes()}</div><div class="dossie-linha"><span>EVIDÊNCIA (FOTO/VÍDEO)</span><input type="file" accept="image/*,video/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><div class="dossie-linha"><span>AMEAÇA</span><select id="novo-ameaca"><option value="MÉDIA">MÉDIA</option><option value="ALTA">ALTA</option><option value="CRÍTICA">CRÍTICA</option></select></div><div class="dossie-linha"><span>BRIEFING / RESUMO</span><textarea id="novo-resumo"></textarea></div><button class="btn-fbi-action" onclick="criarNovoCaso(${lat}, ${lng})">CRIAR MISSÃO</button>`; modalDinamico.style.display = 'flex'; }
function criarNovoCaso(lat, lng) { somSucesso(); incidentesGoiadas.push({ cidade: document.getElementById('novo-cidade').value || "Desconhecida", coordenadas: [lat, lng], cod: "CASE_" + Math.floor(Math.random()*1000), titulo: document.getElementById('novo-titulo').value || "Anomalia", vagas: document.getElementById('novo-vagas').value || 4, voluntarios: [], ameaca: document.getElementById('novo-ameaca').value, agente: getAgentesSelecionados(), imagem: base64TempMedia, resumo: document.getElementById('novo-resumo').value || "", status: "ATIVA" }); salvarBancos(); fecharModal(); renderizarPontosNoMapa(); }
function salvarAlteracoesMissao() { somSucesso(); var caso = incidentesGoiadas[indexItemSelecionado]; caso.cod = document.getElementById('edit-cod').value; caso.titulo = document.getElementById('edit-titulo').value; caso.agente = getAgentesSelecionados(); caso.vagas = document.getElementById('edit-vagas').value; caso.ameaca = document.getElementById('edit-ameaca').value; caso.resumo = document.getElementById('edit-resumo').value; if(base64TempMedia !== "") caso.imagem = base64TempMedia; salvarBancos(); fecharModal(); renderizarPontosNoMapa(); }
function concluirCaso() { incidentesGoiadas[indexItemSelecionado].status = 'CONCLUÍDA'; salvarBancos(); fecharModal(); renderizarPontosNoMapa(); }
function reabrirCaso() { incidentesGoiadas[indexItemSelecionado].status = 'ATIVA'; salvarBancos(); fecharModal(); renderizarPontosNoMapa(); }
function excluirCaso() { chamarConfirmacao("APAGAR REGISTRO DE MISSÃO?", () => { incidentesGoiadas.splice(indexItemSelecionado, 1); salvarBancos(); fecharModal(); renderizarPontosNoMapa(); }); }

window.aprovarAgente = function(idx) { bancoAgentes[idx].aprovado = true; salvarBancos(); abrirFichaCompleta(idx); mostrarSysToast("FICHA APROVADA."); }
window.excluirAgenteDefinitivo = function(idx) { chamarConfirmacao("APAGAR FICHA PERMANENTEMENTE?", () => { bancoAgentes.splice(idx, 1); salvarBancos(); fecharModal(); renderizarAgentes(); window.location.hash = "#agentes"; }); }

window.abrirFichaCompleta = function(indexAgente, editMode = false) { agenteSendoEditado = indexAgente; var ag = bancoAgentes[indexAgente]; if(!ag.atributos) ag.atributos = { for:1, agi:1, int:1, pre:1, vig:1 }; if(!ag.pericias) { ag.pericias = {}; periciasBase.forEach(p => ag.pericias[p] = 0); } if(!ag.data_nasc) ag.data_nasc = ""; if(!ag.nacionalidade) ag.nacionalidade = ""; var isOwnerOrAdmin = usuarioAtual.perfil === 'admin' || usuarioAtual.agentesVinc.includes(ag.nome); var renderCampoInput = (field, val, type='text', extra='') => editMode ? `<input type="${type}" id="ficha_field_${field}" value="${val}" ${extra}>` : `<strong style="display:block; padding:5px 0;">${val}</strong>`; var renderCampoText = (field, val) => editMode ? `<textarea id="ficha_field_${field}" style="background:transparent; border:1px solid #333; color:#fff; font-size:0.85rem; padding:5px; height:80px; width:100%;">${val}</textarea>` : `<p style="font-weight:normal; font-size:0.8rem; white-space:pre-wrap; padding:5px 0;">${val}</p>`; var renderCampoAttr = (attr, val) => editMode ? `<input type="number" id="ficha_attr_${attr}" value="${val}" class="ficha-attr-input">` : `<span class="ficha-attr-val" style="padding:10px; display:inline-block;">${val}</span>`; var fotoAgente=ag.foto||ag.imagem||"";var fotoHtml=fotoAgente?`<img src="${fotoAgente}" class="ficha-foto-grande">`:`<div class="ficha-foto-grande" style="display:flex;align-items:center;justify-content:center;color:#333;">SEM FOTO</div>`; var periciasHtml = ''; periciasBase.forEach(p => { var lvl = ag.pericias[p] || 0; var classeLvl = `pericia-${lvl}`; var conf = configPericias[p]; var displayPName = (conf && conf.penalty) ? `${p}*` : p; var attrKey = conf.attr.toLowerCase(); var attrVal = ag.atributos[attrKey] || 1; var selectHtml = editMode ? `<select onchange="updatePericiaLocal('${p}', this.value)" style="width:55px; padding:2px; margin:0; font-size:0.7rem; border-color:#333;"><option value="0" ${lvl==0?'selected':''}>Des.</option><option value="1" ${lvl==1?'selected':''}>Tre.</option><option value="2" ${lvl==2?'selected':''}>Vet.</option></select>` : ''; periciasHtml += `<div class="ficha-pericia-item ${classeLvl}"><button class="btn-roll-pericia" onclick="rolarPericia('${p}', ${lvl}, ${attrVal})">[${conf.attr}] ${displayPName}</button>${selectHtml}</div>`; }); var badgePendente = !ag.aprovado ? '<span class="tag-pendente">PENDENTE APROVAÇÃO</span>' : ''; var adminAprovacaoPanel = ''; if(!ag.aprovado && usuarioAtual.perfil === 'admin') { adminAprovacaoPanel = `<div style="background:#1c2630; padding:15px; margin-bottom:15px; border-left:4px solid var(--amber-alert); display:flex; gap:10px;"><button class="btn-fbi-action" style="background:var(--verde-terminal); color:#000; margin:0;" onclick="aprovarAgente(${indexAgente})">APROVAR FICHA</button><button class="btn-fbi-action btn-fbi-delete" style="margin:0;" onclick="excluirAgenteDefinitivo(${indexAgente})">REJEITAR E APAGAR</button></div>`; } var editBtnPanel = ''; if(!editMode && isOwnerOrAdmin) { editBtnPanel = `<button class="btn-fbi-action" style="background:var(--amber-alert); color:#000; width:100%; padding:10px; margin-top:15px;" onclick="abrirFichaCompleta(${indexAgente}, true)"><i class="fa-solid fa-pen"></i> ALTERAR FICHA</button>`; } var htmlCompleto = ` <div class="ficha-layout"> <div> ${adminAprovacaoPanel} <div class="ficha-bloco"><div class="ficha-bloco-titulo">FOTO DE IDENTIFICAÇÃO</div>${fotoHtml}<div class="ficha-id-badge"><span style="color:var(--amber-alert); font-size:0.7rem; font-weight:bold; display:block;">AGENTE ${ag.status !== 'ATIVO' ? 'INATIVO' : 'ESPECIAL'}</span><h3 style="color:#fff; text-transform:uppercase; margin:5px 0;">${ag.nome}</h3><span style="font-family:monospace; color:#888;">ID: ${ag.id_ilustrativo || 'N/A'}</span>${badgePendente}</div></div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">INFORMAÇÕES PESSOAIS</div><div class="ficha-dado-inline"><span>DATA NASC.</span>${renderCampoInput('data_nasc', ag.data_nasc, 'text', 'oninput="mascaraData(this)" placeholder="DD/MM/AAAA" maxlength="10"')}</div><div class="ficha-dado-inline"><span>IDADE</span>${renderCampoInput('idade', ag.idade, 'number')}</div><div class="ficha-dado-inline"><span>NACIONALIDADE</span>${renderCampoInput('nacionalidade', ag.nacionalidade)}</div><div class="ficha-dado-inline"><span>ALTURA</span>${renderCampoInput('altura', ag.altura)}</div></div> </div> <div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">IDENTIFICAÇÃO OPERACIONAL</div><div class="ficha-dado-inline"><span>NOME COMPLETO</span>${renderCampoInput('nome', ag.nome)}</div><div class="ficha-dado-inline"><span>CARGO</span>${renderCampoInput('cargo', ag.cargo)}</div><div class="ficha-dado-inline"><span>STATUS</span><strong style="color:${ag.status==='ATIVO'?'var(--verde-terminal)':'var(--vermelho-critica)'}">${ag.status}</strong></div></div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">HISTÓRICO E OBSERVAÇÕES</div><div class="ficha-dado-bloco">${renderCampoText('resumo', ag.resumo)}</div></div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">PERÍCIAS DE CAMPO (CLIQUE PARA ROLAR)</div><div class="ficha-pericias-grid">${periciasHtml}</div></div> </div> <div> <div class="ficha-bloco"><div class="ficha-bloco-titulo">ATRIBUTOS BASE</div><div class="ficha-atributos-container"><div class="ficha-attr-box">${renderCampoAttr('for', ag.atributos.for)}<span class="ficha-attr-name">FOR</span></div><div class="ficha-attr-box">${renderCampoAttr('agi', ag.atributos.agi)}<span class="ficha-attr-name">AGI</span></div><div class="ficha-attr-box">${renderCampoAttr('int', ag.atributos.int)}<span class="ficha-attr-name">INT</span></div><div class="ficha-attr-box">${renderCampoAttr('pre', ag.atributos.pre)}<span class="ficha-attr-name">PRE</span></div><div class="ficha-attr-box">${renderCampoAttr('vig', ag.atributos.vig)}<span class="ficha-attr-name">VIG</span></div></div></div><div class="ficha-bloco" style="margin-top:15px;border-color:var(--amber-alert);"><div class="ficha-bloco-titulo" style="color:var(--amber-alert);"><i class="fa-solid fa-toolbox"></i> EQUIPAMENTO OPERACIONAL</div><div id="inventario-agente">${typeof window.gerarHtmlInventarioDoAgente==='function'?window.gerarHtmlInventarioDoAgente(ag.nome):''}</div></div>${editBtnPanel}</div> </div>`; document.getElementById('conteudo-ficha-completa').innerHTML = htmlCompleto; document.querySelectorAll('.btn-salvar-ficha').forEach(b => { b.style.display = editMode ? 'inline-block' : 'none'; }); document.querySelectorAll('.aba-secao').forEach(el => el.style.display = 'none'); document.getElementById('aba-ficha-completa').style.display = 'block'; window.location.hash = "#ficha-completa"; }
function voltarDaFicha() { if(usuarioAtual.perfil === 'admin') window.location.hash = "#agentes"; else window.location.hash = "#perfil"; } var periciasTempFicha = {}; function updatePericiaLocal(pericia, val) { periciasTempFicha[pericia] = parseInt(val); }
function salvarAlteracoesFichaAtual() { if(agenteSendoEditado === null) return; var ag = bancoAgentes[agenteSendoEditado]; ['for','agi','int','pre','vig'].forEach(attr => { var el = document.getElementById('ficha_attr_' + attr); if(el) ag.atributos[attr] = parseInt(el.value) || 1; }); ['nome','cargo','data_nasc','idade','nacionalidade','altura','resumo'].forEach(f => { var el = document.getElementById('ficha_field_' + f); if(el) { if (f === 'nome' || f === 'cargo') ag[f] = el.value.toUpperCase(); else ag[f] = el.value; } }); Object.keys(periciasTempFicha).forEach(p => { ag.pericias[p] = periciasTempFicha[p]; }); periciasTempFicha = {}; if (usuarioAtual.perfil !== 'admin') { ag.aprovado = false; mostrarSysToast("ENVIADO PARA APROVAÇÃO."); voltarDaFicha(); } else { ag.aprovado = true; mostrarSysToast("SALVO."); abrirFichaCompleta(agenteSendoEditado); } salvarBancos(); }

function renderizarAgentes() { var gridAtivos = document.getElementById('grid-agentes-ativos'); var gridMortos = document.getElementById('grid-agentes-mortos'); var htmlAtivos = ""; var htmlMortos = ""; bancoAgentes.forEach((ag, index) => { if (!ag.aprovado && usuarioAtual.perfil !== 'admin' && !usuarioAtual.agentesVinc.includes(ag.nome)) return; var badgePendente=!ag.aprovado?'<span class="tag-pendente">PENDENTE APROVAÇÃO</span>':'';var fotoAgente=ag.foto||"";var fotoHtml=fotoAgente?`<div class="foto-agente-fbi"><img src="${fotoAgente}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`:`<div class="foto-agente-fbi"></div>`; var btnAction = `<button onclick="abrirFichaCompleta(${index})" class="btn-fbi-action secundario" style="padding:6px 15px; font-size:0.7rem; margin:0; width:auto;">FICHA COMPLETA</button>`; var btnExtraAdmin = usuarioAtual.perfil === 'admin' ? `<button onclick="editarAgenteRapido(${index})" class="btn-fbi-action" style="background:#1c2630; padding:6px 15px; font-size:0.7rem; margin:0; width:auto;">OPÇÕES / STATUS</button>` : ''; var cardHtml = `<div class="fbi-card ${ag.status !== 'ATIVO' ? 'memorial' : ''}" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 15px; width: 220px; box-sizing: border-box;"> ${fotoHtml} <div style="width:100%; margin-top:10px;"> <h3 style="${ag.status !== 'ATIVO' ? 'color:#ccc; text-decoration: line-through;' : 'color:#fff;'} margin: 0 0 5px 0;">${ag.nome}</h3> <span style="font-size:0.65rem; color:var(--verde-terminal); margin-bottom:5px; display:block;">ID: ${ag.id_ilustrativo || 'N/A'}</span> ${ag.status !== 'ATIVO' ? `<span class="${ag.status.includes('M.I.A')?'tag-mia':'tag-morte'}">${ag.status}</span>` : `<p style="color:var(--amber-alert); font-size:0.75rem; font-weight:bold; margin: 0 0 10px 0;">${ag.cargo}</p>`} ${badgePendente} <div style="display:flex; flex-direction:column; gap:8px; align-items:center; margin-top:10px;"> ${btnAction} ${btnExtraAdmin} </div> </div> </div>`; if (ag.status === "ATIVO") htmlAtivos += cardHtml; else htmlMortos += cardHtml; }); if(gridAtivos) gridAtivos.innerHTML = htmlAtivos; if(gridMortos) gridMortos.innerHTML = htmlMortos; }
function renderizarPerfil() { var grid = document.getElementById('grid-meu-perfil'); var aba = document.getElementById('aba-perfil'); if (aba) { aba.style.position = 'relative'; if (!document.getElementById('btn-criar-ficha-perfil')) { var btn = document.createElement('button'); btn.id = 'btn-criar-ficha-perfil'; btn.className = 'btn-fbi-action'; btn.style.cssText = 'position: absolute; right: 20px; top: 15px; width: auto; padding: 8px 15px; margin: 0; font-size: 0.8rem;'; btn.innerHTML = '+ REGISTRAR AGENTE'; btn.onclick = abrirFormularioAgente; aba.appendChild(btn); } } var html = ``; var temFicha = false; bancoAgentes.forEach((ag, index) => { if(usuarioAtual.agentesVinc.includes(ag.nome)) { temFicha = true; var badgePendente = !ag.aprovado ? '<span class="tag-pendente">EM ANÁLISE</span>' : ''; var fotoAgente=ag.foto||ag.imagem||"";var fotoHtml=fotoAgente?`<div class="foto-agente-fbi"><img src="${fotoAgente}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`:`<div class="foto-agente-fbi"></div>`; var btnAction = `<button onclick="abrirFichaCompleta(${index})" class="btn-fbi-action secundario" style="padding:6px 15px; font-size:0.7rem; margin:0; width:auto;">FICHA COMPLETA</button>`; html += `<div class="fbi-card ${ag.status !== 'ATIVO' ? 'memorial' : ''}" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 15px; width: 220px; box-sizing: border-box;"> ${fotoHtml} <div style="width:100%; margin-top:10px;"> <h3 style="${ag.status !== 'ATIVO' ? 'color:#ccc;' : 'color:#fff;'} margin: 0 0 5px 0;">${ag.nome}</h3> <span style="font-size:0.65rem; color:var(--verde-terminal); margin-bottom:5px; display:block;">ID: ${ag.id_ilustrativo || 'N/A'}</span> ${ag.status !== 'ATIVO' ? `<span class="${ag.status.includes('M.I.A')?'tag-mia':'tag-morte'}">${ag.status}</span>` : `<p style="color:var(--amber-alert); font-size:0.75rem; font-weight:bold; margin: 0 0 10px 0;">${ag.cargo}</p>`} ${badgePendente} <div style="display:flex; flex-direction:column; gap:8px; align-items:center; margin-top:10px;"> ${btnAction} </div> </div> </div>`; } }); if(!temFicha) { html += "<p style='color:var(--amber-alert); padding: 20px; grid-column: 1 / -1; margin-top: 20px;'>Nenhuma ficha vinculada.</p>"; } if (grid) grid.innerHTML = html; }
function abrirFormularioAgente() { posicionarModalCentro(); base64TempMedia = ""; document.getElementById('titulo-modal').innerText = "CADASTRAR AGENTE"; document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha-grid"><div><span>NOME COMPLETO</span><input type="text" id="ag-nome"></div><div><span>CARGO</span><input type="text" id="ag-cargo"></div></div><div class="dossie-linha"><span>FOTO (ID)</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarNovoAgente()">CRIAR FICHA VAZIA</button>`; modalDinamico.style.display = 'flex'; }
function salvarNovoAgente() { var p = {}; periciasBase.forEach(x => p[x] = 0); var isAprovado = (usuarioAtual.perfil === 'admin'); bancoAgentes.push({ id_ilustrativo: "AGT-" + Math.floor(1000 + Math.random() * 9000), nome: (document.getElementById('ag-nome').value || "DESCONHECIDO").toUpperCase(), cargo: (document.getElementById('ag-cargo').value || "AGENTE").toUpperCase(), idade: 25, altura: "1.75m", nacionalidade: "", data_nasc: "", status: "ATIVO", foto: window.base64TempMedia||"", resumo: "", atributos: {for:1, agi:1, int:1, pre:1, vig:1}, pericias: p, aprovado: isAprovado }); seNaoAdminVincular(bancoAgentes[bancoAgentes.length - 1].nome); salvarBancos(); fecharModal(); renderizarAgentes(); if(!isAprovado){mostrarSysToast("ENVIADA PARA APROVAÇÃO."); window.location.hash="#perfil"; renderizarPerfil(); } }
function seNaoAdminVincular(nome) { if(usuarioAtual.perfil !== 'admin') { usuarioAtual.agentesVinc.push(nome); var idx = bancoUsuarios.findIndex(u => u.id === usuarioAtual.id); if(idx !== -1) bancoUsuarios[idx].agentesVinc.push(nome); } }
function editarAgenteRapido(index) { posicionarModalCentro(); indexItemSelecionado = index; var ag = bancoAgentes[index]; base64TempMedia = ag.foto || ""; document.getElementById('titulo-modal').innerText = "OPERAÇÕES: " + ag.nome; document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha"><span>NOVA FOTO</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarFotoEStatusAgente()">ATUALIZAR FOTO</button><div style="display:flex; gap:10px; margin-top:10px;"><button class="btn-fbi-action btn-fbi-delete" onclick="declararBaixaAgente('K.I.A (MORTO)')">MARCAR K.I.A.</button><button class="btn-fbi-action" style="background:#ffb000; color:#000;" onclick="declararBaixaAgente('M.I.A (DESAPARECIDO)')">MARCAR M.I.A.</button></div>${ag.status !== 'ATIVO' ? `<button class="btn-fbi-action secundario" style="margin-top:10px;" onclick="declararBaixaAgente('ATIVO')">RESTAURAR COMO ATIVO</button>` : ''} <button class="btn-fbi-action btn-fbi-delete" style="width:100%; margin-top:15px;" onclick="excluirAgenteDefinitivo(${index})">EXCLUIR FICHA PERMANENTEMENTE</button>`; modalDinamico.style.display = 'flex'; }
function salvarFotoEStatusAgente(){var ag=bancoAgentes[indexItemSelecionado];if(window.base64TempMedia){ag.foto=window.base64TempMedia;}salvarBancos();renderizarAgentes();if(agenteSendoEditado!==null){abrirFichaCompleta(agenteSendoEditado);}fecharModal();mostrarSysToast("FOTO ATUALIZADA.");}
function declararBaixaAgente(s) { bancoAgentes[indexItemSelecionado].status = s; salvarBancos(); fecharModal(); renderizarAgentes(); }

function renderRelatorios() { var container = document.getElementById('lista-relatorios'); var relsVisiveis = bancoRelatorios.filter(r => r.visibilidade !== 'PRIVADO' || usuarioAtual.perfil === 'admin' || r.autorId === usuarioAtual.id); if(relsVisiveis.length === 0) { container.innerHTML = '<p style="color:#666;">Nenhum relatório.</p>'; return; } var html = ""; [...relsVisiveis].reverse().forEach(rel => { var imgHTML = rel.midia ? `<div style="margin-top:10px; text-align:center;">${renderizarMidia(rel.midia)}</div>` : ""; var badgePrivado = rel.visibilidade === 'PRIVADO' ? `<span style="background:var(--vermelho-critica); color:#fff; font-size:0.6rem; padding:2px 5px; border-radius:2px; margin-right:10px;">CONFIDENCIAL</span>` : ''; var btnAcoes = ''; if(usuarioAtual.perfil === 'admin' || usuarioAtual.id === rel.autorId) { var idReal = bancoRelatorios.findIndex(x => x === rel); btnAcoes = `<div style="margin-top:10px; border-top:1px solid #1c2630; padding-top:10px; text-align:right;"><button class="btn-fbi-action secundario" style="width:auto; padding:4px 10px;" onclick="editarRelatorio(${idReal})"><i class="fa-solid fa-pen"></i> Editar</button><button class="btn-fbi-action btn-fbi-delete" style="width:auto; padding:4px 10px; margin-left:5px;" onclick="apagarRelatorio(${idReal})"><i class="fa-solid fa-trash"></i></button></div>`; } html += `<div style="background:var(--janela-fbi); border:1px solid var(--borda-fbi); border-left:3px solid ${rel.visibilidade==='PRIVADO'?'var(--vermelho-critica)':'var(--verde-terminal)'}; padding:20px; margin-bottom:15px;"><div style="display:flex; justify-content:space-between; border-bottom:1px dashed rgba(166,183,201,0.1); padding-bottom:5px; margin-bottom:10px; font-size:0.75rem;"><span style="color:var(--fbi-text); font-weight:bold;">${badgePrivado}AUTOR: ${rel.autorNome}</span><span style="color:#5b6f82;">${rel.data}</span></div><div style="font-size:0.85rem; line-height:1.6; white-space:pre-wrap; color:var(--texto-claro);">${rel.texto}${imgHTML}</div>${btnAcoes}</div>`; }); container.innerHTML = html; }
function abrirFormularioRelatorio() { posicionarModalCentro(); base64TempMedia = ""; document.getElementById('titulo-modal').innerText = "DIÁRIO DE CAMPO"; document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha-grid"><div><span>VISIBILIDADE</span><select id="novo-rel-vis"><option value="PUBLICO">PÚBLICO</option><option value="PRIVADO">CONFIDENCIAL</option></select></div><div><span>EVIDÊNCIA</span><input type="file" accept="image/*,video/*" onchange="lidarComUploadMidia(event)"></div></div><div class="dossie-linha"><span>RELATO</span><textarea id="novo-rel-texto" style="height:200px;"></textarea></div><button class="btn-fbi-action" onclick="salvarRelatorio()">SUBMETER</button>`; modalDinamico.style.display = 'flex'; }
function salvarRelatorio() { var nomeAutor = usuarioAtual.agentesVinc.length > 0 ? usuarioAtual.agentesVinc[0] : usuarioAtual.id; bancoRelatorios.push({ autorId: usuarioAtual.id, autorNome: nomeAutor, data: new Date().toLocaleDateString('pt-BR'), texto: document.getElementById('novo-rel-texto').value, midia: base64TempMedia, visibilidade: document.getElementById('novo-rel-vis').value }); salvarBancos(); fecharModal(); renderRelatorios(); }
function editarRelatorio(idx) { var rel = bancoRelatorios[idx]; posicionarModalCentro(); base64TempMedia = rel.midia || ""; document.getElementById('titulo-modal').innerText = "EDITAR RELATÓRIO"; document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha-grid"><div><span>VISIBILIDADE</span><select id="edit-rel-vis"><option value="PUBLICO" ${rel.visibilidade==='PUBLICO'?'selected':''}>PÚBLICO</option><option value="PRIVADO" ${rel.visibilidade==='PRIVADO'?'selected':''}>CONFIDENCIAL</option></select></div><div><span>EVIDÊNCIA</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"></div></div><div class="dossie-linha"><span>TEXTO</span><textarea id="edit-rel-texto" style="height:150px;">${rel.texto}</textarea></div><button class="btn-fbi-action" onclick="salvarEdicaoRelatorio(${idx})">SALVAR</button>`; modalDinamico.style.display = 'flex'; }
function salvarEdicaoRelatorio(idx) { bancoRelatorios[idx].texto = document.getElementById('edit-rel-texto').value; bancoRelatorios[idx].visibilidade = document.getElementById('edit-rel-vis').value; if(base64TempMedia !== "") bancoRelatorios[idx].midia = base64TempMedia; salvarBancos(); fecharModal(); renderRelatorios(); }
function apagarRelatorio(idx) { chamarConfirmacao("APAGAR RELATÓRIO?", () => { bancoRelatorios.splice(idx, 1); salvarBancos(); renderRelatorios(); }); }

function getCorElemento(ele) { if(ele==='SANGUE') return 'var(--ele-sangue)'; if(ele==='MORTE') return 'var(--ele-morte)'; if(ele==='ENERGIA') return 'var(--ele-energia)'; if(ele==='CONHECIMENTO') return 'var(--ele-conhecimento)'; return 'var(--ele-medo)'; }

function renderEntidades(){var grid=document.getElementById("grid-entidades");var html="";bancoEntidades.forEach((ent,idx)=>{if(!ent.aprovado&&usuarioAtual.perfil!=="admin")return;var fotoHtml=ent.foto?`<div class="foto-agente-fbi"><img src="${ent.foto}" style="width:100%;height:100%;object-fit:cover;display:block;"></div>`:`<div class="foto-agente-fbi"></div>`;var corElem=getCorElemento(ent.elemento);var descHtml=ent.descricao?`<div style="font-size:.75rem;color:#a6b7c9;margin-top:12px;border-top:1px dashed #1c2630;padding-top:10px;white-space:normal;word-break:break-word;overflow-wrap:anywhere;max-height:90px;overflow:auto;">${ent.descricao}</div>`:'';var pendente=!ent.aprovado?`<div style="margin-top:6px;color:var(--amber-alert);font-size:.65rem;">PENDENTE APROVAÇÃO</div>`:'';var btnAdmin=usuarioAtual.perfil==="admin"?`<div style="display:flex;gap:10px;margin-top:15px;"><button class="btn-fbi-action secundario" style="margin:0;padding:6px;flex:1;" onclick="editarEntidade(${idx})">EDITAR</button><button class="btn-fbi-action btn-fbi-delete" style="margin:0;padding:6px;flex:1;" onclick="apagarEntidade(${idx})">REMOVER</button></div>`:'';html+=`<div class="fbi-card" style="border-left:4px solid ${corElem};width:340px;display:flex;flex-direction:column;padding:18px;box-sizing:border-box;"><div style="display:flex;gap:15px;align-items:flex-start;">${fotoHtml}<div style="flex:1;min-width:0;"><h3 style="color:#fff;margin:0 0 8px 0;word-break:break-word;">${ent.nome}</h3><span class="tag-elemento" style="background:${corElem};color:#fff;">${ent.elemento}</span><p style="color:var(--vermelho-critica);font-size:.75rem;font-weight:bold;margin-top:10px;">NÍVEL DE AMEAÇA: ${ent.vd}</p>${pendente}</div></div>${descHtml}${btnAdmin}</div>`;});grid.innerHTML=html;}

function abrirFormularioEntidade(){posicionarModalCentro();base64TempMedia="";var aviso=usuarioAtual.perfil==="admin"?"APROVAÇÃO AUTOMÁTICA.":"PASSARÁ POR ANÁLISE DO FUNDADOR.";document.getElementById("titulo-modal").innerText="CATALOGAR NOVA AMEAÇA";document.getElementById("conteudo-modal").innerHTML=`<p style="font-size:.72rem;color:var(--amber-alert);margin-bottom:15px;">${aviso}</p><div class="dossie-linha-grid"><div><span>NOME DA ENTIDADE</span><input type="text" id="nova-ent-nome"></div><div><span>NÍVEL DE AMEAÇA</span><input type="number" id="nova-ent-vd" value="10"></div></div><div class="dossie-linha"><span>ELEMENTO PRINCIPAL</span><select id="nova-ent-elemento"><option value="SANGUE">SANGUE</option><option value="MORTE">MORTE</option><option value="ENERGIA">ENERGIA</option><option value="CONHECIMENTO">CONHECIMENTO</option><option value="MEDO">MEDO</option></select></div><div class="dossie-linha"><span>DESCRIÇÃO / COMPORTAMENTO</span><textarea id="nova-ent-desc" style="height:80px;"></textarea></div><div class="dossie-linha"><span>FOTO / REFERÊNCIA</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarNovaEntidade()">REGISTRAR NO BESTIÁRIO</button>`;modalDinamico.style.display="flex";}

function salvarNovaEntidade(){var aprovado=usuarioAtual.perfil==="admin";var nome=(document.getElementById("nova-ent-nome").value||"ENTIDADE DESCONHECIDA").toUpperCase();var vd=document.getElementById("nova-ent-vd").value||10;var elemento=document.getElementById("nova-ent-elemento").value;var descricao=document.getElementById("nova-ent-desc").value;bancoEntidades.push({nome:nome,vd:vd,elemento:elemento,descricao:descricao,foto:window.base64TempMedia||"",aprovado:aprovado});window.base64TempMedia="";salvarBancos();fecharModal();renderEntidades();mostrarSysToast(aprovado?"AMEAÇA CATALOGADA COM SUCESSO.":"ENVIADA PARA APROVAÇÃO.");}

function editarEntidade(idx){indexItemSelecionado=idx;var ent=bancoEntidades[idx];window.base64TempMedia=ent.foto||"";document.getElementById("titulo-modal").innerText="EDITAR AMEAÇA: "+ent.nome;document.getElementById("conteudo-modal").innerHTML=`<div class="dossie-linha-grid"><div><span>NOME DA ENTIDADE</span><input type="text" id="edit-ent-nome" value="${ent.nome}"></div><div><span>NÍVEL DE AMEAÇA</span><input type="number" id="edit-ent-vd" value="${ent.vd}"></div></div><div class="dossie-linha"><span>ELEMENTO PRINCIPAL</span><select id="edit-ent-elemento"><option value="SANGUE" ${ent.elemento==="SANGUE"?"selected":""}>SANGUE</option><option value="MORTE" ${ent.elemento==="MORTE"?"selected":""}>MORTE</option><option value="ENERGIA" ${ent.elemento==="ENERGIA"?"selected":""}>ENERGIA</option><option value="CONHECIMENTO" ${ent.elemento==="CONHECIMENTO"?"selected":""}>CONHECIMENTO</option><option value="MEDO" ${ent.elemento==="MEDO"?"selected":""}>MEDO</option></select></div><div class="dossie-linha"><span>DESCRIÇÃO</span><textarea id="edit-ent-desc" style="height:80px;">${ent.descricao||""}</textarea></div><div class="dossie-linha"><span>NOVA FOTO</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload">${ent.foto?`<img src="${ent.foto}" style="max-width:180px;border:1px solid #333;">`:''}</div></div><button class="btn-fbi-action" onclick="salvarEdicaoEntidade()">SALVAR ALTERAÇÕES</button>`;modalDinamico.style.display="flex";}

function salvarEdicaoEntidade() { var ent = bancoEntidades[indexItemSelecionado]; ent.nome = document.getElementById('edit-ent-nome').value.toUpperCase().trim() || "ENTIDADE DESCONHECIDA"; ent.vd = document.getElementById('edit-ent-vd').value || "0"; ent.elemento = document.getElementById('edit-ent-elemento').value; ent.descricao = document.getElementById('edit-ent-desc').value; if(window.base64TempMedia)ent.foto=window.base64TempMedia; window.base64TempMedia=""; salvarBancos(); fecharModal(); renderEntidades(); }
function apagarEntidade(idx) { chamarConfirmacao("APAGAR REGISTRO DA ENTIDADE?", () => { bancoEntidades.splice(idx, 1); salvarBancos(); renderEntidades(); }); }

function getReqLvlDoc(acesso) { if(acesso === 'SEGREDO') return 3; if(acesso === 'RESTRITO') return 2; return 1; }
function renderArquivos() { var tbody = document.getElementById('tbody-arquivos'); var arqsVisiveis = bancoArquivos.filter(a => a.status === 'APROVADO' || usuarioAtual.perfil === 'admin' || a.autorId === usuarioAtual.id); var html = ""; arqsVisiveis.forEach((arq, idx) => { var idReal = bancoArquivos.findIndex(x => x === arq); var reqLvl = getReqLvlDoc(arq.acesso); var lockStatus = (usuarioAtual.perfil !== 'admin' && usuarioAtual.patente < reqLvl) ? '<i class="fa-solid fa-lock"></i> ' : '<i class="fa-solid fa-file-lines"></i> '; var corStatus = arq.status === 'APROVADO' ? 'var(--verde-terminal)' : (arq.status === 'REPROVADO' ? 'var(--vermelho-critica)' : 'var(--amber-alert)'); html += `<tr onclick="abrirArquivo(${idReal})"><td><strong>${arq.cod}</strong></td><td style="color:var(--fbi-text);">${lockStatus}${arq.titulo}</td><td>${arq.acesso}</td><td style="color:${corStatus}; font-weight:bold;">${arq.status}</td></tr>`; }); tbody.innerHTML = html; }
function abrirFormularioEntidade(){posicionarModalCentro();base64TempMedia="";document.getElementById('titulo-modal').innerText="CATALOGAR NOVA AMEAÇA";document.getElementById('conteudo-modal').innerHTML=`<div class="dossie-linha-grid"><div><span>NOME DA ENTIDADE</span><input type="text" id="nova-ent-nome"></div><div><span>NÍVEL DE AMEAÇA</span><input type="number" id="nova-ent-vd" value="10"></div></div><div class="dossie-linha"><span>ELEMENTO PRINCIPAL</span><select id="nova-ent-elemento"><option value="SANGUE">SANGUE</option><option value="MORTE">MORTE</option><option value="ENERGIA">ENERGIA</option><option value="CONHECIMENTO">CONHECIMENTO</option><option value="MEDO">MEDO</option></select></div><div class="dossie-linha"><span>DESCRIÇÃO / COMPORTAMENTO</span><textarea id="nova-ent-desc" style="height:80px;"></textarea></div><div class="dossie-linha"><span>FOTO / REFERÊNCIA</span><input type="file" accept="image/*" onchange="lidarComUploadMidia(event)"><div id="preview-upload"></div></div><button class="btn-fbi-action" onclick="salvarNovaEntidade()">REGISTRAR NO BESTIÁRIO</button>`;modalDinamico.style.display='flex';}
function salvarNovoArquivo() { var status = usuarioAtual.perfil === 'admin' ? 'APROVADO' : 'PENDENTE'; bancoArquivos.push({ autorId: usuarioAtual.id, cod: document.getElementById('novo-arq-cod').value, titulo: document.getElementById('novo-arq-titulo').value, acesso: document.getElementById('novo-arq-acesso').value, midia: base64TempMedia, conteudo: document.getElementById('novo-arq-conteudo').value, status: status }); salvarBancos(); fecharModal(); renderArquivos(); }
function abrirArquivo(idx) { var arq = bancoArquivos[idx]; var reqLvl = getReqLvlDoc(arq.acesso); if (usuarioAtual.perfil !== 'admin' && usuarioAtual.patente < reqLvl) { piscarErroAcesso(); return; } posicionarModalCentro(); base64TempMedia = arq.midia || ""; document.getElementById('titulo-modal').innerText = "DOC: " + arq.cod; var midiaHtml = renderizarMidia(arq.midia); if (usuarioAtual.perfil === 'admin') { var botoesAprovacao = arq.status === 'PENDENTE' ? `<div style="display:flex; gap:10px;"><button class="btn-fbi-action" style="background:var(--verde-terminal); color:#000;" onclick="alterarStatusDoc(${idx}, 'APROVADO')">APROVAR</button><button class="btn-fbi-action btn-fbi-delete" onclick="alterarStatusDoc(${idx}, 'REPROVADO')">REPROVAR</button></div>` : ''; document.getElementById('conteudo-modal').innerHTML = ` <div class="dossie-linha-grid"><div><span>STATUS</span><strong style="color:${arq.status==='APROVADO'?'var(--verde-terminal)':(arq.status==='REPROVADO'?'var(--vermelho-critica)':'var(--amber-alert)')}">${arq.status}</strong></div></div> <div class="dossie-linha-grid"><div><span>CÓDIGO</span><input type="text" id="edit-arq-cod" value="${arq.cod}"></div><div><span>ACESSO</span><select id="edit-arq-acesso"><option value="LIBERADO" ${arq.acesso==='LIBERADO'?'selected':''}>LIBERADO</option><option value="RESTRITO" ${arq.acesso==='RESTRITO'?'selected':''}>RESTRITO</option><option value="SEGREDO" ${arq.acesso==='SEGREDO'?'selected':''}>SEGREDO DA ORDEM</option></select></div></div> <div class="dossie-linha"><span>TÍTULO</span><input type="text" id="edit-arq-titulo" value="${arq.titulo}"></div><div class="dossie-linha"><span>CONTEÚDO</span><textarea id="edit-arq-conteudo" style="height:100px;">${arq.conteudo}</textarea></div> ${botoesAprovacao} <button class="btn-fbi-action secundario" style="margin-top:10px;" onclick="salvarEdicaoArquivo(${idx})">SALVAR EDIÇÕES</button> <button class="btn-fbi-action btn-fbi-delete" style="margin-top:10px;" onclick="apagarArquivo(${idx})">APAGAR DOC</button> `; } else { var corSt = arq.status === 'REPROVADO' ? 'var(--vermelho-critica)' : (arq.status === 'APROVADO' ? 'var(--verde-terminal)' : 'var(--amber-alert)'); document.getElementById('conteudo-modal').innerHTML = `<div class="dossie-linha"><span>STATUS: <strong style="color:${corSt}">${arq.status}</strong></span></div><div class="dossie-linha"><span>TÍTULO</span><strong>${arq.titulo}</strong></div><div style="text-align:center;">${midiaHtml}</div><div class="dossie-linha" style="margin-top:15px;"><p style="white-space:pre-wrap; background:#07090c; padding:20px; border-left:3px solid var(--borda-fbi);">${arq.conteudo}</p></div>`; } modalDinamico.style.display = 'flex'; }
function salvarEdicaoArquivo(idx) { var arq = bancoArquivos[idx]; arq.cod = document.getElementById('edit-arq-cod').value; arq.titulo = document.getElementById('edit-arq-titulo').value; arq.acesso = document.getElementById('edit-arq-acesso').value; arq.conteudo = document.getElementById('edit-arq-conteudo').value; salvarBancos(); fecharModal(); renderArquivos(); }
function alterarStatusDoc(idx, status) { bancoArquivos[idx].status = status; salvarBancos(); fecharModal(); renderArquivos(); }
function apagarArquivo(idx) { chamarConfirmacao("APAGAR ARQUIVO?", () => { bancoArquivos.splice(idx, 1); salvarBancos(); fecharModal(); renderArquivos(); }); }

function atualizarPatentesSelect(perfilValue, patenteSelectId) { var patSel = document.getElementById(patenteSelectId); var valAtual = patSel.value; if(perfilValue === 'admin') { patSel.innerHTML = '<option value="4">4 - FUNDADOR</option>'; } else { patSel.innerHTML = '<option value="1">1 - RECRUTA</option><option value="2">2 - AGENTE</option><option value="3">3 - AGENTE ESPECIAL</option>'; if(valAtual < 4) patSel.value = valAtual; } }
function gerarCheckboxesMultiAgentesLogin(lista) { var html = `<div class="agentes-lista-checkbox" style="max-height:100px;">`; if(bancoAgentes.length === 0) return html + `<span>Nenhum agente.</span></div>`; bancoAgentes.forEach(ag => { var checked = lista.includes(ag.nome) ? "checked" : ""; html += `<label><input type="checkbox" class="check-multi-agente-login" value="${ag.nome}" ${checked}> ${ag.nome} (${ag.id_ilustrativo || 'N/A'})</label>`; }); return html + `</div>`; }
function getMultiAgentesLogin() { var c = document.querySelectorAll('.check-multi-agente-login'); var n = []; c.forEach(x => { if(x.checked) n.push(x.value); }); return n; }
function renderUsuarios() { var tbody = document.getElementById('tbody-usuarios'); var html = ""; bancoUsuarios.forEach((usr, idx) => { var agNomes = usr.agentesVinc && usr.agentesVinc.length > 0 ? usr.agentesVinc.join(', ') : 'NENHUM'; var btn = usr.id === 'ADMIN' ? `<button class="btn-fbi-action secundario" style="padding:4px; margin:0;" onclick="editarUsuario(${idx})">EDITAR</button>` : `<div style="display:flex; gap:5px;"><button class="btn-fbi-action secundario" style="padding:4px; margin:0;" onclick="editarUsuario(${idx})">EDITAR</button><button class="btn-fbi-action btn-fbi-delete" style="padding:4px; margin:0;" onclick="excluirUsuario(${idx})">EXCLUIR</button></div>`; html += `<tr><td><strong>${usr.id}</strong></td><td style="color:var(--verde-terminal); font-size:0.7rem;">${agNomes}</td><td>${getNomePatente(usr.patente)} (Nvl ${usr.patente || 1})</td><td>${btn}</td></tr>`; }); tbody.innerHTML = html; }
function abrirFormularioUsuario() { posicionarModalCentro(); document.getElementById('titulo-modal').innerText = "NOVO LOGIN"; document.getElementById('conteudo-modal').innerHTML = ` <div class="dossie-linha"><span>ID (LOGIN)</span><input type="text" id="novo-usr-id" style="text-transform:uppercase;"></div> <div class="dossie-linha"><span>PIN (6 NÚMEROS)</span><input type="password" id="novo-usr-pin" placeholder="Ex: 123456"></div> <div class="dossie-linha"><span>VINCULAR FICHAS</span>${gerarCheckboxesMultiAgentesLogin([])}</div> <div class="dossie-linha-grid"> <div><span>PERFIL</span><select id="novo-usr-perfil" onchange="atualizarPatentesSelect(this.value, 'novo-usr-patente')"><option value="agente">AGENTE</option><option value="admin">FUNDADOR</option></select></div> <div><span>PATENTE</span><select id="novo-usr-patente"><option value="1">1 - RECRUTA</option><option value="2">2 - AGENTE</option><option value="3">3 - AGENTE ESPECIAL</option></select></div> </div><button class="btn-fbi-action" onclick="salvarNovoUsuario()">CRIAR CREDENCIAL</button> `; modalDinamico.style.display = 'flex'; }
function salvarNovoUsuario() { var nId = document.getElementById('novo-usr-id').value.toUpperCase().trim(); var nPin = document.getElementById('novo-usr-pin').value.toString(); if(nId === '' || nPin.length !== 6) { somErro(); mostrarSysToast("ERRO: PIN 6 DÍGITOS", true); return; } somSucesso(); bancoUsuarios.push({ id: nId, pin: nPin, perfil: document.getElementById('novo-usr-perfil').value, patente: document.getElementById('novo-usr-patente').value, agentesVinc: getMultiAgentesLogin() }); salvarBancos(); fecharModal(); renderUsuarios(); }
function editarUsuario(idx) { indexItemSelecionado = idx; var usr = bancoUsuarios[idx]; posicionarModalCentro(); document.getElementById('titulo-modal').innerText = "EDITAR LOGIN"; var lock = usr.id === 'ADMIN' ? 'disabled' : ''; document.getElementById('conteudo-modal').innerHTML = ` <div class="dossie-linha"><span>ID</span><input type="text" id="edit-usr-id" value="${usr.id}" ${lock}></div> <div class="dossie-linha"><span>NOVO PIN</span><input type="password" id="edit-usr-pin" placeholder="******"></div> <div class="dossie-linha"><span>VINCULAR FICHAS</span>${gerarCheckboxesMultiAgentesLogin(usr.agentesVinc || [])}</div> <div class="dossie-linha-grid"> <div><span>PERFIL</span><select id="edit-usr-perfil" onchange="atualizarPatentesSelect(this.value, 'edit-usr-patente')" ${lock}><option value="agente" ${usr.perfil==='agente'?'selected':''}>AGENTE</option><option value="admin" ${usr.perfil==='admin'?'selected':''}>FUNDADOR</option></select></div> <div><span>PATENTE</span><select id="edit-usr-patente"></select></div> </div><button class="btn-fbi-action" onclick="salvarEdicaoUsuario()">SALVAR ALTERAÇÕES</button> `; var perfilSelect = document.getElementById('edit-usr-perfil'); atualizarPatentesSelect(perfilSelect.value, 'edit-usr-patente'); document.getElementById('edit-usr-patente').value = usr.patente; modalDinamico.style.display = 'flex'; }
function salvarEdicaoUsuario() { var usr = bancoUsuarios[indexItemSelecionado]; if(usr.id !== 'ADMIN') { usr.id = document.getElementById('edit-usr-id').value.toUpperCase().trim(); usr.perfil = document.getElementById('edit-usr-perfil').value; } var nPin = document.getElementById('edit-usr-pin').value.toString(); if(nPin.length > 0) { if(nPin.length !== 6) { somErro(); mostrarSysToast("PIN DEVE TER 6 NÚMEROS.", true); return; } usr.pin = nPin; } usr.patente = document.getElementById('edit-usr-patente').value; usr.agentesVinc = getMultiAgentesLogin(); somSucesso(); salvarBancos(); fecharModal(); renderUsuarios(); }
function excluirUsuario(idx) { chamarConfirmacao("REVOGAR LOGIN?", () => { bancoUsuarios.splice(idx, 1); salvarBancos(); renderUsuarios(); }); }

// --- SISTEMA MASTER INTERNO (SESSÕES) ---
window.abrirPainelMasterInterno = async function() {
    posicionarModalCentro();
    document.getElementById('titulo-modal').innerText = "ACESSO GLOBAL // SUPERVISÃO DE SESSÕES";
    document.getElementById('conteudo-modal').innerHTML = `
        <p style="color:#a6b7c9; font-size:0.8rem; margin-bottom:15px; text-align:center;">Todas as instâncias de servidor sob a sua jurisdição.</p>
        <div id="lista-sessoes-master" style="max-height: 400px; overflow-y: auto; text-align:left;">
            <p style="color:var(--amber-alert); text-align:center;">Interceptando dados do servidor...</p>
        </div>
    `;
    modalDinamico.style.display = 'flex';

    var html = `<table width="100%" style="color:#fff; font-size:0.8rem; border-collapse: collapse; text-align:left;">
        <tr style="border-bottom:1px solid #333; color:var(--amber-alert);">
            <th style="padding:10px;">CÓDIGO</th>
            <th style="padding:10px;">ÚLTIMA ATIVIDADE</th>
            <th style="padding:10px; text-align:right;">AÇÃO</th>
        </tr>`;

    try {
        var snapshot = await db.collection("sessoes").get();
        if(snapshot.empty) { 
            html += `<tr><td colspan="3" style="text-align:center; padding:20px; color:#666;">O servidor está limpo.</td></tr>`; 
        } else {
            snapshot.forEach(doc => {
                var d = doc.data();
                var textoUltimaAlt = "<span style='color:#666;'>Sem atividade</span>";
                if (d.ultimaAlteracao) {
                    var tempoInativo = Math.floor((Date.now() - d.ultimaAlteracao) / (1000 * 60 * 60 * 24));
                    var corInatividade = tempoInativo > 15 ? "var(--vermelho-critica)" : "var(--verde-terminal)";
                    textoUltimaAlt = `${new Date(d.ultimaAlteracao).toLocaleString('pt-BR')} <br><span style="font-size:0.65rem; color:${corInatividade};">(${tempoInativo} dias inativa)</span>`;
                }

                var isCurrent = doc.id === SESSAO_ATUAL;
                var btnAcao = isCurrent 
                    ? `<span style="color:var(--amber-alert); font-size:0.7rem;">SESSÃO ATUAL</span>`
                    : `<button class="btn-fbi-action btn-fbi-delete" style="margin:0; padding:4px 8px; font-size:0.65rem; width:auto;" onclick="excluirSessaoInterna('${doc.id}')">PURGAR</button>`;

                html += `<tr style="border-bottom:1px solid #1c2630;">
                    <td style="padding:15px; font-weight:bold; color:var(--verde-terminal); font-family:monospace; font-size:1.1rem;">${doc.id}</td>
                    <td style="padding:15px; color:#fff;">${textoUltimaAlt}</td>
                    <td style="padding:15px; text-align:right;">${btnAcao}</td>
                </tr>`;
            });
        }
        html += `</table>`;
        var container = document.getElementById('lista-sessoes-master');
        if(container) container.innerHTML = html;
    } catch(e) {
        var container = document.getElementById('lista-sessoes-master');
        if(container) container.innerHTML = `<p style="color:var(--vermelho-critica); text-align:center;">Erro de Permissão: Acesso Negado.</p>`;
    }
}

// A TELA DE CONFIRMAÇÃO DO PURGAR AGORA EXISTE AQUI:
window.excluirSessaoInterna = async function(id) {
    chamarConfirmacao(`ATENÇÃO: Deseja realmente APAGAR a sessão ${id}? Isso é irreversível.`, async () => {
        try {
            await db.collection("sessoes").doc(id).delete();
            somErro();
            mostrarSysToast("SESSÃO ELIMINADA COM SUCESSO.");
            abrirPainelMasterInterno(); 
        } catch(e) {
            mostrarSysToast("ERRO: PERMISSÃO NEGADA.", true);
        }
    });
}

// =========================================================
// INJEÇÃO DINÂMICA E NOVAS FUNÇÕES (LOGOFF / RECUPERAR SENHA)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Injetar botão de "Esqueceu a senha?" na tela de login
    var boxLogin = document.getElementById('box-login');
    if (boxLogin && !document.getElementById('btn-recuperar-senha')) {
        var btnLogin = boxLogin.querySelector('button'); // Pega o primeiro botão (Entrar)
        var pRecuperar = document.createElement('p');
        pRecuperar.id = 'btn-recuperar-senha';
        pRecuperar.style.cssText = "font-size:0.75rem; color:var(--amber-alert); margin-bottom:20px; cursor:pointer; text-decoration:underline; text-align: right;";
        pRecuperar.innerText = "Esqueceu a senha?";
        pRecuperar.onclick = recuperarSenha;
        
        // Insere o link logo acima do botão de Entrar
        if(btnLogin) boxLogin.insertBefore(pRecuperar, btnLogin);
    }

    // 2. Injetar botão de "Deslogar" na tela de Sessão
    var sessaoBox = document.getElementById('sessao-box');
    if (sessaoBox && !document.getElementById('btn-logoff-global')) {
        var btnLogoff = document.createElement('button');
        btnLogoff.id = 'btn-logoff-global';
        btnLogoff.className = 'btn-fbi-action btn-fbi-delete';
        btnLogoff.style.cssText = 'width: 100%; padding:8px; margin-top: 15px;';
        btnLogoff.innerHTML = '<i class="fa-solid fa-power-off"></i> DESLOGAR DA CONTA';
        btnLogoff.onclick = deslogarFirebaseAuth;
        
        // Adiciona o botão no final da caixa de sessão
        sessaoBox.appendChild(btnLogoff);
    }
});

// --- LÓGICA DE RECUPERAÇÃO DE SENHA ---
window.recuperarSenha = async function() {
    var email = document.getElementById('login-email').value;
    
    if(!email) { 
        mostrarSysToast("DIGITE SEU E-MAIL NA CAIXA ACIMA ANTES DE RECUPERAR", true); 
        return; 
    }
    
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        somSucesso();
        mostrarSysToast("E-MAIL DE RECUPERAÇÃO ENVIADO! VERIFIQUE SUA CAIXA.");
    } catch(e) {
        somErro();
        mostrarSysToast("ERRO: CONTA NÃO ENCONTRADA OU INVÁLIDA.", true);
    }
}

// --- LÓGICA DE LOGOFF (CORRIGIDA) ---
window.deslogarFirebaseAuth = function() {
    somClick();
    firebase.auth().signOut().then(() => {
        // Limpa a sala armazenada na memória do navegador
        SESSAO_ATUAL = "";
        localStorage.removeItem('rpg_sessao_atual');
    }).catch((e) => {
        console.error("Erro ao deslogar:", e);
    });
}

// --- CORREÇÃO DO AVISO (TOAST) TRAVADO NA TELA ---
window.mostrarToastSessao = function(msg, erro = false) {
    var t = document.getElementById('toast-sessao');
    if(!t) {
        // Se o toast da sessão não existir, usa o do sistema global
        if(typeof mostrarSysToast === "function") mostrarSysToast(msg, erro);
        return; 
    }
    t.innerText = msg; 
    t.style.background = erro ? "var(--vermelho-critica, #ff3333)" : "var(--amber-alert, #ffb000)";
    t.style.color = erro ? "#fff" : "#000";
    t.style.display = 'block';
    
    if(erro) somErro(); else somClick();
    
    // Agora o setTimeout funciona sempre, apagando a mensagem após 3 segundos
    setTimeout(() => t.style.display = 'none', 3000);
};

// =========================================================
// SISTEMA DE INVENTÁRIO OPERACIONAL (BLINDADO - GLOBAL)
// =========================================================

window.getReqLvlItem = function(visibilidade) {
    if(visibilidade === 'FUNDADOR') return 4;
    if(visibilidade === 'AGENTE ESPECIAL') return 3;
    if(visibilidade === 'AGENTE') return 2;
    return 1; // RECRUTA
};

window.getCorStatusInventario=function(status){
    if(status==='DISPONÍVEL')return{classe:'status-disponivel',cor:'#42ff42'};
    if(status==='EM CAMPO')return{classe:'status-em-campo',cor:'#ffb000'};
    if(status==='RESERVADO')return{classe:'status-reservado',cor:'#00aaff'};
    if(status==='PERDIDO')return{classe:'status-perdido',cor:'#ff3333'};
    if(status==='DESTRUÍDO')return{classe:'status-destruido',cor:'#777'};
    if(status==='CONTAMINADO')return{classe:'status-contaminado',cor:'#bb66ff'};
    return{classe:'',cor:'#fff'};
};

window.getCorElementoInventario = function(elemento) {
    if(elemento === 'SANGUE') return 'var(--ele-sangue)';
    if(elemento === 'MORTE') return 'var(--ele-morte)';
    if(elemento === 'ENERGIA') return 'var(--ele-energia)';
    if(elemento === 'CONHECIMENTO') return 'var(--ele-conhecimento)';
    if(elemento === 'MEDO') return 'var(--ele-medo)';
    return '#888'; // NEUTRO
};

window.renderInventario = function() {
    var grid = document.getElementById('grid-inventario');
    if (!grid) return;
    
    // MÁGICA: Forçamos a estante (Grid) a obedecer ao tamanho aqui pelo JavaScript!
    // Mude o "190px" abaixo para mais ou para menos até ficar no tamanho perfeito.
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(190px, 1fr))';
    grid.style.gap = '15px';
    
    var html = "";
    if(typeof bancoInventario === 'undefined' || bancoInventario.length === 0) {
        grid.innerHTML = '<p style="color:#666; grid-column:1/-1;">Nenhum item catalogado no inventário da sessão.</p>';
        return;
    }

    bancoInventario.forEach((item, idx) => {
        var reqLvl = window.getReqLvlItem(item.visibilidade);
        var temAcesso = (usuarioAtual.perfil === 'admin' || usuarioAtual.patente >= reqLvl);
        
        var corElem = window.getCorElementoInventario(item.elemento);
        var statusInfo=window.getCorStatusInventario(item.status);
        var classeStatus=statusInfo.classe;
        
        var fotoHtml = item.imagem 
            ? `<img src="${item.imagem}" class="foto-agente-fbi" style="width:70px; height:70px; min-height:70px; object-fit:cover; margin-bottom:5px;">` 
            : `<div class="foto-agente-fbi" style="width:70px; height:70px; min-height:70px; display:flex; align-items:center; justify-content:center; color:#333; font-size:1.5rem; margin-bottom:5px;"><i class="fa-solid fa-box"></i></div>`;
        
        var conteudoCard=`<div style="display:flex;flex-direction:column;width:100%;height:100%;"><div style="width:100%;display:flex;justify-content:center;margin-bottom:10px;">${item.imagem?`<img src="${item.imagem}" style="width:100%;height:120px;object-fit:cover;border:1px solid rgba(255,255,255,.08);">`:`<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;border:1px solid #1b2735;color:#2f3d4a;font-size:2rem;"><i class="fa-solid fa-box"></i></div>`}</div><div style="display:flex;flex-direction:column;gap:6px;flex:1;"><span style="font-size:.62rem;color:var(--verde-terminal);font-family:monospace;text-align:center;">${item.idOperacional}</span><h3 style="margin:0;font-size:1rem;line-height:1.1;text-align:center;color:#fff;text-transform:uppercase;min-height:34px;">${item.nome}</h3><div style="display:flex;justify-content:center;"><span class="tag-elemento" style="background:${corElem};padding:3px 8px;font-size:.58rem;letter-spacing:1px;color:${item.elemento==='NEUTRO'?'#000':'#fff'};">${item.elemento}</span></div><div style="text-align:center;font-size:.62rem;color:#73869b;letter-spacing:1px;">${item.categoria}</div>${item.portador?`<div style="font-size:.58rem;text-align:center;color:var(--amber-alert);margin-top:3px;letter-spacing:.5px;"><i class="fa-solid fa-user"></i> ${item.portador}</div>`:''}<div style="margin-top:auto;display:flex;justify-content:center;align-items:center;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);"><strong style="font-size:.72rem;margin:0;color:${statusInfo.cor};letter-spacing:1px;font-weight:700;">${item.status}</strong></div></div></div>`;

        // Note o "width: 100%; max-width: 220px;" que garante que o cartão acompanha o Grid
        if (temAcesso) {
            html += `<div class="fbi-card card-inventario" style="border-bottom:3px solid ${corElem};width:100%;max-width:200px;min-height:320px;padding:10px;display:flex;flex-direction:column;box-sizing:border-box;" onclick="window.abrirDossieItem(${idx})">${conteudoCard}</div>`;
        } else {
            html += `
                <div class="fbi-card card-restrito" style="border-bottom:3px solid var(--vermelho-critica); min-height:280px; width:100%; max-width:220px; margin:0 auto; padding:15px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; height:100%; box-sizing:border-box; position:relative; overflow:hidden;">
                    <div class="acesso-restrito-blur" style="width:100%;">${conteudoCard}</div>
                    <div class="overlay-restrito" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(14,19,25,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; z-index:10;">
                        <i class="fa-solid fa-lock" style="font-size:1.5rem; margin-bottom:5px; color:var(--vermelho-critica);"></i>
                        <span style="font-size:0.8rem; letter-spacing:1px; color:#fff; font-weight:bold;">RESTRITO</span>
                        <span style="font-size:0.6rem; color:var(--vermelho-critica); margin-top:2px; font-weight:bold;">NÍVEL: ${item.visibilidade}</span>
                    </div>
                </div>
            `;
        }
    });
    
    grid.innerHTML = html;
};

window.abrirFormularioInventario = function() {
    if(typeof posicionarModalCentro === 'function') posicionarModalCentro();
    window.base64TempMedia = ""; 
    var modalDinamico = document.getElementById('modal-dinamico');
    if(!modalDinamico) return;
    
    document.getElementById('titulo-modal').innerText = "CADASTRAR ITEM OPERACIONAL";
    document.getElementById('conteudo-modal').innerHTML = `
        <div class="dossie-linha-grid">
            <div><span>NOME DO ITEM</span><input type="text" id="novo-inv-nome"></div>
            <div><span>ID OPERACIONAL</span><input type="text" id="novo-inv-id" value="INV-${Math.floor(1000 + Math.random() * 9000)}"></div>
        </div>
        <div class="dossie-linha-grid">
            <div><span>CATEGORIA</span>
                <select id="novo-inv-categoria">
                    <option value="EQUIPAMENTO">EQUIPAMENTO</option>
                    <option value="ARTEFATO">ARTEFATO</option>
                    <option value="DOCUMENTO">DOCUMENTO</option>
                    <option value="CONSUMÍVEL">CONSUMÍVEL</option>
                    <option value="CONTENÇÃO">CONTENÇÃO</option>
                    <option value="OUTROS">OUTROS</option>
                </select>
            </div>
            <div><span>ELEMENTO</span>
                <select id="novo-inv-elemento">
                    <option value="NEUTRO">NEUTRO</option>
                    <option value="SANGUE">SANGUE</option>
                    <option value="MORTE">MORTE</option>
                    <option value="ENERGIA">ENERGIA</option>
                    <option value="CONHECIMENTO">CONHECIMENTO</option>
                    <option value="MEDO">MEDO</option>
                </select>
            </div>
        </div>
        <div class="dossie-linha-grid">
            <div><span>STATUS</span>
                <select id="novo-inv-status">
                    <option value="DISPONÍVEL">DISPONÍVEL</option>
                    <option value="EM CAMPO">EM CAMPO</option>
                    <option value="RESERVADO">RESERVADO</option>
                    <option value="PERDIDO">PERDIDO</option>
                    <option value="DESTRUÍDO">DESTRUÍDO</option>
                    <option value="CONTAMINADO">CONTAMINADO</option>
                </select>
            </div>
            <div><span>VISIBILIDADE EXIGIDA</span>
                <select id="novo-inv-vis">
                    <option value="RECRUTA">RECRUTA</option>
                    <option value="AGENTE">AGENTE</option>
                    <option value="AGENTE ESPECIAL">AGENTE ESPECIAL</option>
                    <option value="FUNDADOR">FUNDADOR</option>
                </select>
            </div>
        </div>
        <div class="dossie-linha-grid">
            <div><span>QUANTIDADE</span><input type="number" id="novo-inv-qtd" value="1"></div>
            <div><span>DANO / EFEITO (Ex: 2d20)</span><input type="text" id="novo-inv-dano" placeholder="Opcional"></div>
        </div>
        <div class="dossie-linha"><span>LOCALIZAÇÃO DE ARMAZENAMENTO</span><input type="text" id="novo-inv-local" value="Base Operacional"></div>
        <div class="dossie-linha"><span>IMAGEM DO ITEM</span><input type="file" accept="image/*" onchange="if(typeof lidarComUploadMidia === 'function'){lidarComUploadMidia(event)}"><div id="preview-upload"></div></div>
        <div class="dossie-linha"><span>DESCRIÇÃO</span><textarea id="novo-inv-desc" style="height:60px;"></textarea></div>
        <div class="dossie-linha"><span>OBSERVAÇÕES TÁTICAS</span><textarea id="novo-inv-obs" style="height:60px;"></textarea></div>
        <button class="btn-fbi-action" onclick="window.salvarNovoItemInventario()">REGISTRAR NO SISTEMA</button>
    `;
    modalDinamico.style.display = 'flex';
};

window.salvarNovoItemInventario = function() {
    if(typeof bancoInventario === 'undefined') window.bancoInventario = [];
    var nome = document.getElementById('novo-inv-nome').value.trim() || "Item Desconhecido";
    var idOp = document.getElementById('novo-inv-id').value.trim();
    
    window.bancoInventario.push({
        nome:nome.toUpperCase(),
        idOperacional: idOp,
        categoria: document.getElementById('novo-inv-categoria').value,
        elemento: document.getElementById('novo-inv-elemento').value,
        status: document.getElementById('novo-inv-status').value,
        visibilidade: document.getElementById('novo-inv-vis').value,
        quantidade: document.getElementById('novo-inv-qtd').value,
        danoEfeito: document.getElementById('novo-inv-dano').value,
        localizacao: document.getElementById('novo-inv-local').value,
        imagem: window.base64TempMedia || "",
        descricao: document.getElementById('novo-inv-desc').value,
        observacoes: document.getElementById('novo-inv-obs').value,
        portador: "",
        solicitantes: [],
        criadoEm: Date.now()
    });
    
    if(typeof salvarBancos === 'function') salvarBancos();
    if(typeof fecharModal === 'function') fecharModal();
    window.renderInventario();
    if(typeof somSucesso === 'function') somSucesso();
    if(typeof mostrarSysToast === 'function') mostrarSysToast("ITEM CADASTRADO COM SUCESSO.");
};

window.abrirDossieItem = function(idx) {
    window.indexItemSelecionado = idx;
    var item = window.bancoInventario[idx];
    if(typeof posicionarModalCentro === 'function') posicionarModalCentro();
    
    var isAdmin = usuarioAtual.perfil === 'admin';
    var meuAgente = usuarioAtual.agentesVinc.length > 0 ? usuarioAtual.agentesVinc[0] : usuarioAtual.id;
    var corElem = window.getCorElementoInventario(item.elemento);
    
    var midiaHtml = "";
    if(typeof renderizarMidia === "function") {
        midiaHtml = renderizarMidia(item.imagem);
    } else {
        midiaHtml = item.imagem ? `<img src="${item.imagem}" style="width:100%; border:1px solid #333;">` : `<div style="width:100%; height:150px; border:1px dashed #333; display:flex; align-items:center; justify-content:center;">SEM FOTO</div>`;
    }
    
    var avisoSolicitantes = '';
    if (isAdmin && item.solicitantes && item.solicitantes.length > 0) {
        var listaBotoesPedidos = item.solicitantes.map(solicitante => {
            return `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:1px dashed #000; padding-top:8px;">
                        <span><i class="fa-solid fa-hand"></i> ${solicitante}</span>
                        <button class="btn-fbi-action" style="width:auto; margin:0; padding:5px 15px; font-size:0.75rem; background:#1c2630; color:var(--verde-terminal); border:1px solid var(--verde-terminal);" onclick="window.aceitarSolicitacaoItem(${idx}, '${solicitante}')">AUTORIZAR</button>
                    </div>`;
        }).join('');

        avisoSolicitantes = `
            <div style="background:var(--amber-alert); color:#000; padding:15px; margin-top:15px; font-weight:bold; font-size:0.8rem; border-radius:4px;">
                <div style="margin-bottom:5px;">REQUISIÇÕES PENDENTES:</div>
                ${listaBotoesPedidos}
            </div>
        `;
    }

    var botoesHtml = '';
    if (isAdmin) {
        botoesHtml = `
            <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
                <button class="btn-fbi-action" style="flex:1; margin:0; padding:10px; background:#1c2630;" onclick="window.editarItemInventario(${idx})">EDITAR</button>
                <button class="btn-fbi-action btn-fbi-delete" style="flex:1; margin:0; padding:10px;" onclick="window.excluirItemInventario(${idx})">EXCLUIR</button>
                <button class="btn-fbi-action secundario" style="width:100%; margin:0; margin-top:10px;" onclick="fecharModal(); window.location.hash='#inventario';">VOLTAR AO INVENTÁRIO</button>
            </div>
        `;
    } else {
        var jaSolicitou = item.solicitantes && item.solicitantes.includes(meuAgente);
        var euSouPortador = item.portador === meuAgente;
        
        botoesHtml = `<div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">`;
        
        if (euSouPortador) {
            botoesHtml += `<button class="btn-fbi-action" style="width:100%; margin:0; background:var(--amber-alert); color:#000;" onclick="window.devolverItemInventario(${idx})">DEVOLVER ITEM À BASE</button>`;
        } else if (item.status === 'DISPONÍVEL' && !jaSolicitou) {
            botoesHtml += `<button class="btn-fbi-action" style="width:100%; margin:0; background:var(--verde-terminal); color:#000;" onclick="window.solicitarRetiradaItem(${idx})">SOLICITAR RETIRADA</button>`;
        } else if (jaSolicitou) {
            botoesHtml += `<p style="width:100%; text-align:center; color:var(--amber-alert); font-weight:bold; font-size:0.8rem;">REQUISIÇÃO EM ANÁLISE PELOS FUNDADORES...</p>`;
        }
        botoesHtml += `</div>`;
    }

    document.getElementById('titulo-modal').innerText = "DOSSIÊ OPERACIONAL: " + item.idOperacional;
    document.getElementById('conteudo-modal').innerHTML = `
        <div style="display:flex; gap:20px; align-items:flex-start;">
            <div style="width:150px; flex-shrink:0;">${midiaHtml}</div>
            <div style="flex-grow:1;">
                <h2 style="color:#fff; text-transform:uppercase; margin-bottom:5px;">${item.nome}</h2>
                <span class="tag-elemento" style="background:${corElem}; color:${item.elemento==='NEUTRO'?'#000':'#fff'}; margin-bottom:10px; display:inline-block;">${item.elemento}</span>
                <div class="dossie-linha-grid" style="margin-bottom:0;">
                    <div><span style="display:block; font-size:0.65rem;">STATUS</span><strong style="color:${window.getCorStatusInventario(item.status).cor};font-weight:700;letter-spacing:1px;opacity:.95;">${item.status}</strong></div>
                    <div><span style="display:block; font-size:0.65rem;">CATEGORIA</span><strong style="color:var(--fbi-text);">${item.categoria}</strong></div>
                </div>
                <div class="dossie-linha-grid" style="margin-top:10px; margin-bottom:0;">
                    <div><span style="display:block; font-size:0.65rem;">QUANTIDADE</span><strong style="color:#fff;">${item.quantidade}x</strong></div>
                    <div><span style="display:block; font-size:0.65rem;">DANO / EFEITO</span><strong style="color:var(--vermelho-critica);">${item.danoEfeito || 'N/A'}</strong></div>
                </div>
            </div>
        </div>
        <div class="dossie-linha" style="margin-top:20px;">
            <span style="margin-right:10px;">PORTADOR ATUAL:</span><strong style="color:${item.portador ? 'var(--amber-alert)' : 'var(--verde-terminal)'};">${item.portador || 'NENHUM (NA BASE)'}</strong>
        </div>
        <div class="dossie-linha"><span style="margin-right:10px;">LOCALIZAÇÃO:</span><strong style="color:#fff;">${item.localizacao}</strong></div>
        <div class="dossie-linha"><span>DESCRIÇÃO GERAL</span><p style="white-space:pre-wrap; color:#fff; font-size:0.8rem;">${item.descricao || 'Sem descrição.'}</p></div>
        <div class="dossie-linha"><span>OBSERVAÇÕES TÁTICAS</span><p style="white-space:pre-wrap; color:var(--amber-alert); font-size:0.8rem;">${item.observacoes || 'Nenhuma observação.'}</p></div>
        ${avisoSolicitantes}
        ${item.categoria==='CONSUMÍVEL'&&(usuarioAtual.perfil==='admin'||item.portador===meuAgente)?`<button class="btn-fbi-action" style="width:100%;margin-top:10px;background:${Number(item.quantidade)>0?'var(--amber-alert)':'#444'};color:${Number(item.quantidade)>0?'#000':'#888'};" ${Number(item.quantidade)<=0?'disabled':''} onclick="window.consumirItemInventario(${idx})">${Number(item.quantidade)>0?'CONSUMIR UNIDADE':'SEM ESTOQUE'}</button>`:''}${botoesHtml}
    `;
    var modalDinamico = document.getElementById('modal-dinamico');
    if(modalDinamico) modalDinamico.style.display = 'flex';
};

window.consumirItemInventario=function(idx){var item=window.bancoInventario[idx];var meuAgente=usuarioAtual.agentesVinc&&usuarioAtual.agentesVinc.length>0?usuarioAtual.agentesVinc[0]:usuarioAtual.id;var podeConsumir=usuarioAtual.perfil==='admin'||item.portador===meuAgente;if(!podeConsumir){if(typeof mostrarSysToast==='function')mostrarSysToast('ACESSO NEGADO: ITEM NÃO VINCULADO AO AGENTE.');return;}if(item.categoria!=='CONSUMÍVEL')return;if(Number(item.quantidade)<=0){if(typeof mostrarSysToast==='function')mostrarSysToast('ESTOQUE ESGOTADO.');return;}item.quantidade=Number(item.quantidade)-1;if(item.quantidade<=0){item.quantidade=0;item.status='DESTRUÍDO';if(item.portador)item.localizacao='CONSUMIDO';}if(typeof salvarBancos==='function')salvarBancos();var inventarioAgente=document.getElementById('inventario-agente');if(inventarioAgente&&item.portador)inventarioAgente.innerHTML=window.gerarHtmlInventarioDoAgente(item.portador);if(typeof renderInventario==='function')window.renderInventario();if(typeof renderizarAgentes==='function')renderizarAgentes();window.abrirDossieItem(idx);if(typeof somSucesso==='function')somSucesso();};

window.solicitarRetiradaItem = function(idx) {
    var meuAgente = usuarioAtual.agentesVinc.length > 0 ? usuarioAtual.agentesVinc[0] : usuarioAtual.id;
    if (!window.bancoInventario[idx].solicitantes) bancoInventario[idx].solicitantes = [];
    bancoInventario[idx].solicitantes.push(meuAgente);
    if(typeof salvarBancos === 'function') salvarBancos();
    window.abrirDossieItem(idx);
    if(typeof mostrarSysToast === 'function') mostrarSysToast("REQUISIÇÃO ENVIADA AOS FUNDADORES.");
};

window.devolverItemInventario = function(idx) {
    bancoInventario[idx].portador = "";
    bancoInventario[idx].status = "DISPONÍVEL";
    bancoInventario[idx].localizacao = "Base Operacional";
    if(typeof salvarBancos === 'function') salvarBancos();
    window.abrirDossieItem(idx);
    if(typeof mostrarSysToast === 'function') mostrarSysToast("ITEM DEVOLVIDO À BASE.");
};

window.editarItemInventario = function(idx) {
    var item = bancoInventario[idx];
    window.base64TempMedia = item.imagem || "";
    document.getElementById('titulo-modal').innerText = "EDITAR: " + item.idOperacional;
    
    // MÁGICA 1: Puxa todos os agentes do banco de dados para criar a lista de opções
    var opcoesAgentes = `<option value="">NENHUM (NA BASE)</option>`;
    if(typeof bancoAgentes !== 'undefined') {
        bancoAgentes.forEach(ag => {
            var selecionado = (item.portador === ag.nome) ? 'selected' : '';
            opcoesAgentes += `<option value="${ag.nome}" ${selecionado}>${ag.nome} - ${ag.classe || ''}</option>`;
        });
    }

    document.getElementById('conteudo-modal').innerHTML = `
        <div class="dossie-linha-grid">
            <div><span>NOME DO ITEM</span><input type="text" id="edit-inv-nome" value="${item.nome}"></div>
            <div><span>PORTADOR ATUAL</span>
                <select id="edit-inv-portador" style="background:var(--fbi-interface-blue); color:var(--amber-alert); font-weight:bold;">
                    ${opcoesAgentes}
                </select>
            </div>
        </div>
        <div class="dossie-linha-grid">
            <div><span>CATEGORIA</span>
                <select id="edit-inv-categoria">
                    <option value="EQUIPAMENTO" ${item.categoria==='EQUIPAMENTO'?'selected':''}>EQUIPAMENTO</option>
                    <option value="ARTEFATO" ${item.categoria==='ARTEFATO'?'selected':''}>ARTEFATO</option>
                    <option value="DOCUMENTO" ${item.categoria==='DOCUMENTO'?'selected':''}>DOCUMENTO</option>
                    <option value="CONSUMÍVEL" ${item.categoria==='CONSUMÍVEL'?'selected':''}>CONSUMÍVEL</option>
                    <option value="CONTENÇÃO" ${item.categoria==='CONTENÇÃO'?'selected':''}>CONTENÇÃO</option>
                    <option value="OUTROS" ${item.categoria==='OUTROS'?'selected':''}>OUTROS</option>
                </select>
            </div>
            <div><span>ELEMENTO</span>
                <select id="edit-inv-elemento">
                    <option value="NEUTRO" ${item.elemento==='NEUTRO'?'selected':''}>NEUTRO</option>
                    <option value="SANGUE" ${item.elemento==='SANGUE'?'selected':''}>SANGUE</option>
                    <option value="MORTE" ${item.elemento==='MORTE'?'selected':''}>MORTE</option>
                    <option value="ENERGIA" ${item.elemento==='ENERGIA'?'selected':''}>ENERGIA</option>
                    <option value="CONHECIMENTO" ${item.elemento==='CONHECIMENTO'?'selected':''}>CONHECIMENTO</option>
                    <option value="MEDO" ${item.elemento==='MEDO'?'selected':''}>MEDO</option>
                </select>
            </div>
        </div>
        <div class="dossie-linha-grid">
            <div><span>STATUS</span>
                <select id="edit-inv-status">
                    <option value="DISPONÍVEL" ${item.status==='DISPONÍVEL'?'selected':''}>DISPONÍVEL</option>
                    <option value="EM CAMPO" ${item.status==='EM CAMPO'?'selected':''}>EM CAMPO</option>
                    <option value="RESERVADO" ${item.status==='RESERVADO'?'selected':''}>RESERVADO</option>
                    <option value="PERDIDO" ${item.status==='PERDIDO'?'selected':''}>PERDIDO</option>
                    <option value="DESTRUÍDO" ${item.status==='DESTRUÍDO'?'selected':''}>DESTRUÍDO</option>
                    <option value="CONTAMINADO" ${item.status==='CONTAMINADO'?'selected':''}>CONTAMINADO</option>
                </select>
            </div>
            <div><span>VISIBILIDADE</span>
                <select id="edit-inv-vis">
                    <option value="RECRUTA" ${item.visibilidade==='RECRUTA'?'selected':''}>RECRUTA</option>
                    <option value="AGENTE" ${item.visibilidade==='AGENTE'?'selected':''}>AGENTE</option>
                    <option value="AGENTE ESPECIAL" ${item.visibilidade==='AGENTE ESPECIAL'?'selected':''}>AGENTE ESPECIAL</option>
                    <option value="FUNDADOR" ${item.visibilidade==='FUNDADOR'?'selected':''}>FUNDADOR</option>
                </select>
            </div>
        </div>
        <div class="dossie-linha-grid">
            <div><span>QUANTIDADE</span><input type="number" id="edit-inv-qtd" value="${item.quantidade}"></div>
            <div><span>DANO / EFEITO</span><input type="text" id="edit-inv-dano" value="${item.danoEfeito || ''}"></div>
        </div>
        <div class="dossie-linha"><span>LOCALIZAÇÃO</span><input type="text" id="edit-inv-local" value="${item.localizacao}"></div>
        <div class="dossie-linha"><span>NOVA IMAGEM (Deixe vazio p/ manter)</span><input type="file" accept="image/*" onchange="if(typeof lidarComUploadMidia === 'function'){lidarComUploadMidia(event)}"></div>
        <div class="dossie-linha"><span>DESCRIÇÃO</span><textarea id="edit-inv-desc" style="height:60px;">${item.descricao}</textarea></div>
        <div class="dossie-linha"><span>OBSERVAÇÕES TÁTICAS</span><textarea id="edit-inv-obs" style="height:60px;">${item.observacoes}</textarea></div>
        
        <button class="btn-fbi-action" style="margin-bottom:10px;" onclick="window.salvarEdicaoInventario(${idx})">SALVAR ALTERAÇÕES</button>
        <button class="btn-fbi-action secundario" onclick="bancoInventario[${idx}].solicitantes = []; if(typeof salvarBancos === 'function') salvarBancos(); window.abrirDossieItem(${idx}); if(typeof mostrarSysToast === 'function') mostrarSysToast('FILA DE PEDIDOS LIMPA.');">LIMPAR SOLICITANTES</button>
    `;
};

window.salvarEdicaoInventario = function(idx) {
    var item = bancoInventario[idx];
    item.nome = document.getElementById('edit-inv-nome').value.toUpperCase();
    item.portador = document.getElementById('edit-inv-portador').value.trim();
    item.categoria = document.getElementById('edit-inv-categoria').value;
    item.elemento = document.getElementById('edit-inv-elemento').value;
    item.status = document.getElementById('edit-inv-status').value;
    item.visibilidade = document.getElementById('edit-inv-vis').value;
    item.quantidade = document.getElementById('edit-inv-qtd').value;
    item.danoEfeito = document.getElementById('edit-inv-dano').value;
    item.localizacao = document.getElementById('edit-inv-local').value;
    item.descricao = document.getElementById('edit-inv-desc').value;
    item.observacoes = document.getElementById('edit-inv-obs').value;
    if(window.base64TempMedia !== "") item.imagem = window.base64TempMedia;
    
    if(typeof salvarBancos === 'function') salvarBancos();
    if(typeof fecharModal === 'function') fecharModal();
    window.renderInventario();
    if(typeof somSucesso === 'function') somSucesso();
};

window.excluirItemInventario = function(idx) {
    if(typeof chamarConfirmacao === 'function') {
        chamarConfirmacao("APAGAR ITEM PERMANENTEMENTE DO INVENTÁRIO?", () => {
            bancoInventario.splice(idx, 1);
            salvarBancos();
            fecharModal();
            window.renderInventario();
        });
    } else {
        if(confirm("APAGAR ITEM PERMANENTEMENTE?")) {
            bancoInventario.splice(idx, 1);
            if(typeof salvarBancos === 'function') salvarBancos();
            if(typeof fecharModal === 'function') fecharModal();
            window.renderInventario();
        }
    }
};

window.aceitarSolicitacaoItem=function(idx,nomeAgente){var modal=document.getElementById('modal-dinamico');modal.classList.add('modal-transferencia');document.getElementById('conteudo-modal').innerHTML=`<div style="width:340px;border:1px solid var(--verde-terminal);background:rgba(14,19,25,.98);margin:auto;"><div style="background:rgba(15,55,30,.55);color:var(--verde-terminal);padding:10px 16px;font-weight:700;border-bottom:1px solid var(--verde-terminal);text-align:center;">TRANSFERÊNCIA OPERACIONAL</div><div style="padding:18px;display:flex;flex-direction:column;align-items:center;"><div style="font-size:.82rem;color:#cfd8e3;margin-bottom:18px;text-align:center;">DEFINA O STATUS OPERACIONAL PARA <span style="color:var(--amber-alert)">${nomeAgente}</span></div><div style="display:flex;flex-direction:column;gap:10px;width:76%;"><button class="btn-fbi-action" style="height:34px;background:rgba(36,48,65,.45);color:#d7e2ee;" onclick="document.getElementById('modal-dinamico').classList.remove('modal-transferencia');window.confirmarTransferenciaItem(${idx},'${nomeAgente}','RESERVADO');">RESERVAR NA BASE</button><button class="btn-fbi-action" style="height:34px;background:rgba(255,180,0,.15);border:1px solid var(--amber-alert);color:var(--amber-alert);" onclick="document.getElementById('modal-dinamico').classList.remove('modal-transferencia');window.confirmarTransferenciaItem(${idx},'${nomeAgente}','EM CAMPO');">LIBERAR PARA CAMPO</button><button class="btn-fbi-action" style="height:34px;background:rgba(120,18,18,.18);border:1px solid #8d2b2b;color:#ff8a8a;" onclick="document.getElementById('modal-dinamico').classList.remove('modal-transferencia');window.abrirDossieItem(${idx});">CANCELAR</button></div></div></div>`;modal.style.display='flex';};

window.confirmarTransferenciaItem=function(idx,nomeAgente,status){var modal=document.getElementById('modal-dinamico');modal.classList.remove('modal-transferencia');bancoInventario[idx].portador=nomeAgente;bancoInventario[idx].status=status;bancoInventario[idx].localizacao=status==='RESERVADO'?'Reservado para '+nomeAgente:'Em posse de '+nomeAgente;bancoInventario[idx].solicitantes=[];if(typeof salvarBancos==='function')salvarBancos();if(typeof renderInventario==='function')renderInventario();if(typeof renderizarAgentes==='function')renderizarAgentes();modal.style.display='none';if(typeof mostrarSysToast==='function')mostrarSysToast('TRANSFERÊNCIA AUTORIZADA.');if(typeof somSucesso==='function')somSucesso();};

window.gerarHtmlInventarioDoAgente=function(nomeDoAgente){if(typeof bancoInventario==='undefined')return'';var itensDoAgente=bancoInventario.filter(item=>item.portador===nomeDoAgente);if(itensDoAgente.length===0)return`<div style="padding:10px;border:1px dashed #333;color:#666;text-align:center;font-size:.8rem;margin-top:10px;">NENHUM EQUIPAMENTO VINCULADO</div>`;var html=`<div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">`;itensDoAgente.forEach(item=>{var itemAtual=window.bancoInventario.find(i=>i.idOperacional===item.idOperacional)||item;var corElem=window.getCorElementoInventario(itemAtual.elemento);var brilho=itemAtual.elemento!=='NEUTRO'?`box-shadow:0 0 10px ${corElem};`:``;var statusInfo=window.getCorStatusInventario(itemAtual.status);html+=`<div style="border:1px solid var(--borda-fbi);border-left:4px solid ${corElem};padding:10px;background:rgba(14,19,25,.8);${brilho}cursor:pointer;transition:.15s;" onclick="window.abrirDossieItem(window.bancoInventario.findIndex(i=>i.idOperacional==='${itemAtual.idOperacional}'))" onmouseenter="this.style.transform='translateX(3px)'" onmouseleave="this.style.transform='translateX(0)'"><div style="display:flex;justify-content:space-between;align-items:center;"><strong style="color:#fff;font-size:.9rem;letter-spacing:1px;">${itemAtual.nome}<span style="color:var(--fbi-text);font-size:.7rem;"> (x${itemAtual.quantidade})</span></strong>${itemAtual.danoEfeito?`<span style="background:var(--vermelho-critica);color:#fff;padding:2px 6px;border-radius:3px;font-size:.7rem;font-weight:bold;">${itemAtual.danoEfeito}</span>`:''}</div><div style="display:flex;justify-content:space-between;margin-top:5px;font-size:.7rem;color:#888;"><span>[${itemAtual.categoria}]</span><span style="color:${statusInfo.cor};font-weight:700;">${itemAtual.status}</span></div></div>`});html+=`</div>`;return html;};
// ==========================================
// PATCH DEFINITIVO: TECLADO FÍSICO E ENTER
// ==========================================
window.iniciarLogin = function() {
    document.getElementById('perfis-botoes').style.display = 'none';
    document.getElementById('login-processo').style.display = 'flex';
    var input = document.getElementById('agente-id-input');
    input.style.display = 'block'; 
    input.value = '';
    input.focus();
    document.getElementById('pinpad-container').style.display = 'none'; 
    document.getElementById('login-instrucao').innerText = ""; 
    
    input.onkeydown = function(e) { 
        if(e.key === 'Enter') { 
            e.preventDefault();
            e.stopPropagation(); // Impede o Enter de vazar para a tela de senha
            
            window.pinProcesso.id = this.value.toUpperCase().trim(); 
            if(window.pinProcesso.id === '') return; 
            
            this.style.display = 'none'; 
            document.getElementById('pinpad-container').style.display = 'block'; 
            window.pinProcesso.pin = '';
            var display = document.getElementById('pin-display');
            if(display) { display.value = ''; display.focus(); }
        } 
    }; 
};

document.addEventListener('keydown', function(e) {
    var pinPad = document.getElementById('pinpad-container');
    var idInput = document.getElementById('agente-id-input');
    
    if (pinPad && pinPad.style.display === 'block' && (!idInput || idInput.style.display === 'none')) {
        if (e.key >= '0' && e.key <= '9') {
            if (typeof window.digitarPin === 'function') window.digitarPin(e.key);
        } else if (e.key === 'Backspace') {
            if (window.pinProcesso) {
                window.pinProcesso.pin = window.pinProcesso.pin.slice(0, -1);
                var display = document.getElementById('pin-display');
                if (display) display.value = window.pinProcesso.pin.replace(/./g, '*');
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (window.pinProcesso.pin.length === 6) {
                if (typeof window.validarLogin === 'function') window.validarLogin();
            } else {
                if (window.mostrarSysToast) window.mostrarSysToast("DIGITE OS 6 DÍGITOS.", true);
            }
        } else if (e.key === 'Escape') {
            if (typeof window.cancelarLogin === 'function') window.cancelarLogin();
        }
    }
});

// ==========================================
// BLINDAGEM GLOBAL (Evita 'is not defined')
// ==========================================
if (typeof toggleChatWindow !== 'undefined') window.toggleChatWindow = toggleChatWindow;
if (typeof carregarDadosDaNuvem !== 'undefined') window.carregarDadosDaNuvem = carregarDadosDaNuvem;
if (typeof validarLogin !== 'undefined') window.validarLogin = validarLogin;
if (typeof digitarPin !== 'undefined') window.digitarPin = digitarPin;
if (typeof iniciarLogin !== 'undefined') window.iniciarLogin = iniciarLogin;
if (typeof abrirFormularioAgente !== 'undefined') window.abrirFormularioAgente = abrirFormularioAgente;
if (typeof abrirFormularioArquivo !== 'undefined') window.abrirFormularioArquivo = abrirFormularioArquivo;
if (typeof abrirFormularioEntidade !== 'undefined') window.abrirFormularioEntidade = abrirFormularioEntidade;
if (typeof abrirFormularioRelatorio !== 'undefined') window.abrirFormularioRelatorio = abrirFormularioRelatorio;
if (typeof abrirFormularioUsuario !== 'undefined') window.abrirFormularioUsuario = abrirFormularioUsuario;
if (typeof abrirFormularioInventario !== 'undefined') window.abrirFormularioInventario = abrirFormularioInventario;
if (typeof renderizarAgentes !== 'undefined') window.renderizarAgentes = renderizarAgentes;
if (typeof renderizarPerfil !== 'undefined') window.renderizarPerfil = renderizarPerfil;
if (typeof renderEntidades !== 'undefined') window.renderEntidades = renderEntidades;
if (typeof renderArquivos !== 'undefined') window.renderArquivos = renderArquivos;
if (typeof renderRelatorios !== 'undefined') window.renderRelatorios = renderRelatorios;
if (typeof renderUsuarios !== 'undefined') window.renderUsuarios = renderUsuarios;
if (typeof renderInventario !== 'undefined') window.renderInventario = renderInventario;
if (typeof salvarBancos !== 'undefined') window.salvarBancos = salvarBancos;
if (typeof fecharModal !== 'undefined') window.fecharModal = fecharModal;
if (typeof posicionarModalCentro !== 'undefined') window.posicionarModalCentro = posicionarModalCentro;
if (typeof mostrarDossieJanela !== 'undefined') window.mostrarDossieJanela = mostrarDossieJanela;
