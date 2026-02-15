import { db } from '../db';
import { agentTileBets, agentRoundBalances } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { contractService } from './contract.service';
import { calculateMultiplier, isPriceInTileRange } from '../shared/tile-multiplier';
import { wsService } from './websocket.service';

interface TileBet {
  colIndex: number;
  rowIndex: number;
  targetPrice: string;
  amount: string;
  multiplier: number;
}

export class AgentBettingService {
  async generateAgentBets(
    roundId: string,
    agentId: string,
    strategy: any,
    currentPrice: number,
    priceHistoryLength: number
  ): Promise<TileBet[]> {
    // Get agent's pool balance
    const balance = await db.query.agentRoundBalances.findFirst({
      where: and(
        eq(agentRoundBalances.roundId, roundId),
        eq(agentRoundBalances.agentId, agentId)
      ),
    });

    if (!balance || BigInt(balance.startingBalance) === BigInt(0)) {
      return [];
    }

    const pool = BigInt(balance.startingBalance);
    const currentColumn = Math.floor(priceHistoryLength);
    const minValidColumn = currentColumn + 2; // At least 2 tiles ahead

    // Generate bets using strategy (delegated to AIAgentStrategyService)
    const tileBets = strategy.generateBets(pool, currentPrice, currentColumn);

    // Filter out past bets
    return tileBets.filter((bet: TileBet) => bet.colIndex >= minValidColumn);
  }

  async placeAgentBetsGradually(
    roundId: string,
    agentId: string,
    contractAgentId: number,
    tileBets: TileBet[]
  ) {
    const spreadDuration = 30000; // 30 seconds
    const delayPerBet = spreadDuration / tileBets.length;

    for (const tile of tileBets) {
      try {
        // Record on-chain using contract agent ID (0-3)
        const txHash = await contractService.recordAgentTileBet(
          roundId,
          contractAgentId.toString(),
          tile,
          tile.amount
        );

        // Insert into database
        await db.insert(agentTileBets).values({
          roundId,
          agentId,
          tileColIndex: tile.colIndex,
          tileRowIndex: tile.rowIndex,
          targetPrice: tile.targetPrice,
          amount: tile.amount,
          multiplier: tile.multiplier,
          contractTxHash: txHash,
          status: 'pending',
        });

        // Update allocated balance
        await this.updateAllocatedBalance(roundId, agentId, tile.amount);

        // Broadcast WebSocket: agent_bet_placed
        wsService.broadcastAgentBetPlaced(roundId, {
          agentId,
          tileCol: tile.colIndex,
          tileRow: tile.rowIndex,
          amount: tile.amount,
          multiplier: tile.multiplier,
        });

        console.log(`✅ Agent ${agentId} bet placed: Col ${tile.colIndex}, Row ${tile.rowIndex}`);

        // Wait before next bet
        await new Promise(resolve => setTimeout(resolve, delayPerBet));
      } catch (error) {
        console.error(`❌ Failed to place agent bet:`, error);
      }
    }
  }

  private async updateAllocatedBalance(roundId: string, agentId: string, amount: string) {
    const balance = await db.query.agentRoundBalances.findFirst({
      where: and(
        eq(agentRoundBalances.roundId, roundId),
        eq(agentRoundBalances.agentId, agentId)
      ),
    });

    if (balance) {
      const newAllocated = (BigInt(balance.allocatedToTiles) + BigInt(amount)).toString();
      await db.update(agentRoundBalances)
        .set({ allocatedToTiles: newAllocated })
        .where(and(
          eq(agentRoundBalances.roundId, roundId),
          eq(agentRoundBalances.agentId, agentId)
        ));
    }
  }

  async evaluateBet(
    roundId: string,
    agentId: string,
    betId: string,
    currentPrice: number,
    basePrice: number
  ) {
    const bet = await db.query.agentTileBets.findFirst({
      where: eq(agentTileBets.id, betId),
    });

    if (!bet || bet.status !== 'pending') return;

    const isWin = isPriceInTileRange(currentPrice, bet.tileRowIndex, basePrice);

    if (isWin) {
      const profit = (BigInt(bet.amount) * BigInt(Math.floor(bet.multiplier * 100)) / BigInt(100)).toString();
      
      await db.update(agentTileBets)
        .set({
          status: 'won',
          profitLoss: profit,
        })
        .where(eq(agentTileBets.id, betId));

      // Update agent balance
      await this.updateCurrentBalance(roundId, agentId, profit, true);
    } else {
      const loss = `-${bet.amount}`;
      
      await db.update(agentTileBets)
        .set({
          status: 'lost',
          profitLoss: loss,
        })
        .where(eq(agentTileBets.id, betId));

      await this.updateCurrentBalance(roundId, agentId, bet.amount, false);
    }

    // Broadcast WebSocket: agent_bet_resolved
    wsService.broadcastAgentBetResolved(roundId, {
      agentId,
      tileId: betId,
      won: isWin,
      profitLoss: isWin ? profit : `-${bet.amount}`,
    });
  }

  private async updateCurrentBalance(roundId: string, agentId: string, amount: string, isWin: boolean) {
    const balance = await db.query.agentRoundBalances.findFirst({
      where: and(
        eq(agentRoundBalances.roundId, roundId),
        eq(agentRoundBalances.agentId, agentId)
      ),
    });

    if (balance) {
      const currentBal = BigInt(balance.currentBalance);
      const change = BigInt(amount);
      const newBalance = isWin ? (currentBal + change).toString() : (currentBal - change).toString();
      
      const updates: any = { currentBalance: newBalance };
      if (isWin) {
        updates.tilesWon = balance.tilesWon + 1;
      } else {
        updates.tilesLost = balance.tilesLost + 1;
      }

      await db.update(agentRoundBalances)
        .set(updates)
        .where(and(
          eq(agentRoundBalances.roundId, roundId),
          eq(agentRoundBalances.agentId, agentId)
        ));
    }
  }
}

export const agentBettingService = new AgentBettingService();
