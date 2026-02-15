import { db } from '../db';
import { tradingRounds, aiAgents, agentRoundBalances } from '../db/schema';
import { eq } from 'drizzle-orm';
import { priceService } from './price.service';
import { contractService } from './contract.service';
import { agentBettingService } from './agent-betting.service';
import { aiAgentStrategyService } from './ai-agent-strategy.service';
import { payoutCalculationService } from './payout-calculation.service';
import { playerBettingService } from './player-betting.service';
import { wsService } from './websocket.service';

const BETTING_DURATION_MS = parseInt(process.env.BETTING_DURATION_MS || '900000'); // 15 min default
const ROUND_DURATION_MS = parseInt(process.env.ROUND_DURATION_MS || '3600000'); // 60 min default
const COOLDOWN_MS = 10000; // 10 sec

export class TradingRoundService {
  private isRunning = false;
  private currentRound: any = null;
  private roundCounter = 0;

  async autoManageRounds() {
    if (this.isRunning) {
      console.log('⚠️ Auto-round manager already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Auto-round manager started');

    while (this.isRunning) {
      try {
        // PHASE 1: BET PHASE
        const round = await this.startNewRound();
        this.currentRound = round;
        console.log(`📢 Round ${round.roundNumber} - BETTING OPEN (${BETTING_DURATION_MS / 1000}s)`);
        
        await this.sleep(BETTING_DURATION_MS);

        // PHASE 2: TRADING PHASE START
        console.log(`🎯 Round ${round.roundNumber} - BETTING CLOSED, BOTS TRADING`);
        await this.transitionToBettingEnd(round.id);

        const tradingDuration = ROUND_DURATION_MS - BETTING_DURATION_MS;
        await this.sleep(tradingDuration);

        // PHASE 3: CASHOUT PHASE
        console.log(`💰 Round ${round.roundNumber} - CASHOUT PHASE`);
        await this.settleRound(round.id);

        // PHASE 4: COOLDOWN
        console.log(`⏸️  Cooldown - Next round in ${COOLDOWN_MS / 1000}s`);
        await this.sleep(COOLDOWN_MS);

      } catch (error) {
        console.error('❌ Round error:', error);
        if (this.currentRound) {
          await this.handleRoundFailure(this.currentRound.id, (error as Error).message);
        }
        await this.sleep(5000);
      }
    }
  }

  async startNewRound() {
    this.roundCounter++;
    const now = new Date();
    const bettingEndTime = new Date(now.getTime() + BETTING_DURATION_MS);
    const roundEndTime = new Date(now.getTime() + ROUND_DURATION_MS);

    const contractRoundId = `round-${Date.now()}`;

    // Create round on-chain
    await contractService.createRound({
      roundId: contractRoundId,
      bettingEndTime: Math.floor(bettingEndTime.getTime() / 1000),
      roundEndTime: Math.floor(roundEndTime.getTime() / 1000),
    });

    // Create round in database
    const [round] = await db.insert(tradingRounds).values({
      roundNumber: this.roundCounter,
      contractRoundId,
      status: 'BETTING',
      startTime: now,
      bettingEndTime,
      roundEndTime,
      startingPrice: priceService.getCurrentPrice(),
    }).returning();

    // Initialize agent balances with seed MONAD for testing
    const agents = await db.query.aiAgents.findMany();
    const seedBalance = '100000000000000000'; // 0.1 MON per agent
    
    for (const agent of agents) {
      await db.insert(agentRoundBalances).values({
        roundId: round.id,
        agentId: agent.id,
        startingBalance: seedBalance,
        currentBalance: seedBalance,
      }).onConflictDoNothing();
    }

    // Broadcast WebSocket: round_started
    wsService.broadcastRoundStarted(round.id, {
      roundNumber: round.roundNumber,
      bettingEndTime: round.bettingEndTime,
      roundEndTime: round.roundEndTime,
      agents: agents.map(a => ({ id: a.id, name: a.name, strategyType: a.strategyType, avatarColor: a.avatarColor })),
    });

    return round;
  }

  async transitionToBettingEnd(roundId: string) {
    // Lock betting on-chain
    await contractService.lockBettingPhase(roundId);

    // Update status
    await db.update(tradingRounds)
      .set({ status: 'TRADING' })
      .where(eq(tradingRounds.id, roundId));

    // Get all agents
    const agents = await db.query.aiAgents.findMany();
    const currentPrice = parseFloat(priceService.getCurrentPrice());

    // Start price monitoring
    priceService.subscribeToRound(roundId, (price) => {
      wsService.broadcastPriceUpdate(roundId, price, new Date());
    });

    // Generate and place AI agent bets (gradually over 30 seconds)
    const agentPools: any[] = [];
    const agentIdMap = new Map<string, number>(); // Map UUID to index 0-3
    
    agents.forEach((agent, index) => {
      agentIdMap.set(agent.id, index);
    });
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const strategyType = agent.strategyType as 'alpha' | 'beta' | 'gamma' | 'delta';
      const strategy = aiAgentStrategyService.getStrategy(strategyType);
      
      const tileBets = await agentBettingService.generateAgentBets(
        roundId,
        agent.id,
        strategy,
        currentPrice,
        0 // priceHistoryLength starts at 0
      );

      // Place bets gradually (non-blocking) - pass contract index (0-3)
      agentBettingService.placeAgentBetsGradually(roundId, agent.id, i, tileBets);
      
      agentPools.push({ agentId: agent.id, poolSize: '0' });
    }

    // Broadcast WebSocket: trading_started
    wsService.broadcastTradingStarted(roundId, {
      agentPools,
      tradingEndTime: new Date(Date.now() + (ROUND_DURATION_MS - BETTING_DURATION_MS)),
    });
  }

  async settleRound(roundId: string) {
    await db.update(tradingRounds)
      .set({ status: 'SETTLING' })
      .where(eq(tradingRounds.id, roundId));

    // Stop price monitoring
    priceService.unsubscribeFromRound(roundId);

    // Calculate final P&L for all agents
    const agents = await db.query.aiAgents.findMany();
    const agentPnLs: string[] = [];

    for (const agent of agents) {
      const pnl = await payoutCalculationService.calculateAgentPnL(roundId, agent.id);
      agentPnLs.push(pnl);
    }

    // Determine winners
    const winnerIds = await payoutCalculationService.determineWinners(roundId);

    // Submit to contract
    await contractService.settleRound(roundId, agentPnLs);

    // Update round
    const round = await db.query.tradingRounds.findFirst({
      where: eq(tradingRounds.id, roundId),
    });

    await db.update(tradingRounds)
      .set({
        status: 'SETTLED',
        finalPrice: priceService.getCurrentPrice(),
        winnerAgentIds: winnerIds,
      })
      .where(eq(tradingRounds.id, roundId));

    // Mark winning/losing bets
    await payoutCalculationService.markWinningBets(roundId, winnerIds);

    // Process payouts for all winners
    await playerBettingService.processPayouts(roundId);

    // Update agent stats
    for (const winnerId of winnerIds) {
      await db.update(aiAgents)
        .set({
          totalWins: db.$count(aiAgents.totalWins) + 1,
          totalRounds: db.$count(aiAgents.totalRounds) + 1,
        })
        .where(eq(aiAgents.id, winnerId));
    }

    // Broadcast WebSocket: round_settled
    wsService.broadcastRoundSettled(roundId, {
      winners: winnerIds,
      finalPnLs: agentPnLs,
    });

    console.log(`✅ Round ${round?.roundNumber} settled. Winners:`, winnerIds);
  }

  async handleRoundFailure(roundId: string, reason: string) {
    console.error(`❌ Cancelling round ${roundId}: ${reason}`);

    await contractService.cancelRound(roundId, reason);

    await db.update(tradingRounds)
      .set({
        status: 'CANCELLED',
        cancellationReason: reason,
      })
      .where(eq(tradingRounds.id, roundId));

    // Broadcast WebSocket: round_cancelled
    wsService.broadcastRoundCancelled(roundId, reason);
  }

  stopAutoManage() {
    this.isRunning = false;
    console.log('🛑 Auto-round manager stopped');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const tradingRoundService = new TradingRoundService();
