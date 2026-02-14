
import { v4 as uuidv4 } from 'uuid';

const POKEDEX_URL = "https://play.pokemonshowdown.com/data/pokedex.json";
const MOVES_URL = "https://play.pokemonshowdown.com/data/moves.json";
const LEARNSETS_URL = "https://play.pokemonshowdown.com/data/learnsets.json";

async function fetchJson(url: string) {
    console.error(`Fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return await response.json();
}

// Heuristic for cooldown
function calculateCooldown(move: any): number {
    if (move.basePower >= 120) return 3; // Hyper Beam style
    if (move.basePower >= 100) return 2; // Very strong
    if (move.basePower >= 80) return 1;  // Strong moves
    return 0;
}

// Check if Pokemon has an image file
function hasImage(pokemonNum: number): boolean {
    // We have images 0001.png through 0500.png approximately
    return pokemonNum >= 1 && pokemonNum <= 500;
}

// Select best 4 moves for a Pokemon
function selectBestMoves(allMoves: any[], pokemonTypes: string[]): any[] {
    // Get all damaging moves sorted by power (note: processed moves use 'power', not 'basePower')
    const damagingMoves = allMoves.filter(m => m.power > 0).sort((a, b) => b.power - a.power);
    
    // Early return if we have very few moves - just take what we can get
    if (damagingMoves.length <= 4) {
        return damagingMoves.slice(0, 4);
    }
    
    const selected = [];
    const selectedNames = new Set();
    
    // 1. Try to get a STAB move (same type as Pokemon) - relaxed power requirement
    for (const move of damagingMoves) {
        if (selectedNames.has(move.name)) continue;
        if (pokemonTypes.includes(move.type.toLowerCase())) {
            selected.push(move);
            selectedNames.add(move.name);
            break;
        }
    }

    // 2. Get coverage move (different type) - no strict power requirement
    for (const move of damagingMoves) {
        if (selected.length >= 4) break;
        if (selectedNames.has(move.name)) continue;
        if (!pokemonTypes.includes(move.type.toLowerCase())) {
            selected.push(move);
            selectedNames.add(move.name);
            break;
        }
    }

    // 3. Try to get a priority move (if any exist)
    const priorityMoves = allMoves.filter(m => m.priority > 0 && m.power > 0);
    if (priorityMoves.length > 0) {
        const bestPriority = priorityMoves.sort((a, b) => b.power - a.power)[0];
        if (!selectedNames.has(bestPriority.name)) {
            selected.push(bestPriority);
            selectedNames.add(bestPriority.name);
        }
    }
    
    // 4. Fill remaining slots with highest power moves we haven't picked yet
    for (const move of damagingMoves) {
        if (selected.length >= 4) break;
        if (!selectedNames.has(move.name)) {
            selected.push(move);
            selectedNames.add(move.name);
        }
    }
    
    return selected.slice(0, 4);
}

async function main() {
    try {
        const [pokedex, moves, learnsets] = await Promise.all([
            fetchJson(POKEDEX_URL),
            fetchJson(MOVES_URL),
            fetchJson(LEARNSETS_URL)
        ]);

        const processedPokemon: any[] = [];
        const allMovesMap = new Map();
        const allAbilitiesSet = new Set();

        // Diverse Pokemon selection - handpicked for variety across types and generations
        const DIVERSE_POKEMON_IDS = [
            // Gen 1 Starters & Evolutions (9)
            1, 2, 3,   // Bulbasaur line (Grass/Poison)
            4, 5, 6,   // Charmander line (Fire/Flying)
            7, 8, 9,   // Squirtle line (Water)
            // Gen 1 Classics (10)
            25,        // Pikachu (Electric)
            26,        // Raichu (Electric)
            38,        // Ninetales (Fire)
            65,        // Alakazam (Psychic)
            68,        // Machamp (Fighting)
            94,        // Gengar (Ghost/Poison)
            130,       // Gyarados (Water/Flying)
            131,       // Lapras (Water/Ice)
            143,       // Snorlax (Normal)
            149,       // Dragonite (Dragon/Flying)
            // Gen 1 Legendary Birds (3)
            144,       // Articuno (Ice/Flying)
            145,       // Zapdos (Electric/Flying)
            146,       // Moltres (Fire/Flying)
            // Gen 2 Starters & Evolutions (9)
            152, 153, 154, // Chikorita line (Grass)
            155, 156, 157, // Cyndaquil line (Fire)
            158, 159, 160, // Totodile line (Water)
            // Gen 2 Classics (6)
            196,       // Espeon (Psychic)
            197,       // Umbreon (Dark)
            212,       // Scizor (Bug/Steel)
            227,       // Skarmory (Steel/Flying)
            248,       // Tyranitar (Rock/Dark)
            249,       // Lugia (Psychic/Flying - Legendary)
            // Gen 3 Starters & Evolutions (9)
            252, 253, 254, // Treecko line (Grass)
            255, 256, 257, // Torchic line (Fire/Fighting)
            258, 259, 260, // Mudkip line (Water/Ground)
            // Gen 3 Classics (6)
            282,       // Gardevoir (Psychic/Fairy)
            295,       // Exploud (Normal)
            306,       // Aggron (Steel/Rock)
            330,       // Flygon (Ground/Dragon)
            373,       // Salamence (Dragon/Flying)
            376,       // Metagross (Steel/Psychic)
            // Gen 3 Legendaries (3)
            382,       // Kyogre (Water - Legendary)
            383,       // Groudon (Ground - Legendary)
            384,       // Rayquaza (Dragon/Flying - Legendary)
            // Gen 4 Starters & Evolutions (9)
            387, 388, 389, // Turtwig line (Grass/Ground)
            390, 391, 392, // Chimchar line (Fire/Fighting)
            393, 394, 395, // Piplup line (Water/Steel)
            // Gen 4 Classics (3)
            405,       // Luxray (Electric)
            445,       // Garchomp (Dragon/Ground)
            448,       // Lucario (Fighting/Steel)
        ];

        const eligiblePokemon = [];
        for (const [key, mon] of Object.entries(pokedex)) {
            const p = mon as any;
            // Skip if no number or outside image range
            if (!p.num || p.num < 1 || p.num > 493) continue; // Gen 4 ends at 493
            // Skip alternate forms
            if (p.forme) continue;
            // Only include our diverse selection
            if (!DIVERSE_POKEMON_IDS.includes(p.num)) continue;
            
            eligiblePokemon.push({ key, data: p });
        }

        // Sort by number for consistent ordering
        eligiblePokemon.sort((a, b) => a.data.num - b.data.num);
        const selectedPokemon = eligiblePokemon;

        console.error(`Processing ${selectedPokemon.length} Pokemon...`);

        for (const { key, data: p } of selectedPokemon) {
            // Get Learnset
            const learnsetData = (learnsets as any)[key]?.learnset;
            if (!learnsetData) {
                console.error(`No learnset for ${p.name}, skipping...`);
                continue;
            }

            const pokemonMoves = [];
            const rawMoves = [];

            // Process all learnable moves
            for (const moveId of Object.keys(learnsetData)) {
                const moveData = (moves as any)[moveId];
                if (!moveData) continue;
                if (moveData.category === 'Status') continue; // Skip status moves

                // Accuracy: Showdown uses true (100%) or number
                let acc = moveData.accuracy;
                if (acc === true) acc = 100;
                
                const processedMove = {
                    name: moveData.name,
                    power: moveData.basePower,
                    accuracy: acc / 100,
                    type: moveData.type.toLowerCase(),
                    category: moveData.category.toLowerCase(),
                    priority: moveData.priority || 0,
                    cooldown: calculateCooldown(moveData)
                };
                
                rawMoves.push(processedMove);
                allMovesMap.set(moveData.name, processedMove);
            }

            // Select best 4 moves
            const selectedMoves = selectBestMoves(rawMoves, p.types.map((t: string) => t.toLowerCase()));
            
            if (selectedMoves.length === 0) {
                console.error(`WARNING: ${p.name} has no moves selected! Available damaging moves: ${rawMoves.length}`);
            }

            // Get ability
            const abilityName = p.abilities['0'] || 'No Ability';
            allAbilitiesSet.add(abilityName);

            // Construct Pokemon Object
            const pokemon = {
                id: uuidv4(),
                speciesName: p.name,
                types: p.types.map((t: string) => t.toLowerCase()),
                stats: {
                    hp: p.baseStats.hp,
                    maxHp: p.baseStats.hp,
                    attack: p.baseStats.atk,
                    defense: p.baseStats.def,
                    spAttack: p.baseStats.spa,
                    spDefense: p.baseStats.spd,
                    speed: p.baseStats.spe
                },
                moves: selectedMoves,
                ability: {
                    name: abilityName,
                    effect: "unknown",
                    value: 0
                }
            };

            processedPokemon.push(pokemon);
        }

        console.error(`\n=== POKEMON SPECIES LIBRARY ===\n`);
        console.log(`const POKEMON_SPECIES_LIBRARY = [`);
        for (const p of processedPokemon) {
            const movesStr = p.moves.map((m: any) => `'${m.name}'`).join(', ');
            console.log(`    { name: '${p.speciesName}', types: [${p.types.map((t: string) => `'${t}'`).join(', ')}], ability: '${p.ability.name}', moves: [${movesStr}], baseStats: { hp: ${p.stats.hp}, attack: ${p.stats.attack}, defense: ${p.stats.defense}, spAttack: ${p.stats.spAttack}, spDefense: ${p.stats.spDefense}, speed: ${p.stats.speed} } },`);
        }
        console.log(`];`);

        console.error(`\n=== MOVES LIBRARY ===\n`);
        console.log(`const MOVES_LIBRARY: BattleMove[] = [`);
        for (const [name, move] of allMovesMap) {
            console.log(`    { name: '${move.name}', power: ${move.power}, accuracy: ${move.accuracy}, type: '${move.type}', category: '${move.category}', priority: ${move.priority}, cooldown: ${move.cooldown} },`);
        }
        console.log(`];`);

        console.error(`\n=== ABILITIES LIBRARY ===\n`);
        console.log(`const ABILITIES_LIBRARY: BattleAbility[] = [`);
        for (const ability of allAbilitiesSet) {
            console.log(`    { name: '${ability}', effect: 'unknown', value: 0 },`);
        }
        console.log(`];`);

        console.error(`\nProcessed ${processedPokemon.length} Pokemon with ${allMovesMap.size} unique moves and ${allAbilitiesSet.size} abilities.`);

    } catch (error) {
        console.error("Error scraping data:", error);
        process.exit(1);
    }
}

main();
