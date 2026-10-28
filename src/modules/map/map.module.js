import { state } from '../../core/state.js';

let map;
let camadaMarcadores;
let tempMarker = null;

export function initMapa() {
  if (map) map.remove();
  map = L.map('map', {
    zoomControl: false,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1,
    minZoom: 3,
  }).setView([-15.93, -49.25], 3);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { noWrap: true }).addTo(map);
  camadaMarcadores = L.layerGroup().addTo(map);
  renderizarPontosNoMapa();

  map.on('contextmenu', (e) => {
    if (state.usuarioAtual.perfil !== 'admin') return;
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: '',
        html: '<div class="temp-marker-dot"></div>',
        iconSize: [14, 14],
      }),
    }).addTo(map);
    if (window.abrirFormularioCriacao) window.abrirFormularioCriacao(e.latlng.lat, e.latlng.lng);
  });
}

export function renderizarPontosNoMapa() {
  if (!camadaMarcadores) return;
  camadaMarcadores.clearLayers();
  state.incidentesGoiadas.forEach((caso) => {
    let cor = 'var(--azul-seguro)';
    if (caso.status === 'CONCLUIDA' || caso.status === 'CONCLUÍDA') cor = 'var(--verde-terminal)';
    else if (caso.ameaca === 'ALTA') cor = 'var(--amber-alert)';
    else if (caso.ameaca === 'CRITICA' || caso.ameaca === 'CRÍTICA') cor = 'var(--vermelho-critica)';

    const iconHtml = '<div style="width:12px; height:12px; background:' + cor + '; border-radius:50%; box-shadow:0 0 10px ' + cor + ';"></div>';
    const icon = L.divIcon({ className: 'custom-fbi-marker', html: iconHtml, iconSize: [12, 12] });
    L.marker(caso.coordenadas, { icon })
      .on('click', () => {
        map.flyTo(caso.coordenadas, 12, { duration: 1.5 });
        if (window.mostrarDossieJanela) window.mostrarDossieJanela(caso);
      })
      .addTo(camadaMarcadores);
  });
}

export function invalidarMapa() {
  setTimeout(() => { if (map) map.invalidateSize(); }, 100);
}

export function getMapa() { return map; }
export function getCamadaMarcadores() { return camadaMarcadores; }