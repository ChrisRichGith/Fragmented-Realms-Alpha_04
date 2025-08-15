document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    const MAP_IMAGES = [
        'Dorf.png', 'Dunkel.png', 'Himmel.png', 'Höhle.png', 'Lava.png',
        'Ruine.png', 'Schlachtfeld.png', 'Wald.png', 'Winter.png', 'Wüste.png'
    ];
    // This will be used later for tactical items on the map
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
    const abilitiesContainer = document.getElementById('abilities-container');

    // --- BATTLE STATE ---
    const battleState = {
        playerParty: [],
        enemies: [],
        turnOrder: [],
        currentTurnIndex: 0,
        activeCharacterId: null,
        targetingMode: null, // { casterId, abilityId }
    };

    // --- UTILITY FUNCTIONS ---
    function playSound(src) {
        const audio = new Audio(src);
        audio.play().catch(e => console.error("Audio play failed:", e));
    }

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // --- CORE BATTLE LOGIC ---

    function initializeBattle() {
        // 1. Load character data from localStorage
        const playerCharData = JSON.parse(localStorage.getItem('selectedCharacter'));
        const npcPartyData = JSON.parse(localStorage.getItem('npcParty')) || [];

        if (!playerCharData) {
            console.error("No player character found. Aborting battle.");
            abilitiesContainer.innerHTML = '<h1>Fehler: Kein Charakter gefunden.</h1>';
            return;
        }

        let charIdCounter = 0;
        const allPlayerChars = [playerCharData, ...npcPartyData].filter(Boolean);

        // 2. Populate battleState.playerParty
        battleState.playerParty = allPlayerChars.map(charData => {
            const stats = charData.stats || { strength: 5, dexterity: 5, intelligence: 5 };
            // Fallback for class name if it's missing (e.g., for custom characters)
            const className = charData.className || 'Abenteurer';
            return {
                id: `player-${charIdCounter++}`,
                name: charData.name,
                className: className,
                image: charData.image,
                team: 'player',
                stats: { ...stats }, // Create a copy
                maxHp: (stats.strength * 10) + 50,
                currentHp: (stats.strength * 10) + 50,
                maxMana: (stats.intelligence * 10) + 20,
                currentMana: (stats.intelligence * 10) + 20,
                abilities: ABILITIES[className] || {},
                effects: [],
            };
        });

        // 3. Populate battleState.enemies (with placeholder stats and abilities)
        battleState.enemies = [
            {
                id: 'enemy-0', name: 'Goblin', className: 'Goblin', image: '/images/RPG/Monster/Goblin.png', team: 'enemy',
                stats: { strength: 4, dexterity: 6, intelligence: 2 }, maxHp: 40, currentHp: 40, maxMana: 10, currentMana: 10,
                abilities: { 'basic_attack': { name: 'Kratzer', description: 'Ein einfacher Angriff.', cost: 0, damage: { type: 'physical', multiplier: 1.0 }, target: 'single-enemy' } },
                effects: [],
            },
            {
                id: 'enemy-1', name: 'Orc', className: 'Orc', image: '/images/RPG/Monster/Orc.png', team: 'enemy',
                stats: { strength: 8, dexterity: 4, intelligence: 1 }, maxHp: 80, currentHp: 80, maxMana: 0, currentMana: 0,
                abilities: { 'basic_attack': { name: 'Zerschmettern', description: 'Ein wütender Hieb.', cost: 0, damage: { type: 'physical', multiplier: 1.2 }, target: 'single-enemy' } },
                effects: [],
            }
        ];

        // 4. Render all character cards
        playerCardContainer.innerHTML = '';
        npcCardsContainer.innerHTML = '';
        battleState.playerParty.forEach((char, index) => {
            const card = createCharacterCard(char);
            if (card) {
                // The main player goes into the top container, NPCs in the bottom one
                if (index === 0) {
                    playerCardContainer.appendChild(card);
                } else {
                    npcCardsContainer.appendChild(card);
                }
            }
        });

        // TODO: Render enemy sprites on the map itself

        // 5. Establish turn order and start the first turn
        const allCharacters = [...battleState.playerParty, ...battleState.enemies];
        battleState.turnOrder = allCharacters
            .sort((a, b) => b.stats.dexterity - a.stats.dexterity)
            .map(c => c.id);

        console.log("Battle Initialized. Turn order:", battleState.turnOrder);

        // Start the first turn
        setTimeout(startTurn, 100);
    }

    function startTurn() {
        if (battleState.turnOrder.length === 0) {
            console.log("Battle over, no one is left in turn order.");
            return;
        }

        const activeCharacterId = battleState.turnOrder[battleState.currentTurnIndex];
        battleState.activeCharacterId = activeCharacterId;
        const activeCharacter = findCharacter(activeCharacterId);

        if (!activeCharacter || activeCharacter.currentHp <= 0) {
            console.log(`Skipping turn for defeated character: ${activeCharacterId}`);
            endTurn();
            return;
        }

        console.log(`%cTurn starts for: ${activeCharacter.name} (${activeCharacter.id})`, 'font-weight: bold; color: blue;');

        // Process effects at the start of the turn
        applyTurnEffects(activeCharacter);

        // If the character died from an effect (e.g., poison), end their turn immediately.
        if (activeCharacter.currentHp <= 0) {
            endTurn();
            return;
        }

        // Highlight the active character's card
        document.querySelectorAll('.char-card, .enemy-sprite').forEach(card => card.classList.remove('active-turn'));
        const activeCard = document.getElementById(`char-card-${activeCharacterId}`);
        if (activeCard) {
            activeCard.classList.add('active-turn');
        }

        // Show abilities for the player, or run AI for the enemy
        if (activeCharacter.team === 'player') {
            displayAbilities(activeCharacterId);
        } else {
            abilitiesContainer.innerHTML = ''; // Clear abilities for enemy turn
            setTimeout(runEnemyAI, 1000); // Wait a second before AI acts
        }
    }

    function endTurn() {
        // Clear targeting and active turn visuals
        exitTargetingMode();
        const activeCard = document.querySelector('.active-turn');
        if (activeCard) {
            activeCard.classList.remove('active-turn');
        }

        // Check for battle end conditions
        const livingPlayers = battleState.playerParty.filter(p => p.currentHp > 0);
        const livingEnemies = battleState.enemies.filter(e => e.currentHp > 0);

        if (livingPlayers.length === 0) {
            abilitiesContainer.innerHTML = '<h1>NIEDERLAGE</h1>';
            console.log("Battle over: Defeat.");
            return;
        } else if (livingEnemies.length === 0) {
            abilitiesContainer.innerHTML = '<h1>SIEG!</h1>';
            console.log("Battle over: Victory!");
            return;
        }

        // Advance to the next character
        battleState.currentTurnIndex = (battleState.currentTurnIndex + 1) % battleState.turnOrder.length;

        // Start the next turn after a short delay
        setTimeout(startTurn, 250);
    }

    function useAbility(casterId, targets, abilityId) {
        const caster = findCharacter(casterId);
        const ability = caster.abilities[abilityId];

        if (!caster || !targets || targets.length === 0 || !ability) {
            console.error("Invalid ability use:", { casterId, targets, abilityId });
            exitTargetingMode();
            return;
        }

        if (caster.currentMana < ability.cost) {
            console.log("Not enough mana!");
            exitTargetingMode();
            return;
        }
        caster.currentMana -= ability.cost;
        console.log(`${caster.name} uses ${ability.name}.`);
        updateCharacterCard(caster.id);

        targets.forEach(target => {
            if (ability.damage) {
                const damage = calculateDamage(caster, target, ability);
                target.currentHp = Math.max(0, target.currentHp - damage);
                console.log(`${target.name} takes ${damage} damage.`);
            }
            if (ability.healing) {
                const healing = calculateHealing(caster, ability);
                target.currentHp = Math.min(target.maxHp, target.currentHp + healing);
                 console.log(`${target.name} heals for ${healing} health.`);
            }
            // --- Apply Effects (to be implemented next) ---
            if (ability.effects) {
                 target.effects = target.effects || [];
                 ability.effects.forEach(effect => {
                    // Add a copy of the effect object
                    target.effects.push({ ...effect });
                    console.log(`${target.name} is afflicted with ${effect.name}.`);
                });
            }

            updateCharacterCard(target.id);
            if (target.currentHp <= 0) {
                handleDeath(target.id);
            }
        });

        exitTargetingMode();
        endTurn();
    }

    function runEnemyAI() {
        const caster = findCharacter(battleState.activeCharacterId);
        if (!caster || caster.currentHp <= 0) {
            endTurn();
            return;
        }

        console.log(`${caster.name} is thinking...`);

        // Find abilities the AI can afford
        const usableAbilities = Object.keys(caster.abilities).filter(id => caster.abilities[id].cost <= caster.currentMana);
        if (usableAbilities.length === 0) {
            console.log(`${caster.name} has no usable abilities.`);
            endTurn();
            return;
        }

        // Choose a random ability
        const abilityId = getRandomElement(usableAbilities);
        const ability = caster.abilities[abilityId];

        // Find valid targets for the chosen ability
        let potentialTargets = [];
        if (ability.target.includes('ally')) { // AI targets its own team
            potentialTargets = battleState.enemies.filter(e => isValidTarget(caster, e, ability));
        } else { // AI targets players
            potentialTargets = battleState.playerParty.filter(p => isValidTarget(caster, p, ability));
        }

        if (potentialTargets.length === 0) {
            console.log(`${caster.name} could not find a valid target for ${ability.name}.`);
            endTurn();
            return;
        }

        let targets = [];
        // Decide who to target
        if (ability.target.includes('group') || ability.target.includes('multi')) {
            targets = potentialTargets;
        } else {
            targets.push(getRandomElement(potentialTargets));
        }

        console.log(`${caster.name} decides to use ${ability.name}.`);
        useAbility(caster.id, targets, abilityId);
    }

    function displayAbilities(characterId) {
        const character = findCharacter(characterId);
        abilitiesContainer.innerHTML = ''; // Clear previous abilities

        if (!character || !character.abilities || character.team !== 'player' || character.currentHp <= 0) {
            return;
        }

        for (const abilityId in character.abilities) {
            const ability = character.abilities[abilityId];
            const btn = document.createElement('button');
            btn.className = 'ability-btn';
            btn.dataset.abilityId = abilityId;
            // Disable button if not enough mana
            btn.disabled = character.currentMana < ability.cost;

            btn.innerHTML = `
                <strong>${ability.name}</strong>
                <small>${ability.description}</small>
                <span>Mana: ${ability.cost}</span>
            `;

            btn.addEventListener('click', () => {
                const ability = character.abilities[abilityId];
                // If the ability is self-targeted, use it immediately.
                if (ability.target === 'self') {
                    useAbility(character.id, [character], abilityId);
                } else {
                    // Otherwise, enter targeting mode.
                    enterTargetingMode(abilityId);
                }
            });
            abilitiesContainer.appendChild(btn);
        }
    }

    function createCharacterCard(character) {
        if (!character) return null;

        const card = document.createElement('div');
        card.className = 'char-card';
        card.id = `char-card-${character.id}`;
        card.dataset.characterId = character.id;

        const name = character.name || 'Unknown';
        const imageSrc = character.image || '/images/RPG/Charakter/male_silhouette.svg';

        // Basic stat display
        const statsContainer = document.createElement('div');
        statsContainer.className = 'char-stats-container';
        statsContainer.innerHTML = `
            <div class="stat-bar health-bar">
                <div class="bar-fill" style="width: ${(character.currentHp / character.maxHp) * 100}%;"></div>
                <span class="bar-text">${character.currentHp} / ${character.maxHp}</span>
            </div>
            <div class="stat-bar mana-bar">
                <div class="bar-fill" style="width: ${(character.currentMana / character.maxMana) * 100}%;"></div>
                <span class="bar-text">${character.currentMana} / ${character.maxMana}</span>
            </div>
        `;

        card.innerHTML = `
            <img src="${imageSrc}" alt="${name}">
            <div class="char-card-info">
                <h3>${name}</h3>
            </div>
        `;
        card.appendChild(statsContainer);
        return card;
    }

    function findCharacter(characterId) {
        return battleState.playerParty.find(c => c.id === characterId) || battleState.enemies.find(c => c.id === characterId);
    }

    // --- COMBAT HELPER FUNCTIONS ---

    function updateCharacterCard(characterId) {
        const character = findCharacter(characterId);
        const card = document.getElementById(`char-card-${characterId}`);
        if (!character || !card) return;

        const hpFill = card.querySelector('.health-bar .bar-fill');
        const hpText = card.querySelector('.health-bar .bar-text');
        if (hpFill && hpText) {
            const hpPercent = character.currentHp > 0 ? (character.currentHp / character.maxHp) * 100 : 0;
            hpFill.style.width = `${hpPercent}%`;
            hpText.textContent = `${character.currentHp} / ${character.maxHp}`;
        }

        const manaFill = card.querySelector('.mana-bar .bar-fill');
        const manaText = card.querySelector('.mana-bar .bar-text');
        if (manaFill && manaText) {
            const manaPercent = character.currentMana > 0 ? (character.currentMana / character.maxMana) * 100 : 0;
            manaFill.style.width = `${manaPercent}%`;
            manaText.textContent = `${character.currentMana} / ${character.maxMana}`;
        }

        if (character.currentHp <= 0) {
            card.classList.add('dead');
        } else {
            card.classList.remove('dead');
        }
    }

    function handleDeath(characterId) {
        const character = findCharacter(characterId);
        if (!character) return;

        console.log(`%c${character.name} has been defeated!`, 'color: red; font-weight: bold;');
        character.currentHp = 0; // Ensure HP is 0
        updateCharacterCard(characterId); // Visually mark as dead

        // Find the character's ID in the turn order
        const turnIndex = battleState.turnOrder.indexOf(characterId);
        if (turnIndex > -1) {
            // Remove them from the turn order
            battleState.turnOrder.splice(turnIndex, 1);
            // If the removed character was before the current turn, adjust the index
            if (turnIndex < battleState.currentTurnIndex) {
                battleState.currentTurnIndex--;
            }
        }
    }

    function calculateDamage(caster, target, ability) {
        if (!ability.damage) return 0;

        // Check for stat buffs/debuffs
        let attackModifier = 1.0;
        caster.effects.forEach(e => {
            if (e.name === 'increase_damage') attackModifier += e.value;
            if (e.name === 'decrease_damage') attackModifier -= e.value;
        });

        let defenseModifier = 1.0;
        target.effects.forEach(e => {
            if (e.name === 'increase_defense') defenseModifier += e.value;
            if (e.name === 'decrease_defense') defenseModifier -= e.value;
        });

        const damageType = ability.damage.type || 'physical';
        const powerStat = (damageType === 'magic') ? caster.stats.intelligence : caster.stats.strength;

        // Base damage calculation
        let baseDamage = powerStat * 5 * (ability.damage.multiplier || 1) * attackModifier;

        // Basic defense calculation
        const defenseStat = (damageType === 'magic') ? target.stats.intelligence : target.stats.strength;
        const defenseValue = (defenseStat / 2) * defenseModifier;

        const finalDamage = Math.max(1, Math.round(baseDamage - defenseValue));
        return finalDamage;
    }

    // --- TARGETING FUNCTIONS ---

    function enterTargetingMode(abilityId) {
        const caster = findCharacter(battleState.activeCharacterId);
        const ability = caster.abilities[abilityId];
        battleState.targetingMode = { casterId: caster.id, abilityId: abilityId };

        // Highlight valid targets
        const allCharacters = [...battleState.playerParty, ...battleState.enemies];
        allCharacters.forEach(char => {
            const card = document.getElementById(`char-card-${char.id}`);
            if (isValidTarget(caster, char, ability)) {
                card.classList.add('targetable');
                card.addEventListener('click', onTargetClick);
            }
        });

        console.log(`Targeting mode entered for ability: ${ability.name}`);
    }

    function exitTargetingMode() {
        if (!battleState.targetingMode) return;
        battleState.targetingMode = null;
        document.querySelectorAll('.targetable').forEach(card => {
            card.classList.remove('targetable');
            card.removeEventListener('click', onTargetClick);
        });
        console.log("Targeting mode exited.");
    }

    function onTargetClick(event) {
        if (!battleState.targetingMode) return;

        const targetCard = event.currentTarget;
        const targetId = targetCard.dataset.characterId;
        const target = findCharacter(targetId);
        const { casterId, abilityId } = battleState.targetingMode;
        const caster = findCharacter(casterId);
        const ability = caster.abilities[abilityId];

        let targets = [];
        switch (ability.target) {
            case 'single-enemy':
            case 'single-ally':
            case 'single-ally-dead':
                targets.push(target);
                break;
            case 'multi-enemy':
            case 'group-enemy': // Alias for multi-enemy
                targets = battleState.enemies.filter(e => e.currentHp > 0);
                break;
            case 'group-ally':
                targets = battleState.playerParty.filter(p => p.currentHp > 0);
                break;
            // Add more complex targeting like line or chain later
            default:
                targets.push(target); // Default to single target
                break;
        }

        useAbility(casterId, targets, abilityId);
    }

    function isValidTarget(caster, target, ability) {
        if (target.currentHp <= 0 && ability.target !== 'single-ally-dead') {
            return false;
        }
        switch (ability.target) {
            case 'single-enemy':
            case 'multi-enemy':
            case 'group-enemy':
                return target.team === 'enemy';
            case 'single-ally':
            case 'group-ally':
                return target.team === 'player';
            case 'single-ally-dead':
                return target.team === 'player' && target.currentHp <= 0;
            case 'self':
                return caster.id === target.id;
            default:
                return false; // Unknown target type
        }
    }

    function calculateHealing(caster, ability) {
        if (!ability.healing) return 0;
        return Math.round(caster.stats.intelligence * 5 * (ability.healing.multiplier || 1));
    }

    function applyTurnEffects(character) {
        if (!character.effects || character.effects.length === 0) {
            return;
        }

        console.log(`Applying effects for ${character.name}...`);
        const remainingEffects = [];

        character.effects.forEach(effect => {
            // Apply effect logic
            switch (effect.name) {
                case 'poison':
                case 'burn':
                    const dotDamage = effect.damage || 0;
                    character.currentHp = Math.max(0, character.currentHp - dotDamage);
                    console.log(`${character.name} takes ${dotDamage} damage from ${effect.name}.`);
                    break;
                case 'heal_over_time':
                    const hotHealing = Math.round(character.maxHp * effect.value);
                    character.currentHp = Math.min(character.maxHp, character.currentHp + hotHealing);
                    console.log(`${character.name} heals for ${hotHealing} from ${effect.name}.`);
                    break;
            }

            // Decrement duration and check for expiration
            if (effect.duration) {
                effect.duration--;
                if (effect.duration > 0) {
                    remainingEffects.push(effect);
                } else {
                    console.log(`${effect.name} has worn off for ${character.name}.`);
                }
            }
        });

        character.effects = remainingEffects;
        updateCharacterCard(character.id);

        if (character.currentHp <= 0) {
            handleDeath(character.id);
        }
    }


    // --- MAP & TACTIC ITEM DISPLAY (can be left as is for now) ---
    function displayMap() {
        const randomMap = getRandomElement(MAP_IMAGES);
        battleMapImage.src = `/images/RPG/Background/${randomMap}`;
    }

    function displayTacticItems() {
        const selectedItems = getRandomElement(TACTIC_ITEM_IMAGES, 2);
        // Logic to display these items will go here later
    }

    // --- INITIALIZATION ---
    function init() {
        displayMap();
        // displayTacticItems(); // We can re-enable this later
        initializeBattle();
    }

    init();
});
