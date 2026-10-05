const plane = document.getElementById('plane');
const smokeContainer = document.getElementById('smoke');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

let width, height;
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Game constants
const GRAVITY = 0.4;          // pixels per ms^2
const THRUST = -0.6;          // upward acceleration while holding
const MAX_SPEED = 8;          // max upward speed (pixels per ms)

// Game state
let posY = height * 0.5;      // vertical position (center of plane)
let velocity = 0;             // pixels per ms
let score = 0;
let highScore = 0;
let gameOver = false;
let lastTime = 0;
let holding = false;

// Input handling
function startHold() {
    console.log('startHold');
    if (gameOver) {
        restart();
        return;
    }
    holding = true;
}
function endHold() {
    console.log('endHold');
    holding = false;
}
window.addEventListener('mousedown', startHold);
window.addEventListener('touchstart', startHold, {passive: true});
window.addEventListener('mouseup', endHold);
window.addEventListener('touchend', endHold, {passive: true});
window.addEventListener('touchcancel', endHold, {passive: true});

// Restart
function restart() {
    console.log('restart');
    posY = height * 0.5;
    velocity = 0;
    score = 0;
    gameOver = false;
    holding = false;
    lastTime = 0;
    restartBtn.style.display = 'none';
    // clear smoke
    smokeContainer.innerHTML = '';
    requestAnimationFrame(update);
}

// Game loop
function update(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime; // ms since last frame
    lastTime = timestamp;

    if (!gameOver) {
        // Apply physics
        if (holding) {
            velocity += THRUST * dt;
        }
        // gravity
        velocity += GRAVITY * dt;

        // clamp speed
        if (velocity > MAX_SPEED) velocity = MAX_SPEED;
        if (velocity < -MAX_SPEED) velocity = -MAX_SPEED;

        posY += velocity * dt;

        // Boundaries
        if (posY < 0) {
            posY = 0;
            velocity = 0;
            gameOver = true;
        }
        if (posY > height) {
            posY = height;
            velocity = 0;
            gameOver = true;
        }

        // Score increment
        score += dt * 0.01; // arbitrary scaling
        if (score > highScore) highScore = score;

        // Emit smoke puff only while holding
        if (holding) {
            emitSmoke();
        }
    }

    // Render
    render();

    requestAnimationFrame(update);
}

function render() {
    // Position plane (top-left of SVG container)
    // We want the plane's visual center at posY; plane height is 40px
    const planeTop = posY - 20; // half of 40
    plane.style.top = `${planeTop}px`;

    // Update score display
    scoreEl.textContent = `Score: ${Math.floor(score)}`;

    // Show restart button if game over
    if (gameOver) {
        restartBtn.style.display = 'block';
        scoreEl.textContent += `   High Score: ${Math.floor(highScore)}`;
    } else {
        restartBtn.style.display = 'none';
    }
}

function emitSmoke() {
    // Create a puff at the tail of the plane (approx x=0 relative to plane)
    const puff = document.createElement('div');
    puff.className = 'smokePuff';
    // Position relative to plane: left side of plane (x=0) plus container offset
    const planeRect = plane.getBoundingClientRect();
    const containerRect = document.getElementById('gameContainer').getBoundingClientRect();
    const left = planeRect.left - containerRect.left + 0; // at left edge of fuselage
    const top = planeRect.top - containerRect.top + 20; // middle vertically
    puff.style.left = `${left}px`;
    puff.style.top = `${top}px`;
    smokeContainer.appendChild(puff);
    // Remove after animation ends (2s)
    setTimeout(() => {
        if (puff.parentNode) puff.parentNode.removeChild(puff);
    }, 2000);
}

// Start loop
requestAnimationFrame(update);