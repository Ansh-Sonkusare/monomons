import { Elysia, t } from 'elysia';
import { db } from '../db';
import { tradingRounds, agentRoundBalances, userAgentBets, agentTileBets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { tradingRoundService } from '../services/trading-round.service';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  // Emergency cancel round
  .post('/rounds/cancel/:roundId', async ({ params, body }) => {
    try {
      await tradingRoundService.handleRoundFailure(params.roundId, body.reason);
      return { success: true, message: 'Round cancelled' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel round'
      };
    }
  }, {
    params: t.Object({
      roundId: t.String()
    }),
    body: t.Object({
      reason: t.String()
    })
  })

  // Get full audit data for a round
  .get('/rounds/:id/audit', async ({ params }) => {
    const round = await db.query.tradingRounds.findFirst({
      where: eq(tradingRounds.id, params.id),
    });

    if (!round) {
      return { success: false, message: 'Round not found' };
    }

    const agentBalances = await db.query.agentRoundBalances.findMany({
      where: eq(agentRoundBalances.roundId, params.id),
    });

    const userBets = await db.query.userAgentBets.findMany({
      where: eq(userAgentBets.roundId, params.id),
    });

    const agentBets = await db.query.agentTileBets.findMany({
      where: eq(agentTileBets.roundId, params.id),
    });

    const totalUserPool = userBets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));

    return {
      success: true,
      audit: {
        round,
        agentBalances,
        userBets,
        agentBets,
        totalUserPool: totalUserPool.toString(),
        userBetsCount: userBets.length,
        agentBetsCount: agentBets.length,
      }
    };
  }, {
    params: t.Object({
      id: t.String()
    })
  })

  // Stop auto-round manager
  .post('/rounds/stop', async () => {
    tradingRoundService.stopAutoManage();
    return { success: true, message: 'Auto-round manager stopped' };
  })

  // Start auto-round manager
  .post('/rounds/start', async () => {
    // Start in background
    tradingRoundService.autoManageRounds();
    return { success: true, message: 'Auto-round manager started' };
  });
