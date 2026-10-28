// =========================================================
// PATCH DE AUTENTICAÇÃO E SESSÃO (ISOLADO)
// =========================================================

window.entrarSessaoExistente = async function() {
    if(typeof window.pararChuvaCodigo === 'function') window.pararChuvaCodigo();
    let cod = document.getElementById('input-codigo-sessao').value.toUpperCase().trim();
    if(!cod) { 
        if(window.mostrarToastSessao) window.mostrarToastSessao("ERRO: INSIRA UM CÓDIGO.", true); 
        else alert("INSIRA UM CÓDIGO."); 
        return; 
    }
    
    try {
        const db = firebase.firestore();
        const doc = await db.collection("sessoes").doc(cod).get();
        if(!doc.exists) { 
            if(window.mostrarToastSessao) window.mostrarToastSessao("SALA NÃO ENCONTRADA.", true); 
            else alert("SALA NÃO ENCONTRADA.");
            return; 
        }
        
        if(typeof window.iniciarRotinaDeBoot === 'function') {
            window.iniciarRotinaDeBoot(cod);
        } else {
            // Fallback caso legacy-app.js esteja quebrado
            window.SESSAO_ATUAL = cod;
            localStorage.setItem('rpg_sessao_atual', cod);
            document.getElementById('tela-sessao').style.display = 'none';
            const intro = document.getElementById('tela-intro');
            if(intro) intro.style.display = 'flex';
        }
    } catch(e) {
        console.error(e);
        if(window.mostrarToastSessao) window.mostrarToastSessao("ERRO AO CONECTAR.", true);
    }
};

window.confirmarAcesso = function() {
    const cod = document.getElementById('input-codigo-sessao');
    if(cod && cod.value.trim()) {
        window.entrarSessaoExistente();
    } else {
        if(window.mostrarToastSessao) window.mostrarToastSessao("INSIRA UM ID DE ACESSO.", true);
    }
};

window.validarLogin = async function() {
    const user = (window.bancoUsuarios || []).find(u => u.id === window.pinProcesso.id && u.pin === window.pinProcesso.pin);
    if (!user) { 
        if(window.somErro) window.somErro(); 
        if(window.mostrarSysToast) window.mostrarSysToast("ACESSO NEGADO: CREDENCIAIS INVÁLIDAS", true); 
        window.pinProcesso.pin = ''; 
        document.getElementById('pin-display').value = ''; 
        return; 
    }
    
    if(window.somSucesso) window.somSucesso(); 
    window.usuarioLogado = true; 
    window.usuarioAtual = { perfil: user.perfil, id: user.id, patente: parseInt(user.patente) || 1, agentesVinc: user.agentesVinc || [] };
    
    document.getElementById("tela-login").style.display = "none"; 
    document.getElementById("app-principal").style.display = "flex";
    
    let nomePatente = window.getNomePatente ? window.getNomePatente(window.usuarioAtual.patente) : 'AGENTE';
    if(user.perfil === 'admin') {
        document.getElementById("credencial-display").innerText = `FUNDADOR // ID: ${user.id} // SESSÃO: ${window.SESSAO_ATUAL}`; 
        let banner = document.getElementById("admin-banner");
        if(banner) banner.style.display = "block";
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'inline-block'); 
        document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'none');
        window.location.hash = "#mapa";
    } else {
        document.getElementById("credencial-display").innerText = `AGENTE // ID: ${user.id} (${nomePatente})`;
        document.querySelectorAll('.admin-only').forEach(btn => btn.style.display = 'none'); 
        document.querySelectorAll('.agente-only').forEach(btn => btn.style.display = 'flex');
        window.location.hash = "#perfil";
    }
    
    document.querySelectorAll('.nav-button.admin-only').forEach(b => b.style.display = user.perfil === 'admin' ? 'flex' : 'none');
    if(document.getElementById('chat-floating-btn')) document.getElementById('chat-floating-btn').style.display = 'flex';
    if(typeof window.iniciarListenerChats === 'function') window.iniciarListenerChats();
    if(typeof window.renderizarChatTabs === 'function') window.renderizarChatTabs();
    if(typeof window.atualizarCentroComando === 'function') window.atualizarCentroComando();
    window.dispatchEvent(new Event('hashchange'));
};

window.voltarParaSessoes = function() {
    if(window.somClick) window.somClick();
    const telaLogin = document.getElementById("tela-login");
    const telaSessao = document.getElementById("tela-sessao");
    if(telaLogin) telaLogin.style.display = "none";
    window.SESSAO_ATUAL = ""; localStorage.removeItem('rpg_sessao_atual');
    if(telaSessao) telaSessao.style.display = "flex";
    if(typeof window.iniciarChuvaCodigo === 'function') window.iniciarChuvaCodigo();
};
