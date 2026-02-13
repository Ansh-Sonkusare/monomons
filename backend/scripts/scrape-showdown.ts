
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
    if (move.basePower >= 120) return 2; // Hyper Beam style
    if (move.basePower >= 90) return 1;  // Strong moves
    return 0;
}

async function main() {
    try {
        const [pokedex, moves, learnsets] = await Promise.all([
            fetchJson(POKEDEX_URL),
            fetchJson(MOVES_URL),
            fetchJson(LEARNSETS_URL)
        ]);

        const processedPokemon = [];

        // Filter for Gen 1 (1-151)
        for (const [key, mon] of Object.entries(pokedex)) {
            const p = mon as any;
            if (p.num < 1 || p.num > 151) continue;
            // Skip alternate forms if they have the same number (check 'forme' property or key name)
            // Usually base forms are just the name in lowercase.
            // "bulbasaur" -> num 1. "venusaurmega" -> num 3.
            // We want base forms.
            if (p.forme) continue; 

            // Get Learnset
            const learnsetData = (learnsets as any)[key]?.learnset;
            if (!learnsetData) {
                console.error(`No learnset for ${p.name}`);
                continue;
            }

            const pokemonMoves = [];

            // Process moves
            for (const moveId of Object.keys(learnsetData)) {
                const moveData = (moves as any)[moveId];
                if (!moveData) continue;

                // Skip Status moves for now if they don't do damage? 
                // The BattleService logic supports damage and some status effects but mainly attacks.
                // However, user said "extract data and moves". I'll include all valid moves.
                // The interface requires: name, power, accuracy, type, category, priority, cooldown.
                
                // Map Category
                // Showdown: 'Physical', 'Special', 'Status'
                // Our Interface: 'physical' | 'special'. 
                // If Status, maybe skip for now as our battle logic might not handle them well yet?
                // Or map to 'special' with 0 power? 
                // Let's skip 'Status' category moves to keep the prototype working with current logic
                // which expects attacks.
                if (moveData.category === 'Status') continue;

                // Accuracy: Showdown uses true (100%) or number.
                let acc = moveData.accuracy;
                if (acc === true) acc = 100;
                
                pokemonMoves.push({
                    name: moveData.name,
                    power: moveData.basePower,
                    accuracy: acc / 100, // Convert 100 to 1.0
                    type: moveData.type.toLowerCase(),
                    category: moveData.category.toLowerCase(),
                    priority: moveData.priority || 0,
                    cooldown: calculateCooldown(moveData)
                });
            }

            // Construct Pokemon Object
            const pokemon = {
                id: uuidv4(),
                speciesName: p.name,
                types: p.types.map((t: string) => t.toLowerCase()),
                stats: {
                    hp: p.baseStats.hp,
                    maxHp: p.baseStats.hp, // Base stats, scaling handled by game logic usually
                    attack: p.baseStats.atk,
                    defense: p.baseStats.def,
                    spAttack: p.baseStats.spa,
                    spDefense: p.baseStats.spd,
                    speed: p.baseStats.spe
                },
                moves: pokemonMoves,
                // Ability: Just pick the first one for now
                ability: {
                    name: p.abilities['0'], 
                    effect: "unknown", // Placeholder, would need manual mapping or another dictionary
                    value: 0
                }
            };

            processedPokemon.push(pokemon);
        }

        console.log(JSON.stringify(processedPokemon, null, 2));

    } catch (error) {
        console.error("Error scraping data:", error);
        process.exit(1);
    }
}

main();
