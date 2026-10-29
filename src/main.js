import './styles/main.css';
import { initCodeRain } from './modules/ui/code-rain.js';
import { initNotificationsModule } from './modules/ui/notifications.module.js';
import { initAgentsModule } from './modules/agents/agents.module.js';

initCodeRain();
initNotificationsModule();
initAgentsModule();

console.log('[ARQUIVO 66] Sistema principal carregado.');

// Garante que a chuva de código pode ser parada
window.pararChuvaCodigo = function() {
    const c = document.getElementById('chuva-codigo');
    if(c) c.style.display = 'none';
};
window.iniciarChuvaCodigo = function() {
    const c = document.getElementById('chuva-codigo');
    if(c) c.style.display = 'block';
};

// --- PONTE DO MAPA 3D ---
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
