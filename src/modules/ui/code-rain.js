export function initCodeRain() {
  const canvas = document.getElementById('chuva-codigo');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}#%$@!?/\\|+-';
  const fonte = 14;
  const colunas = Math.floor(canvas.width / fonte);
  const queda = Array.from({ length: colunas }, () => Math.random() * canvas.height);

  let ativo = true;

  function desenhar() {
    if (!ativo) return;
    ctx.fillStyle = 'rgba(0,5,10,.006)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fonte + 'px monospace';
    for (let i = 0; i < queda.length; i++) {
      const letra = letras[Math.floor(Math.random() * letras.length)];
      ctx.fillStyle = Math.random() < 0.15 ? 'rgba(255,180,0,.18)' : 'rgba(66,255,66,.18)';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillText(letra, i * fonte, queda[i] * fonte);
      queda[i]++;
      if (queda[i] * fonte > canvas.height && Math.random() > 0.985) queda[i] = 0;
    }
    ctx.shadowBlur = 0;
  }

  setInterval(desenhar, 50);

  window.pararChuvaCodigo = () => { ativo = false; canvas.style.opacity = '0'; };
  window.iniciarChuvaCodigo = () => { ativo = true; canvas.style.opacity = '.18'; };
}