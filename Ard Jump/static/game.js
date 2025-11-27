// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Constants
const GRAVITY = 0.8;
const MAX_POWER = 100;
const POWER_CHARGE_RATE = 2;
const FINISH_LINE = 5000; // Distance to win

// Game State
let gameState = {
    playing: false,
    paused: false,
    gameOver: false,
    victory: false
};

// Player
let player = {
    x: 150,
    y: 0,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    isOnGround: false,
    groundTimer: 0, // Coyote time buffer
    lives: 3,
    skin: localStorage.getItem('selectedSkinIcon') || '🎮',
    spawnX: 150,
    spawnY: 0
};

// Power Bar
let powerBar = {
    charging: false,
    power: 0
};

// Camera
let camera = {
    x: 0,
    y: 0
};

// Score
let score = 0;
let distance = 0;
let combo = 0;
let lastJumpTime = 0;

// Timer (3 minutes = 180 seconds)
let timeRemaining = 180;
let timerInterval = null;

// Platforms
let platforms = [];
let obstacles = [];

// Visual Effects (for addictiveness)
let particles = [];
let screenShake = 0;

// UI Elements
const livesCount = document.getElementById('livesCount');
const scoreDisplay = document.getElementById('scoreDisplay');
const distanceDisplay = document.getElementById('distanceDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');
const powerBarFill = document.getElementById('powerBarFill');
const powerBarContainer = document.getElementById('powerBarContainer');

// Modals
const gameOverModal = document.getElementById('gameOverModal');
const victoryModal = document.getElementById('victoryModal');
const pauseModal = document.getElementById('pauseModal');
const pauseBtn = document.getElementById('pauseBtn');

// Initialize Game
function init() {
    player.lives = 3;
    player.x = 150;
    player.y = canvas.height - 200;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isOnGround = false;
    player.groundTimer = 0;
    camera.x = 0;
    score = 0;
    distance = 0;
    combo = 0;
    timeRemaining = 180;

    gameState.playing = true;
    gameState.paused = false;
    gameState.gameOver = false;
    gameState.victory = false;

    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);

    generateLevel();
    updateUI();
    gameLoop();
}

// Update Timer
function updateTimer() {
    if (gameState.paused || !gameState.playing) return;

    timeRemaining--;

    if (timeRemaining <= 0) {
        timeRemaining = 0;
        gameOver();
    }

    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Warning animation when time is low
    if (timeRemaining <= 30) {
        timerDisplay.parentElement.classList.add('warning');
    } else {
        timerDisplay.parentElement.classList.remove('warning');
    }
}

// Generate Level
function generateLevel() {
    platforms = [];
    obstacles = [];

    // Starting platform
    platforms.push({
        x: 0,
        y: canvas.height - 100,
        width: 300,
        height: 100
    });

    let currentX = 300;

    // Generate platforms until finish line
    while (currentX < FINISH_LINE) {
        const gap = Math.random() * 200 + 100;
        const platformWidth = Math.random() * 150 + 100;
        const platformHeight = Math.random() * 30 + 70;
        const platformY = canvas.height - platformHeight - Math.random() * 100;

        currentX += gap;

        platforms.push({
            x: currentX,
            y: platformY,
            width: platformWidth,
            height: platformHeight
        });

        // Add obstacles on some platforms
        if (Math.random() > 0.6 && currentX < FINISH_LINE - 500) {
            obstacles.push({
                x: currentX + platformWidth / 2 - 20,
                y: platformY - 40,
                width: 40,
                height: 40
            });
        }

        currentX += platformWidth;
    }

    // Finish platform
    platforms.push({
        x: FINISH_LINE - 200,
        y: canvas.height - 100,
        width: 400,
        height: 100,
        isFinish: true
    });
}

// Input Handling
let isPressed = false;

function handleTouchStart(e) {
    e.preventDefault();
    if (!gameState.playing || gameState.paused || gameState.gameOver) return;

    isPressed = true;
    powerBar.charging = true;
    powerBar.power = 0;
    powerBarContainer.classList.add('visible');
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!gameState.playing || gameState.paused || gameState.gameOver) return;

    if (isPressed && powerBar.charging && powerBar.power > 0) {
        jump();
    }

    isPressed = false;
    powerBar.charging = false;
    powerBar.power = 0;
    powerBarFill.style.height = '0%';
    powerBarContainer.classList.remove('visible');
}

// Touch events
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', handleTouchEnd);

// Mouse events (for desktop testing)
canvas.addEventListener('mousedown', handleTouchStart);
canvas.addEventListener('mouseup', handleTouchEnd);

// Jump Function
function jump() {
    // Allow jump if on ground OR recently was on ground (coyote time)
    const canJump = player.isOnGround || player.groundTimer > 0;

    if (canJump && powerBar.power > 0) {
        const jumpPower = powerBar.power / 100;
        player.velocityY = -15 * jumpPower - 5; // Min jump + power
        player.velocityX = 8 * jumpPower + 2; // Forward velocity
        player.isOnGround = false;
        player.groundTimer = 0; // Reset timer

        // Combo system - reward quick successive jumps
        const currentTime = Date.now();
        if (currentTime - lastJumpTime < 2000) { // Within 2 seconds
            combo++;
        } else {
            combo = 1;
        }
        lastJumpTime = currentTime;

        // Score calculation with combo multiplier
        const baseScore = Math.floor(powerBar.power / 10);
        const comboMultiplier = 1 + (combo * 0.1); // +10% per combo
        const earnedScore = Math.floor(baseScore * comboMultiplier);
        score += earnedScore;

        // Show combo feedback (visual juice)
        if (combo > 1) {
            showComboText(combo, earnedScore);
        }
    }
    powerBar.power = 0;
    powerBarFill.style.height = '0%';
}

// Show Combo Text (addictive feedback)
function showComboText(comboCount, scoreEarned) {
    particles.push({
        x: player.x + player.width / 2,
        y: player.y,
        text: `x${comboCount} COMBO! +${scoreEarned}`,
        life: 60, // frames
        velocityY: -2,
        color: '#FFD700'
    });
}

// Create landing particles
function createLandingParticles() {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: player.y + player.height,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: -Math.random() * 3,
            life: 30,
            size: Math.random() * 4 + 2,
            color: '#43e97b'
        });
    }
}

// Update Game
function update() {
    if (!gameState.playing || gameState.paused || gameState.gameOver) return;

    // Charge power bar (allow charging if on ground or very recently was)
    const canCharge = player.isOnGround || player.groundTimer > 0;
    if (powerBar.charging && canCharge) {
        powerBar.power = Math.min(powerBar.power + POWER_CHARGE_RATE, MAX_POWER);
        powerBarFill.style.height = powerBar.power + '%';
    }

    // Apply gravity
    if (!player.isOnGround) {
        player.velocityY += GRAVITY;
    }

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Deceleration
    if (player.isOnGround) {
        player.velocityX *= 0.8;
    } else {
        player.velocityX *= 0.99;
    }

    // Check platform collisions
    const wasOnGround = player.isOnGround;
    player.isOnGround = false;

    for (let platform of platforms) {
        if (checkCollision(player, platform)) {
            // Landing on top
            if (player.velocityY > 0 && player.y + player.height <= platform.y + 20) {
                const wasInAir = !wasOnGround;
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isOnGround = true;

                // Landing effects (addictive juice)
                if (wasInAir) {
                    createLandingParticles();
                    screenShake = 3; // Small screen shake
                }

                // Check if finish line
                if (platform.isFinish && player.x >= FINISH_LINE - 300) {
                    winGame();
                }
            }
            // Hit from below
            else if (player.velocityY < 0 && player.y >= platform.y + platform.height - 20) {
                player.y = platform.y + platform.height;
                player.velocityY = 3; // Bounce down
            }
            // Hit from side
            else {
                if (player.x < platform.x) {
                    player.x = platform.x - player.width - 5;
                    player.velocityX = -Math.abs(player.velocityX) * 0.5; // Bounce back
                } else {
                    player.x = platform.x + platform.width + 5;
                    player.velocityX = -Math.abs(player.velocityX) * 0.5;
                }
            }
        }
    }

    // Check obstacle collisions
    for (let obstacle of obstacles) {
        if (checkCollision(player, obstacle)) {
            // Hit from below
            if (player.velocityY < 0 && player.y >= obstacle.y + obstacle.height - 15) {
                player.velocityY = 5; // Throw down
                score -= 10;
            }
            // Hit from side
            else {
                if (player.x < obstacle.x) {
                    player.x = obstacle.x - player.width - 5;
                } else {
                    player.x = obstacle.x + obstacle.width + 5;
                }
                player.velocityX = -Math.abs(player.velocityX) * 0.8; // Bounce back harder
                score -= 5;
            }
        }
    }

    // Fall into void
    if (player.y > canvas.height + 100) {
        loseLife();
    }

    // Update ground timer (coyote time)
    if (player.isOnGround) {
        player.groundTimer = 5; // 5 frames buffer
    } else if (player.groundTimer > 0) {
        player.groundTimer--;
    }

    // Update camera
    camera.x = player.x - canvas.width / 3;
    camera.x = Math.max(0, camera.x);

    // Update distance (player.x is actual position, we show it as meters)
    distance = Math.floor(player.x);

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;

        if (p.velocityY !== undefined) {
            p.y += p.velocityY;
            p.velocityY += 0.2; // Gravity for particles
        }

        if (p.velocityX !== undefined) {
            p.x += p.velocityX;
            p.velocityX *= 0.95; // Friction
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update screen shake
    if (screenShake > 0) {
        screenShake--;
    }

    updateUI();
}

// Collision Detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Lose Life
function loseLife() {
    player.lives--;

    if (player.lives <= 0) {
        gameOver();
    } else {
        // Respawn
        player.x = 150;
        player.y = canvas.height - 200;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isOnGround = false;
        player.groundTimer = 0;
        camera.x = 0;
    }

    updateUI();
}

// Game Over
function gameOver() {
    gameState.playing = false;
    gameState.gameOver = true;

    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalDistance').textContent = distance + 'm';

    gameOverModal.classList.remove('hidden');
}

// Win Game
function winGame() {
    gameState.playing = false;
    gameState.victory = true;

    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Calculate bonuses
    score += 1000; // Victory bonus
    score += timeRemaining * 10; // Time bonus (10 points per second remaining)

    document.getElementById('victoryScore').textContent = score;
    document.getElementById('victoryDistance').textContent = distance + 'm';

    victoryModal.classList.remove('hidden');
}

// Update UI
function updateUI() {
    livesCount.textContent = player.lives;
    scoreDisplay.textContent = score;
    distanceDisplay.textContent = `${distance}m / 5000m`;

    // Update progress bar
    const progress = Math.min((distance / FINISH_LINE) * 100, 100);
    progressBarFill.style.width = progress + '%';
    progressText.textContent = Math.floor(progress) + '%';
}

// Render Game
function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context
    ctx.save();

    // Apply screen shake
    if (screenShake > 0) {
        const shakeAmount = screenShake;
        ctx.translate(
            (Math.random() - 0.5) * shakeAmount,
            (Math.random() - 0.5) * shakeAmount
        );
    }

    // Apply camera
    ctx.translate(-camera.x, 0);

    // Draw platforms
    for (let platform of platforms) {
        if (platform.isFinish) {
            // Finish line platform
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Checkered pattern
            ctx.fillStyle = '#000';
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 3; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(
                            platform.x + i * 40,
                            platform.y + j * 33,
                            40,
                            33
                        );
                    }
                }
            }
        } else {
            // Regular platform
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Platform top (grass)
            ctx.fillStyle = '#228B22';
            ctx.fillRect(platform.x, platform.y, platform.width, 10);
        }
    }

    // Draw obstacles
    ctx.fillStyle = '#DC143C';
    for (let obstacle of obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Danger stripes
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(obstacle.x, obstacle.y + 5, obstacle.width, 5);
        ctx.fillRect(obstacle.x, obstacle.y + 20, obstacle.width, 5);
        ctx.fillStyle = '#DC143C';
    }

    // Draw player
    ctx.font = `${player.height}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.skin, player.x + player.width / 2, player.y + player.height / 2);

    // Draw finish line flag
    const finishX = FINISH_LINE;
    ctx.fillStyle = '#000';
    ctx.fillRect(finishX, canvas.height - 250, 5, 150);

    // Flag
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(finishX + 5, canvas.height - 250);
    ctx.lineTo(finishX + 55, canvas.height - 230);
    ctx.lineTo(finishX + 5, canvas.height - 210);
    ctx.closePath();
    ctx.fill();

    // Draw particles
    for (let p of particles) {
        if (p.text) {
            // Text particle (combo text)
            const alpha = p.life / 60;
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1;
        } else if (p.size) {
            // Circle particle (landing effect)
            const alpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    ctx.restore();
}

// Game Loop
function gameLoop() {
    update();
    render();

    if (gameState.playing && !gameState.gameOver && !gameState.victory) {
        requestAnimationFrame(gameLoop);
    }
}

// Button Event Listeners
document.getElementById('restartBtn').addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    init();
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    init();
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
    window.location.href = '/';
});

document.getElementById('backToMenuBtn2').addEventListener('click', () => {
    window.location.href = '/';
});

pauseBtn.addEventListener('click', () => {
    if (gameState.playing && !gameState.gameOver) {
        gameState.paused = true;
        pauseModal.classList.remove('hidden');
    }
});

document.getElementById('resumeBtn').addEventListener('click', () => {
    gameState.paused = false;
    pauseModal.classList.add('hidden');
    gameLoop();
});

document.getElementById('exitBtn').addEventListener('click', () => {
    window.location.href = '/';
});

// Start Game
init();
