// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
const FINISH_LINE = 5000;

// Game State
let gameState = {
    playing: false,
    paused: false,
    gameOver: false
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
    groundTimer: 0,
    skin: localStorage.getItem('selectedSkinIcon') || '🎮',
    distance: 0,
    finishTime: null,
    coins: 0,
    checkpoint: { x: 150, y: 0 }
};

// Bot
let bot = {
    x: 150,
    y: 0,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    isOnGround: false,
    groundTimer: 0,
    skin: '🤖',
    distance: 0,
    finishTime: null,
    coins: 0,
    checkpoint: { x: 150, y: 0 },
    // AI properties
    thinkTimer: 0,
    targetPower: 0,
    charging: false,
    chargingTime: 0
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

// Score & Time
let score = 0;
let combo = 0;
let lastJumpTime = 0;
let raceStartTime = 0;

// Platforms
let platforms = [];
let obstacles = [];
let coins = [];

// Visual Effects
let particles = [];
let screenShake = 0;
let taunts = [];

// UI Elements
const livesCount = document.getElementById('livesCount');
const scoreDisplay = document.getElementById('scoreDisplay');
const playerDistance = document.getElementById('playerDistance');
const botDistance = document.getElementById('botDistance');
const playerMarker = document.getElementById('playerMarker');
const botMarker = document.getElementById('botMarker');
const powerBarFill = document.getElementById('powerBarFill');
const powerBarContainer = document.getElementById('powerBarContainer');

// Modals
const victoryModal = document.getElementById('victoryModal');
const pauseModal = document.getElementById('pauseModal');
const pauseBtn = document.getElementById('pauseBtn');

// Initialize Game
function init() {
    player.x = 150;
    player.y = canvas.height - 200;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isOnGround = false;
    player.groundTimer = 0;
    player.distance = 0;
    player.finishTime = null;
    player.coins = 0;
    player.checkpoint = { x: 150, y: canvas.height - 200 };

    bot.x = 150;
    bot.y = canvas.height - 200;
    bot.velocityX = 0;
    bot.velocityY = 0;
    bot.isOnGround = false;
    bot.groundTimer = 0;
    bot.distance = 0;
    bot.finishTime = null;
    bot.coins = 0;
    bot.checkpoint = { x: 150, y: canvas.height - 200 };
    bot.thinkTimer = 0;
    bot.charging = false;

    camera.x = 0;
    score = 0;
    combo = 0;
    raceStartTime = Date.now();

    gameState.playing = true;
    gameState.paused = false;
    gameState.gameOver = false;

    particles = [];
    taunts = [];

    generateLevel();
    updateUI();
    gameLoop();
}

// Generate Level (Mario-style with floating islands and voids)
function generateLevel() {
    platforms = [];
    obstacles = [];
    coins = [];

    const groundLevel = canvas.height - 100;
    const midLevel = canvas.height - 250;
    const highLevel = canvas.height - 400;

    // Starting safe platform
    platforms.push({
        x: 0,
        y: groundLevel,
        width: 400,
        height: 100,
        type: 'ground'
    });

    let currentX = 400;
    let sectionCount = 0;

    while (currentX < FINISH_LINE) {
        sectionCount++;
        const sectionType = Math.random();

        // Checkpoint every 1000 units
        if (currentX % 1000 < 50 && currentX > 500) {
            platforms.push({
                x: currentX,
                y: groundLevel,
                width: 150,
                height: 100,
                type: 'checkpoint'
            });
            currentX += 150;
            continue;
        }

        if (sectionType < 0.25) {
            // Type 1: Ground level platforms with small gaps
            const numPlatforms = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numPlatforms; i++) {
                const gap = 80 + Math.random() * 120;
                const width = 120 + Math.random() * 100;

                currentX += gap;

                platforms.push({
                    x: currentX,
                    y: groundLevel,
                    width: width,
                    height: 100,
                    type: 'ground'
                });

                // Add coins above gaps
                if (gap > 100) {
                    const coinCount = Math.floor(gap / 30);
                    for (let c = 0; c < coinCount; c++) {
                        coins.push({
                            x: currentX - gap + (c + 1) * (gap / (coinCount + 1)),
                            y: groundLevel - 80 - Math.random() * 40,
                            collected: false
                        });
                    }
                }

                currentX += width;
            }

        } else if (sectionType < 0.5) {
            // Type 2: Floating islands with void below
            const voidWidth = 300 + Math.random() * 400;
            const islandCount = 2 + Math.floor(Math.random() * 3);

            for (let i = 0; i < islandCount; i++) {
                const islandWidth = 100 + Math.random() * 120;
                const islandHeight = 60 + Math.random() * 40;
                const islandLevel = i % 2 === 0 ? midLevel : highLevel;
                const gap = voidWidth / (islandCount + 1);

                currentX += gap;

                // Floating island
                platforms.push({
                    x: currentX,
                    y: islandLevel,
                    width: islandWidth,
                    height: islandHeight,
                    type: 'floating'
                });

                // Coins around floating islands
                for (let c = 0; c < 3; c++) {
                    coins.push({
                        x: currentX + (c + 0.5) * (islandWidth / 4),
                        y: islandLevel - 60 - Math.random() * 30,
                        collected: false
                    });
                }

                // Obstacle on some islands
                if (Math.random() > 0.7 && islandWidth > 100) {
                    obstacles.push({
                        x: currentX + islandWidth / 2 - 20,
                        y: islandLevel - 40,
                        width: 40,
                        height: 40
                    });
                }
            }

            // Landing platform after void
            currentX += voidWidth / (islandCount + 1);
            platforms.push({
                x: currentX,
                y: groundLevel,
                width: 150,
                height: 100,
                type: 'ground'
            });
            currentX += 150;

        } else if (sectionType < 0.75) {
            // Type 3: Staircase pattern (ascending/descending)
            const ascending = Math.random() > 0.5;
            const steps = 3 + Math.floor(Math.random() * 3);
            const stepWidth = 100 + Math.random() * 50;
            const stepGap = 60 + Math.random() * 60;

            for (let i = 0; i < steps; i++) {
                const stepY = ascending
                    ? groundLevel - (i * 80)
                    : groundLevel - ((steps - i - 1) * 80);

                currentX += stepGap;

                platforms.push({
                    x: currentX,
                    y: stepY,
                    width: stepWidth,
                    height: 100,
                    type: 'step'
                });

                // Coins in staircase
                coins.push({
                    x: currentX + stepWidth / 2,
                    y: stepY - 60,
                    collected: false
                });

                currentX += stepWidth;
            }

        } else {
            // Type 4: Multi-level platforms (ground + floating above)
            const baseWidth = 200 + Math.random() * 150;
            const gap = 100 + Math.random() * 100;

            currentX += gap;

            // Ground platform
            platforms.push({
                x: currentX,
                y: groundLevel,
                width: baseWidth,
                height: 100,
                type: 'ground'
            });

            // Floating platform above
            const floatWidth = 80 + Math.random() * 80;
            const floatOffset = Math.random() * (baseWidth - floatWidth);
            platforms.push({
                x: currentX + floatOffset,
                y: midLevel,
                width: floatWidth,
                height: 60,
                type: 'floating'
            });

            // Coins between levels
            const coinSpacing = 40;
            for (let c = 0; c < 4; c++) {
                coins.push({
                    x: currentX + 50 + c * coinSpacing,
                    y: midLevel + 100,
                    collected: false
                });
            }

            // Obstacle on ground
            if (Math.random() > 0.6) {
                obstacles.push({
                    x: currentX + baseWidth - 80,
                    y: groundLevel - 40,
                    width: 40,
                    height: 40
                });
            }

            currentX += baseWidth;
        }

        // Add random coin clusters
        if (Math.random() > 0.7) {
            const clusterSize = 3 + Math.floor(Math.random() * 4);
            const clusterY = groundLevel - 150 - Math.random() * 100;
            for (let c = 0; c < clusterSize; c++) {
                coins.push({
                    x: currentX - 100 + c * 35,
                    y: clusterY,
                    collected: false
                });
            }
        }
    }

    // Finish platform (grand finale)
    platforms.push({
        x: FINISH_LINE - 300,
        y: groundLevel,
        width: 500,
        height: 100,
        type: 'finish',
        isFinish: true
    });

    // Victory flag with coin trail
    for (let c = 0; c < 10; c++) {
        coins.push({
            x: FINISH_LINE - 250 + c * 30,
            y: groundLevel - 100 - Math.abs(5 - c) * 20,
            collected: false
        });
    }
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
        jumpPlayer();
    }

    isPressed = false;
    powerBar.charging = false;
    powerBar.power = 0;
    powerBarFill.style.height = '0%';
    powerBarContainer.classList.remove('visible');
}

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchend', handleTouchEnd);
canvas.addEventListener('mousedown', handleTouchStart);
canvas.addEventListener('mouseup', handleTouchEnd);

// Jump Functions
function jumpPlayer() {
    const canJump = player.isOnGround || player.groundTimer > 0;

    if (canJump && powerBar.power > 0) {
        const jumpPower = powerBar.power / 100;
        player.velocityY = -15 * jumpPower - 5;
        player.velocityX = 8 * jumpPower + 2;
        player.isOnGround = false;
        player.groundTimer = 0;

        // Combo system
        const currentTime = Date.now();
        if (currentTime - lastJumpTime < 2000) {
            combo++;
        } else {
            combo = 1;
        }
        lastJumpTime = currentTime;

        const baseScore = Math.floor(powerBar.power / 10);
        const comboMultiplier = 1 + (combo * 0.1);
        const earnedScore = Math.floor(baseScore * comboMultiplier);
        score += earnedScore;

        if (combo > 1) {
            showComboText(combo, earnedScore, player);
        }
    }
}

function jumpBot(power) {
    const canJump = bot.isOnGround || bot.groundTimer > 0;

    if (canJump && power > 0) {
        const jumpPower = power / 100;
        bot.velocityY = -15 * jumpPower - 5;
        bot.velocityX = 8 * jumpPower + 2;
        bot.isOnGround = false;
        bot.groundTimer = 0;
    }
}

// Bot AI (50% accuracy)
function updateBotAI() {
    if (!bot.isOnGround && bot.groundTimer <= 0) return;

    bot.thinkTimer--;

    if (bot.thinkTimer <= 0 && !bot.charging) {
        // Decide to jump (50% accurate timing)
        const shouldJump = Math.random() > 0.3; // Slightly biased to jump

        if (shouldJump) {
            // Start charging with random accuracy
            bot.charging = true;
            bot.chargingTime = 0;
            // Target power: 40-100 (sometimes weak, sometimes strong)
            const accuracy = Math.random(); // 0 to 1
            if (accuracy > 0.5) {
                // Good jump (50% chance)
                bot.targetPower = 60 + Math.random() * 40; // 60-100
            } else {
                // Weak jump (50% chance)
                bot.targetPower = 30 + Math.random() * 50; // 30-80
            }
        }
    }

    if (bot.charging) {
        bot.chargingTime += POWER_CHARGE_RATE;

        // Release at target power (with some variance)
        const variance = Math.random() * 20 - 10; // ±10
        if (bot.chargingTime >= bot.targetPower + variance) {
            jumpBot(bot.chargingTime);
            bot.charging = false;
            bot.chargingTime = 0;
            // Random think delay
            bot.thinkTimer = Math.random() * 20 + 10; // 10-30 frames
        }
    }
}

// Show Combo Text
function showComboText(comboCount, scoreEarned, entity) {
    particles.push({
        x: entity.x + entity.width / 2,
        y: entity.y,
        text: `x${comboCount} COMBO! +${scoreEarned}`,
        life: 60,
        velocityY: -2,
        color: '#FFD700'
    });
}

// Show Taunt
function showTaunt(message, duration = 120) {
    taunts.push({
        text: message,
        life: duration,
        y: canvas.height / 3
    });
}

// Create landing particles
function createLandingParticles(entity, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: entity.x + entity.width / 2,
            y: entity.y + entity.height,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: -Math.random() * 3,
            life: 30,
            size: Math.random() * 4 + 2,
            color: color
        });
    }
}

// Update Entity (Player or Bot)
function updateEntity(entity, isPlayer = false) {
    // Gravity
    if (!entity.isOnGround) {
        entity.velocityY += GRAVITY;
    }

    // Update position
    entity.x += entity.velocityX;
    entity.y += entity.velocityY;

    // Deceleration
    if (entity.isOnGround) {
        entity.velocityX *= 0.8;
    } else {
        entity.velocityX *= 0.99;
    }

    // Check platform collisions
    const wasOnGround = entity.isOnGround;
    entity.isOnGround = false;

    for (let platform of platforms) {
        if (checkCollision(entity, platform)) {
            if (entity.velocityY > 0 && entity.y + entity.height <= platform.y + 20) {
                const wasInAir = !wasOnGround;
                entity.y = platform.y - entity.height;
                entity.velocityY = 0;
                entity.isOnGround = true;

                if (wasInAir) {
                    const color = isPlayer ? '#43e97b' : '#f093fb';
                    createLandingParticles(entity, color);
                    if (isPlayer) screenShake = 3;
                }

                if (platform.isFinish && entity.x >= FINISH_LINE - 300) {
                    if (isPlayer) {
                        player.finishTime = Date.now() - raceStartTime;
                    } else {
                        bot.finishTime = Date.now() - raceStartTime;
                    }
                    checkRaceEnd();
                }
            }
            else if (entity.velocityY < 0 && entity.y >= platform.y + platform.height - 20) {
                entity.y = platform.y + platform.height;
                entity.velocityY = 3;
            }
            else {
                if (entity.x < platform.x) {
                    entity.x = platform.x - entity.width - 5;
                    entity.velocityX = -Math.abs(entity.velocityX) * 0.5;
                } else {
                    entity.x = platform.x + platform.width + 5;
                    entity.velocityX = -Math.abs(entity.velocityX) * 0.5;
                }
            }
        }
    }

    // Check obstacle collisions
    for (let obstacle of obstacles) {
        if (checkCollision(entity, obstacle)) {
            if (entity.velocityY < 0 && entity.y >= obstacle.y + obstacle.height - 15) {
                entity.velocityY = 5;
                if (isPlayer) score -= 10;
            } else {
                if (entity.x < obstacle.x) {
                    entity.x = obstacle.x - entity.width - 5;
                } else {
                    entity.x = obstacle.x + obstacle.width + 5;
                }
                entity.velocityX = -Math.abs(entity.velocityX) * 0.8;
                if (isPlayer) score -= 5;
            }
        }
    }

    // Fall into void - respawn at checkpoint
    if (entity.y > canvas.height + 100) {
        entity.x = entity.checkpoint.x;
        entity.y = entity.checkpoint.y;
        entity.velocityX = 0;
        entity.velocityY = 0;
        entity.isOnGround = false;
        entity.groundTimer = 0;

        if (isPlayer) {
            score -= 50; // Penalty for falling
            showTaunt("Fell into void! -50 points 😬", 90);
            screenShake = 8;
        }
    }

    // Check checkpoint updates
    for (let platform of platforms) {
        if (platform.type === 'checkpoint' && entity.isOnGround && checkCollision(entity, platform)) {
            entity.checkpoint.x = platform.x + platform.width / 2;
            entity.checkpoint.y = platform.y - entity.height;

            if (isPlayer && (Math.abs(entity.checkpoint.x - platform.x) < 10)) {
                showTaunt("Checkpoint! 🚩", 60);
                score += 20;
            }
        }
    }

    // Collect coins
    if (isPlayer) {
        for (let coin of coins) {
            if (!coin.collected && checkCollision(entity, { x: coin.x - 15, y: coin.y - 15, width: 30, height: 30 })) {
                coin.collected = true;
                entity.coins++;
                score += 10;

                // Coin particle effect
                for (let i = 0; i < 8; i++) {
                    particles.push({
                        x: coin.x,
                        y: coin.y,
                        velocityX: (Math.random() - 0.5) * 6,
                        velocityY: -Math.random() * 6,
                        life: 20,
                        size: 3,
                        color: '#FFD700'
                    });
                }
            }
        }
    } else {
        // Bot also collects coins (simpler logic)
        for (let coin of coins) {
            if (!coin.collected && checkCollision(entity, { x: coin.x - 15, y: coin.y - 15, width: 30, height: 30 })) {
                coin.collected = true;
                entity.coins++;
            }
        }
    }

    // Update ground timer
    if (entity.isOnGround) {
        entity.groundTimer = 5;
    } else if (entity.groundTimer > 0) {
        entity.groundTimer--;
    }

    // Update distance
    entity.distance = Math.floor(entity.x);
}

// Update Game
function update() {
    if (!gameState.playing || gameState.paused || gameState.gameOver) return;

    // Charge power bar
    const canCharge = player.isOnGround || player.groundTimer > 0;
    if (powerBar.charging && canCharge) {
        powerBar.power = Math.min(powerBar.power + POWER_CHARGE_RATE, MAX_POWER);
        powerBarFill.style.height = powerBar.power + '%';
    }

    // Update player
    updateEntity(player, true);

    // Update bot
    updateBotAI();
    updateEntity(bot, false);

    // Check who's ahead and show taunts
    checkLeadChanges();

    // Update camera (follow player)
    camera.x = player.x - canvas.width / 3;
    camera.x = Math.max(0, camera.x);

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;

        if (p.velocityY !== undefined) {
            p.y += p.velocityY;
            p.velocityY += 0.2;
        }

        if (p.velocityX !== undefined) {
            p.x += p.velocityX;
            p.velocityX *= 0.95;
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update taunts
    for (let i = taunts.length - 1; i >= 0; i--) {
        taunts[i].life--;
        if (taunts[i].life <= 0) {
            taunts.splice(i, 1);
        }
    }

    // Update screen shake
    if (screenShake > 0) {
        screenShake--;
    }

    updateUI();
}

let lastLeader = null;
function checkLeadChanges() {
    const currentLeader = player.distance > bot.distance ? 'player' : 'bot';

    if (lastLeader && lastLeader !== currentLeader) {
        if (currentLeader === 'bot') {
            showTaunt("Bot takes the lead! 🤖", 90);
        } else {
            showTaunt("You're back in front! 🔥", 90);
        }
    }

    lastLeader = currentLeader;
}

function checkRaceEnd() {
    if (player.finishTime !== null && bot.finishTime !== null) {
        gameState.playing = false;
        gameState.gameOver = true;

        const playerWon = player.finishTime < bot.finishTime;
        showVictoryScreen(playerWon);
    } else if (player.finishTime !== null) {
        showTaunt("You finished! Waiting for bot...", 180);
    } else if (bot.finishTime !== null) {
        showTaunt("Bot finished! Hurry up! 🏃", 180);
    }
}

function showVictoryScreen(playerWon) {
    const victoryTitle = document.getElementById('victoryTitle');
    const finalScore = document.getElementById('finalScore');
    const playerTime = document.getElementById('playerTime');
    const botTime = document.getElementById('botTime');

    if (playerWon) {
        victoryTitle.textContent = "🎉 You Win! 🎉";
        score += 1000; // Victory bonus
    } else {
        victoryTitle.textContent = "😢 Bot Wins! 😢";
    }

    finalScore.textContent = score;
    playerTime.textContent = formatTime(player.finishTime);
    botTime.textContent = formatTime(bot.finishTime);

    victoryModal.classList.remove('hidden');
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

// Collision Detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Lose Life
// Removed loseLife - using checkpoint respawn system instead

// Update UI
function updateUI() {
    livesCount.textContent = player.coins; // Show coins instead of lives
    scoreDisplay.textContent = score;
    playerDistance.textContent = `${player.distance}m`;
    botDistance.textContent = `${bot.distance}m`;

    // Update progress markers
    const playerProgress = Math.min((player.distance / FINISH_LINE) * 100, 100);
    const botProgress = Math.min((bot.distance / FINISH_LINE) * 100, 100);

    playerMarker.style.left = playerProgress + '%';
    botMarker.style.left = botProgress + '%';
}

// Render Game
function render() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        if (platform.type === 'finish') {
            // Finish platform - gold checkered
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            ctx.fillStyle = '#000';
            for (let i = 0; i < 12; i++) {
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
        } else if (platform.type === 'checkpoint') {
            // Checkpoint platform - blue with flag
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(platform.x, platform.y, platform.width, 10);

            // Flag pole
            ctx.fillStyle = '#000';
            ctx.fillRect(platform.x + platform.width / 2 - 2, platform.y - 60, 4, 60);

            // Flag
            ctx.fillStyle = '#FF6347';
            ctx.beginPath();
            ctx.moveTo(platform.x + platform.width / 2 + 2, platform.y - 60);
            ctx.lineTo(platform.x + platform.width / 2 + 32, platform.y - 45);
            ctx.lineTo(platform.x + platform.width / 2 + 2, platform.y - 30);
            ctx.fill();

        } else if (platform.type === 'floating') {
            // Floating island - lighter brown with clouds
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            ctx.fillStyle = '#DEB887';
            ctx.fillRect(platform.x, platform.y, platform.width, 8);

            // Cloud effect underneath
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(platform.x + 20, platform.y + platform.height + 5, 15, 0, Math.PI * 2);
            ctx.arc(platform.x + platform.width - 20, platform.y + platform.height + 5, 15, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Regular ground platform
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Grass top
            ctx.fillStyle = '#228B22';
            ctx.fillRect(platform.x, platform.y, platform.width, 12);

            // Grass blades
            ctx.strokeStyle = '#32CD32';
            ctx.lineWidth = 2;
            for (let i = 0; i < platform.width; i += 15) {
                ctx.beginPath();
                ctx.moveTo(platform.x + i, platform.y + 12);
                ctx.lineTo(platform.x + i + 3, platform.y + 2);
                ctx.stroke();
            }
        }
    }

    // Draw coins
    for (let coin of coins) {
        if (!coin.collected) {
            // Spinning coin effect
            const time = Date.now() / 100;
            const spinScale = Math.abs(Math.sin(time + coin.x / 100));

            ctx.save();
            ctx.translate(coin.x, coin.y);
            ctx.scale(spinScale * 0.7 + 0.3, 1);

            // Coin glow
            const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Coin body
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Coin detail
            ctx.fillStyle = '#FFA500';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', 0, 0);

            ctx.restore();
        }
    }

    // Draw obstacles
    ctx.fillStyle = '#DC143C';
    for (let obstacle of obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

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

    // Draw bot
    ctx.fillText(bot.skin, bot.x + bot.width / 2, bot.y + bot.height / 2);

    // Draw finish line flag
    const finishX = FINISH_LINE;
    ctx.fillStyle = '#000';
    ctx.fillRect(finishX, canvas.height - 250, 5, 150);

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
            const alpha = p.life / 60;
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1;
        } else if (p.size) {
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

    // Draw taunts (fixed position, not affected by camera)
    for (let taunt of taunts) {
        const alpha = Math.min(taunt.life / 30, 1);
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.strokeText(taunt.text, canvas.width / 2, taunt.y);
        ctx.fillText(taunt.text, canvas.width / 2, taunt.y);
        ctx.globalAlpha = 1;
    }
}

// Game Loop
function gameLoop() {
    update();
    render();

    if (gameState.playing && !gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Button Event Listeners
document.getElementById('playAgainBtn').addEventListener('click', () => {
    victoryModal.classList.add('hidden');
    init();
});

document.getElementById('backToMenuBtn').addEventListener('click', () => {
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
