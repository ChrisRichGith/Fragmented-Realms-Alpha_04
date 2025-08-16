// This will be the full, corrected content of game.js
// I will combine the old code with the new logic here.
const LOCATIONS = {
    'city_1': {
        name: 'Varethyn',
        coords: { top: '11.24%', left: '26.06%', width: '10%', height: '15%' },
        detailMap: '/images/RPG/Maps/Citymap.png',
        actions: ['trade', 'quest', 'rest']
    },
    'village_2': {
        name: 'Dornhall',
        coords: { top: '38.06%', left: '16.24%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Maps/Villagemap.png',
        actions: ['quest', 'rest']
    },
    'village_3': {
        name: 'Myrrgarde',
        coords: { top: '48.12%', left: '31.15%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Maps/Villagemap.png',
        actions: ['quest', 'rest']
    },
    'forest_4': {
        name: 'Ysmereth',
        coords: { top: '25.25%', left: '45.77%', width: '15%', height: '15%' },
        detailMap: '/images/RPG/Maps/Wald.png',
        actions: ['explore', 'gather']
    },
    'village_5': {
        name: 'Elaris',
        coords: { top: '65.24%', left: '15.02%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Maps/Villagemap.png',
        actions: ['quest', 'rest']
    },
    'city_6': {
        name: 'Bruchhain',
        coords: { top: '65.92%', left: '35.78%', width: '10%', height: '10%' },
        detailMap: '/images/RPG/Maps/Citymap.png',
        actions: ['trade', 'quest', 'rest']
    },
    'city_7': {
        name: 'Tharvok',
        coords: { top: '52.8%', left: '67.05%', width: '13%', height: '13%' },
        detailMap: '/images/RPG/Maps/Citymap.png',
        actions: ['trade', 'quest', 'rest']
    },
    'dungeon_8': {
        name: 'Schattenfels',
        coords: { top: '68.45%', left: '72.44%', width: '9%', height: '9%' },
        detailMap: '/images/RPG/Maps/Dungeon.png',
        actions: ['enter_dungeon']
    },
    'village_9': {
        name: 'Kragmoor',
        coords: { top: '26.54%', left: '80.27%', width: '8%', height: '8%' },
        detailMap: '/images/RPG/Maps/Villagemap.png',
        actions: ['quest', 'rest']
    }
};

// Game objects
let keys = {};

// UI Elements
let ui = {};

// Party state
let npcParty = [null, null, null];
let currentLocationId = null;

// New state for the new character creation screen
let creationState = {
    name: '',
    class: '',
    gender: 'male',
    portrait: ''
};

// Initialize game
function init() {
    // Populate UI object
    ui = {
        // Screens
        titleScreen: document.getElementById('title-screen'),
        gameScreen: document.getElementById('game-screen'),
        optionsScreen: document.getElementById('options-screen'),
        characterCreationScreen: document.getElementById('character-creation-screen'),
        locationDetailScreen: document.getElementById('location-detail-screen'),

        // Buttons
        newGameBtn: document.getElementById('new-game-btn'),
        loadGameBtn: document.getElementById('load-game-btn'),
        optionsBtn: document.getElementById('options-btn'),
        exitBtn: document.getElementById('exit-rpg-btn'),
        optionsBackBtn: document.getElementById('options-back-btn'),
        creationBackBtn: document.getElementById('creation-back-btn'),
        startGameDirektBtn: document.getElementById('start-game-direkt-btn'),
        backToWorldMapBtn: document.getElementById('back-to-world-map-btn'),
        savePartyBtn: document.getElementById('save-party-btn'),
        loadPartyBtn: document.getElementById('load-party-btn'),
        rpgMenuToggleBtn: document.getElementById('rpg-menu-toggle-btn'),
        rpgMenuPopup: document.getElementById('rpg-menu-popup'),
        locationOverlayContainer: document.getElementById('location-overlay-container'),
        locationTitleDisplay: document.getElementById('location-title-display'),
        worldMapWrapper: document.getElementById('world-map-wrapper'),

        // Game UI
        levelEl: document.getElementById('level'),
        experienceEl: document.getElementById('experience'),
        healthEl: document.getElementById('health'),

        // Audio
        bgMusic: document.getElementById('bg-music'),
        sfxClick: document.getElementById('sfx-click'),
        sfxSlideOpen: document.getElementById('sfx-slide-open'),
        sfxSlideClose: document.getElementById('sfx-slide-close'),
        sfxParchment: document.getElementById('sfx-parchment'),
        sfxQuestAccept: document.getElementById('sfx-quest-accept'),
        sfxQuestDecline: document.getElementById('sfx-quest-decline'),
        musicVolumeSlider: document.getElementById('music-volume'),
        sfxVolumeSlider: document.getElementById('sfx-volume'),

        // Save Game Modal
        saveGameModal: document.getElementById('save-game-modal'),
        saveNameInput: document.getElementById('save-name-input'),
        confirmSaveBtn: document.getElementById('confirm-save-btn'),
        cancelSaveBtn: document.getElementById('cancel-save-btn'),

        // Load Game Modal
        loadGameModal: document.getElementById('load-game-modal'),
        saveSlotsContainer: document.getElementById('save-slots-container'),
        cancelLoadBtn: document.getElementById('cancel-load-btn'),

        // Quest Scroll Modal
        questScrollModal: document.getElementById('quest-scroll-modal'),
        questAcceptBtn: document.getElementById('quest-accept-btn'),
        questDeclineBtn: document.getElementById('quest-decline-btn'),

        // New Character Creation Elements
        creationScreen: document.getElementById('character-creation-screen'),
        portraitDisplay: document.getElementById('creation-portrait-display'),
        classDisplay: document.getElementById('creation-class-display'),
        classDescription: document.getElementById('creation-class-description'),
        statsDisplay: document.getElementById('creation-stats-display'),
        classSelect: document.getElementById('creation-class-select'),
        genderSelector: document.getElementById('creation-gender-selector'),
        charNameInput: document.getElementById('creation-char-name'),
        portraitGallery: document.getElementById('portrait-gallery-container'),
        confirmCreationBtn: document.getElementById('confirm-creation-btn'),
    };
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the new character creation screen
    initCharacterCreationScreen();
    
    // Check for direct start action
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'continue') {
        showScreen('game');
    } else {
        showScreen('title');
    }
}

function playClickSound() {
    if (ui.sfxClick) {
        ui.sfxClick.currentTime = 0;
        ui.sfxClick.play();
    }
}

function playBgMusic() {
    if (ui.bgMusic) {
        ui.bgMusic.play().catch(e => console.error("Audio autoplay failed: ", e));
    }
}

function setupEventListeners() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', playClickSound);
    });

    ui.newGameBtn.addEventListener('click', () => showScreen('character-creation'));
    ui.optionsBtn.addEventListener('click', () => showScreen('options'));
    ui.optionsBackBtn.addEventListener('click', () => showScreen('title'));
    ui.creationBackBtn.addEventListener('click', () => showScreen('title'));
    ui.startGameDirektBtn.addEventListener('click', () => showScreen('game'));
    ui.backToWorldMapBtn.addEventListener('click', () => {
        if (ui.sfxSlideClose) {
            ui.sfxSlideClose.currentTime = 0;
            ui.sfxSlideClose.play();
        }
        ui.worldMapWrapper.style.zIndex = 2;
        ui.locationTitleDisplay.style.opacity = 0;
        const mapLeft = document.getElementById('world-map-left');
        const mapRight = document.getElementById('world-map-right');
        mapLeft.classList.remove('split');
        mapRight.classList.remove('split');
        setTimeout(() => {
            ui.locationDetailScreen.style.display = 'none';
            ui.locationOverlayContainer.style.display = 'block';
            setTimeout(() => {
                ui.locationOverlayContainer.classList.add('active');
            }, 20);
        }, 800);
    });
    ui.savePartyBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/gamesaves');
            const saveFiles = await response.json();
            const container = document.getElementById('existing-saves-container');
            container.innerHTML = '';
            if (saveFiles.length === 0) {
                container.innerHTML = '<p>Noch keine Spielstände vorhanden.</p>';
            } else {
                const list = document.createElement('ul');
                saveFiles.forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.className = 'existing-save-item';
                    listItem.textContent = file.replace('.json', '');
                    list.appendChild(listItem);
                });
                container.appendChild(list);
            }
        } catch (error) {
            console.error('Could not fetch existing saves:', error);
            document.getElementById('existing-saves-container').innerHTML = '<p>Fehler beim Laden der Spielstände.</p>';
        }
        ui.saveGameModal.style.display = 'flex';
    });
    ui.exitBtn.addEventListener('click', () => {
        window.close();
    });
    ui.rpgMenuToggleBtn.addEventListener('click', () => {
        ui.rpgMenuPopup.classList.toggle('hidden');
    });
    ui.musicVolumeSlider.addEventListener('input', (e) => {
        if(ui.bgMusic) ui.bgMusic.volume = e.target.value / 100;
    });
    ui.sfxVolumeSlider.addEventListener('input', (e) => {
        if(ui.sfxClick) ui.sfxClick.volume = e.target.value / 100;
    });
    ui.cancelSaveBtn.addEventListener('click', () => {
        ui.saveGameModal.style.display = 'none';
    });
    ui.confirmSaveBtn.addEventListener('click', async () => {
        const baseName = ui.saveNameInput.value.trim();
        if (baseName.length < 3 || !/^[a-zA-Z0-9_ -]+$/.test(baseName)) {
             alert('Bitte gib einen gültigen Namen mit mindestens 3 Zeichen ein (nur Buchstaben, Zahlen, Leerzeichen, _ und -).');
            return;
        }
        const charData = JSON.parse(localStorage.getItem('selectedCharacter'));
        if (!charData) {
            alert('Fehler: Kein Charakter zum Speichern ausgewählt. Bitte erstelle zuerst einen Charakter.');
            return;
        }
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const finalSaveName = `${baseName}_${timestamp}`;
        const saveData = {
            name: finalSaveName,
            character: charData,
            party: npcParty,
            location: currentLocationId
        };
        try {
            const response = await fetch('/api/gamesaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save game.');
            }
            ui.saveNameInput.value = '';
            ui.saveGameModal.style.display = 'none';
            alert('Spielstand gespeichert!');
        } catch (error) {
            console.error('Error saving game:', error);
            alert(`Fehler beim Speichern: ${error.message}`);
        }
    });

    // New Creation Screen Listeners
    if (ui.creationScreen) {
        ui.classSelect.addEventListener('change', updateCreationState);
        ui.genderSelector.addEventListener('click', (e) => {
            const button = e.target.closest('.gender-btn');
            if (button) {
                if (ui.genderSelector.querySelector('.active')) {
                    ui.genderSelector.querySelector('.active').classList.remove('active');
                }
                button.classList.add('active');
                updateCreationState();
            }
        });
        ui.charNameInput.addEventListener('input', updateCreationState);
        ui.portraitGallery.addEventListener('click', (e) => {
            const item = e.target.closest('.portrait-item');
            if (item) {
                if (ui.portraitGallery.querySelector('.selected')) {
                    ui.portraitGallery.querySelector('.selected').classList.remove('selected');
                }
                item.classList.add('selected');
                updateCreationState();
            }
        });
        ui.confirmCreationBtn.addEventListener('click', confirmCharacter);
    }
}

function showScreen(screenId) {
    if (ui.titleScreen) ui.titleScreen.style.display = 'none';
    if (ui.gameScreen) ui.gameScreen.style.display = 'none';
    if (ui.optionsScreen) ui.optionsScreen.style.display = 'none';
    if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'none';
    if (ui.locationDetailScreen) ui.locationDetailScreen.style.display = 'none';

    switch(screenId) {
        case 'title':
            if (ui.titleScreen) ui.titleScreen.style.display = 'flex';
            playBgMusic();
            break;
        case 'options':
            if (ui.optionsScreen) ui.optionsScreen.style.display = 'flex';
            break;
        case 'character-creation':
            if (ui.characterCreationScreen) ui.characterCreationScreen.style.display = 'flex';
            break;
        case 'game':
            if (ui.gameScreen) ui.gameScreen.style.display = 'flex';
            setupGameScreen();
            break;
        case 'location-detail':
            if (ui.locationDetailScreen) ui.locationDetailScreen.style.display = 'flex';
            break;
    }
}

function setupGameScreen() {
    const charCardContainer = document.getElementById('game-character-card-container');
    const charData = JSON.parse(localStorage.getItem('selectedCharacter'));
    if (!charData) {
        charCardContainer.innerHTML = '<p>Kein Charakter ausgewählt. Bitte erstelle einen Charakter.</p>';
        ui.savePartyBtn.disabled = true;
        return;
    }
    ui.savePartyBtn.disabled = false;
    charCardContainer.innerHTML = `
        <div class="character-card-game">
            <img src="${charData.image}" alt="${charData.name}">
            <h3>${charData.name}</h3>
            <div class="card-stats">
                <span>STÄ: ${charData.stats.strength}</span>
                <span>GES: ${charData.stats.dexterity}</span>
                <span>INT: ${charData.stats.intelligence}</span>
            </div>
        </div>
    `;
    setupNpcSelection();
    createLocationOverlays();
}

function setupNpcSelection() {
    const npcContainer = document.getElementById('npc-selection-container');
    npcContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const card = document.createElement('div');
        card.className = 'npc-card';
        let options = '<option value="">- Klasse wählen -</option>';
        for (const className in RPG_CLASSES) {
            if (className !== 'Eigener Charakter') {
                options += `<option value="${className}">${className}</option>`;
            }
        }
        const savedNpc = npcParty[i];
        const imgSrc = savedNpc && RPG_CLASSES[savedNpc.className] ? RPG_CLASSES[savedNpc.className].img[savedNpc.gender] : '/images/RPG/Charakter/male_silhouette.svg';
        card.innerHTML = `
            <img src="${imgSrc}" alt="NPC ${i + 1}">
            <div class="npc-card-details">
                <h4>Begleiter ${i + 1}</h4>
                <select class="npc-class-select" data-slot="${i}">${options}</select>
                <div class="gender-selector">
                    <button class="gender-btn active" data-gender="male"><img src="/images/RPG/Charakter/M.png" alt="Männlich"></button>
                    <button class="gender-btn" data-gender="female"><img src="/images/RPG/Charakter/F.png" alt="Weiblich"></button>
                </div>
            </div>
        `;
        npcContainer.appendChild(card);
        if (savedNpc) {
            card.querySelector('.npc-class-select').value = savedNpc.className;
        }
    }
    document.querySelectorAll('.npc-card').forEach((card, i) => {
        const select = card.querySelector('.npc-class-select');
        const img = card.querySelector('img');
        const genderButtons = card.querySelectorAll('.gender-btn');
        const updateNpc = () => {
            const selectedClass = select.value;
            const activeGenderBtn = card.querySelector('.gender-btn.active');
            const gender = activeGenderBtn ? activeGenderBtn.dataset.gender : 'male';
            if (selectedClass && RPG_CLASSES[selectedClass]) {
                const classData = RPG_CLASSES[selectedClass];
                img.src = classData.img[gender];
                npcParty[i] = {
                    name: selectedClass,
                    class: selectedClass,
                    image: classData.img[gender],
                    stats: classData.stats,
                    hp: 100, maxHp: 100, mana: 100, maxMana: 100,
                    gender: gender
                };
            } else {
                img.src = '/images/RPG/Charakter/male_silhouette.svg';
                npcParty[i] = null;
            }
        };
        select.addEventListener('change', updateNpc);
        genderButtons.forEach(button => {
            button.addEventListener('click', () => {
                card.querySelector('.gender-btn.active').classList.remove('active');
                button.classList.add('active');
                updateNpc();
            });
        });
    });
}

function createLocationOverlays() {
    // ... (rest of the function)
}

function showLocationDetail(locationId) {
    // ... (rest of the function)
}

async function loadGame(fileName) {
    // ... (rest of the function)
}

// --- New Character Creation Logic ---
function initCharacterCreationScreen() {
    if (!ui.creationScreen) return; // Guard clause
    ui.classSelect.innerHTML = '<option value="">- Klasse wählen -</option>';
    for (const className in RPG_CLASSES) {
        ui.classSelect.appendChild(new Option(className, className));
    }
    updateCreationState();
}

function updateCreationState() {
    if (!ui.creationScreen) return;
    const selectedClass = ui.classSelect.value;
    const activeGenderBtn = ui.genderSelector.querySelector('.active');
    const selectedGender = activeGenderBtn ? activeGenderBtn.dataset.gender : 'male';
    const selectedPortraitEl = ui.portraitGallery.querySelector('.selected');
    const charName = ui.charNameInput.value.trim();
    creationState = {
        name: charName,
        class: selectedClass,
        gender: selectedGender,
        portrait: selectedPortraitEl ? selectedPortraitEl.src : ''
    };
    updateCreationDisplay();
    updatePortraitGallery();
    checkCreationComplete();
}

function updateCreationDisplay() {
    const { class: className, gender, portrait } = creationState;
    const classData = RPG_CLASSES[className];
    if (classData) {
        ui.classDisplay.textContent = className;
        ui.classDescription.textContent = classData.description;
        const stats = classData.stats;
        ui.statsDisplay.innerHTML = `
            <span>STÄ: ${stats.strength}</span>
            <span>GES: ${stats.dexterity}</span>
            <span>INT: ${stats.intelligence}</span>
        `;
    } else {
        ui.classDisplay.textContent = 'Klasse';
        ui.classDescription.textContent = 'Wähle eine Klasse und ein Geschlecht.';
        ui.statsDisplay.innerHTML = '';
    }
    ui.portraitDisplay.src = portrait || (gender === 'male' ? '/images/RPG/Charakter/male_silhouette.svg' : '/images/RPG/Charakter/female_silhouette.svg');
}

function updatePortraitGallery() {
    const { gender } = creationState;
    ui.portraitGallery.innerHTML = '';
    const portraitFiles = [
        'Portrait_m.png', 'Portrait_f.png', 'Portrait_2_m.png', 'Portrait_2_f.png',
        'Portrait_3_m.png', 'Portrait_3_f.png', 'Portrait_4_m.png', 'Portrait_4_f.png'
    ];
    const genderSuffix = `_${gender}.png`;
    const availablePortraits = portraitFiles.filter(file => file.endsWith(genderSuffix));
    availablePortraits.forEach(fileName => {
        const img = document.createElement('img');
        img.src = `/images/RPG/Charakter/${fileName}`;
        img.alt = fileName;
        img.className = 'portrait-item';
        if (img.src === creationState.portrait) {
            img.classList.add('selected');
        }
        ui.portraitGallery.appendChild(img);
    });
}

function checkCreationComplete() {
    const { name, class: className, portrait } = creationState;
    if (name && name.length >= 3 && className && portrait) {
        ui.confirmCreationBtn.disabled = false;
    } else {
        ui.confirmCreationBtn.disabled = true;
    }
}

function confirmCharacter() {
    const { name, class: className, gender, portrait } = creationState;
    if (!name || !className || !portrait) {
        alert("Bitte fülle alle Felder aus und wähle ein Porträt.");
        return;
    }
    const classData = RPG_CLASSES[className];
    const finalCharData = {
        name,
        class: className,
        gender,
        image: portrait,
        stats: classData.stats,
        abilities: classData.abilities
    };
    if (window.opener) {
        window.opener.postMessage({ type: 'character-selected', data: finalCharData }, '*');
        alert("Charakter wurde an das Hauptfenster gesendet!");
    } else {
        localStorage.setItem('selectedCharacter', JSON.stringify(finalCharData));
        alert(`Charakter ${name} erstellt! (Standalone)`);
    }
}

function handleKeyDown(e) {
    keys[e.key] = true;
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

window.onload = init;
