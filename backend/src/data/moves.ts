// Pokemon Moves Data
// All damaging moves with cooldowns based on power

export interface BattleMove {
    name: string;
    power: number;
    accuracy: number;
    type: string;
    category: 'physical' | 'special';
    priority?: number;
    cooldown: number;
}

export const MOVES_LIBRARY: BattleMove[] = [
    // Fire
    { name: 'Flamethrower', power: 90, accuracy: 0.95, type: 'fire', category: 'special', cooldown: 1 },
    { name: 'Fire Blast', power: 110, accuracy: 0.8, type: 'fire', category: 'special', cooldown: 3 },
    { name: 'Flame Wheel', power: 70, accuracy: 1.0, type: 'fire', category: 'physical', cooldown: 0 },
    { name: 'Heat Wave', power: 95, accuracy: 0.9, type: 'fire', category: 'special', cooldown: 2 },
    { name: 'Flare Blitz', power: 120, accuracy: 0.9, type: 'fire', category: 'physical', cooldown: 3 },
    { name: 'Eruption', power: 150, accuracy: 1.0, type: 'fire', category: 'special', cooldown: 4 },
    { name: 'Sacred Fire', power: 100, accuracy: 0.95, type: 'fire', category: 'physical', cooldown: 2 },
    // Water
    { name: 'Surf', power: 90, accuracy: 0.95, type: 'water', category: 'special', cooldown: 1 },
    { name: 'Hydro Pump', power: 110, accuracy: 0.8, type: 'water', category: 'special', cooldown: 3 },
    { name: 'Aqua Tail', power: 85, accuracy: 0.9, type: 'water', category: 'physical', cooldown: 1 },
    { name: 'Waterfall', power: 80, accuracy: 1.0, type: 'water', category: 'physical', cooldown: 0 },
    { name: 'Hydro Cannon', power: 150, accuracy: 0.9, type: 'water', category: 'special', cooldown: 4 },
    // Grass
    { name: 'Razor Leaf', power: 75, accuracy: 0.95, type: 'grass', category: 'physical', cooldown: 0 },
    { name: 'Solar Beam', power: 110, accuracy: 0.85, type: 'grass', category: 'special', cooldown: 3 },
    { name: 'Energy Ball', power: 90, accuracy: 0.95, type: 'grass', category: 'special', cooldown: 1 },
    { name: 'Petal Dance', power: 120, accuracy: 1.0, type: 'grass', category: 'special', cooldown: 3 },
    { name: 'Wood Hammer', power: 120, accuracy: 0.9, type: 'grass', category: 'physical', cooldown: 3 },
    { name: 'Leaf Blade', power: 90, accuracy: 1.0, type: 'grass', category: 'physical', cooldown: 1 },
    // Electric
    { name: 'Thunderbolt', power: 90, accuracy: 0.95, type: 'electric', category: 'special', cooldown: 1 },
    { name: 'Thunder', power: 110, accuracy: 0.8, type: 'electric', category: 'special', cooldown: 3 },
    { name: 'Spark', power: 70, accuracy: 1.0, type: 'electric', category: 'physical', cooldown: 0 },
    { name: 'Thunder Punch', power: 75, accuracy: 1.0, type: 'electric', category: 'physical', cooldown: 0 },
    { name: 'Volt Tackle', power: 120, accuracy: 1.0, type: 'electric', category: 'physical', cooldown: 3 },
    // Psychic
    { name: 'Psychic', power: 90, accuracy: 0.95, type: 'psychic', category: 'special', cooldown: 1 },
    { name: 'Psybeam', power: 65, accuracy: 1.0, type: 'psychic', category: 'special', cooldown: 0 },
    { name: 'Future Sight', power: 120, accuracy: 1.0, type: 'psychic', category: 'special', cooldown: 3 },
    { name: 'Zen Headbutt', power: 80, accuracy: 0.9, type: 'psychic', category: 'physical', cooldown: 1 },
    { name: 'Psycho Cut', power: 70, accuracy: 1.0, type: 'psychic', category: 'physical', cooldown: 0 },
    // Ghost
    { name: 'Shadow Ball', power: 85, accuracy: 0.95, type: 'ghost', category: 'special', cooldown: 1 },
    { name: 'Shadow Punch', power: 60, accuracy: 1.0, type: 'ghost', category: 'physical', cooldown: 0 },
    { name: 'Shadow Claw', power: 70, accuracy: 1.0, type: 'ghost', category: 'physical', cooldown: 0 },
    { name: 'Lick', power: 30, accuracy: 1.0, type: 'ghost', category: 'physical', cooldown: 0 },
    // Ground
    { name: 'Earthquake', power: 100, accuracy: 0.9, type: 'ground', category: 'physical', cooldown: 2 },
    { name: 'Earth Power', power: 90, accuracy: 0.95, type: 'ground', category: 'special', cooldown: 1 },
    { name: 'Mud Shot', power: 55, accuracy: 0.95, type: 'ground', category: 'special', cooldown: 0 },
    { name: 'Drill Run', power: 80, accuracy: 0.9, type: 'ground', category: 'physical', cooldown: 1 },
    // Rock
    { name: 'Rock Slide', power: 85, accuracy: 0.9, type: 'rock', category: 'physical', cooldown: 1 },
    { name: 'Stone Edge', power: 100, accuracy: 0.8, type: 'rock', category: 'physical', cooldown: 2 },
    { name: 'Ancient Power', power: 60, accuracy: 1.0, type: 'rock', category: 'special', cooldown: 0 },
    { name: 'Power Gem', power: 80, accuracy: 1.0, type: 'rock', category: 'special', cooldown: 1 },
    { name: 'Rock Blast', power: 25, accuracy: 0.9, type: 'rock', category: 'physical', cooldown: 0 },
    // Fighting
    { name: 'Close Combat', power: 100, accuracy: 0.9, type: 'fighting', category: 'physical', cooldown: 2 },
    { name: 'Dynamic Punch', power: 100, accuracy: 0.5, type: 'fighting', category: 'physical', cooldown: 2 },
    { name: 'Focus Blast', power: 120, accuracy: 0.7, type: 'fighting', category: 'special', cooldown: 3 },
    { name: 'Cross Chop', power: 100, accuracy: 0.8, type: 'fighting', category: 'physical', cooldown: 2 },
    { name: 'Brick Break', power: 75, accuracy: 1.0, type: 'fighting', category: 'physical', cooldown: 0 },
    { name: 'Superpower', power: 120, accuracy: 1.0, type: 'fighting', category: 'physical', cooldown: 3 },
    // Ice
    { name: 'Ice Beam', power: 90, accuracy: 0.95, type: 'ice', category: 'special', cooldown: 1 },
    { name: 'Blizzard', power: 110, accuracy: 0.7, type: 'ice', category: 'special', cooldown: 3 },
    { name: 'Ice Punch', power: 75, accuracy: 1.0, type: 'ice', category: 'physical', cooldown: 0 },
    { name: 'Ice Fang', power: 65, accuracy: 0.95, type: 'ice', category: 'physical', cooldown: 0 },
    { name: 'Icicle Crash', power: 85, accuracy: 0.9, type: 'ice', category: 'physical', cooldown: 1 },
    { name: 'Ice Shard', power: 40, accuracy: 1.0, type: 'ice', category: 'physical', priority: 1, cooldown: 0 },
    // Dragon
    { name: 'Dragon Claw', power: 85, accuracy: 0.95, type: 'dragon', category: 'physical', cooldown: 1 },
    { name: 'Dragon Pulse', power: 90, accuracy: 1.0, type: 'dragon', category: 'special', cooldown: 1 },
    { name: 'Outrage', power: 120, accuracy: 1.0, type: 'dragon', category: 'physical', cooldown: 3 },
    { name: 'Draco Meteor', power: 130, accuracy: 0.9, type: 'dragon', category: 'special', cooldown: 3 },
    // Dark
    { name: 'Crunch', power: 80, accuracy: 0.95, type: 'dark', category: 'physical', cooldown: 0 },
    { name: 'Dark Pulse', power: 85, accuracy: 1.0, type: 'dark', category: 'special', cooldown: 1 },
    { name: 'Bite', power: 60, accuracy: 1.0, type: 'dark', category: 'physical', cooldown: 0 },
    { name: 'Night Slash', power: 70, accuracy: 1.0, type: 'dark', category: 'physical', cooldown: 0 },
    { name: 'Sucker Punch', power: 70, accuracy: 1.0, type: 'dark', category: 'physical', priority: 1, cooldown: 0 },
    // Normal
    { name: 'Slash', power: 70, accuracy: 1.0, type: 'normal', category: 'physical', cooldown: 0 },
    { name: 'Quick Attack', power: 40, accuracy: 1.0, type: 'normal', category: 'physical', priority: 1, cooldown: 0 },
    { name: 'Tackle', power: 50, accuracy: 1.0, type: 'normal', category: 'physical', cooldown: 0 },
    { name: 'Hyper Beam', power: 120, accuracy: 0.75, type: 'normal', category: 'special', cooldown: 4 },
    { name: 'Body Slam', power: 85, accuracy: 1.0, type: 'normal', category: 'physical', cooldown: 1 },
    { name: 'Double-Edge', power: 120, accuracy: 1.0, type: 'normal', category: 'physical', cooldown: 3 },
    { name: 'Return', power: 80, accuracy: 1.0, type: 'normal', category: 'physical', cooldown: 0 },
    { name: 'Take Down', power: 90, accuracy: 0.85, type: 'normal', category: 'physical', cooldown: 1 },
    { name: 'Hyper Voice', power: 90, accuracy: 1.0, type: 'normal', category: 'special', cooldown: 1 },
    { name: 'Explosion', power: 250, accuracy: 1.0, type: 'normal', category: 'physical', cooldown: 5 },
    { name: 'Giga Impact', power: 150, accuracy: 0.9, type: 'normal', category: 'physical', cooldown: 4 },
    // Flying
    { name: 'Air Slash', power: 75, accuracy: 0.95, type: 'flying', category: 'special', cooldown: 1 },
    { name: 'Aerial Ace', power: 60, accuracy: 1.0, type: 'flying', category: 'physical', cooldown: 0 },
    { name: 'Hurricane', power: 110, accuracy: 0.7, type: 'flying', category: 'special', cooldown: 3 },
    { name: 'Wing Attack', power: 60, accuracy: 1.0, type: 'flying', category: 'physical', cooldown: 0 },
    { name: 'Brave Bird', power: 120, accuracy: 1.0, type: 'flying', category: 'physical', cooldown: 3 },
    { name: 'Fly', power: 90, accuracy: 0.95, type: 'flying', category: 'physical', cooldown: 1 },
    { name: 'Bounce', power: 85, accuracy: 0.85, type: 'flying', category: 'physical', cooldown: 1 },
    { name: 'Drill Peck', power: 80, accuracy: 1.0, type: 'flying', category: 'physical', cooldown: 1 },
    { name: 'Aeroblast', power: 100, accuracy: 0.95, type: 'flying', category: 'special', cooldown: 2 },
    { name: 'Dragon Ascent', power: 120, accuracy: 1.0, type: 'flying', category: 'physical', cooldown: 3 },
    // Steel
    { name: 'Bullet Punch', power: 40, accuracy: 1.0, type: 'steel', category: 'physical', priority: 1, cooldown: 0 },
    { name: 'Iron Head', power: 80, accuracy: 1.0, type: 'steel', category: 'physical', cooldown: 1 },
    { name: 'Flash Cannon', power: 90, accuracy: 1.0, type: 'steel', category: 'special', cooldown: 1 },
    { name: 'Steel Wing', power: 70, accuracy: 0.9, type: 'steel', category: 'physical', cooldown: 0 },
    { name: 'Meteor Mash', power: 90, accuracy: 0.9, type: 'steel', category: 'physical', cooldown: 1 },
    // Fairy
    { name: 'Moonblast', power: 90, accuracy: 0.95, type: 'fairy', category: 'special', cooldown: 1 },
    { name: 'Play Rough', power: 90, accuracy: 0.9, type: 'fairy', category: 'physical', cooldown: 1 },
    { name: 'Dazzling Gleam', power: 80, accuracy: 1.0, type: 'fairy', category: 'special', cooldown: 1 },
    // Bug
    { name: 'X-Scissor', power: 80, accuracy: 0.95, type: 'bug', category: 'physical', cooldown: 1 },
    { name: 'Bug Buzz', power: 90, accuracy: 1.0, type: 'bug', category: 'special', cooldown: 1 },
    { name: 'Megahorn', power: 120, accuracy: 0.85, type: 'bug', category: 'physical', cooldown: 3 },
    { name: 'U-turn', power: 70, accuracy: 1.0, type: 'bug', category: 'physical', cooldown: 0 },
    { name: 'Bug Bite', power: 60, accuracy: 1.0, type: 'bug', category: 'physical', cooldown: 0 },
    { name: 'Silver Wind', power: 60, accuracy: 1.0, type: 'bug', category: 'special', cooldown: 0 },
    // Poison
    { name: 'Sludge Bomb', power: 90, accuracy: 1.0, type: 'poison', category: 'special', cooldown: 1 },
    { name: 'Poison Jab', power: 80, accuracy: 1.0, type: 'poison', category: 'physical', cooldown: 1 },
    { name: 'Gunk Shot', power: 120, accuracy: 0.8, type: 'poison', category: 'physical', cooldown: 3 },
    { name: 'Cross Poison', power: 70, accuracy: 1.0, type: 'poison', category: 'physical', cooldown: 0 },
    { name: 'Sludge', power: 65, accuracy: 1.0, type: 'poison', category: 'special', cooldown: 0 },
    // Additional utility moves
    { name: 'Volt Switch', power: 70, accuracy: 1.0, type: 'electric', category: 'special', cooldown: 0 },
    { name: 'Signal Beam', power: 75, accuracy: 1.0, type: 'bug', category: 'special', cooldown: 0 },
    { name: 'Extrasensory', power: 80, accuracy: 1.0, type: 'psychic', category: 'special', cooldown: 1 },
    { name: 'Seed Bomb', power: 80, accuracy: 1.0, type: 'grass', category: 'physical', cooldown: 1 }
];
