// Class data is now loaded from class_data.js

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

// ... (keep all the old functions like playClickSound, playBgMusic, setupEventListeners, showScreen, etc.)
// ... I will just replace the character creation logic.

function setupEventListeners() {
    // ... (keep existing event listeners)
    
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


// --- New Character Creation Logic ---

function initCharacterCreationScreen() {
    if (!ui.creationScreen) return; // Guard clause to prevent errors on other screens

    // Populate class dropdown
    ui.classSelect.innerHTML = '<option value="">- Klasse wählen -</option>';
    for (const className in RPG_CLASSES) {
        ui.classSelect.appendChild(new Option(className, className));
    }
    updateCreationState();
}

function updateCreationState() {
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
        // The window is intentionally not closed here as per user request
    } else {
        localStorage.setItem('selectedCharacter', JSON.stringify(finalCharData));
        alert(`Charakter ${name} erstellt! (Standalone)`);
    }
}

// ... (The rest of the original game.js functions, like showScreen, setupGameScreen, etc.)
// Make sure to remove the old `populateCharacterCreation` and its related functions.
// I will combine all the code into one block for the final overwrite.

window.onload = init;
