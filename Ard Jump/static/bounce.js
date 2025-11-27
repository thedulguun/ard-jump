// Game State
const gameState = {
    balance: 1000,
    currentBet: 50,
    isPlaying: false,
    ballSpeed: 3,
    ballPosition: 0,
    ballDirection: 1,
    currentWinnings: 0,
    streak: 0,
    bestStreak: 0,
    totalWins: 0,
    totalGames: 0,
    biggestWin: 0,
    consecutiveWins: 0,
    totalProfit: 0
};

// Zone configuration with HIDDEN manipulation
const zones = [
    { multiplier: 1.2, start: 0, end: 25, color: '#4CAF50', label: '1.2x', displayWidth: 25 },
    { multiplier: 2, start: 25, end: 45, color: '#2196F3', label: '2x', displayWidth: 20 },
    { multiplier: 5, start: 45, end: 60, color: '#9C27B0', label: '5x', displayWidth: 15 },
    { multiplier: 10, start: 60, end: 70, color: '#FF9800', label: '10x', displayWidth: 10 },
    { multiplier: 20, start: 70, end: 75, color: '#f44336', label: '20x', displayWidth: 5 },
    { multiplier: 10, start: 75, end: 85, color: '#FF9800', label: '10x', displayWidth: 10 },
    { multiplier: 5, start: 85, end: 100, color: '#9C27B0', label: '5x', displayWidth: 15 }
];

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    ball: document.getElementById('ball'),
    startBtn: document.getElementById('startBtn'),
    tapBtn: document.getElementById('tapBtn'),
    cashoutBtn: document.getElementById('cashoutBtn'),
    betInput: document.getElementById('betInput'),
    betControls: document.getElementById('betControls'),
    gameButtons: document.getElementById('gameButtons'),
    currentMultiplier: document.getElementById('currentMultiplier'),
    streakValue: document.getElementById('streakValue'),
    streakBonus: document.getElementById('streakBonus'),
    winningsValue: document.getElementById('winningsValue'),
    cashoutValue: document.getElementById('cashoutValue'),
    totalWins: document.getElementById('totalWins'),
    bestStreak: document.getElementById('bestStreak'),
    biggestWin: document.getElementById('biggestWin'),
    winRate: document.getElementById('winRate'),
    notifications: document.getElementById('notifications'),
    particleCanvas: document.getElementById('particleCanvas'),
    menuBtn: document.getElementById('menuBtn'),
    menuModal: document.getElementById('menuModal'),
    closeMenu: document.getElementById('closeMenu'),
    howToPlay: document.getElementById('howToPlay'),
    howToPlayModal: document.getElementById('howToPlayModal'),
    closeHowToPlay: document.getElementById('closeHowToPlay'),
    backToMenu: document.getElementById('backToMenu'),
    resultModal: document.getElementById('resultModal'),
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    resultAmount: document.getElementById('resultAmount'),
    resultMultiplier: document.getElementById('resultMultiplier'),
    continueBtn: document.getElementById('continueBtn'),
    cashoutResultBtn: document.getElementById('cashoutResultBtn')
};

// Particle System
const particleCanvas = elements.particleCanvas;
const ctx = particleCanvas.getContext('2d');
particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8 - 2;
        this.gravity = 0.3;
        this.opacity = 1;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= 0.02;
    }

    draw() {
        ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${this.opacity})`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createParticles(x, y, color, count = 30) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles = particles.filter(p => p.opacity > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(updateParticles);
}

updateParticles();

// Casino Mathematics - Hidden House Edge
function getManipulatedZone(displayedPosition) {
    // Base manipulation: shrink high-value zones
    let manipulation = 0;

    // Increase manipulation based on consecutive wins (adaptive difficulty)
    if (gameState.consecutiveWins > 0) {
        manipulation = gameState.consecutiveWins * 1.5; // 1.5% shrink per win
    }

    // Increase manipulation if player is profiting
    if (gameState.totalProfit > 0) {
        manipulation += Math.min(gameState.totalProfit / 100, 5); // Up to 5% additional
    }

    // Apply manipulation: shift position away from high zones
    let actualPosition = displayedPosition;

    for (const zone of zones) {
        if (displayedPosition >= zone.start && displayedPosition <= zone.end) {
            // High multiplier zones get shrunk
            if (zone.multiplier >= 5) {
                const zoneCenter = (zone.start + zone.end) / 2;
                const distanceFromCenter = Math.abs(displayedPosition - zoneCenter);
                const shrinkFactor = 1 + (manipulation / 100);

                // Push position toward zone edges (shrinking effective hitbox)
                if (displayedPosition < zoneCenter) {
                    actualPosition = zone.start + (distanceFromCenter * shrinkFactor);
                } else {
                    actualPosition = zone.end - (distanceFromCenter * shrinkFactor);
                }

                // Clamp to valid range
                actualPosition = Math.max(0, Math.min(100, actualPosition));
            }
            break;
        }
    }

    return actualPosition;
}

function getZoneAtPosition(position) {
    for (const zone of zones) {
        if (position >= zone.start && position <= zone.end) {
            return zone;
        }
    }
    return zones[0]; // Default to lowest multiplier
}

// Ball Animation
let animationFrame;

function animateBall() {
    gameState.ballPosition += gameState.ballSpeed * gameState.ballDirection;

    // Bounce at edges
    if (gameState.ballPosition >= 100) {
        gameState.ballPosition = 100;
        gameState.ballDirection = -1;
    } else if (gameState.ballPosition <= 0) {
        gameState.ballPosition = 0;
        gameState.ballDirection = 1;
    }

    // Update ball visual position
    elements.ball.style.left = `${gameState.ballPosition}%`;

    // Update current multiplier display
    const zone = getZoneAtPosition(gameState.ballPosition);
    elements.currentMultiplier.querySelector('.multiplier-value').textContent = `${zone.multiplier}x`;
    elements.currentMultiplier.style.background = `linear-gradient(135deg, ${zone.color}dd, ${zone.color}aa)`;

    if (gameState.isPlaying) {
        animationFrame = requestAnimationFrame(animateBall);
    }
}

// Input lag injection (for casino edge)
let inputLagActive = false;

function shouldApplyInputLag() {
    // 15% chance of 50ms lag when player has won recently
    if (gameState.consecutiveWins >= 2 && Math.random() < 0.15) {
        return true;
    }
    // 25% chance of 30ms lag when player is profiting significantly
    if (gameState.totalProfit > gameState.balance * 0.2 && Math.random() < 0.25) {
        return true;
    }
    return false;
}

// Start Game
function startGame() {
    const bet = parseInt(elements.betInput.value);

    if (bet < 10 || bet > gameState.balance) {
        showNotification('Invalid bet amount!', 'error');
        return;
    }

    gameState.currentBet = bet;
    gameState.balance -= bet;
    gameState.isPlaying = true;
    gameState.ballSpeed = 3 + Math.random() * 2; // Variable speed for unpredictability
    gameState.totalGames++;

    updateBalance();

    // UI updates
    elements.startBtn.classList.add('hidden');
    elements.betControls.style.opacity = '0.5';
    elements.betControls.style.pointerEvents = 'none';
    elements.gameButtons.classList.remove('hidden');

    // Start animation
    animateBall();
}

// Stop Ball (Tap)
function stopBall() {
    if (!gameState.isPlaying) return;

    // Apply input lag if conditions met
    if (shouldApplyInputLag() && !inputLagActive) {
        inputLagActive = true;
        setTimeout(() => {
            processBallStop();
            inputLagActive = false;
        }, Math.random() * 30 + 20); // 20-50ms lag
        return;
    }

    processBallStop();
}

function processBallStop() {
    gameState.isPlaying = false;
    cancelAnimationFrame(animationFrame);

    // Get manipulated position for payout calculation
    const displayedPosition = gameState.ballPosition;
    const actualPosition = getManipulatedZone(displayedPosition);
    const zone = getZoneAtPosition(actualPosition);

    // Calculate winnings with streak bonus
    const streakBonus = gameState.streak * 0.1; // 10% per streak
    const totalMultiplier = zone.multiplier * (1 + streakBonus);
    const winAmount = Math.floor(gameState.currentBet * totalMultiplier);

    gameState.currentWinnings += winAmount;
    gameState.totalProfit += (winAmount - gameState.currentBet);

    // Check for near-miss (psychological manipulation)
    checkNearMiss(displayedPosition, actualPosition, zone);

    // Update streak
    if (zone.multiplier >= 2) {
        gameState.streak++;
        gameState.consecutiveWins++;
        gameState.totalWins++;
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
    } else {
        gameState.streak = 0;
        gameState.consecutiveWins = 0;
    }

    if (winAmount > gameState.biggestWin) {
        gameState.biggestWin = winAmount;
    }

    updateStats();
    updateWinnings();
    updateStreak();

    // Particle effect
    const ballRect = elements.ball.getBoundingClientRect();
    createParticles(
        ballRect.left + ballRect.width / 2,
        ballRect.top + ballRect.height / 2,
        zone.color,
        zone.multiplier >= 10 ? 50 : 30
    );

    // Show result modal
    showResultModal(zone, winAmount, totalMultiplier);
}

function checkNearMiss(displayedPos, actualPos, resultZone) {
    // If manipulation pushed them out of a better zone, show "near miss"
    const displayedZone = getZoneAtPosition(displayedPos);

    if (displayedZone.multiplier > resultZone.multiplier) {
        const diff = displayedZone.multiplier - resultZone.multiplier;
        if (diff >= 3) {
            setTimeout(() => {
                showNotification(`SO CLOSE to ${displayedZone.multiplier}x!`, 'warning', 2000);
            }, 500);
        }
    }
}

// Cash Out
function cashOut() {
    if (gameState.currentWinnings === 0) return;

    gameState.balance += gameState.currentWinnings;
    const cashoutAmount = gameState.currentWinnings;
    gameState.currentWinnings = 0;
    gameState.streak = 0;
    gameState.consecutiveWins = 0;

    updateBalance();
    updateWinnings();
    updateStreak();

    // Reset UI
    elements.gameButtons.classList.add('hidden');
    elements.startBtn.classList.remove('hidden');
    elements.betControls.style.opacity = '1';
    elements.betControls.style.pointerEvents = 'auto';

    showNotification(`Cashed out ${cashoutAmount} coins!`, 'success', 2000);

    // Particle celebration
    createParticles(window.innerWidth / 2, window.innerHeight / 2, '#4CAF50', 60);
}

// Continue Playing
function continueGame() {
    const bet = gameState.currentBet;

    if (bet > gameState.balance) {
        showNotification('Not enough balance! Cash out first.', 'error');
        return;
    }

    gameState.balance -= bet;
    gameState.isPlaying = true;
    gameState.ballSpeed = 3 + Math.random() * 2;
    gameState.totalGames++;

    updateBalance();

    // Hide result modal
    elements.resultModal.classList.add('hidden');

    // Continue animation
    animateBall();
}

// Result Modal
function showResultModal(zone, winAmount, totalMultiplier) {
    let icon, title;

    if (zone.multiplier >= 20) {
        icon = '🎰';
        title = 'JACKPOT!!!';
    } else if (zone.multiplier >= 10) {
        icon = '🎉';
        title = 'AMAZING!';
    } else if (zone.multiplier >= 5) {
        icon = '🔥';
        title = 'GREAT HIT!';
    } else if (zone.multiplier >= 2) {
        icon = '✨';
        title = 'NICE!';
    } else {
        icon = '😐';
        title = 'SMALL WIN';
    }

    elements.resultIcon.textContent = icon;
    elements.resultTitle.textContent = title;
    elements.resultAmount.textContent = `+${winAmount}`;
    elements.resultMultiplier.textContent = `${totalMultiplier.toFixed(1)}x`;

    elements.resultModal.classList.remove('hidden');
}

// UI Updates
function updateBalance() {
    elements.balance.textContent = gameState.balance;
}

function updateWinnings() {
    elements.winningsValue.textContent = gameState.currentWinnings;
    elements.cashoutValue.textContent = gameState.currentWinnings;
}

function updateStreak() {
    elements.streakValue.textContent = gameState.streak;
    elements.streakBonus.textContent = `+${gameState.streak * 10}%`;
}

function updateStats() {
    elements.totalWins.textContent = gameState.totalWins;
    elements.bestStreak.textContent = gameState.bestStreak;
    elements.biggestWin.textContent = gameState.biggestWin;
    const winRate = gameState.totalGames > 0 ?
        Math.round((gameState.totalWins / gameState.totalGames) * 100) : 0;
    elements.winRate.textContent = `${winRate}%`;
}

// Notifications
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    elements.notifications.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Event Listeners
elements.startBtn.addEventListener('click', startGame);
elements.tapBtn.addEventListener('click', stopBall);
elements.cashoutBtn.addEventListener('click', cashOut);
elements.continueBtn.addEventListener('click', continueGame);
elements.cashoutResultBtn.addEventListener('click', () => {
    elements.resultModal.classList.add('hidden');
    cashOut();
});

// Bet quick buttons
document.getElementById('bet10').addEventListener('click', () => {
    elements.betInput.value = 10;
    gameState.currentBet = 10;
});
document.getElementById('bet50').addEventListener('click', () => {
    elements.betInput.value = 50;
    gameState.currentBet = 50;
});
document.getElementById('bet100').addEventListener('click', () => {
    elements.betInput.value = 100;
    gameState.currentBet = 100;
});
document.getElementById('bet500').addEventListener('click', () => {
    elements.betInput.value = 500;
    gameState.currentBet = 500;
});

// Menu modals
elements.menuBtn.addEventListener('click', () => {
    elements.menuModal.classList.remove('hidden');
});
elements.closeMenu.addEventListener('click', () => {
    elements.menuModal.classList.add('hidden');
});
elements.howToPlay.addEventListener('click', () => {
    elements.menuModal.classList.add('hidden');
    elements.howToPlayModal.classList.remove('hidden');
});
elements.closeHowToPlay.addEventListener('click', () => {
    elements.howToPlayModal.classList.add('hidden');
});
elements.backToMenu.addEventListener('click', () => {
    window.location.href = '/';
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === elements.menuModal) {
        elements.menuModal.classList.add('hidden');
    }
    if (e.target === elements.howToPlayModal) {
        elements.howToPlayModal.classList.add('hidden');
    }
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.isPlaying) {
            stopBall();
        } else if (!elements.startBtn.classList.contains('hidden')) {
            startGame();
        }
    }
});

// Responsive canvas
window.addEventListener('resize', () => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
});

// Initialize
updateBalance();
updateWinnings();
updateStreak();
updateStats();
