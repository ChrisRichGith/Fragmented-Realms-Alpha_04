document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    const MAP_IMAGES = [
        'Dorf.png', 'Dunkel.png', 'Himmel.png', 'Höhle.png', 'Lava.png',
        'Ruine.png', 'Schlachtfeld.png', 'Wald.png', 'Winter.png', 'Wüste.png'
    ];

    const TACTIC_ITEM_IMAGES = [
        'Altar.png', 'Arkan.png', 'Dunkelwolke.png', 'Fass.png', 'Schildwall.png', 'Turm.png'
    ];

    // --- DOM Elements ---
    const playerCardContainer = document.getElementById('player-character-card');
    const npcCardsContainer = document.getElementById('npc-character-cards');
    const battleMapImage = document.getElementById('battle-map');
    const tacticItemsContainer = document.getElementById('tactic-items');

    // --- FUNCTIONS ---

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function selectRandomTacticItems() {
        const shuffled = TACTIC_ITEM_IMAGES.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    }

    function displayMap() {
        const randomMap = getRandomElement(MAP_IMAGES);
        battleMapImage.src = `/images/RPG/Background/${randomMap}`;
    }

    function displayTacticItems() {
        const selectedItems = selectRandomTacticItems();
        tacticItemsContainer.innerHTML = ''; // Clear previous items
        selectedItems.forEach(itemImage => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'tactic-item';

            const img = document.createElement('img');
            img.src = `/images/RPG/Taktikitems/${itemImage}`;
            img.alt = itemImage.replace('.png', '');
            img.draggable = true; // Set draggable attribute for future use

            itemDiv.appendChild(img);
            tacticItemsContainer.appendChild(itemDiv);
        });
    }

    function createCharacterCard(characterData) {
        if (!characterData) return null;

        const card = document.createElement('div');
        card.className = 'char-card';

        const name = characterData.name || 'Unknown';
        const image = characterData.image || '/images/RPG/Charakter/male_silhouette.svg';

        card.innerHTML = `
            <img src="${image}" alt="${name}">
            <h3>${name}</h3>
        `;
        // In a real scenario, more stats would be added here.
        return card;
    }

    function displayCharacters() {
        // Get player character from localStorage
        const playerCharData = JSON.parse(localStorage.getItem('selectedCharacter'));
        if (playerCharData) {
            const playerCard = createCharacterCard(playerCharData);
            playerCardContainer.appendChild(playerCard);
        }

        // Get NPC party from localStorage
        // Note: The structure of npcParty in localStorage needs to be defined.
        // For now, let's assume it's an array of objects similar to the player character.
        // This part is a placeholder until the main game saves NPC data.
        const npcPartyData = JSON.parse(localStorage.getItem('npcParty')) || [];
        npcCardsContainer.innerHTML = ''; // Clear previous NPCs
        npcPartyData.forEach(npcData => {
            if (npcData) { // Check if the slot is not empty
                const npcCard = createCharacterCard(npcData);
                if(npcCard) npcCardsContainer.appendChild(npcCard);
            }
        });
    }


    // --- INITIALIZATION ---
    function init() {
        displayMap();
        displayTacticItems();
        displayCharacters();
        // Setup drag and drop listeners in the future
    }

    init();
});
