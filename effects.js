let confetti;
try {
  confetti = require('canvas-confetti');
} catch (e) {
  confetti = null;
}

function playSuccess() {
  if (confetti) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  } else {
    drawBurst('#4caf50');
  }
}

function playFailure() {
  if (confetti) {
    confetti({ particleCount: 50, spread: 30, colors: ['#f44336'], origin: { y: 0.6 } });
  } else {
    drawBurst('#f44336');
  }
}

function drawBurst(color) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const particleCount = 30;
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const velocity = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    const radius = 2 + Math.random() * 3;
    (function draw() {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      x += vx;
      y += vy;
      radius *= 0.95;
      if (radius > 0.5) {
        requestAnimationFrame(draw);
      } else {
        canvas.remove();
      }
    })();
  }
}

export { playSuccess, playFailure };