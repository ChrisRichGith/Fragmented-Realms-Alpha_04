// Game configuration
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    playerSpeed: 4,
    playerSize: 30
};

// Game objects
let player, plants = [], coins = [];
let canvas, ctx, gameLoop, keys = {};

// UI Elements
const ui = {
    // Screens
    titleScreen: document.getElementById('title-screen'),
    gameScreen: document.getElementById('game-screen'),
    highscoresScreen: document.getElementById('highscores-screen'),
    gameOverScreen: document.getElementById('game-over'),
    
    // Buttons
    startBtn: document.getElementById('start-btn'),
    highscoresBtn: document.getElementById('highscores-btn'),
    backBtn: document.getElementById('back-btn'),
    restartBtn: document.getElementById('restart-btn'),
    toHighscoresBtn: document.getElementById('to-highscores-btn'),
    exitBtn: document.getElementById('exit-btn'),
    exitToMenuBtn: document.getElementById('exit-to-menu-btn'),
    
    // Game UI
    plantsEl: document.getElementById('plants'),
    coinsEl: document.getElementById('coins'),
    timeEl: document.getElementById('time'),
    finalPlantsEl: document.getElementById('final-plants'),
    finalCoinsEl: document.getElementById('final-coins'),
    newHighscoreEl: document.getElementById('new-highscore'),
    playerNameInput: document.getElementById('player-name'),
    personalHighscoresEl: document.getElementById('personal-highscores'),
    globalHighscoresEl: document.getElementById('global-highscores')
};

// Game state
let gameState = {
    plants: 0,
    coins: 0,
    time: 0,
    isGameOver: false,
    startTime: 0
};

// Initialize game
function init() {
    // Set up canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Set up event listeners
    setupEventListeners();
    
    // Show title screen
    showScreen('title');
    
    // Start game loop (paused until game starts)
    gameLoop = requestAnimationFrame(update);
}

// Set up all event listeners
function setupEventListeners() {
    // Game controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // UI Buttons
    ui.startBtn.addEventListener('click', () => showScreen('game'));
    ui.highscoresBtn.addEventListener('click', () => showScreen('highscores'));
    ui.backBtn.addEventListener('click', () => showScreen('title'));
    ui.exitBtn.addEventListener('click', () => window.close());
    ui.exitToMenuBtn.addEventListener('click', () => window.close());
    
    ui.restartBtn.addEventListener('click', () => {
        if (ui.newHighscoreEl.style.display === 'block') {
            const name = ui.playerNameInput.value.trim() || 'Player';
            submitHighscore(name, gameState.plants, gameState.coins).then(() => {
                resetGame();
                showScreen('game');
            });
        } else {
            resetGame();
            showScreen('game');
        }
    });
    
    ui.toHighscoresBtn.addEventListener('click', () => {
        if (ui.newHighscoreEl.style.display === 'block') {
            const name = ui.playerNameInput.value.trim() || 'Player';
            submitHighscore(name, gameState.plants, gameState.coins).then(() => {
                showScreen('highscores');
            });
        } else {
            showScreen('highscores');
        }
    });
}

// Show a specific screen
function showScreen(screenId) {
    // Hide all screens
    Object.values(ui).forEach(element => {
        if (element && element.style) {
            element.style.display = 'none';
        }
    });
    
    // Show the requested screen
    switch(screenId) {
        case 'title':
            ui.titleScreen.style.display = 'block';
            break;
        case 'game':
            ui.gameScreen.style.display = 'block';
            resetGame();
            break;
        case 'highscores':
            ui.highscoresScreen.style.display = 'block';
            loadHighscores();
            break;
        case 'gameOver':
            ui.gameOverScreen.style.display = 'block';
            ui.finalPlantsEl.textContent = gameState.plants;
            ui.finalCoinsEl.textContent = gameState.coins;
            checkHighscore();
            break;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Game loop
function update(timestamp) {
    if (gameState.isGameOver) return;
    
    updatePlayer();
    updatePlants();
    updateCoins();
    updateTime();
    checkCollisions();
    draw();
    
    gameLoop = requestAnimationFrame(update);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    if (player) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw plants
    plants.forEach(plant => {
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(plant.x, plant.y, plant.width, plant.height);
    });
    
    // Draw coins
    coins.forEach(coin => {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function updatePlayer() {
    if (!player) return;
    
    // Movement
    if (keys['ArrowLeft'] || keys['a']) {
        player.x = Math.max(0, player.x - config.playerSpeed);
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x = Math.min(canvas.width - player.width, player.x + config.playerSpeed);
    }
    if (keys['ArrowUp'] || keys['w']) {
        player.y = Math.max(0, player.y - config.playerSpeed);
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y = Math.min(canvas.height - player.height, player.y + config.playerSpeed);
    }
}

function updatePlants() {
    // Spawn new plants randomly
    if (Math.random() < 0.005) {
        const plant = {
            x: Math.random() * (canvas.width - 20),
            y: Math.random() * (canvas.height - 20),
            width: 20,
            height: 20
        };
        plants.push(plant);
    }
}

function updateCoins() {
    // Spawn new coins randomly
    if (Math.random() < 0.003) {
        const coin = {
            x: Math.random() * (canvas.width - 15),
            y: Math.random() * (canvas.height - 15),
            width: 15,
            height: 15
        };
        coins.push(coin);
    }
}

function updateTime() {
    if (gameState.startTime > 0) {
        gameState.time = Math.floor((Date.now() - gameState.startTime) / 1000);
        ui.timeEl.textContent = `Zeit: ${gameState.time}s`;
    }
}

function checkCollisions() {
    if (!player) return;
    
    // Check plant collisions
    for (let i = plants.length - 1; i >= 0; i--) {
        const plant = plants[i];
        
        if (isColliding(player, plant)) {
            gameState.plants++;
            plants.splice(i, 1);
            ui.plantsEl.textContent = `Pflanzen: ${gameState.plants}`;
        }
    }
    
    // Check coin collisions
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        if (isColliding(player, coin)) {
            gameState.coins++;
            coins.splice(i, 1);
            ui.coinsEl.textContent = `Münzen: ${gameState.coins}`;
        }
    }
}

function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

function gameOver() {
    gameState.isGameOver = true;
    showScreen('gameOver');
}

function resetGame() {
    gameState = {
        plants: 0,
        coins: 0,
        time: 0,
        isGameOver: false,
        startTime: Date.now()
    };
    
    player = {
        x: canvas.width / 2 - config.playerSize / 2,
        y: canvas.height / 2 - config.playerSize / 2,
        width: config.playerSize,
        height: config.playerSize
    };
    
    plants = [];
    coins = [];
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    gameLoop = requestAnimationFrame(update);
}

function handleKeyDown(e) {
    keys[e.key] = true;
    if (e.key === 'Escape') window.close();
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

// Highscore functions
function loadHighscores() {
    // Load personal highscores from localStorage
    const personalHighscores = JSON.parse(localStorage.getItem('gardenPersonalHighscores') || '[]');
    displayHighscores(personalHighscores, ui.personalHighscoresEl);
    
    // Load global highscores from server (placeholder for now)
    const globalHighscores = JSON.parse(localStorage.getItem('gardenGlobalHighscores') || '[]');
    displayHighscores(globalHighscores, ui.globalHighscoresEl);
}

function displayHighscores(highscores, element) {
    element.innerHTML = '';
    
    if (highscores.length === 0) {
        element.innerHTML = '<li>Keine Highscores verfügbar</li>';
        return;
    }
    
    // Sort by plants and coins (highest first) and take top 10
    const topScores = highscores
        .sort((a, b) => {
            if (b.plants !== a.plants) return b.plants - a.plants;
            return b.coins - a.coins;
        })
        .slice(0, 10);
    
    topScores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.plants} Pflanzen, ${entry.coins} Münzen</span>
        `;
        element.appendChild(li);
    });
}

function checkHighscore() {
    const personalHighscores = JSON.parse(localStorage.getItem('gardenPersonalHighscores') || '[]');
    const currentScore = { plants: gameState.plants, coins: gameState.coins };
    
    const isNewPersonalHighscore = personalHighscores.length < 10 || 
        personalHighscores.some(h => h.plants < currentScore.plants || 
            (h.plants === currentScore.plants && h.coins < currentScore.coins));
    
    if (isNewPersonalHighscore) {
        ui.newHighscoreEl.style.display = 'block';
        ui.playerNameInput.focus();
    } else {
        ui.newHighscoreEl.style.display = 'none';
    }
}

async function submitHighscore(name, plants, coins) {
    // Add to personal highscores
    const personalHighscores = JSON.parse(localStorage.getItem('gardenPersonalHighscores') || '[]');
    personalHighscores.push({ name, plants, coins, date: new Date().toISOString() });
    
    // Keep only top 10
    personalHighscores.sort((a, b) => {
        if (b.plants !== a.plants) return b.plants - a.plants;
        return b.coins - a.coins;
    });
    const top10 = personalHighscores.slice(0, 10);
    
    localStorage.setItem('gardenPersonalHighscores', JSON.stringify(top10));
    
    // TODO: Submit to server for global highscores
    // For now, we'll use localStorage for global highscores too
    const globalHighscores = JSON.parse(localStorage.getItem('gardenGlobalHighscores') || '[]');
    globalHighscores.push({ name, plants, coins, date: new Date().toISOString() });
    
    globalHighscores.sort((a, b) => {
        if (b.plants !== a.plants) return b.plants - a.plants;
        return b.coins - a.coins;
    });
    const top10Global = globalHighscores.slice(0, 10);
    
    localStorage.setItem('gardenGlobalHighscores', JSON.stringify(top10Global));
    
    return Promise.resolve();
}

// Start the game
window.onload = init;
