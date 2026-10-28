import { state } from './state.js';

let audioCtx;

export function initAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, type, duration, vol) {
  vol = vol === undefined ? 0.05 : vol;
  if (state.isMuted || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const somClick   = () => beep(500, 'square', 0.05);
export const somErro    = () => { beep(150, 'sawtooth', 0.4, 0.1); setTimeout(() => beep(150, 'sawtooth', 0.4, 0.1), 200); };
export const somSucesso = () => { beep(800, 'sine', 0.1); setTimeout(() => beep(1200, 'sine', 0.15), 100); };

export function toggleMute() {
  state.isMuted = !state.isMuted;
  const icon = document.getElementById('icone-mute');
  if (icon) {
    icon.className = state.isMuted
      ? 'fa-solid fa-volume-xmark'
      : 'fa-solid fa-volume-high';
    icon.style.color = state.isMuted ? 'var(--vermelho-critica)' : 'var(--fbi-text)';
  }
  if (!state.isMuted) somClick();
}

export function bindAudioGlobalClick() {
  document.addEventListener('click', (e) => {
    initAudio();
    if (e.target.tagName === 'BUTTON' || e.target.closest('.pin-btn') || e.target.tagName === 'TR') somClick();
  });
}