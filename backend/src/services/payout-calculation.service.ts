import { db } from '../db';
import { agentRoundBalances, userAgentBets, tradingRounds } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export class PayoutCalculationService {
  async calculateAgentPnL(roundId: string, agentId: string): Promise<string> {
    const balance = await db.query.agentRoundBalances.findFirst({
      where: and(
        eq(agentRoundBalances.roundId, roundId),
        eq(agentRoundBalances.agentId, agentId)
      ),
    });

    if (!balance) return '0';

    const starting = BigInt(balance.startingBalance);
    const current = BigInt(balance.currentBalance);
    const pnl = current - starting;

    // Update final PnL
    await db.update(agentRoundBalances)
      .set({ finalPnl: pnl.toString() })
      .where(and(
        eq(agentRoundBalances.roundId, roundId),
        eq(agentRoundBalances.agentId, agentId)
      ));

    return pnl.toString();
  }

  async determineWinners(roundId: string): Promise<string[]> {
    // Get all agents' balances for this round
    const allBalances = await db.query.agentRoundBalances.findMany({
      where: eq(agentRoundBalances.roundId, roundId),
    });

    if (allBalances.length === 0) return [];

    // Calculate PnL for each
    const pnls = allBalances.map(b => ({
      agentId: b.agentId,
      pnl: b.finalPnl ? BigInt(b.finalPnl) : BigInt(0),
    }));

    // Find max PnL
    const maxPnL = pnls.reduce((max, curr) => curr.pnl > max ? curr.pnl : max, BigInt(0));

    // Get all agents with max PnL (handles ties)
    const winners = pnls.filter(p => p.pnl === maxPnL).map(p => p.agentId);

    return winners;
  }

  async calculateUserPayout(userId: string, roundId: string): Promise<string> {
    // Get round info
    const round = await db.query.tradingRounds.findFirst({
      where: eq(tradingRounds.id, roundId),
    });

    if (!round || !round.winnerAgentIds || round.winnerAgentIds.length === 0) {
      return '0';
    }

    // Get user's bets
    const userBets = await db.query.userAgentBets.findMany({
      where: and(
        eq(userAgentBets.userId, userId),
        eq(userAgentBets.roundId, roundId)
      ),
    });

    // Check if user bet on any winning agent
    const winningBets = userBets.filter(bet => 
      round.winnerAgentIds!.includes(bet.agentId)
    );

    if (winningBets.length === 0) return '0';

    // Calculate total pool and platform cut
    const allBets = await db.query.userAgentBets.findMany({
      where: eq(userAgentBets.roundId, roundId),
    });

    const totalPool = allBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));
    const platformCut = (totalPool * BigInt(5)) / BigInt(100); // 5%
    const prizePool = totalPool - platformCut;

    if (round.winnerAgentIds.length === 1) {
      // Single winner
      const winnerId = round.winnerAgentIds[0];
      const winnerBets = allBets.filter(b => b.agentId === winnerId);
      const winnerPool = winnerBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));
      
      const userWinningAmount = winningBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));
      const userShare = winnerPool > BigInt(0) ? userWinningAmount * prizePool / winnerPool : BigInt(0);
      
      return userShare.toString();
    } else {
      // Multiple winners (tie)
      const allWinnersBets = allBets.filter(b => round.winnerAgentIds!.includes(b.agentId));
      const allWinnersPool = allWinnersBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));

      let userTotalPayout = BigInt(0);

      for (const winningBet of winningBets) {
        const thisWinnerBets = allBets.filter(b => b.agentId === winningBet.agentId);
        const thisWinnerPool = thisWinnerBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));
        
        const agentShare = allWinnersPool > BigInt(0) ? thisWinnerPool * prizePool / allWinnersPool : BigInt(0);
        const userShare = thisWinnerPool > BigInt(0) ? BigInt(winningBet.amount) * agentShare / thisWinnerPool : BigInt(0);
        
        userTotalPayout += userShare;
      }

      return userTotalPayout.toString();
    }
  }

  async markWinningBets(roundId: string, winnerAgentIds: string[]) {
    // Update all bets for winning agents
    await db.update(userAgentBets)
      .set({ status: 'won' })
      .where(and(
        eq(userAgentBets.roundId, roundId),
        inArray(userAgentBets.agentId, winnerAgentIds)
      ));

    // Mark losing bets
    const allBets = await db.query.userAgentBets.findMany({
      where: eq(userAgentBets.roundId, roundId),
    });

    const losingBetIds = allBets
      .filter(bet => !winnerAgentIds.includes(bet.agentId))
      .map(bet => bet.id);

    if (losingBetIds.length > 0) {
      await db.update(userAgentBets)
        .set({ status: 'lost' })
        .where(inArray(userAgentBets.id, losingBetIds));
    }
  }
}

export const payoutCalculationService = new PayoutCalculationService();
