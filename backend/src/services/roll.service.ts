import { db } from '../db';
import { characters, cards, rolls, users, userTeams } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { BattlePokemon } from './battle.service';
import { MOVES_LIBRARY, ABILITIES_LIBRARY, POKEMON_SPECIES_LIBRARY } from '../data/moves';

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
      const speciesData = POKEMON_SPECIES_LIBRARY[Math.floor(Math.random() * POKEMON_SPECIES_LIBRARY.length)];
      
      const statMultiplier = rarity === 'common' ? 1 : 
        rarity === 'uncommon' ? 1.1 : 
        rarity === 'rare' ? 1.2 : 
        rarity === 'epic' ? 1.3 : 1.5;
      
      const stats = {
        hp: Math.floor(speciesData.baseStats.hp * statMultiplier),
        attack: Math.floor(speciesData.baseStats.attack * statMultiplier),
        defense: Math.floor(speciesData.baseStats.defense * statMultiplier),
        spAttack: Math.floor(speciesData.baseStats.spAttack * statMultiplier),
        spDefense: Math.floor(speciesData.baseStats.spDefense * statMultiplier),
        speed: Math.floor(speciesData.baseStats.speed * statMultiplier)
      };
      
      await db.insert(characters).values({
        tokenId,
        ownerAddress: roll.userAddress,
        rarity,
        species: speciesData.name,
        stats,
        moves: speciesData.moves,
        ability: speciesData.ability,
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
      speciesId: speciesData?.id || 0,
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
