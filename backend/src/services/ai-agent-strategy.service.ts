import { calculateMultiplier, getTileTargetPrice } from '../shared/tile-multiplier';

interface TileBet {
  colIndex: number;
  rowIndex: number;
  targetPrice: string;
  amount: string;
  multiplier: number;
}

interface Strategy {
  name: string;
  type: 'aggressive' | 'conservative' | 'momentum' | 'contrarian';
  distribution: { near: number; mid: number; far: number };
  multiplierPreference: { min: number; max: number };
  direction: 'adaptive' | 'neutral' | 'bullish' | 'bearish';
  generateBets: (pool: bigint, currentPrice: number, currentColumn: number) => TileBet[];
}

const STRATEGIES: Record<string, Strategy> = {
  alpha: {
    name: 'Alpha Bot',
    type: 'aggressive',
    distribution: { near: 0.2, mid: 0.3, far: 0.5 },
    multiplierPreference: { min: 2.5, max: 5.0 },
    direction: 'adaptive',
    generateBets(pool, currentPrice, currentColumn) {
      return generateTileBets(this, pool, currentPrice, currentColumn);
    },
  },
  beta: {
    name: 'Beta Trader',
    type: 'conservative',
    distribution: { near: 0.6, mid: 0.3, far: 0.1 },
    multiplierPreference: { min: 1.2, max: 1.8 },
    direction: 'neutral',
    generateBets(pool, currentPrice, currentColumn) {
      return generateTileBets(this, pool, currentPrice, currentColumn);
    },
  },
  gamma: {
    name: 'Gamma Predictor',
    type: 'momentum',
    distribution: { near: 0.35, mid: 0.45, far: 0.2 },
    multiplierPreference: { min: 1.5, max: 2.5 },
    direction: 'bullish',
    generateBets(pool, currentPrice, currentColumn) {
      return generateTileBets(this, pool, currentPrice, currentColumn);
    },
  },
  delta: {
    name: 'Delta Oracle',
    type: 'contrarian',
    distribution: { near: 0.25, mid: 0.35, far: 0.4 },
    multiplierPreference: { min: 3.0, max: 6.0 },
    direction: 'bearish',
    generateBets(pool, currentPrice, currentColumn) {
      return generateTileBets(this, pool, currentPrice, currentColumn);
    },
  },
};

function generateTileBets(
  strategy: Strategy,
  pool: bigint,
  currentPrice: number,
  currentColumn: number
): TileBet[] {
  const bets: TileBet[] = [];
  const { distribution, multiplierPreference, direction } = strategy;

  // Calculate bet amounts for each distance category
  const nearPool = (pool * BigInt(Math.floor(distribution.near * 100))) / BigInt(100);
  const midPool = (pool * BigInt(Math.floor(distribution.mid * 100))) / BigInt(100);
  const farPool = pool - nearPool - midPool;

  // Generate near bets (2-4 columns ahead)
  const nearBets = createBetsForRange(
    currentColumn + 2,
    currentColumn + 4,
    nearPool,
    3,
    currentPrice,
    direction
  );

  // Generate mid bets (5-9 columns ahead)
  const midBets = createBetsForRange(
    currentColumn + 5,
    currentColumn + 9,
    midPool,
    5,
    currentPrice,
    direction
  );

  // Generate far bets (10+ columns ahead)
  const farBets = createBetsForRange(
    currentColumn + 10,
    currentColumn + 15,
    farPool,
    6,
    currentPrice,
    direction
  );

  return [...nearBets, ...midBets, ...farBets];
}

function createBetsForRange(
  startCol: number,
  endCol: number,
  poolAmount: bigint,
  betCount: number,
  currentPrice: number,
  direction: string
): TileBet[] {
  const bets: TileBet[] = [];
  const amountPerBet = poolAmount / BigInt(betCount);

  for (let i = 0; i < betCount; i++) {
    const col = startCol + Math.floor(Math.random() * (endCol - startCol + 1));
    const multiplier = calculateMultiplier(col, 0); // currentCol doesn't matter for calculation

    // Determine row based on direction
    let row: number;
    if (direction === 'bullish') {
      row = Math.floor(Math.random() * 3) + 3; // Upper tiles (rows 3-5)
    } else if (direction === 'bearish') {
      row = Math.floor(Math.random() * 3) - 3; // Lower tiles (rows -3 to -1)
    } else if (direction === 'neutral') {
      row = Math.floor(Math.random() * 7) - 3; // Full range (rows -3 to 3)
    } else {
      // Adaptive: follow recent trend (simplified)
      row = Math.random() > 0.5 ? Math.floor(Math.random() * 3) : -Math.floor(Math.random() * 3);
    }

    const targetPrice = getTileTargetPrice(row, currentPrice);

    bets.push({
      colIndex: col,
      rowIndex: row,
      targetPrice: targetPrice.toString(),
      amount: amountPerBet.toString(),
      multiplier,
    });
  }

  return bets;
}

export class AIAgentStrategyService {
  getStrategy(agentType: 'alpha' | 'beta' | 'gamma' | 'delta'): Strategy {
    return STRATEGIES[agentType];
  }

  calculateBets(
    agentType: 'alpha' | 'beta' | 'gamma' | 'delta',
    pool: bigint,
    currentPrice: number,
    currentColumn: number,
    priceHistory: number[]
  ): TileBet[] {
    const strategy = this.getStrategy(agentType);
    return strategy.generateBets(pool, currentPrice, currentColumn);
  }
}

export const aiAgentStrategyService = new AIAgentStrategyService();
