import { db } from '../db';
import { tradingRounds, agentRoundBalances, userAgentBets } from '../db/schema';
import { eq } from 'drizzle-orm';

const roundId = process.argv[2];

if (!roundId) {
  console.error('❌ Usage: bun run admin:view-round <roundId>');
  process.exit(1);
}

async function viewRound() {
  const round = await db.query.tradingRounds.findFirst({
    where: eq(tradingRounds.id, roundId),
  });

  if (!round) {
    console.error('❌ Round not found');
    process.exit(1);
  }

  console.log('\n📊 ROUND DETAILS\n');
  console.log(`Round #${round.roundNumber}`);
  console.log(`Status: ${round.status}`);
  console.log(`Contract ID: ${round.contractRoundId}`);
  console.log(`Start: ${round.startTime}`);
  console.log(`Betting End: ${round.bettingEndTime}`);
  console.log(`Round End: ${round.roundEndTime}`);
  console.log(`Starting Price: ${round.startingPrice || 'N/A'}`);
  console.log(`Final Price: ${round.finalPrice || 'N/A'}`);

  if (round.winnerAgentIds && round.winnerAgentIds.length > 0) {
    console.log(`\n🏆 Winners: ${round.winnerAgentIds.length} agent(s)`);
  }

  // Get agent balances
  const balances = await db.query.agentRoundBalances.findMany({
    where: eq(agentRoundBalances.roundId, roundId),
  });

  if (balances.length > 0) {
    console.log('\n💰 AGENT BALANCES\n');
    for (const balance of balances) {
      const agent = await db.query.aiAgents.findFirst({
        where: (agents, { eq }) => eq(agents.id, balance.agentId),
      });
      console.log(`${agent?.name || balance.agentId}:`);
      console.log(`  Starting: ${balance.startingBalance}`);
      console.log(`  Current: ${balance.currentBalance}`);
      console.log(`  Final P&L: ${balance.finalPnl || 'N/A'}`);
      console.log(`  Tiles Won: ${balance.tilesWon} | Lost: ${balance.tilesLost}`);
    }
  }

  // Get user bets
  const bets = await db.query.userAgentBets.findMany({
    where: eq(userAgentBets.roundId, roundId),
  });

  console.log(`\n💸 USER BETS: ${bets.length} total\n`);
  const totalPool = bets.reduce((sum, bet) => sum + BigInt(bet.amount), BigInt(0));
  console.log(`Total Pool: ${totalPool.toString()}`);

  const statusCounts = bets.reduce((acc, bet) => {
    acc[bet.status] = (acc[bet.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Bet Status:', statusCounts);

  process.exit(0);
}

viewRound().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
