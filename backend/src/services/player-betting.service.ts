import { db } from '../db';
import { userAgentBets, agentRoundBalances } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { contractService } from './contract.service';
import { wsService } from './websocket.service';

export class PlayerBettingService {
  async placeBet(
    userId: string,
    roundId: string,
    agentId: string,
    amount: string,
    txHash: string
  ) {
    // Validate minimum bet (0.1 MON)
    const minBet = BigInt('100000000000000000'); // 0.1 MON in wei
    if (BigInt(amount) < minBet) {
      throw new Error('Minimum bet is 0.1 MON');
    }

    // Verify transaction on-chain
    const isValid = await contractService.verifyUserDeposit(txHash, roundId, agentId, amount);
    if (!isValid) {
      throw new Error('Invalid transaction');
    }

    // Insert bet record
    const [bet] = await db.insert(userAgentBets).values({
      userId,
      roundId,
      agentId,
      amount,
      txHash,
      status: 'pending',
    }).returning();

    // Update agent's starting balance for this round
    const updatedBalance = await this.updateAgentBalance(roundId, agentId, amount);

    // Broadcast WebSocket event: agent_pool_update
    wsService.broadcastAgentPoolUpdate(roundId, {
      agentId,
      newPoolSize: updatedBalance,
    });
    
    return bet;
  }

  private async updateAgentBalance(roundId: string, agentId: string, additionalAmount: string): Promise<string> {
    const existing = await db.query.agentRoundBalances.findFirst({
      where: and(
        eq(agentRoundBalances.roundId, roundId),
        eq(agentRoundBalances.agentId, agentId)
      ),
    });

    let newBalance: string;
    if (existing) {
      newBalance = (BigInt(existing.startingBalance) + BigInt(additionalAmount)).toString();
      await db.update(agentRoundBalances)
        .set({
          startingBalance: newBalance,
          currentBalance: newBalance,
        })
        .where(and(
          eq(agentRoundBalances.roundId, roundId),
          eq(agentRoundBalances.agentId, agentId)
        ));
    } else {
      newBalance = additionalAmount;
      await db.insert(agentRoundBalances).values({
        roundId,
        agentId,
        startingBalance: additionalAmount,
        currentBalance: additionalAmount,
      });
    }
    
    return newBalance;
  }

  async getUserBets(userId: string, roundId: string) {
    return await db.query.userAgentBets.findMany({
      where: and(
        eq(userAgentBets.userId, userId),
        eq(userAgentBets.roundId, roundId)
      ),
    });
  }

  async processPayouts(roundId: string) {
    // Get all winning bets
    const winners = await db.query.userAgentBets.findMany({
      where: and(
        eq(userAgentBets.roundId, roundId),
        eq(userAgentBets.status, 'won')
      ),
    });

    for (const bet of winners) {
      try {
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, bet.userId),
        });

        if (!user) continue;

        // Trigger payout on-chain
        const txHash = await contractService.claimWinningsForUser(
          roundId,
          user.address as `0x${string}`
        );

        // Update bet record
        await db.update(userAgentBets)
          .set({
            status: 'won',
            payoutTxHash: txHash,
          })
          .where(eq(userAgentBets.id, bet.id));

        console.log(`✅ Payout processed for user ${user.address}: ${txHash}`);
      } catch (error) {
        console.error(`❌ Failed to process payout for bet ${bet.id}:`, error);
      }
    }
  }
}

export const playerBettingService = new PlayerBettingService();
