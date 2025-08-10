// Game configuration
const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridSize: 40,
    colors: ['#9C27B0', '#E91E63', '#2196F3', '#4CAF50', '#FF9800']
};

// Game objects
let crystals = [], selectedCrystal = null;
let canvas, ctx, gameLoop;

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
    scoreEl: document.getElementById('score'),
    levelEl: document.getElementById('level'),
    timeEl: document.getElementById('time'),
    finalScoreEl: document.getElementById('final-score'),
    finalLevelEl: document.getElementById('final-level'),
    newHighscoreEl: document.getElementById('new-highscore'),
    playerNameInput: document.getElementById('player-name'),
    personalHighscoresEl: document.getElementById('personal-highscores'),
    globalHighscoresEl: document.getElementById('global-highscores')
};

// Game state
let gameState = {
    score: 0,
    level: 1,
    time: 0,
    isGameOver: false,
    startTime: 0,
    gridWidth: 0,
    gridHeight: 0
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
    canvas.addEventListener('click', handleClick);
    
    // UI Buttons
    ui.startBtn.addEventListener('click', () => showScreen('game'));
    ui.highscoresBtn.addEventListener('click', () => showScreen('highscores'));
    ui.backBtn.addEventListener('click', () => showScreen('title'));
    ui.exitBtn.addEventListener('click', () => window.close());
    ui.exitToMenuBtn.addEventListener('click', () => window.close());
    
    ui.restartBtn.addEventListener('click', () => {
        if (ui.newHighscoreEl.style.display === 'block') {
            const name = ui.playerNameInput.value.trim() || 'Player';
            submitHighscore(name, gameState.score, gameState.level).then(() => {
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
            submitHighscore(name, gameState.score, gameState.level).then(() => {
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
            ui.finalScoreEl.textContent = gameState.score;
            ui.finalLevelEl.textContent = gameState.level;
            checkHighscore();
            break;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Calculate grid dimensions
    gameState.gridWidth = Math.floor(canvas.width / config.gridSize);
    gameState.gridHeight = Math.floor(canvas.height / config.gridSize);
}

// Game loop
function update(timestamp) {
    if (gameState.isGameOver) return;
    
    updateTime();
    draw();
    
    gameLoop = requestAnimationFrame(update);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= gameState.gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * config.gridSize, 0);
        ctx.lineTo(x * config.gridSize, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= gameState.gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * config.gridSize);
        ctx.lineTo(canvas.width, y * config.gridSize);
        ctx.stroke();
    }
    
    // Draw crystals
    crystals.forEach(crystal => {
        ctx.fillStyle = crystal.color;
        ctx.fillRect(
            crystal.x * config.gridSize + 2,
            crystal.y * config.gridSize + 2,
            config.gridSize - 4,
            config.gridSize - 4
        );
        
        // Highlight selected crystal
        if (selectedCrystal === crystal) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                crystal.x * config.gridSize + 1,
                crystal.y * config.gridSize + 1,
                config.gridSize - 2,
                config.gridSize - 2
            );
        }
    });
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / config.gridSize);
    const y = Math.floor((e.clientY - rect.top) / config.gridSize);
    
    // Find crystal at clicked position
    const clickedCrystal = crystals.find(c => c.x === x && c.y === y);
    
    if (clickedCrystal) {
        if (selectedCrystal && selectedCrystal !== clickedCrystal) {
            // Try to swap crystals
            if (isAdjacent(selectedCrystal, clickedCrystal)) {
                swapCrystals(selectedCrystal, clickedCrystal);
                selectedCrystal = null;
            } else {
                selectedCrystal = clickedCrystal;
            }
        } else {
            selectedCrystal = clickedCrystal;
        }
    } else {
        selectedCrystal = null;
    }
}

function isAdjacent(crystal1, crystal2) {
    const dx = Math.abs(crystal1.x - crystal2.x);
    const dy = Math.abs(crystal1.y - crystal2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function swapCrystals(crystal1, crystal2) {
    const tempX = crystal1.x;
    const tempY = crystal1.y;
    
    crystal1.x = crystal2.x;
    crystal1.y = crystal2.y;
    crystal2.x = tempX;
    crystal2.y = tempY;
    
    // Check for matches after swap
    const matches = findMatches();
    if (matches.length > 0) {
        removeMatches(matches);
        gameState.score += matches.length * 10;
        ui.scoreEl.textContent = `Punkte: ${gameState.score}`;
        
        // Level up every 100 points
        const newLevel = Math.floor(gameState.score / 100) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            ui.levelEl.textContent = `Level: ${gameState.level}`;
        }
    } else {
        // Swap back if no matches
        crystal1.x = tempX;
        crystal1.y = tempY;
        crystal2.x = tempX;
        crystal2.y = tempY;
    }
}

function findMatches() {
    const matches = [];
    
    // Check horizontal matches
    for (let y = 0; y < gameState.gridHeight; y++) {
        for (let x = 0; x < gameState.gridWidth - 2; x++) {
            const crystal1 = crystals.find(c => c.x === x && c.y === y);
            const crystal2 = crystals.find(c => c.x === x + 1 && c.y === y);
            const crystal3 = crystals.find(c => c.x === x + 2 && c.y === y);
            
            if (crystal1 && crystal2 && crystal3 && 
                crystal1.color === crystal2.color && crystal2.color === crystal3.color) {
                matches.push(crystal1, crystal2, crystal3);
            }
        }
    }
    
    // Check vertical matches
    for (let x = 0; x < gameState.gridWidth; x++) {
        for (let y = 0; y < gameState.gridHeight - 2; y++) {
            const crystal1 = crystals.find(c => c.x === x && c.y === y);
            const crystal2 = crystals.find(c => c.x === x && c.y === y + 1);
            const crystal3 = crystals.find(c => c.x === x && c.y === y + 2);
            
            if (crystal1 && crystal2 && crystal3 && 
                crystal1.color === crystal2.color && crystal2.color === crystal3.color) {
                matches.push(crystal1, crystal2, crystal3);
            }
        }
    }
    
    return [...new Set(matches)]; // Remove duplicates
}

function removeMatches(matches) {
    matches.forEach(match => {
        const index = crystals.indexOf(match);
        if (index > -1) {
            crystals.splice(index, 1);
        }
    });
    
    // Fill empty spaces
    fillEmptySpaces();
}

function fillEmptySpaces() {
    // Move crystals down
    for (let x = 0; x < gameState.gridWidth; x++) {
        for (let y = gameState.gridHeight - 1; y >= 0; y--) {
            const crystal = crystals.find(c => c.x === x && c.y === y);
            if (!crystal) {
                // Find the highest crystal above this position
                const highestCrystal = crystals.find(c => c.x === x && c.y < y);
                if (highestCrystal) {
                    highestCrystal.y = y;
                }
            }
        }
    }
    
    // Add new crystals at the top
    for (let x = 0; x < gameState.gridWidth; x++) {
        const crystalsInColumn = crystals.filter(c => c.x === x);
        while (crystalsInColumn.length < gameState.gridHeight) {
            const newY = crystalsInColumn.length;
            crystals.push({
                x: x,
                y: newY,
                color: config.colors[Math.floor(Math.random() * config.colors.length)]
            });
            crystalsInColumn.push(crystals[crystals.length - 1]);
        }
    }
}

function updateTime() {
    if (gameState.startTime > 0) {
        gameState.time = Math.floor((Date.now() - gameState.startTime) / 1000);
        ui.timeEl.textContent = `Zeit: ${gameState.time}s`;
    }
}

function gameOver() {
    gameState.isGameOver = true;
    showScreen('gameOver');
}

function resetGame() {
    gameState = {
        score: 0,
        level: 1,
        time: 0,
        isGameOver: false,
        startTime: Date.now()
    };
    
    // Create initial crystal grid
    crystals = [];
    for (let x = 0; x < gameState.gridWidth; x++) {
        for (let y = 0; y < gameState.gridHeight; y++) {
            crystals.push({
                x: x,
                y: y,
                color: config.colors[Math.floor(Math.random() * config.colors.length)]
            });
        }
    }
    
    selectedCrystal = null;
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    gameLoop = requestAnimationFrame(update);
}

// Highscore functions
function loadHighscores() {
    // Load personal highscores from localStorage
    const personalHighscores = JSON.parse(localStorage.getItem('puzzlePersonalHighscores') || '[]');
    displayHighscores(personalHighscores, ui.personalHighscoresEl);
    
    // Load global highscores from server (placeholder for now)
    const globalHighscores = JSON.parse(localStorage.getItem('puzzleGlobalHighscores') || '[]');
    displayHighscores(globalHighscores, ui.globalHighscoresEl);
}

function displayHighscores(highscores, element) {
    element.innerHTML = '';
    
    if (highscores.length === 0) {
        element.innerHTML = '<li>Keine Highscores verfügbar</li>';
        return;
    }
    
    // Sort by score and level (highest first) and take top 10
    const topScores = highscores
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.level - a.level;
        })
        .slice(0, 10);
    
    topScores.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${index + 1}. ${entry.name}</span>
            <span>${entry.score} Punkte (Level ${entry.level})</span>
        `;
        element.appendChild(li);
    });
}

function checkHighscore() {
    const personalHighscores = JSON.parse(localStorage.getItem('puzzlePersonalHighscores') || '[]');
    const currentScore = { score: gameState.score, level: gameState.level };
    
    const isNewPersonalHighscore = personalHighscores.length < 10 || 
        personalHighscores.some(h => h.score < currentScore.score || 
            (h.score === currentScore.score && h.level < currentScore.level));
    
    if (isNewPersonalHighscore) {
        ui.newHighscoreEl.style.display = 'block';
        ui.playerNameInput.focus();
    } else {
        ui.newHighscoreEl.style.display = 'none';
    }
}

async function submitHighscore(name, score, level) {
    // Add to personal highscores
    const personalHighscores = JSON.parse(localStorage.getItem('puzzlePersonalHighscores') || '[]');
    personalHighscores.push({ name, score, level, date: new Date().toISOString() });
    
    // Keep only top 10
    personalHighscores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.level - a.level;
    });
    const top10 = personalHighscores.slice(0, 10);
    
    localStorage.setItem('puzzlePersonalHighscores', JSON.stringify(top10));
    
    // TODO: Submit to server for global highscores
    // For now, we'll use localStorage for global highscores too
    const globalHighscores = JSON.parse(localStorage.getItem('puzzleGlobalHighscores') || '[]');
    globalHighscores.push({ name, score, level, date: new Date().toISOString() });
    
    globalHighscores.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.level - a.level;
    });
    const top10Global = globalHighscores.slice(0, 10);
    
    localStorage.setItem('puzzleGlobalHighscores', JSON.stringify(top10Global));
    
    return Promise.resolve();
}

// Start the game
window.onload = init;
