// Sky Ace: One-Finger Flight Aerodynamic Engine
console.log('🚀 Sky Ace engine active');

const plane = document.getElementById('plane');
const smokeContainer = document.getElementById('smoke');
const gameContainer = document.getElementById('gameContainer');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const thrustFill = document.getElementById('thrustFill');
const tutorialHint = document.getElementById('tutorialHint');
const gameOverBanner = document.getElementById('gameOverBanner');
const finalScoreEl = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const restartBtn = document.getElementById('restartBtn');

const obstacleContainer = document.getElementById('obstacleContainer');
const collectibleContainer = document.getElementById('collectibleContainer');
const sparkleContainer = document.getElementById('sparkleContainer');

let width = window.innerWidth;
let height = window.innerHeight;

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ── Physics Constants ──
const GRAVITY = 720;          // Downward gravity pull (px/s^2)
const THRUST = -1050;         // Climb acceleration when holding (px/s^2)
const MAX_FALL_SPEED = 480;   // Terminal downward glide speed (px/s)
const MAX_CLIMB_SPEED = -420; // Maximum climb speed (px/s)
const PLANE_X_RATIO = 0.18;   // X-position anchored at 18% of screen width

// ── State Variables ──
let posY = height * 0.42;
let velocity = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('sky_ace_best') || '0', 10);
if (highScoreEl) highScoreEl.textContent = highScore.toString();

let holding = false;
let gameOver = false;
let hasStartedFlying = false;
let lastTime = 0;

let lastObstacleSpawn = 0;
let lastCollectibleSpawn = 0;
let lastSmokeTime = 0;

let obstacles = [];
let collectibles = [];
let sparkles = [];

// ── Input Handling (One-Finger Tap & Hold) ──
function startThrust(e) {
  if (e && e.target && (e.target.id === 'restartBtn' || e.target.closest('#restartBtn'))) {
    return;
  }
  if (e && e.cancelable && e.type.startsWith('touch')) {
    e.preventDefault();
  }

  if (gameOver) {
    restartFlight();
    return;
  }

  holding = true;
  if (!hasStartedFlying) {
    hasStartedFlying = true;
    if (tutorialHint) tutorialHint.style.opacity = '0';
  }
}

function releaseThrust(e) {
  if (e && e.cancelable && e.type.startsWith('touch')) {
    e.preventDefault();
  }
  holding = false;
}

window.addEventListener('mousedown', startThrust);
window.addEventListener('mouseup', releaseThrust);
window.addEventListener('touchstart', startThrust, { passive: false });
window.addEventListener('touchend', releaseThrust, { passive: false });
window.addEventListener('touchcancel', releaseThrust, { passive: false });

if (restartBtn) {
  restartBtn.addEventListener('click', (e) => { e.stopPropagation(); restartFlight(); });
  restartBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); restartFlight(); });
}

function restartFlight() {
  width = window.innerWidth;
  height = window.innerHeight;
  posY = height * 0.42;
  velocity = -80;
  score = 0;
  gameOver = false;
  holding = false;
  lastTime = performance.now();
  lastObstacleSpawn = 0;
  lastCollectibleSpawn = 0;
  lastSmokeTime = 0;

  // Clear DOM entities
  obstacles.forEach(o => o.el.remove());
  collectibles.forEach(c => c.el.remove());
  sparkles.forEach(s => s.el.remove());
  obstacles = [];
  collectibles = [];
  sparkles = [];
  smokeContainer.innerHTML = '';

  if (gameOverBanner) gameOverBanner.style.display = 'none';
  if (tutorialHint) tutorialHint.style.opacity = '1';
  hasStartedFlying = false;

  updatePlaneDOM();
}

// ── Flight Tick Loop ──
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = timestamp;

  if (!gameOver) {
    // 1. Aerodynamic thrust & gravity
    const accel = holding ? THRUST : GRAVITY;
    velocity += accel * dt;

    if (velocity > MAX_FALL_SPEED) velocity = MAX_FALL_SPEED;
    if (velocity < MAX_CLIMB_SPEED) velocity = MAX_CLIMB_SPEED;

    posY += velocity * dt;

    // 2. Ceiling & Ground Boundaries
    const planeHeight = 40;
    if (posY <= 12) {
      posY = 12;
      if (velocity < 0) velocity = 40; // Gentle aerodynamic bounce
    }
    if (posY >= height - planeHeight - 8) {
      posY = height - planeHeight - 8;
      crashPlane();
    }

    // 3. Score progression
    if (hasStartedFlying) {
      score += dt * 12;
      if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('sky_ace_best', highScore.toString());
        if (highScoreEl) highScoreEl.textContent = highScore.toString();
      }
    }

    // 4. Smoke stream while climbing
    if (holding && (timestamp - lastSmokeTime > 80)) {
      lastSmokeTime = timestamp;
      createSmokePuff();
    }

    // 5. Spawning Obstacles & Collectibles
    if (hasStartedFlying) {
      lastObstacleSpawn += dt;
      const spawnRate = Math.max(1.8 - (score / 450), 1.05);
      if (lastObstacleSpawn > spawnRate) {
        lastObstacleSpawn = 0;
        spawnObstacle();
      }

      lastCollectibleSpawn += dt;
      if (lastCollectibleSpawn > 2.2) {
        lastCollectibleSpawn = 0;
        spawnCollectible();
      }
    }

    // 6. Update Entities
    updateObstacles(dt);
    updateCollectibles(dt);
    updateSparkles(dt);
  }

  renderHUD();
  updatePlaneDOM();

  requestAnimationFrame(loop);
}

function updatePlaneDOM() {
  const planeX = width * PLANE_X_RATIO;
  plane.style.left = `${planeX}px`;
  plane.style.top = `${posY}px`;

  // Dynamic tilt: climb tilts up to -26deg, descent pitches down to +36deg
  const tiltDeg = Math.max(-28, Math.min(38, velocity * 0.08));
  plane.style.transform = `rotate(${tiltDeg}deg)`;

  if (thrustFill) {
    thrustFill.style.width = holding ? '100%' : '0%';
  }
}

function renderHUD() {
  if (scoreEl) scoreEl.textContent = Math.floor(score).toString();
}

function crashPlane() {
  if (gameOver) return;
  gameOver = true;
  holding = false;
  if (score > highScore) highScore = Math.floor(score);

  if (finalScoreEl) finalScoreEl.textContent = Math.floor(score).toString();
  if (highScoreDisplay) highScoreDisplay.textContent = highScore.toString();
  if (gameOverBanner) gameOverBanner.style.display = 'flex';
}

function createSmokePuff() {
  const puff = document.createElement('div');
  puff.className = 'smokePuff';
  const planeX = width * PLANE_X_RATIO;
  puff.style.left = `${planeX - 4}px`;
  puff.style.top = `${posY + 16}px`;
  smokeContainer.appendChild(puff);
  setTimeout(() => puff.remove(), 900);
}

// ── Obstacle Spawning ──
const OBS_TYPES = ['cloud-obs', 'mountain-obs', 'storm-obs'];

function spawnObstacle() {
  const type = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
  const el = document.createElement('div');
  el.className = `obstacle ${type}`;

  let w = 84, h = 90;
  let spawnY = 0;

  if (type === 'mountain-obs') {
    w = 90;
    h = Math.random() * 60 + 110;
    spawnY = height - h; // Base anchored to ground
  } else if (type === 'cloud-obs') {
    w = 88;
    h = 56;
    spawnY = Math.random() * (height * 0.45) + 30; // High altitude
  } else {
    w = 80;
    h = 100;
    spawnY = Math.random() * (height - h - 120) + 60; // Mid altitude
  }

  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  el.style.left = `${width + 30}px`;
  el.style.top = `${spawnY}px`;

  obstacleContainer.appendChild(el);

  obstacles.push({
    el,
    x: width + 30,
    y: spawnY,
    w,
    h,
    speed: 180 + Math.min(score * 1.4, 130),
  });
}

function updateObstacles(dt) {
  const pBox = plane.getBoundingClientRect();
  const hitInset = 10;
  const pHit = {
    left: pBox.left + hitInset,
    right: pBox.right - hitInset,
    top: pBox.top + hitInset,
    bottom: pBox.bottom - hitInset,
  };

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= obs.speed * dt;
    obs.el.style.left = `${obs.x}px`;

    if (obs.x + obs.w < -40) {
      obs.el.remove();
      obstacles.splice(i, 1);
      continue;
    }

    const oBox = obs.el.getBoundingClientRect();
    if (
      pHit.right > oBox.left &&
      pHit.left < oBox.right &&
      pHit.bottom > oBox.top &&
      pHit.top < oBox.bottom
    ) {
      crashPlane();
    }
  }
}

// ── Collectibles ──
function spawnCollectible() {
  const isStar = Math.random() > 0.4;
  const type = isStar ? 'star-col' : 'coin-col';
  const el = document.createElement('div');
  el.className = `collectible ${type}`;
  const size = isStar ? 34 : 30;

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;

  const spawnY = Math.random() * (height - size - 140) + 60;
  el.style.left = `${width + 25}px`;
  el.style.top = `${spawnY}px`;

  collectibleContainer.appendChild(el);

  collectibles.push({
    el,
    x: width + 25,
    y: spawnY,
    size,
    type,
    speed: 195,
  });
}

function updateCollectibles(dt) {
  const pBox = plane.getBoundingClientRect();

  for (let i = collectibles.length - 1; i >= 0; i--) {
    const col = collectibles[i];
    col.x -= col.speed * dt;
    col.el.style.left = `${col.x}px`;

    if (col.x + col.size < -30) {
      col.el.remove();
      collectibles.splice(i, 1);
      continue;
    }

    const cBox = col.el.getBoundingClientRect();
    if (
      pBox.right > cBox.left &&
      pBox.left < cBox.right &&
      pBox.bottom > cBox.top &&
      pBox.top < cBox.bottom
    ) {
      const bonus = col.type === 'star-col' ? 50 : 25;
      score += bonus;
      spawnSparkles(cBox.left + col.size / 2, cBox.top + col.size / 2);
      col.el.remove();
      collectibles.splice(i, 1);
    }
  }
}

function spawnSparkles(x, y) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle-dot';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    sparkleContainer.appendChild(el);

    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 80 + 40;
    sparkles.push({
      el,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35,
      maxLife: 0.35,
    });
  }
}

function updateSparkles(dt) {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const sp = sparkles[i];
    sp.life -= dt;
    if (sp.life <= 0) {
      sp.el.remove();
      sparkles.splice(i, 1);
      continue;
    }
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.el.style.left = `${sp.x}px`;
    sp.el.style.top = `${sp.y}px`;
    sp.el.style.opacity = (sp.life / sp.maxLife).toString();
  }
}

// ── Kickoff Loop ──
requestAnimationFrame(loop);
