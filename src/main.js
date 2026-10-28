import './styles/main.css';
import { initCodeRain } from './modules/ui/code-rain.js';
import { initNotificationsModule } from './modules/ui/notifications.module.js';
import { initAgentsModule } from './modules/agents/agents.module.js';

initCodeRain();
initNotificationsModule();
initAgentsModule();

console.log('[ARQUIVO 66] Sistema principal e ponte do mapa carregados.');

// ==========================================
// FUNÇÕES DE SESSÃO (BLINDADAS NO MAIN.JS)
// ==========================================
window.entrarSessaoExistente = async function() {
    const input = document.getElementById('input-codigo-sessao');
    const cod = input ? input.value.toUpperCase().trim() : '';
    
    if(!cod) {
        if(window.mostrarToastSessao) window.mostrarToastSessao("ERRO: INSIRA UM CÓDIGO.", true);
        else alert("ERRO: INSIRA UM CÓDIGO.");
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
        
        // Chama a rotina de boot
        if(typeof window.iniciarRotinaDeBoot === 'function') {
            window.iniciarRotinaDeBoot(cod);
        } else {
            // Fallback caso o legacy esteja totalmente quebrado
            window.SESSAO_ATUAL = cod;
            localStorage.setItem('rpg_sessao_atual', cod);
            document.getElementById('tela-sessao').style.display = 'none';
            document.getElementById('tela-intro').style.display = 'flex';
        }
    } catch(e) {
        console.error(e);
        if(window.mostrarToastSessao) window.mostrarToastSessao("ERRO AO CONECTAR.", true);
    }
};

window.confirmarAcesso = function() {
    window.entrarSessaoExistente();
};

// ==========================================
// AUTO-LOGIN NA SESSÃO (MÁGICA DO CARREGAMENTO)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(async (user) => {
        const telaAuth = document.getElementById('tela-auth');
        const telaSessao = document.getElementById('tela-sessao');

        if (user) {
            if(telaAuth) telaAuth.style.display = 'none';
            
            // Tenta puxar do cache local primeiro
            const savedSession = localStorage.getItem('rpg_sessao_atual');
            
            if (savedSession) {
                console.log("[AUTO-LOGIN] Sessão encontrada no cache: " + savedSession);
                if(typeof window.iniciarRotinaDeBoot === 'function') window.iniciarRotinaDeBoot(savedSession);
                return; // Para a execução aqui
            }
            
            // Se não tem no cache, busca no banco
            try {
                console.log("[AUTO-LOGIN] Buscando sessão ativa no banco...");
                const db = firebase.firestore();
                const snapshot = await db.collection("sessoes").where("ownerUid", "==", user.uid).get();
                
                if (!snapshot.empty) {
                    let minhaSessao = snapshot.docs[0].id;
                    console.log("[AUTO-LOGIN] Sessão encontrada no banco: " + minhaSessao);
                    if(typeof window.iniciarRotinaDeBoot === 'function') window.iniciarRotinaDeBoot(minhaSessao);
                } else {
                    console.log("[AUTO-LOGIN] Nenhuma sessão encontrada. Mostrando tela de conexão.");
                    if(telaSessao) telaSessao.style.display = 'flex';
                }
            } catch(e) {
                console.error("[AUTO-LOGIN] Erro ao buscar sessão:", e);
                if(telaSessao) telaSessao.style.display = 'flex';
            }
        } else {
            // Não logado no Firebase Auth
            if(telaAuth) telaAuth.style.display = 'flex';
            if(telaSessao) telaSessao.style.display = 'none';
        }
    });
});

// ==========================================
// PONTE DO MAPA 3D
// ==========================================
let currentMissionsCache = '';
window.syncMissionsToGlobe = function() {
    const frame = document.getElementById('globo-frame');
    const missoes = window.incidentesGoiadas || [];
    
    if (frame && frame.contentWindow) {
        const currentJSON = JSON.stringify(missoes);
        if (currentJSON !== currentMissionsCache) {
            currentMissionsCache = currentJSON;
            frame.contentWindow.postMessage({ type: 'SET_MISSIONS', missions: missoes }, '*');
        }
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GLOBE_READY') {
        currentMissionsCache = ''; 
        window.syncMissionsToGlobe();
    }
    if (event.data && event.data.type === 'CREATE_MISSION') {
        if (typeof window.abrirFormularioCriacao === 'function') window.abrirFormularioCriacao(event.data.lat, event.data.lon);
    }
    if (event.data && event.data.type === 'OPEN_MISSION') {
        const missoes = window.incidentesGoiadas || [];
        const index = missoes.findIndex(m => m.cod === event.data.cod);
        if (index !== -1) {
            window.indexItemSelecionado = index;
            if (typeof window.mostrarDossieJanela === 'function') window.mostrarDossieJanela(missoes[index]);
        }
    }
});

setInterval(window.syncMissionsToGlobe, 2000);
