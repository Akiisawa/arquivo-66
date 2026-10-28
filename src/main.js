import './styles/main.css';
import { initCodeRain } from './modules/ui/code-rain.js';
import { initNotificationsModule } from './modules/ui/notifications.module.js';
import { initAgentsModule } from './modules/agents/agents.module.js';

initCodeRain();
initNotificationsModule();
initAgentsModule();

console.log('[ARQUIVO 66] Sistema principal e ponte do mapa carregados.');

// ==========================================
// PONTE DEFINITIVA: RPG <-> GLOBO 3D
// ==========================================
let lastMissionsCache = '';

window.syncMissionsToGlobe = function() {
    const frame = document.getElementById('globo-frame');
    // Puxa as missões de onde estiverem (legacy ou state)
    const missoes = window.incidentesGoiadas || (window.state && window.state.incidentesGoiadas) || [];
    
    if (frame && frame.contentWindow) {
        const currentJSON = JSON.stringify(missoes);
        if (currentJSON !== lastMissionsCache) {
            lastMissionsCache = currentJSON;
            frame.contentWindow.postMessage({ type: 'SET_MISSIONS', missions: missoes }, '*');
        }
    }
};

window.addEventListener('message', (event) => {
    // 1. Globo avisou que carregou -> Envia missões
    if (event.data && event.data.type === 'GLOBE_READY') {
        lastMissionsCache = ''; 
        window.syncMissionsToGlobe();
    }
    
    // 2. Clique Direito no mapa -> Abre formulário de criação
    if (event.data && event.data.type === 'CREATE_MISSION') {
        if (typeof window.abrirFormularioCriacao === 'function') {
            window.abrirFormularioCriacao(event.data.lat, event.data.lon);
        } else {
            console.error("Erro: Função abrirFormularioCriacao não encontrada no legacy-app.js");
        }
    }
    
    // 3. Clique na bolinha -> Abre Dossiê
    if (event.data && event.data.type === 'OPEN_MISSION') {
        const missoes = window.incidentesGoiadas || (window.state && window.state.incidentesGoiadas) || [];
        const index = missoes.findIndex(m => m.cod === event.data.cod);
        if (index !== -1) {
            window.indexItemSelecionado = index;
            if (typeof window.mostrarDossieJanela === 'function') {
                window.mostrarDossieJanela(missoes[index]);
            }
        }
    }
});

// Sincroniza a cada 3 segundos caso as missões mudem
setInterval(window.syncMissionsToGlobe, 3000);
