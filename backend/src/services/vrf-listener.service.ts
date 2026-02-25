import { db } from '../db';
import { RollService } from './roll.service';
import { eq } from 'drizzle-orm';
import { rolls } from '../db/schema';

export class VRFListenerService {
  static async handleRollRequested(event: {
    user: string;
    requestId: bigint;
    isCharacter: boolean;
    fee: bigint;
  }) {
    console.log(`Roll requested: ${event.user}, isCharacter: ${event.isCharacter}`);
  }

  static async handleRollFulfilled(event: {
    user: string;
    tokenId: bigint;
    rarity: number;
    rarityName: string;
  }) {
    console.log(`Roll fulfilled: ${event.user}, tokenId: ${event.tokenId}, rarity: ${event.rarityName}`);
    
    const rarityMap: Record<number, string> = {
      0: 'common',
      1: 'uncommon',
      2: 'rare',
      3: 'epic',
      4: 'legendary'
    };
    
    const pendingRolls = await db.select()
      .from(rolls)
      .where(eq(rolls.status, 'pending'));
    
    const roll = pendingRolls.find(r => r.userAddress.toLowerCase() === event.user.toLowerCase());
    
    if (roll) {
      await RollService.fulfillRoll(
        roll.vrfRequestId || roll.id.toString(),
        rarityMap[event.rarity] || 'common',
        Number(event.tokenId),
        ''
      );
    }
  }

  static async processPendingRolls() {
    const pendingRolls = await db.select()
      .from(rolls)
      .where(eq(rolls.status, 'pending'));
    
    console.log(`Processing ${pendingRolls.length} pending rolls`);
    
    for (const roll of pendingRolls) {
      console.log(`Pending roll: ${roll.id}, type: ${roll.rollType}, vrfRequestId: ${roll.vrfRequestId}`);
    }
  }
}
