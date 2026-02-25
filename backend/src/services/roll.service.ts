import { db } from '../db';
import { characters, cards, rolls, users, userTeams } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { BattlePokemon, MOVES_LIBRARY, ABILITIES_LIBRARY, POKEMON_SPECIES_LIBRARY } from './battle.service';

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
    const speciesData = POKEMON_SPECIES_LIBRARY.find((s: any) => s.name === char.species);
    
    const getMove = (name: string) => MOVES_LIBRARY.find(m => m.name === name);
    const getAbility = (name: string) => ABILITIES_LIBRARY.find(a => a.name === name);

    const characterMoves = char.moves && Array.isArray(char.moves) && char.moves.length > 0
      ? char.moves.map((m: any) => typeof m === 'string' ? getMove(m) : m).filter(Boolean)
      : speciesData 
        ? speciesData.moves.map(m => getMove(m)).filter(Boolean)
        : [];

    return {
      id: char.id,
      speciesName: char.species,
      types: speciesData?.types || ['normal'],
      stats: {
        hp: char.stats?.hp || (speciesData ? speciesData.baseStats.hp * 2 + 110 : 100),
        maxHp: char.stats?.hp || (speciesData ? speciesData.baseStats.hp * 2 + 110 : 100),
        attack: char.stats?.attack || (speciesData ? speciesData.baseStats.attack + 50 : 50),
        defense: char.stats?.defense || (speciesData ? speciesData.baseStats.defense + 50 : 50),
        spAttack: char.stats?.spAttack || (speciesData ? speciesData.baseStats.spAttack + 50 : 50),
        spDefense: char.stats?.spDefense || (speciesData ? speciesData.baseStats.spDefense + 50 : 50),
        speed: char.stats?.speed || (speciesData ? speciesData.baseStats.speed + 50 : 50)
      },
      moves: characterMoves.length > 0 ? characterMoves as any : MOVES_LIBRARY.slice(0, 4),
      ability: getAbility(char.ability || speciesData?.ability || 'None') || { name: 'None', effect: 'none', value: 0 },
      modifiers: { attack: 1, defense: 1, speed: 1, accuracy: 1 },
      cooldowns: {}
    };
  }
}
