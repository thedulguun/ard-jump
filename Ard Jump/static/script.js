// Modal Management
const modals = {
    gameMode: document.getElementById('gameModeModal'),
    inventory: document.getElementById('inventoryModal'),
    skinPull: document.getElementById('skinPullModal')
};

// Buttons
const btnStart = document.querySelector('.btn-start');
const btnInventory = document.querySelector('.btn-inventory');
const btnSkinPull = document.querySelector('.btn-skin-pull');

// Modal buttons
const btnSinglePlayer = document.getElementById('singlePlayerBtn');
const btnMultiPlayer = document.getElementById('multiPlayerBtn');
const btnBackFromMode = document.getElementById('backFromModeBtn');
const btnBackFromInventory = document.getElementById('backFromInventoryBtn');
const btnBackFromPull = document.getElementById('backFromPullBtn');

// Carousel elements
const carousel = document.getElementById('carousel');
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
const btnSelectSkin = document.getElementById('selectSkinBtn');

// Chest elements
const chest = document.getElementById('chest');
const chestReward = document.getElementById('chestReward');
const rewardItem = document.getElementById('rewardItem');
const rewardName = document.getElementById('rewardName');
const btnOpenChest = document.getElementById('openChestBtn');

// Character display
const characterIcon = document.querySelector('.character-icon');

// State
let currentSkinIndex = 0;
let selectedSkin = 'default';
const skins = [
    { name: 'Default', icon: '🎮', id: 'default' },
    { name: 'Ninja', icon: '🥷', id: 'ninja' },
    { name: 'Robot', icon: '🤖', id: 'robot' },
    { name: 'Alien', icon: '👽', id: 'alien' }
];

// Modal Functions
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

function closeAllModals() {
    Object.values(modals).forEach(modal => closeModal(modal));
}

// Event Listeners - Main Buttons
btnStart.addEventListener('click', () => {
    openModal(modals.gameMode);
});

btnInventory.addEventListener('click', () => {
    openModal(modals.inventory);
});

btnSkinPull.addEventListener('click', () => {
    openModal(modals.skinPull);
    resetChestPull();
});

// Event Listeners - Game Mode
btnSinglePlayer.addEventListener('click', () => {
    // Save selected skin to localStorage
    localStorage.setItem('selectedSkin', selectedSkin);
    localStorage.setItem('selectedSkinIcon', characterIcon.textContent);

    // Navigate to game
    window.location.href = '/game';
});

btnMultiPlayer.addEventListener('click', () => {
    // Save selected skin to localStorage
    localStorage.setItem('selectedSkin', selectedSkin);
    localStorage.setItem('selectedSkinIcon', characterIcon.textContent);

    // Navigate to multiplayer
    window.location.href = '/multiplayer';
});

btnBackFromMode.addEventListener('click', () => {
    closeModal(modals.gameMode);
});

// Event Listeners - Inventory
btnBackFromInventory.addEventListener('click', () => {
    closeModal(modals.inventory);
});

carouselPrev.addEventListener('click', () => {
    if (currentSkinIndex > 0) {
        currentSkinIndex--;
        updateCarousel();
    }
});

carouselNext.addEventListener('click', () => {
    if (currentSkinIndex < skins.length - 1) {
        currentSkinIndex++;
        updateCarousel();
    }
});

// Skin selection
const skinItems = document.querySelectorAll('.skin-item');
skinItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        currentSkinIndex = index;
        updateActiveSkin();
    });
});

btnSelectSkin.addEventListener('click', () => {
    const activeSkinItem = document.querySelector('.skin-item.active');
    const skinId = activeSkinItem.getAttribute('data-skin');
    const skinIcon = activeSkinItem.getAttribute('data-icon');

    // Update character display
    characterIcon.textContent = skinIcon;
    selectedSkin = skinId;

    // Update all skin statuses
    skinItems.forEach(item => {
        const statusElement = item.querySelector('.skin-status');
        if (item.getAttribute('data-skin') === skinId) {
            statusElement.textContent = 'Equipped';
        } else {
            statusElement.textContent = 'Owned';
        }
    });

    console.log('Skin selected:', skinId);
    closeModal(modals.inventory);
});

function updateCarousel() {
    const scrollAmount = currentSkinIndex * 200;
    carousel.scrollLeft = scrollAmount;
    updateActiveSkin();
}

function updateActiveSkin() {
    skinItems.forEach((item, index) => {
        if (index === currentSkinIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Event Listeners - Skin Pull
btnBackFromPull.addEventListener('click', () => {
    closeModal(modals.skinPull);
});

btnOpenChest.addEventListener('click', () => {
    openChest();
});

function openChest() {
    // Disable button during animation
    btnOpenChest.disabled = true;
    btnOpenChest.textContent = 'Opening...';

    // Add shake animation
    chest.classList.add('opening');

    setTimeout(() => {
        // Hide chest
        chest.style.opacity = '0';

        // Show random reward
        const randomSkin = skins[Math.floor(Math.random() * skins.length)];
        rewardItem.textContent = randomSkin.icon;
        rewardName.textContent = randomSkin.name + '!';
        chestReward.classList.remove('hidden');

        // Reset after delay
        setTimeout(() => {
            btnOpenChest.disabled = false;
            btnOpenChest.textContent = 'Open Again';
        }, 2000);
    }, 500);
}

function resetChestPull() {
    chest.classList.remove('opening');
    chest.style.opacity = '1';
    chestReward.classList.add('hidden');
    btnOpenChest.disabled = false;
    btnOpenChest.textContent = 'Open Chest';
}

// Close modals when clicking outside
Object.values(modals).forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// Initialize
console.log('Ard Jump game loaded!');
