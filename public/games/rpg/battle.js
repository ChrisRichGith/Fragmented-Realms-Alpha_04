document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    const MAP_IMAGES = [
        'Dorf.png', 'Dunkel.png', 'Himmel.png', 'Höhle.png', 'Lava.png',
        'Ruine.png', 'Schlachtfeld.png', 'Wald.png', 'Winter.png', 'Wüste.png'
    ];
    const TACTIC_ITEM_IMAGES = [
        'Altar.png', 'Arkan.png', 'Dunkelwolke.png', 'Fass.png', 'Schildwall.png', 'Turm.png'
    ];
    let currentMap = '';
    let MAP_CONFIG_EDITABLE = {};

    // --- DOM Elements ---
    const playerCardContainer = document.getElementById('player-character-card');
    const npcCardsContainer = document.getElementById('npc-character-cards');
    const centerPanel = document.getElementById('center-panel');
    const battleMapImage = document.getElementById('battle-map');
    const tacticItemsContainer = document.getElementById('tactic-items');

    // --- UTILITY FUNCTIONS ---
    function playSound(src) {
        const audio = new Audio(src);
        audio.play().catch(e => console.error("Audio play failed:", e));
    }

    // --- CORE GAME FUNCTIONS ---

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function selectRandomTacticItems() {
        const shuffled = TACTIC_ITEM_IMAGES.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }

    function displayMap() {
        const randomMap = getRandomElement(MAP_IMAGES);
        currentMap = randomMap;
        battleMapImage.src = `/images/RPG/Background/${randomMap}`;
        battleMapImage.onload = () => {
            MAP_CONFIG_EDITABLE = JSON.parse(JSON.stringify(MAP_CONFIG));
            createDropZones(randomMap);
            setupEditMode(true);
        };
    }

    function createDropZones(mapFileName, useEditableConfig = true) {
        const existingZones = document.querySelectorAll('.drop-zone');
        existingZones.forEach(zone => zone.remove());
        const config = useEditableConfig ? MAP_CONFIG_EDITABLE : MAP_CONFIG;

        if (config && config[mapFileName]) {
            const coordinates = config[mapFileName];
            coordinates.forEach((coord, index) => {
                const zone = document.createElement('div');
                zone.className = 'drop-zone';
                zone.id = `drop-zone-${index}`;
                zone.style.left = `${coord.x}px`;
                zone.style.top = `${coord.y}px`;
                zone.dataset.index = index;

                zone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!zone.classList.contains('edit-mode')) {
                        zone.classList.add('drag-over');
                    }
                });
                zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
                zone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    zone.classList.remove('drag-over');
                    const itemId = e.dataTransfer.getData('text/plain');
                    const itemElement = document.getElementById(itemId);
                    if (itemElement && zone.childElementCount === 0) {
                        playSound('/Sounds/RPG/Drag_rev.mp3'); // Play sound on drop
                        zone.appendChild(itemElement);
                        itemElement.style.position = 'static';
                    }
                });
                centerPanel.appendChild(zone);
            });
        }
    }

    function displayTacticItems() {
        const selectedItems = selectRandomTacticItems();
        tacticItemsContainer.innerHTML = '';
        selectedItems.forEach((itemImage, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'tactic-item';
            itemDiv.id = `tactic-item-${index}`;
            itemDiv.draggable = true;
            const img = document.createElement('img');
            img.src = `/images/RPG/Taktikitems/${itemImage}`;
            img.alt = itemImage.replace('.png', '');
            img.draggable = false;
            itemDiv.appendChild(img);
            tacticItemsContainer.appendChild(itemDiv);
            itemDiv.addEventListener('dragstart', (e) => {
                playSound('/Sounds/RPG/Drag.mp3'); // Play sound on drag start
                e.dataTransfer.setData('text/plain', e.target.id);
                e.dataTransfer.effectAllowed = 'move';
            });
        });
    }

    // --- CHARACTER CARD FUNCTIONS ---

    function createCharacterCard(characterData, isPlayer = false) {
        if (!characterData) return null;

        const hp = characterData.hp ?? Math.floor(Math.random() * 80) + 20;
        const maxHp = characterData.maxHp ?? 100;
        const mana = characterData.mana ?? Math.floor(Math.random() * 60) + 40;
        const maxMana = characterData.maxMana ?? 100;

        const card = document.createElement('div');
        const name = characterData.name || 'Unknown';

        // Health and Mana Bar creation logic (reusable)
        const createStatBar = (current, max, type) => {
            const container = document.createElement('div');
            container.className = 'stat-bar-container';
            const bar = document.createElement('div');
            bar.className = 'stat-bar';
            const fill = document.createElement('div');
            fill.className = `${type}-bar`;
            fill.style.width = `${(current / max) * 100}%`;
            const value = document.createElement('span');
            value.className = 'stat-value';
            value.textContent = `${current} / ${max}`;
            bar.appendChild(fill);
            container.appendChild(bar);
            container.appendChild(value);
            return container;
        };

        // Drop zone creation logic (reusable)
        const createDropZone = () => {
            const dropZone = document.createElement('div');
            dropZone.className = 'char-drop-zone';
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const itemId = e.dataTransfer.getData('text/plain');
                const itemElement = document.getElementById(itemId);
                if (itemElement && dropZone.childElementCount === 0) {
                    playSound('/Sounds/RPG/Drag_rev.mp3');
                    dropZone.appendChild(itemElement);
                }
            });
            return dropZone;
        };

        if (isPlayer) {
            card.className = 'char-card';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'char-card-info';
            const nameHeader = document.createElement('h3');
            nameHeader.textContent = name;
            infoDiv.appendChild(nameHeader);

            const topSection = document.createElement('div');
            topSection.className = 'char-top-section';
            const imageSrc = characterData.image || '/images/RPG/Charakter/male_silhouette.svg';
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = name;
            topSection.appendChild(img);
            topSection.appendChild(createDropZone());

            const statsContainer = document.createElement('div');
            statsContainer.className = 'char-stats-container';
            statsContainer.appendChild(createStatBar(hp, maxHp, 'health'));
            statsContainer.appendChild(createStatBar(mana, maxMana, 'mana'));

            card.appendChild(infoDiv);
            card.appendChild(topSection);
            card.appendChild(statsContainer);
        } else {
            // New compact NPC card
            card.className = 'npc-card';

            const infoSection = document.createElement('div');
            infoSection.className = 'npc-info-section';

            const classHeader = document.createElement('h4');
            classHeader.className = 'npc-class';
            classHeader.textContent = characterData.class || name; // Fallback to name if class is not available

            const statsContainer = document.createElement('div');
            statsContainer.className = 'npc-stats-container';
            statsContainer.appendChild(createStatBar(hp, maxHp, 'health'));
            statsContainer.appendChild(createStatBar(mana, maxMana, 'mana'));

            infoSection.appendChild(classHeader);
            infoSection.appendChild(statsContainer);

            card.appendChild(infoSection);
            card.appendChild(createDropZone());
        }

        return card;
    }

    function displayCharacters() {
        playerCardContainer.innerHTML = '';
        npcCardsContainer.innerHTML = '';
        const playerCharData = JSON.parse(localStorage.getItem('selectedCharacter'));
        if (playerCharData) {
            const playerCard = createCharacterCard(playerCharData, true); // isPlayer = true
            if (playerCard) playerCardContainer.appendChild(playerCard);
        }
        const npcPartyData = JSON.parse(localStorage.getItem('npcParty')) || [];
        npcPartyData.forEach(npcData => {
            if (npcData) {
                const npcCard = createCharacterCard(npcData, false); // isPlayer = false
                if (npcCard) npcCardsContainer.appendChild(npcCard);
            }
        });
    }

    // --- COORDINATE EDIT MODE ---

    let isEditModeInitialized = false;
    function setupEditMode(reinitializing = false) {
        if (isEditModeInitialized && !reinitializing) return;
        let editModeActive = false;
        const toggleKey = 'd';
        let saveButton = null;
        const handleZoneDragEnd = (e) => {
            e.preventDefault();
            const zone = e.target;
            const zoneIndex = zone.dataset.index;
            const panelRect = centerPanel.getBoundingClientRect();
            let newX = e.clientX - panelRect.left;
            let newY = e.clientY - panelRect.top;
            newX = Math.max(0, Math.min(newX, panelRect.width - zone.offsetWidth));
            newY = Math.max(0, Math.min(newY, panelRect.height - zone.offsetHeight));
            zone.style.left = `${newX}px`;
            zone.style.top = `${newY}px`;
            if (MAP_CONFIG_EDITABLE[currentMap] && MAP_CONFIG_EDITABLE[currentMap][zoneIndex]) {
                MAP_CONFIG_EDITABLE[currentMap][zoneIndex].x = Math.round(newX);
                MAP_CONFIG_EDITABLE[currentMap][zoneIndex].y = Math.round(newY);
            }
        };
        const toggleZoneDraggability = (isDraggable) => {
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.draggable = isDraggable;
                zone.classList.toggle('edit-mode', isDraggable);
                if (isDraggable) {
                    zone.addEventListener('dragend', handleZoneDragEnd);
                } else {
                    zone.removeEventListener('dragend', handleZoneDragEnd);
                }
            });
        };
        const saveConfiguration = async () => {
            try {
                const response = await fetch('/api/rpg/mapconfig', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(MAP_CONFIG_EDITABLE, null, 4)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Konfiguration erfolgreich gespeichert!');
                    Object.assign(MAP_CONFIG, MAP_CONFIG_EDITABLE);
                } else {
                    throw new Error(result.message || 'Speichern fehlgeschlagen.');
                }
            } catch (error) {
                console.error('Error saving map configuration:', error);
                alert(`Fehler beim Speichern: ${error.message}`);
            }
        };
        const toggleEditMode = (forceState) => {
            editModeActive = (forceState !== undefined) ? forceState : !editModeActive;
            toggleZoneDraggability(editModeActive);
            if (editModeActive) {
                if (!saveButton) {
                    saveButton = document.createElement('button');
                    saveButton.textContent = 'Koordinaten speichern';
                    saveButton.id = 'save-coords-button';
                    centerPanel.appendChild(saveButton);
                    saveButton.addEventListener('click', saveConfiguration);
                }
                saveButton.style.display = 'block';
                console.log(`%c[Edit Mode] ACTIVATED. Drag drop zones to new positions. Press '${toggleKey}' to exit.`, 'color: limegreen; font-weight: bold;');
            } else {
                if (saveButton) {
                    saveButton.style.display = 'none';
                }
                console.log(`%c[Edit Mode] DEACTIVATED.`, 'color: orange; font-weight: bold;');
            }
        };
        if (!isEditModeInitialized) {
            window.addEventListener('keydown', (e) => {
                if (e.key === toggleKey) toggleEditMode();
            });
            console.log(`%cPress the '${toggleKey}' key to toggle Drop Zone Edit Mode.`, 'color: yellow; font-size: 12px;');
        }
        if (reinitializing) {
            toggleEditMode(editModeActive);
        }
        isEditModeInitialized = true;
    }

    // --- INITIALIZATION ---
    function init() {
        displayMap();
        displayTacticItems();
        displayCharacters();
        setupEditMode();
    }

    init();
});
