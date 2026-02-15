import { Elysia, t } from 'elysia';
import { db } from '../db';
import { tradingRounds, userAgentBets, agentTileBets, agentRoundBalances } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { playerBettingService } from '../services/player-betting.service';
import { payoutCalculationService } from '../services/payout-calculation.service';

export const tradingRoutes = new Elysia({ prefix: '/api/trading' })
  // Get current active round
  .get('/rounds/current', async () => {
    const round = await db.query.tradingRounds.findFirst({
      where: (rounds, { inArray }) => inArray(rounds.status, ['BETTING', 'TRADING']),
      orderBy: desc(tradingRounds.createdAt),
    });

    if (!round) {
      return { success: false, message: 'No active round' };
    }

    return { success: true, round };
  })

  // Get specific round by ID
  .get('/rounds/:id', async ({ params }) => {
    const round = await db.query.tradingRounds.findFirst({
      where: eq(tradingRounds.id, params.id),
    });

    if (!round) {
      return { success: false, message: 'Round not found' };
    }

    return { success: true, round };
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // Get round history (past 20 rounds)
  .get('/rounds/history', async () => {
    const rounds = await db.query.tradingRounds.findMany({
      where: eq(tradingRounds.status, 'SETTLED'),
      orderBy: desc(tradingRounds.createdAt),
      limit: 20,
    });

    return { success: true, rounds };
  })

  // Get all agents with stats
  .get('/agents', async () => {
    const agents = await db.query.aiAgents.findMany();
    return { success: true, agents };
  })

  // Get agent performance stats
  .get('/agents/:id/performance', async ({ params }) => {
    const agent = await db.query.aiAgents.findFirst({
      where: (agents, { eq }) => eq(agents.id, params.id),
    });

    if (!agent) {
      return { success: false, message: 'Agent not found' };
    }

    const winRate = agent.totalRounds > 0 
      ? (agent.totalWins / agent.totalRounds) * 100 
      : 0;

    // Calculate average P&L
    const balances = await db.query.agentRoundBalances.findMany({
      where: eq(agentRoundBalances.agentId, params.id),
    });

    const totalPnL = balances.reduce((sum, b) => 
      sum + (b.finalPnl ? BigInt(b.finalPnl) : BigInt(0)), BigInt(0)
    );

    const avgPnL = balances.length > 0 
      ? (totalPnL / BigInt(balances.length)).toString() 
      : '0';

    return {
      success: true,
      performance: {
        ...agent,
        winRate: winRate.toFixed(2),
        avgPnL,
      }
    };
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // Place user bet
  .post('/bets', async ({ body }) => {
    try {
      const bet = await playerBettingService.placeBet(
        body.userId,
        body.roundId,
        body.agentId,
        body.amount,
        body.txHash
      );

      return { success: true, bet };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to place bet' 
      };
    }
  }, {
    body: t.Object({
      userId: t.String(),
      roundId: t.String(),
      agentId: t.String(),
      amount: t.String(),
      txHash: t.String(),
    })
  })

  // Get user's bet history
  .get('/bets/user/:userId', async ({ params, query }) => {
    const { roundId } = query;

    if (roundId) {
      const bets = await playerBettingService.getUserBets(params.userId, roundId);
      return { success: true, bets };
    }

    // Get all bets for user
    const allBets = await db.query.userAgentBets.findMany({
      where: eq(userAgentBets.userId, params.userId),
      orderBy: desc(userAgentBets.createdAt),
      limit: 50,
    });

    return { success: true, bets: allBets };
  }, {
    params: t.Object({
      userId: t.String()
    }),
    query: t.Object({
      roundId: t.Optional(t.String())
    })
  })

  // Get current leaderboard for a round
  .get('/rounds/:id/leaderboard', async ({ params }) => {
    const balances = await db.query.agentRoundBalances.findMany({
      where: eq(agentRoundBalances.roundId, params.id),
    });

    const rankings = balances
      .map(b => ({
        agentId: b.agentId,
        pnl: b.finalPnl || b.currentBalance,
        tilesWon: b.tilesWon,
        tilesLost: b.tilesLost,
      }))
      .sort((a, b) => Number(BigInt(b.pnl) - BigInt(a.pnl)))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    return { success: true, rankings };
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // Get agent's tile bets for a round
  .get('/rounds/:id/agent-bets/:agentId', async ({ params }) => {
    const bets = await db.query.agentTileBets.findMany({
      where: and(
        eq(agentTileBets.roundId, params.id),
        eq(agentTileBets.agentId, params.agentId)
      ),
    });

    return { success: true, bets };
  }, {
    params: t.Object({
      id: t.String(),
      agentId: t.String(),
    })
  });
