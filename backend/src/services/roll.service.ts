import { db } from '../db';
import { characters, cards, rolls, users, userTeams } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { BattlePokemon } from './battle.service';

const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1
};

const CHARACTER_FEES: Record<string, string> = {
  common: '100000000000000000',
  uncommon: '250000000000000000',
  rare: '500000000000000000',
  epic: '1000000000000000000',
  legendary: '5000000000000000000'
};

const CARD_FEES: Record<string, string> = {
  common: '50000000000000000',
  uncommon: '100000000000000000',
  rare: '250000000000000000',
  epic: '500000000000000000',
  legendary: '2000000000000000000'
};

const POKEMON_SPECIES = [
  'Charizard', 'Blastoise', 'Venusaur', 'Pikachu', 'Gengar',
  'Dragonite', 'Snorlax', 'Lucario', 'Tyranitar', 'Gardevoir'
];

const CARD_DEFINITIONS = [
  { type: 'buff', name: 'Power Boost', effect: { attack: 1.2 }, description: 'Increases attack by 20%' },
  { type: 'buff', name: 'Defense Up', effect: { defense: 1.2 }, description: 'Increases defense by 20%' },
  { type: 'spell', name: 'Fireball', effect: { damage: 30 }, description: 'Deals 30 damage' },
  { type: 'spell', name: 'Thunder', effect: { damage: 40 }, description: 'Deals 40 damage' },
  { type: 'spell', name: 'Heal', effect: { heal: 50 }, description: 'Restores 50 HP' },
  { type: 'ability', name: 'Double Strike', effect: { hits: 2 }, description: 'Attack twice' },
  { type: 'passive', name: 'Quick Feet', effect: { speed: 1.3 }, description: '30% speed boost' },
  { type: 'passive', name: 'Thick Skin', effect: { damageReduction: 0.9 }, description: '10% damage reduction' }
];

const BASE_STATS: Record<string, { hp: number; attack: number; defense: number; spAttack: number; spDefense: number; speed: number }> = {
  Charizard: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 },
  Blastoise: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 },
  Venusaur: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
  Pikachu: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
  Gengar: { hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 },
  Dragonite: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 },
  Snorlax: { hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 },
  Lucario: { hp: 70, attack: 110, defense: 70, spAttack: 115, spDefense: 70, speed: 90 },
  Tyranitar: { hp: 100, attack: 134, defense: 110, spAttack: 95, spDefense: 100, speed: 61 },
  Gardevoir: { hp: 68, attack: 65, defense: 65, spAttack: 125, spDefense: 115, speed: 80 }
};

export class RollService {
  static determineRarity(randomValue: number): string {
    const roll = randomValue % 100;
    if (roll < 50) return 'common';
    if (roll < 80) return 'uncommon';
    if (roll < 95) return 'rare';
    if (roll < 99) return 'epic';
    return 'legendary';
  }

  static getCharacterFee(rarity: string): string {
    return CHARACTER_FEES[rarity] || CHARACTER_FEES.common;
  }

  static getCardFee(rarity: string): string {
    return CARD_FEES[rarity] || CARD_FEES.common;
  }

  static async createRoll(
    userAddress: string,
    rollType: 'character' | 'card',
    vrfRequestId: string,
    txHash: string,
    cost: string
  ) {
    const [user] = await db.select().from(users).where(eq(users.address, userAddress.toLowerCase()));
    
    const [roll] = await db.insert(rolls).values({
      userId: user?.id,
      userAddress: userAddress.toLowerCase(),
      rollType,
      cost,
      status: 'pending',
      vrfRequestId,
      txHash
    }).returning();
    
    return roll;
  }

  static async fulfillRoll(
    vrfRequestId: string,
    rarity: string,
    tokenId: number,
    txHash: string
  ) {
    const [roll] = await db.select().from(rolls).where(eq(rolls.vrfRequestId, vrfRequestId));
    
    if (!roll) throw new Error('Roll not found');
    
    if (roll.rollType === 'character') {
      const species = POKEMON_SPECIES[Math.floor(Math.random() * POKEMON_SPECIES.length)];
      const baseStats = BASE_STATS[species];
      
      const statMultiplier = rarity === 'common' ? 1 : 
        rarity === 'uncommon' ? 1.1 : 
        rarity === 'rare' ? 1.2 : 
        rarity === 'epic' ? 1.3 : 1.5;
      
      const stats = {
        hp: Math.floor(baseStats.hp * statMultiplier),
        attack: Math.floor(baseStats.attack * statMultiplier),
        defense: Math.floor(baseStats.defense * statMultiplier),
        spAttack: Math.floor(baseStats.spAttack * statMultiplier),
        spDefense: Math.floor(baseStats.spDefense * statMultiplier),
        speed: Math.floor(baseStats.speed * statMultiplier)
      };
      
      await db.insert(characters).values({
        tokenId,
        ownerAddress: roll.userAddress,
        rarity,
        species,
        stats,
        moves: [],
        ability: species,
        txHash
      });
    } else {
      const cardDef = CARD_DEFINITIONS[Math.floor(Math.random() * CARD_DEFINITIONS.length)];
      
      await db.insert(cards).values({
        tokenId,
        ownerAddress: roll.userAddress,
        rarity,
        cardType: cardDef.type,
        effect: cardDef.effect,
        name: cardDef.name,
        description: cardDef.description,
        txHash
      });
    }
    
    await db.update(rolls).set({ 
      status: 'fulfilled', 
      rarity, 
      resultTokenId: tokenId 
    }).where(eq(rolls.id, roll.id));
    
    return { roll, rarity, tokenId };
  }

  static async getRollHistory(userAddress: string) {
    return db.select().from(rolls)
      .where(eq(rolls.userAddress, userAddress.toLowerCase()))
      .orderBy(desc(rolls.createdAt));
  }

  static async getInventory(userAddress: string) {
    const [userChars, userCards] = await Promise.all([
      db.select().from(characters).where(eq(characters.ownerAddress, userAddress.toLowerCase())),
      db.select().from(cards).where(eq(cards.ownerAddress, userAddress.toLowerCase()))
    ]);
    
    return {
      characters: userChars,
      cards: userCards
    };
  }

  static async getUserTeam(userAddress: string) {
    const [user] = await db.select().from(users).where(eq(users.address, userAddress.toLowerCase()));
    if (!user) return [];
    
    return db.select({
      id: userTeams.id,
      characterId: userTeams.characterId,
      slot: userTeams.slot,
      character: characters
    })
    .from(userTeams)
    .innerJoin(characters, eq(characters.id, userTeams.characterId))
    .where(eq(userTeams.userId, user.id))
    .orderBy(userTeams.slot);
  }

  static async setUserTeam(userAddress: string, characterIds: string[]) {
    const [user] = await db.select().from(users).where(eq(users.address, userAddress.toLowerCase()));
    if (!user) throw new Error('User not found');
    
    await db.delete(userTeams).where(eq(userTeams.userId, user.id));
    
    for (let i = 0; i < Math.min(characterIds.length, 3); i++) {
      await db.insert(userTeams).values({
        userId: user.id,
        characterId: characterIds[i],
        slot: i
      });
    }
    
    return true;
  }

  static async transferItem(
    fromAddress: string,
    toAddress: string,
    tokenId: number,
    type: 'character' | 'card'
  ) {
    const table = type === 'character' ? characters : cards;
    const ownerField = type === 'character' ? characters.ownerAddress : cards.ownerAddress;
    
    await db.update(table)
      .set({ ownerAddress: toAddress.toLowerCase() })
      .where(and(
        eq(table.tokenId, tokenId),
        eq(ownerField, fromAddress.toLowerCase())
      ));
    
    return true;
  }

  static toBattlePokemon(char: typeof characters.$inferSelect): BattlePokemon {
    const speciesData = POKEMON_SPECIES_LIBRARY.find(s => s.name === char.species);
    if (!speciesData) {
      throw new Error(`Unknown species: ${char.species}`);
    }

    const abilityData = ABILITIES_LIBRARY.find(a => a.name === char.ability);
    const moves = speciesData.moves.map(m => MOVES_LIBRARY.find(move => move.name === m)).filter(Boolean) as any[];

    return {
      id: char.id,
      speciesName: char.species,
      types: speciesData.types,
      stats: {
        hp: char.stats?.hp || speciesData.baseStats.hp * 2 + 110,
        maxHp: char.stats?.hp || speciesData.baseStats.hp * 2 + 110,
        attack: char.stats?.attack || speciesData.baseStats.attack + 50,
        defense: char.stats?.defense || speciesData.baseStats.defense + 50,
        spAttack: char.stats?.spAttack || speciesData.baseStats.spAttack + 50,
        spDefense: char.stats?.spDefense || speciesData.baseStats.spDefense + 50,
        speed: char.stats?.speed || speciesData.baseStats.speed + 50
      },
      moves: moves.length > 0 ? moves : MOVES_LIBRARY.slice(0, 4),
      ability: abilityData || { name: 'None', effect: 'none', value: 0 },
      modifiers: { attack: 1, defense: 1, speed: 1, accuracy: 1 },
      cooldowns: {}
    };
  }
}

const MOVES_LIBRARY = [
  { name: 'Flamethrower', power: 90, accuracy: 0.95, type: 'fire', category: 'special' as const, cooldown: 1 },
  { name: 'Fire Blast', power: 110, accuracy: 0.8, type: 'fire', category: 'special' as const, cooldown: 3 },
  { name: 'Surf', power: 90, accuracy: 0.95, type: 'water', category: 'special' as const, cooldown: 1 },
  { name: 'Hydro Pump', power: 110, accuracy: 0.8, type: 'water', category: 'special' as const, cooldown: 3 },
  { name: 'Razor Leaf', power: 75, accuracy: 0.95, type: 'grass', category: 'physical' as const, cooldown: 0 },
  { name: 'Solar Beam', power: 110, accuracy: 0.85, type: 'grass', category: 'special' as const, cooldown: 3 },
  { name: 'Thunderbolt', power: 90, accuracy: 0.95, type: 'electric', category: 'special' as const, cooldown: 1 },
  { name: 'Thunder', power: 110, accuracy: 0.8, type: 'electric', category: 'special' as const, cooldown: 3 },
  { name: 'Psychic', power: 90, accuracy: 0.95, type: 'psychic', category: 'special' as const, cooldown: 1 },
  { name: 'Shadow Ball', power: 85, accuracy: 0.95, type: 'ghost', category: 'special' as const, cooldown: 1 },
  { name: 'Earthquake', power: 100, accuracy: 0.9, type: 'ground', category: 'physical' as const, cooldown: 2 },
  { name: 'Rock Slide', power: 85, accuracy: 0.9, type: 'rock', category: 'physical' as const, cooldown: 1 },
  { name: 'Close Combat', power: 100, accuracy: 0.9, type: 'fighting', category: 'physical' as const, cooldown: 2 },
  { name: 'Ice Beam', power: 90, accuracy: 0.95, type: 'ice', category: 'special' as const, cooldown: 1 },
  { name: 'Dragon Claw', power: 85, accuracy: 0.95, type: 'dragon', category: 'physical' as const, cooldown: 1 },
  { name: 'Crunch', power: 80, accuracy: 0.95, type: 'dark', category: 'physical' as const, cooldown: 0 },
  { name: 'Slash', power: 70, accuracy: 1.0, type: 'normal', category: 'physical' as const, cooldown: 0 },
  { name: 'Quick Attack', power: 40, accuracy: 1.0, type: 'normal', category: 'physical' as const, priority: 1, cooldown: 0 },
  { name: 'Tackle', power: 50, accuracy: 1.0, type: 'normal', category: 'physical' as const, cooldown: 0 },
  { name: 'Hyper Beam', power: 120, accuracy: 0.75, type: 'normal', category: 'special' as const, cooldown: 4 },
  { name: 'Air Slash', power: 75, accuracy: 0.95, type: 'flying', category: 'special' as const, cooldown: 1 },
  { name: 'Moonblast', power: 90, accuracy: 0.95, type: 'fairy', category: 'special' as const, cooldown: 1 },
];

const ABILITIES_LIBRARY = [
  { name: 'Blaze', effect: 'power_boost_low_hp', value: 1.15 },
  { name: 'Torrent', effect: 'power_boost_low_hp', value: 1.15 },
  { name: 'Overgrow', effect: 'power_boost_low_hp', value: 1.15 },
  { name: 'Swift', effect: 'speed_flat', value: 15 },
  { name: 'Tanky', effect: 'hp_flat', value: 20 },
  { name: 'Thick Skin', effect: 'damage_reduction', value: 0.9 },
  { name: 'Sniper', effect: 'crit_boost', value: 0.15 },
  { name: 'Adaptability', effect: 'all_power_boost', value: 1.1 }
];

const POKEMON_SPECIES_LIBRARY = [
  { name: 'Charizard', types: ['fire', 'flying'], ability: 'Blaze', moves: ['Flamethrower', 'Air Slash', 'Slash', 'Fire Blast'], baseStats: { hp: 78, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 } },
  { name: 'Blastoise', types: ['water'], ability: 'Tanky', moves: ['Surf', 'Ice Beam', 'Crunch', 'Hydro Pump'], baseStats: { hp: 79, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 } },
  { name: 'Venusaur', types: ['grass', 'poison'], ability: 'Overgrow', moves: ['Razor Leaf', 'Energy Ball', 'Tackle', 'Solar Beam'], baseStats: { hp: 80, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 } },
  { name: 'Pikachu', types: ['electric'], ability: 'Swift', moves: ['Thunderbolt', 'Quick Attack', 'Tackle', 'Thunder'], baseStats: { hp: 35, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 } },
  { name: 'Gengar', types: ['ghost', 'poison'], ability: 'Sniper', moves: ['Shadow Ball', 'Psychic', 'Quick Attack', 'Slash'], baseStats: { hp: 60, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 } },
  { name: 'Dragonite', types: ['dragon', 'flying'], ability: 'Thick Skin', moves: ['Dragon Claw', 'Air Slash', 'Thunderbolt', 'Hyper Beam'], baseStats: { hp: 91, attack: 134, defense: 95, spAttack: 100, spDefense: 100, speed: 80 } },
  { name: 'Snorlax', types: ['normal'], ability: 'Tanky', moves: ['Body Slam', 'Crunch', 'Tackle', 'Hyper Beam'], baseStats: { hp: 160, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 } },
  { name: 'Lucario', types: ['fighting', 'steel'], ability: 'Adaptability', moves: ['Close Combat', 'Bullet Punch', 'Crunch', 'Quick Attack'], baseStats: { hp: 70, attack: 110, defense: 70, spAttack: 115, spDefense: 70, speed: 90 } },
  { name: 'Tyranitar', types: ['rock', 'dark'], ability: 'Thick Skin', moves: ['Rock Slide', 'Crunch', 'Earthquake', 'Hyper Beam'], baseStats: { hp: 100, attack: 134, defense: 110, spAttack: 95, spDefense: 100, speed: 61 } },
  { name: 'Gardevoir', types: ['psychic', 'fairy'], ability: 'Sniper', moves: ['Psychic', 'Moonblast', 'Shadow Ball', 'Energy Ball'], baseStats: { hp: 68, attack: 65, defense: 65, spAttack: 125, spDefense: 115, speed: 80 } }
];
