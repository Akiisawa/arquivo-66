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
window.db = firebase.firestore();

// --- VARIÁVEIS GLOBAIS (Para a Ponte Modular conseguir ler) ---
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
window.usuarioLogado = false;
window.usuarioAtual = { perfil: '', id: '', patente: 1, agentesVinc: [] };
window.indexItemSelecionado = null;
window.base64TempMedia = "";
window.agenteSendoEditado = null;
window.pinProcesso = { id: '', pin: '' };
window.periciasTempFicha = {};

// --- INICIALIZAÇÃO GERAL ---
document.addEventListener("DOMContentLoaded", () => {
    const introEl = document.getElementById("tela-intro");
    if(introEl) introEl.style.display = "none";
    
    const savedSession = localStorage.getItem('rpg_sessao_atual');
    if (savedSession && document.getElementById('input-codigo-sessao')) {
        document.getElementById('input-codigo-sessao').value = savedSession;
    }

    // Porteiro de Autenticação
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!document.getElementById('sys-toast')) {
            let toastBox = document.createElement('div');
            toastBox.id = 'sys-toast';
            toastBox.style.cssText = 'display:none; position:fixed; top:20px; right:20px; background:#07090c; border:1px solid; padding:15px 25px; z-index:9999999999; font-family:monospace; border-radius:4px; font-weight:bold; box-shadow: 0 5px 15px rgba(0,0,0,0.5);';
            document.body.appendChild(toastBox);
        }

        const telaAuth = document.getElementById('tela-auth');
        const telaSessao = document.getElementById('tela-sessao');
        
        if(user) {
            if(telaAuth) telaAuth.style.display = 'none';
            if(telaSessao && window.SESSAO_ATUAL === "") {
                telaSessao.style.display = 'flex';
                try {
                    const snapshot = await window.db.collection("sessoes").where("ownerUid", "==", user.uid).get();
                    if (!snapshot.empty) {
                        let minhaSessao = snapshot.docs[0].id;
                        window.iniciarRotinaDeBoot(minhaSessao); // Auto-login
                    }
                } catch(e) { console.error("Erro ao buscar sessão:", e); }
            }
        } else {
            if(telaAuth) telaAuth.style.display = 'flex';
            if(telaSessao) telaSessao.style.display = 'none';
        }
    });

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
});

// --- ÁUDIO ---
const AudioContext = window.AudioContext || window.webkitAudioContext; let audioCtx;
window.initAudio = function() { if(!audioCtx) audioCtx = new AudioContext(); if(audioCtx.state === 'suspended') audioCtx.resume(); };
window.somClick = function() { if(window.isMuted || !audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'square'; osc.frequency.setValueAtTime(500, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.05); }; 
window.somErro = function() { if(window.isMuted || !audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.4); }; 
window.somSucesso = function() { if(window.isMuted || !audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1); };
document.addEventListener('click', (e) => { if(window.initAudio) window.initAudio(); if(e.target.tagName === 'BUTTON') window.somClick(); });

window.mostrarSysToast = function(msg, isError = false) {
    let t = document.getElementById('sys-toast'); 
    if(!t) { alert(msg); return; }
    t.innerText = msg; 
    t.style.borderColor = isError ? "var(--vermelho-critica)" : "var(--verde-terminal)"; 
    t.style.color = isError ? "var(--vermelho-critica)" : "var(--verde-terminal)"; 
    t.style.display = 'block'; 
    if(isError) window.somErro(); else window.somClick();
    setTimeout(() => { t.style.display = 'none'; }, 3500);
}

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

// --- LOGIN E SESSÃO ---
window.entrarSessaoExistente = async function() {
    let cod = document.getElementById('input-codigo-sessao').value.toUpperCase().trim();
    if(!cod) { window.mostrarToastSessao("ERRO: INSIRA UM CÓDIGO.", true); return; }
    const doc = await window.db.collection("sessoes").doc(cod).get();
    if(!doc.exists) { window.mostrarToastSessao("SALA NÃO ENCONTRADA.", true); return; }
    window.iniciarRotinaDeBoot(cod);
}

window.iniciarRotinaDeBoot = async function(cod) {
    window.SESSAO_ATUAL = cod;
    localStorage.setItem('rpg_sessao_atual', cod);
    window.refSessao = window.db.collection("sessoes").doc(cod).collection("dados");
    
    document.getElementById('tela-sessao').style.display = 'none';
    const introEl = document.getElementById('tela-intro');
    if(introEl) introEl.style.display = 'flex';
    
    // Carrega os dados
    try {
        const docUsuarios = await window.refSessao.doc("usuarios").get(); if(docUsuarios.exists && docUsuarios.data().lista) window.bancoUsuarios = docUsuarios.data().lista;
        const docAgentes = await window.refSessao.doc("agentes").get(); if(docAgentes.exists && docAgentes.data().lista) window.bancoAgentes = docAgentes.data().lista;
        const docMissoes = await window.refSessao.doc("missoes").get(); if(docMissoes.exists && docMissoes.data().lista) window.incidentesGoiadas = docMissoes.data().lista;
        const docArquivos = await window.refSessao.doc("arquivos").get(); if(docArquivos.exists && docArquivos.data().lista) window.bancoArquivos = docArquivos.data().lista;
        const docRelatorios = await window.refSessao.doc("relatorios").get(); if(docRelatorios.exists && docRelatorios.data().lista) window.bancoRelatorios = docRelatorios.data().lista;
        const docEntidades = await window.refSessao.doc("entidades").get(); if(docEntidades.exists && docEntidades.data().lista) window.bancoEntidades = docEntidades.data().lista;
        const docInventario = await window.refSessao.doc("inventario").get(); if(docInventario.exists && docInventario.data().lista) window.bancoInventario = docInventario.data().lista;
    } catch(e) { console.error(e); }

    setTimeout(() => {
        if(introEl) introEl.style.display = 'none';
        document.getElementById('tela-login').style.display = 'flex';
        document.getElementById('login-instrucao').innerText = "SALA: " + cod;
    }, 1500);
}

window.iniciarLogin = function() { 
    document.getElementById('perfis-botoes').style.display = 'none'; 
    document.getElementById('login-processo').style.display = 'flex'; 
    const input = document.getElementById('agente-id-input');
    input.style.display = 'block'; 
    input.value = '';
    input.focus();
    document.getElementById('pinpad-container').style.display = 'none'; 
    document.getElementById('login-instrucao').innerText = ""; 
    
    input.onkeydown = function(e) { 
        if(e.key === 'Enter') { 
            window.pinProcesso.id = this.value.toUpperCase().trim(); 
            if(window.pinProcesso.id === '') return; 
            this.style.display = 'none'; 
            document.getElementById('pinpad-container').style.display = 'block'; 
            window.pinProcesso.pin = '';
            document.getElementById('pin-display').value = '';
        } 
    }; 
}

window.digitarPin = function(numero) { 
    if(window.pinProcesso.pin.length < 6) { 
        window.pinProcesso.pin += numero; 
        document.getElementById('pin-display').value = window.pinProcesso.pin.replace(/./g, '*'); 
    } 
}

window.cancelarLogin = function() { 
    document.getElementById('perfis-botoes').style.display = 'flex'; 
    document.getElementById('login-processo').style.display = 'none'; 
    document.getElementById('agente-id-input').value = ''; 
    document.getElementById('pin-display').value = ''; 
    window.pinProcesso.pin = ''; 
    window.pinProcesso.id = ''; 
    document.getElementById('login-instrucao').innerText = "SALA: " + window.SESSAO_ATUAL; 
}

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

window.validarLogin = async function() {
    const user = window.bancoUsuarios.find(u => u.id === window.pinProcesso.id && u.pin === window.pinProcesso.pin);
    if (!user) { window.somErro(); window.mostrarSysToast("ACESSO NEGADO: CREDENCIAIS INVÁLIDAS", true); window.pinProcesso.pin = ''; document.getElementById('pin-display').value = ''; return; }
    
    window.somSucesso(); 
    window.usuarioLogado = true; 
    window.usuarioAtual = { perfil: user.perfil, id: user.id, patente: parseInt(user.patente) || 1, agentesVinc: user.agentesVinc || [] };
    document.getElementById("tela-login").style.display = "none"; 
    document.getElementById("app-principal").style.display = "flex";
    
    if(user.perfil === 'admin') {
        document.getElementById("credencial-display").innerText = `FUNDADOR // ID: ${user.id} // SESSÃO: ${window.SESSAO_ATUAL}`; 
        document.getElementById("admin-banner").style.display = "block";
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'inline-block'); 
        document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'none');
        window.location.hash = "#mapa";
    } else {
        document.getElementById("credencial-display").innerText = `AGENTE // ID: ${user.id}`;
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'none'); 
        document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'flex');
        window.location.hash = "#perfil";
    }
    document.querySelectorAll('.nav-button.admin-only').forEach(b => b.style.display = user.perfil === 'admin' ? 'flex' : 'none');
    document.getElementById('chat-floating-btn').style.display = 'flex';
    if(typeof window.iniciarListenerChats === 'function') window.iniciarListenerChats();
    window.dispatchEvent(new Event('hashchange'));
}

window.voltarParaSessoes = function() {
    window.somClick();
    document.getElementById("tela-login").style.display = "none";
    window.SESSAO_ATUAL = ""; localStorage.removeItem('rpg_sessao_atual');
    document.getElementById("tela-sessao").style.display = "flex";
}

window.fazerLogout = function() { 
    window.somClick(); window.usuarioLogado = false; window.usuarioAtual = { perfil: '', id: '', patente: 1, agentesVinc: [] }; 
    document.getElementById('app-principal').style.display = 'none'; document.getElementById('admin-banner').style.display = 'none';  
    document.getElementById('chat-floating-btn').style.display = 'none'; document.getElementById('chat-window').style.display = 'none';
    window.cancelarLogin(); window.location.hash = ''; 
    document.getElementById('tela-login').style.display = 'flex'; 
}

window.addEventListener('hashchange', function() {
    if(!window.usuarioLogado) return;
    const hash = window.location.hash.replace('#', '') || (window.usuarioAtual.perfil === 'admin' ? 'mapa' : 'perfil');
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
});

// --- MODAIS BÁSICOS ---
window.fecharModal = function() { document.getElementById('modal-dinamico').style.display = 'none'; window.indexItemSelecionado = null; };
window.posicionarModalCentro = function() { const modal = document.getElementById('modal-dinamico'); modal.style.position = 'fixed'; modal.style.left = '50%'; modal.style.right = 'auto'; modal.style.top = '80px'; modal.style.transform = 'translateX(-50%)'; }

window.chamarConfirmacao = function(mensagem, callback) { window.somErro(); document.getElementById('msg-confirmacao').innerText = mensagem; window.confirmCallback = callback; document.getElementById('modal-confirmacao').style.display = 'block'; }
document.getElementById('btn-confirma-sim').onclick = () => { document.getElementById('modal-confirmacao').style.display = 'none'; if(window.confirmCallback) window.confirmCallback(); }
document.getElementById('btn-confirma-nao').onclick = () => { document.getElementById('modal-confirmacao').style.display = 'none'; }

// --- CRIAÇÃO DE MISSÃO (GLOBO 3D) ---
window.abrirFormularioCriacao = function(lat, lng) {
    if(typeof window.posicionarModalCentro === 'function') window.posicionarModalCentro();
    window.base64TempMedia = "";
    document.getElementById('titulo-modal').innerText = "NOVA AMEAÇA DETECTADA";
    let html = '<div class="dossie-linha"><span>MUNICÍPIO / LOCAL</span><input type="text" id="novo-cidade"></div>';
    html += '<div class="dossie-linha-grid"><div><span>TÍTULO DA OPERAÇÃO</span><input type="text" id="novo-titulo"></div><div><span>Nº DE VAGAS</span><input type="number" id="novo-vagas" value="4"></div></div>';
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
        resumo: document.getElementById('novo-resumo').value || "",
        status: "ATIVA"
    });
    if(typeof window.salvarBancos === 'function') window.salvarBancos();
    if(typeof window.fecharModal === 'function') window.fecharModal();
    if(typeof window.syncMissionsToGlobe === 'function') window.syncMissionsToGlobe();
};

window.salvarBancos = async function() {
    if(!window.refSessao) return;
    try {
        await window.refSessao.doc("inventario").set({ lista: window.bancoInventario });
        await window.refSessao.doc("missoes").set({ lista: window.incidentesGoiadas });
        await window.refSessao.doc("agentes").set({ lista: window.bancoAgentes });
        await window.refSessao.doc("arquivos").set({ lista: window.bancoArquivos });
        await window.refSessao.doc("usuarios").set({ lista: window.bancoUsuarios });
        await window.refSessao.doc("relatorios").set({ lista: window.bancoRelatorios });
        await window.refSessao.doc("entidades").set({ lista: window.bancoEntidades });
        if(typeof window.syncMissionsToGlobe === 'function') window.syncMissionsToGlobe();
    } catch (e) { window.mostrarSysToast("ERRO AO SALVAR.", true); }
}

window.mostrarDossieJanela = function(caso) {
    window.posicionarModalCentro();
    document.getElementById('titulo-modal').innerText = "REGISTRO DE MISSÃO";
    let html = `<div class="dossie-linha"><span>STATUS</span><strong>${caso.status}</strong></div>
                <div class="dossie-linha"><span>CÓDIGO</span><strong>${caso.cod}</strong></div>
                <div class="dossie-linha"><span>INCIDENTE</span><strong>${caso.titulo}</strong></div>
                <div class="dossie-linha"><span>RESUMO</span><p>${caso.resumo}</p></div>`;
    if(window.usuarioAtual.perfil === 'admin') {
        html += `<button class="btn-fbi-action" style="background:var(--verde-terminal); color:#000;" onclick="window.concluirCaso()">FINALIZAR MISSÃO</button>`;
        html += `<button class="btn-fbi-action btn-fbi-delete" onclick="window.excluirCaso()">APAGAR REGISTRO</button>`;
    }
    document.getElementById('conteudo-modal').innerHTML = html;
    document.getElementById('modal-dinamico').style.display = 'flex';
};

window.concluirCaso = function() {
    if(window.indexItemSelecionado !== null) {
        window.incidentesGoiadas[window.indexItemSelecionado].status = 'CONCLUÍDA';
        window.salvarBancos();
        window.fecharModal();
    }
};

window.excluirCaso = function() {
    if(window.indexItemSelecionado !== null) {
        window.incidentesGoiadas.splice(window.indexItemSelecionado, 1);
        window.salvarBancos();
        window.fecharModal();
    }
};

// (As outras funções de CRUD de Agentes, Bestiário, etc., ficam nos módulos agora)
