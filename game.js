// Game constants
const GRAVITY = 0.3;
const FLAP_STRENGTH = -6;
const COIN_SPAWN_RATE = 1500; // ms
const BUILDING_SPAWN_RATE = 2000; // ms
const CLOUD_SPAWN_RATE = 3000; // ms
const COIN_SIZE = 20;
const BUILDING_MIN_WIDTH = 40;
const BUILDING_MAX_WIDTH = 120;
const BUILDING_HEIGHT_MIN = 50;
const BUILDING_HEIGHT_MAX = 180;
const CLOUD_MIN_SIZE = 40;
const CLOUD_MAX_SIZE = 80;

// Game state
let score = 0;
let planeY = 200; // initial y position (from top? we'll use top offset)
let planeVelocityY = 0;
const planeElement = document.getElementById('plane');
const scoreElement = document.getElementById('score');
const coinsContainer = document.getElementById('coins');
const buildingsContainer = document.getElementById('buildings');
const cloudsContainer = document.createElement('div');
cloudsContainer.id = 'clouds';
document.getElementById('game-container').appendChild(cloudsContainer);

let coins = [];
let buildings = [];
let clouds = [];
let lastCoinSpawn = 0;
let lastBuildingSpawn = 0;
let lastCloudSpawn = 0;
let gameOver = false;
let animationFrameId = null;

// Plane dimensions (approximate)
const PLANE_WIDTH = 60;
const PLANE_HEIGHT = 40;

// Input handling
function handleTap() {
    if (gameOver) {
        restartGame();
        return;
    }
    planeVelocityY = FLAP_STRENGTH;
}

// Mouse and touch
document.body.addEventListener('click', handleTap);
document.body.addEventListener('touchstart', handleTap, { passive: true });

// Game loop
function update(timestamp) {
    if (!lastCoinSpawn) lastCoinSpawn = timestamp;
    if (!lastBuildingSpawn) lastBuildingSpawn = timestamp;
    if (!lastCloudSpawn) lastCloudSpawn = timestamp;

    const delta = timestamp - lastCoinSpawn;
    // Spawn coins
    if (delta > COIN_SPAWN_RATE) {
        spawnCoin();
        lastCoinSpawn = timestamp;
    }
    // Spawn buildings
    if (timestamp - lastBuildingSpawn > BUILDING_SPAWN_RATE) {
        spawnBuilding();
        lastBuildingSpawn = timestamp;
    }
    // Spawn clouds
    if (timestamp - lastCloudSpawn > CLOUD_SPAWN_RATE) {
        spawnCloud();
        lastCloudSpawn = timestamp;
    }

    // Update plane physics
    planeVelocityY += GRAVITY;
    planeY += planeVelocityY;

    // Keep plane within vertical bounds (top and bottom of visible area)
    const maxY = window.innerHeight - PLANE_HEIGHT - 200; // above buildings
    if (planeY < 0) {
        planeY = 0;
        planeVelocityY = 0;
    }
    if (planeY > maxY) {
        planeY = maxY;
        planeVelocityY = 0;
        // Optionally game over if hits ground
        // gameOver = true;
    }

    // Update plane element position (using top offset)
    planeElement.style.top = planeY + 'px';
    // Optional tilt based on velocity
    const tilt = Math.min(Math.max(planeVelocityY * -2, -30), 30);
    planeElement.style.transform = `rotate(${tilt}deg)`;

    // Update coins
    coins.forEach((coin, index) => {
        coin.x -= 2; // move left
        coin.element.style.left = coin.x + 'px';
        // Remove if off screen
        if (coin.x + COIN_SIZE < 0) {
            coin.element.remove();
            coins.splice(index, 1);
        }
        // Collision detection
        if (
            planeY < coin.y + COIN_SIZE &&
            planeY + PLANE_HEIGHT > coin.y &&
            planeElement.offsetLeft < coin.x + COIN_SIZE &&
            planeElement.offsetLeft + PLANE_WIDTH > coin.x
        ) {
            // Collect coin
            score += 10;
            scoreElement.textContent = 'Score: ' + score;
            coin.element.remove();
            coins.splice(index, 1);
        }
    });

    // Update buildings
    buildings.forEach((building, index) => {
        building.x -= 3; // move left faster
        building.element.style.left = building.x + 'px';
        building.element.style.height = building.height + 'px';
        // Remove if off screen
        if (building.x + building.width < 0) {
            building.element.remove();
            buildings.splice(index, 1);
        }
        // Collision detection with building (AABB)
        if (
            planeY < building.y + building.height &&
            planeY + PLANE_HEIGHT > building.y &&
            planeElement.offsetLeft < building.x + building.width &&
            planeElement.offsetLeft + PLANE_WIDTH > building.x
        ) {
            gameOver = true;
            showGameOver();
        }
    });

    // Update clouds
    clouds.forEach((cloud, index) => {
        cloud.x -= cloud.speed;
        cloud.element.style.left = cloud.x + 'px';
        if (cloud.x + cloud.size < 0) {
            cloud.element.remove();
            clouds.splice(index, 1);
        }
    });

    if (!gameOver) {
        animationFrameId = requestAnimationFrame(update);
    }
}

// Spawn functions
function spawnCoin() {
    const coin = document.createElement('div');
    coin.className = 'coin';
    const x = window.innerWidth + COIN_SIZE;
    const y = Math.random() * (window.innerHeight - 300) + 50; // avoid too low
    coin.style.left = x + 'px';
    coin.style.top = y + 'px';
    coinsContainer.appendChild(coin);
    coins.push({ x, y, element: coin });
}

function spawnBuilding() {
    const building = document.createElement('div');
    building.className = 'building';
    const width = BUILDING_MIN_WIDTH + Math.random() * (BUILDING_MAX_WIDTH - BUILDING_MIN_WIDTH);
    const height = BUILDING_HEIGHT_MIN + Math.random() * (BUILDING_HEIGHT_MAX - BUILDING_HEIGHT_MIN);
    const x = window.innerWidth;
    const y = window.innerHeight - height; // align bottom
    building.style.left = x + 'px';
    building.style.bottom = '0';
    building.style.width = width + 'px';
    building.style.height = height + 'px';
    buildingsContainer.appendChild(building);
    buildings.push({ x, y, width, height, element: building });
}

function spawnCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    const size = CLOUD_MIN_SIZE + Math.random() * (CLOUD_MAX_SIZE - CLOUD_MIN_SIZE);
    const x = window.innerWidth;
    const y = Math.random() * (window.innerHeight * 0.6); // clouds in upper part
    const speed = 0.5 + Math.random() * 1; // slow drift
    cloud.style.width = size + 'px';
    cloud.style.height = size + 'px';
    cloud.style.left = x + 'px';
    cloud.style.top = y + 'px';
    cloud.style.borderRadius = '50%';
    cloudsContainer.appendChild(cloud);
    clouds.push({ x, y, size, speed, element: cloud });
}

// Game over handling
function showGameOver() {
    cancelAnimationFrame(animationFrameId);
    const gameOverDiv = document.createElement('div');
    gameOverDiv.style.position = 'absolute';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.innerHTML = `
        <h2>Game Over</h2>
        <p>Score: ${score}</p>
        <button id="restartBtn">Tap to Restart</button>
    `;
    document.body.appendChild(gameOverDiv);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
}

// Restart game
function restartGame() {
    // Remove game over div
    const gameOverDiv = document.querySelector('div[style*="position: absolute"]');
    if (gameOverDiv) gameOverDiv.remove();
    // Reset state
    score = 0;
    planeY = 200;
    planeVelocityY = 0;
    planeElement.style.top = planeY + 'px';
    planeElement.style.transform = 'rotate(0deg)';
    scoreElement.textContent = 'Score: 0';
    // Clear existing objects
    coins.forEach(c => c.element.remove());
    buildings.forEach(b => b.element.remove());
    clouds.forEach(c => c.element.remove());
    coins = [];
    buildings = [];
    clouds = [];
    gameOver = false;
    // Respawn initial clouds? optional
    lastCoinSpawn = 0;
    lastBuildingSpawn = 0;
    lastCloudSpawn = 0;
    // Restart loop
    requestAnimationFrame(update);
}

// Start game
requestAnimationFrame(update);