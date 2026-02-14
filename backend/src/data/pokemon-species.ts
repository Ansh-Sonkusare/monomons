// Pokemon Species Data
// 50 Pokemon from Generations 1-3

export interface PokemonSpecies {
    id: number;
    name: string;
    types: string[];
    ability: string;
    moves: string[];
    baseStats: {
        hp: number;
        attack: number;
        defense: number;
        spAttack: number;
        spDefense: number;
        speed: number;
    };
}

export const POKEMON_SPECIES_LIBRARY: PokemonSpecies[] = [
    // GEN 1 - KANTO
    // Starters
    { id: 3, name: 'Venusaur', types: ['grass', 'poison'], ability: 'Overgrow', moves: ['Energy Ball', 'Sludge Bomb', 'Earth Power', 'Solar Beam'], baseStats: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 } },
    { id: 6, name: 'Charizard', types: ['fire', 'flying'], ability: 'Blaze', moves: ['Flamethrower', 'Air Slash', 'Dragon Claw', 'Fire Blast'], baseStats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 } },
    { id: 9, name: 'Blastoise', types: ['water'], ability: 'Torrent', moves: ['Surf', 'Ice Beam', 'Flash Cannon', 'Hydro Pump'], baseStats: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 } },
    // Electric
    { id: 25, name: 'Pikachu', types: ['electric'], ability: 'Static', moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Volt Tackle'], baseStats: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 } },
    { id: 26, name: 'Raichu', types: ['electric'], ability: 'Static', moves: ['Thunderbolt', 'Quick Attack', 'Iron Tail', 'Volt Tackle'], baseStats: { hp: 60, attack: 90, defense: 55, spAttack: 90, spDefense: 80, speed: 110 } },
    // Nidos
    { id: 31, name: 'Nidoqueen', types: ['poison', 'ground'], ability: 'Poison Point', moves: ['Earthquake', 'Sludge Bomb', 'Ice Beam', 'Body Slam'], baseStats: { hp: 90, attack: 92, defense: 87, spAttack: 75, spDefense: 85, speed: 76 } },
    { id: 34, name: 'Nidoking', types: ['poison', 'ground'], ability: 'Poison Point', moves: ['Earthquake', 'Sludge Bomb', 'Ice Beam', 'Thunderbolt'], baseStats: { hp: 81, attack: 102, defense: 77, spAttack: 85, spDefense: 75, speed: 85 } },
    // Fairy types
    { id: 36, name: 'Clefable', types: ['fairy'], ability: 'Magic Guard', moves: ['Moonblast', 'Psychic', 'Flamethrower', 'Ice Beam'], baseStats: { hp: 95, attack: 70, defense: 73, spAttack: 95, spDefense: 90, speed: 60 } },
    { id: 40, name: 'Wigglytuff', types: ['normal', 'fairy'], ability: 'Cute Charm', moves: ['Hyper Voice', 'Play Rough', 'Body Slam', 'Ice Beam'], baseStats: { hp: 140, attack: 70, defense: 45, spAttack: 85, spDefense: 50, speed: 45 } },
    // Ghost
    { id: 94, name: 'Gengar', types: ['ghost', 'poison'], ability: 'Levitate', moves: ['Shadow Ball', 'Sludge Bomb', 'Psychic', 'Thunderbolt'], baseStats: { hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 } },
    // Dragon
    { id: 149, name: 'Dragonite', types: ['dragon', 'flying'], ability: 'Inner Focus', moves: ['Dragon Claw', 'Earthquake', 'Hurricane', 'Outrage'], baseStats: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 } },
    // Tank
    { id: 143, name: 'Snorlax', types: ['normal'], ability: 'Thick Fat', moves: ['Body Slam', 'Crunch', 'Earthquake', 'Double-Edge'], baseStats: { hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 } },
    // Water
    { id: 131, name: 'Lapras', types: ['water', 'ice'], ability: 'Water Absorb', moves: ['Surf', 'Ice Beam', 'Thunderbolt', 'Body Slam'], baseStats: { hp: 130, attack: 85, defense: 80, spAttack: 85, spDefense: 95, speed: 60 } },
    // Bugs
    { id: 12, name: 'Butterfree', types: ['bug', 'flying'], ability: 'Compound Eyes', moves: ['Bug Buzz', 'Air Slash', 'Psychic', 'Energy Ball'], baseStats: { hp: 60, attack: 45, defense: 50, spAttack: 90, spDefense: 80, speed: 70 } },
    { id: 15, name: 'Beedrill', types: ['bug', 'poison'], ability: 'Swarm', moves: ['X-Scissor', 'Poison Jab', 'Drill Run', 'U-turn'], baseStats: { hp: 65, attack: 90, defense: 40, spAttack: 45, spDefense: 80, speed: 75 } },
    // Fighting
    { id: 68, name: 'Machamp', types: ['fighting'], ability: 'Guts', moves: ['Close Combat', 'Earthquake', 'Stone Edge', 'Dynamic Punch'], baseStats: { hp: 90, attack: 130, defense: 80, spAttack: 65, spDefense: 85, speed: 55 } },
    // Psychic
    { id: 65, name: 'Alakazam', types: ['psychic'], ability: 'Synchronize', moves: ['Psychic', 'Shadow Ball', 'Focus Blast', 'Energy Ball'], baseStats: { hp: 55, attack: 50, defense: 45, spAttack: 135, spDefense: 95, speed: 120 } },
    // Additional Gen 1
    { id: 59, name: 'Arcanine', types: ['fire'], ability: 'Flash Fire', moves: ['Flare Blitz', 'Crunch', 'Close Combat', 'Wild Charge'], baseStats: { hp: 90, attack: 110, defense: 80, spAttack: 100, spDefense: 80, speed: 95 } },
    { id: 130, name: 'Gyarados', types: ['water', 'flying'], ability: 'Intimidate', moves: ['Waterfall', 'Bounce', 'Earthquake', 'Ice Fang'], baseStats: { hp: 95, attack: 125, defense: 79, spAttack: 60, spDefense: 100, speed: 81 } },
    { id: 45, name: 'Vileplume', types: ['grass', 'poison'], ability: 'Chlorophyll', moves: ['Energy Ball', 'Sludge Bomb', 'Moonblast', 'Body Slam'], baseStats: { hp: 75, attack: 80, defense: 85, spAttack: 110, spDefense: 90, speed: 50 } },
    { id: 76, name: 'Golem', types: ['rock', 'ground'], ability: 'Sturdy', moves: ['Earthquake', 'Stone Edge', 'Fire Punch', 'Explosion'], baseStats: { hp: 80, attack: 120, defense: 130, spAttack: 55, spDefense: 65, speed: 45 } },
    { id: 38, name: 'Ninetales', types: ['fire'], ability: 'Flash Fire', moves: ['Flamethrower', 'Solar Beam', 'Dark Pulse', 'Extrasensory'], baseStats: { hp: 73, attack: 76, defense: 75, spAttack: 81, spDefense: 100, speed: 100 } },

    // GEN 2 - JOHTO
    // Starters
    { id: 154, name: 'Meganium', types: ['grass'], ability: 'Overgrow', moves: ['Energy Ball', 'Earth Power', 'Body Slam', 'Petal Dance'], baseStats: { hp: 80, attack: 82, defense: 100, spAttack: 83, spDefense: 100, speed: 80 } },
    { id: 157, name: 'Typhlosion', types: ['fire'], ability: 'Blaze', moves: ['Flamethrower', 'Eruption', 'Earthquake', 'Thunder Punch'], baseStats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 } },
    { id: 160, name: 'Feraligatr', types: ['water'], ability: 'Torrent', moves: ['Waterfall', 'Ice Punch', 'Crunch', 'Aqua Tail'], baseStats: { hp: 85, attack: 105, defense: 100, spAttack: 79, spDefense: 83, speed: 78 } },
    // Electric
    { id: 181, name: 'Ampharos', types: ['electric'], ability: 'Static', moves: ['Thunderbolt', 'Dragon Pulse', 'Focus Blast', 'Power Gem'], baseStats: { hp: 90, attack: 75, defense: 85, spAttack: 115, spDefense: 90, speed: 55 } },
    // Bug/Fighting
    { id: 214, name: 'Heracross', types: ['bug', 'fighting'], ability: 'Guts', moves: ['Megahorn', 'Close Combat', 'Stone Edge', 'Night Slash'], baseStats: { hp: 80, attack: 125, defense: 75, spAttack: 40, spDefense: 95, speed: 85 } },
    // Dark/Rock
    { id: 248, name: 'Tyranitar', types: ['rock', 'dark'], ability: 'Sand Stream', moves: ['Stone Edge', 'Crunch', 'Earthquake', 'Ice Beam'], baseStats: { hp: 100, attack: 134, defense: 110, spAttack: 95, spDefense: 100, speed: 61 } },
    // Legendary
    { id: 249, name: 'Lugia', types: ['psychic', 'flying'], ability: 'Pressure', moves: ['Psychic', 'Aeroblast', 'Ice Beam', 'Thunder'], baseStats: { hp: 106, attack: 90, defense: 130, spAttack: 90, spDefense: 154, speed: 110 } },
    { id: 250, name: 'Ho-Oh', types: ['fire', 'flying'], ability: 'Pressure', moves: ['Sacred Fire', 'Brave Bird', 'Earthquake', 'Thunder'], baseStats: { hp: 106, attack: 130, defense: 90, spAttack: 110, spDefense: 154, speed: 90 } },
    // Steel
    { id: 208, name: 'Steelix', types: ['steel', 'ground'], ability: 'Sturdy', moves: ['Iron Head', 'Earthquake', 'Stone Edge', 'Crunch'], baseStats: { hp: 75, attack: 85, defense: 200, spAttack: 55, spDefense: 65, speed: 30 } },
    // Normal
    { id: 217, name: 'Ursaring', types: ['normal'], ability: 'Guts', moves: ['Return', 'Close Combat', 'Crunch', 'Play Rough'], baseStats: { hp: 90, attack: 130, defense: 75, spAttack: 75, spDefense: 75, speed: 55 } },

    // GEN 3 - HOENN
    // Starters
    { id: 254, name: 'Sceptile', types: ['grass'], ability: 'Overgrow', moves: ['Leaf Blade', 'Dragon Claw', 'Earthquake', 'Thunder Punch'], baseStats: { hp: 70, attack: 85, defense: 65, spAttack: 105, spDefense: 85, speed: 120 } },
    { id: 257, name: 'Blaziken', types: ['fire', 'fighting'], ability: 'Blaze', moves: ['Flare Blitz', 'Close Combat', 'Stone Edge', 'Thunder Punch'], baseStats: { hp: 80, attack: 120, defense: 70, spAttack: 110, spDefense: 70, speed: 80 } },
    { id: 260, name: 'Swampert', types: ['water', 'ground'], ability: 'Torrent', moves: ['Waterfall', 'Earthquake', 'Ice Punch', 'Stone Edge'], baseStats: { hp: 100, attack: 110, defense: 90, spAttack: 85, spDefense: 90, speed: 60 } },
    // Psychic/Fairy
    { id: 282, name: 'Gardevoir', types: ['psychic', 'fairy'], ability: 'Synchronize', moves: ['Psychic', 'Moonblast', 'Shadow Ball', 'Focus Blast'], baseStats: { hp: 68, attack: 65, defense: 65, spAttack: 125, spDefense: 115, speed: 80 } },
    // Dragon
    { id: 330, name: 'Flygon', types: ['ground', 'dragon'], ability: 'Levitate', moves: ['Earthquake', 'Dragon Claw', 'Stone Edge', 'Bug Buzz'], baseStats: { hp: 80, attack: 100, defense: 80, spAttack: 80, spDefense: 80, speed: 100 } },
    { id: 373, name: 'Salamence', types: ['dragon', 'flying'], ability: 'Intimidate', moves: ['Dragon Claw', 'Fly', 'Earthquake', 'Fire Blast'], baseStats: { hp: 95, attack: 135, defense: 80, spAttack: 110, spDefense: 80, speed: 100 } },
    // Steel/Psychic
    { id: 376, name: 'Metagross', types: ['steel', 'psychic'], ability: 'Clear Body', moves: ['Meteor Mash', 'Zen Headbutt', 'Earthquake', 'Bullet Punch'], baseStats: { hp: 80, attack: 135, defense: 130, spAttack: 95, spDefense: 90, speed: 70 } },
    // Legendary
    { id: 382, name: 'Kyogre', types: ['water'], ability: 'Drizzle', moves: ['Surf', 'Ice Beam', 'Thunder', 'Hydro Pump'], baseStats: { hp: 100, attack: 100, defense: 90, spAttack: 150, spDefense: 140, speed: 90 } },
    { id: 383, name: 'Groudon', types: ['ground'], ability: 'Drought', moves: ['Earthquake', 'Fire Blast', 'Solar Beam', 'Stone Edge'], baseStats: { hp: 100, attack: 150, defense: 140, spAttack: 100, spDefense: 90, speed: 90 } },
    { id: 384, name: 'Rayquaza', types: ['dragon', 'flying'], ability: 'Air Lock', moves: ['Dragon Claw', 'Dragon Ascent', 'Earthquake', 'Fire Blast'], baseStats: { hp: 105, attack: 150, defense: 90, spAttack: 150, spDefense: 90, speed: 95 } },
    // Dark
    { id: 359, name: 'Absol', types: ['dark'], ability: 'Super Luck', moves: ['Night Slash', 'Psycho Cut', 'Stone Edge', 'Megahorn'], baseStats: { hp: 65, attack: 130, defense: 60, spAttack: 75, spDefense: 60, speed: 75 } },
    // Ice
    { id: 365, name: 'Walrein', types: ['ice', 'water'], ability: 'Thick Fat', moves: ['Blizzard', 'Surf', 'Ice Beam', 'Body Slam'], baseStats: { hp: 110, attack: 80, defense: 90, spAttack: 95, spDefense: 90, speed: 65 } },
    // Fighting
    { id: 297, name: 'Hariyama', types: ['fighting'], ability: 'Guts', moves: ['Close Combat', 'Earthquake', 'Stone Edge', 'Bullet Punch'], baseStats: { hp: 144, attack: 120, defense: 60, spAttack: 40, spDefense: 60, speed: 50 } }
];

// Type effectiveness chart
// multiplier values: 0 = immune, 0.5 = not very effective, 1 = normal, 2 = super effective
export const TYPE_CHART: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

// Helper function to get type effectiveness multiplier
export function getTypeMultiplier(attackerType: string, defenderTypes: string[]): number {
    let multiplier = 1;
    for (const defType of defenderTypes) {
        if (TYPE_CHART[attackerType] && TYPE_CHART[attackerType][defType] !== undefined) {
            multiplier *= TYPE_CHART[attackerType][defType];
        }
    }
    return multiplier;
}
