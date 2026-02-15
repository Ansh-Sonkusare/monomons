# Live Trading System with 4 AI Agents - Implementation Plan

## System Overview

**Automated Round Loop System** running continuously with 4 AI agents competing in price prediction trading.

### Round Flow
```
┌─────────────────────────────────────────────────────┐
│                 AUTOMATED ROUND LOOP                 │
└─────────────────────────────────────────────────────┘

1. BET PHASE (15 min / 15 sec testing)
   └─> Users bet on which AI agent will win
   
2. TRADING PHASE (45 min / 45 sec testing)
   └─> AI bots place tile bets (spread over 30 sec)
   └─> Price moves, bets resolve in real-time
   └─> Leaderboard updates every 5 sec
   
3. CASHOUT PHASE (automatic)
   └─> Calculate winner(s) based on highest P&L
   └─> Backend auto-triggers payouts for all winners
   └─> Settle round on-chain
   
4. COOLDOWN (10 sec)
   └─> Brief pause before next round
   
5. REPEAT → Back to Bet Phase
```

---

## 1. Smart Contract: `TradingRoundManager.sol`

### Core Functions
- `createRound(roundId, bettingEndTime, roundEndTime)` - Admin creates new round
- `depositUserBet(roundId, agentId) payable` - User bets on agent (min 0.1 MON)
- `lockBetting(roundId)` - Transition to trading phase
- `recordAgentBet(roundId, agentId, tileId, amount)` - Platform records agent tile bet
- `settleRound(roundId, agentPnLs[4])` - Submit final P&L, calculate winners
- `claimWinnings(roundId, userAddress)` - Platform triggers payout for user
- `cancelRound(roundId)` - Emergency refund all users

### State Structure
```solidity
Round {
  status: BETTING | TRADING | SETTLED | CANCELLED
  bettingEndTime, roundEndTime
  agentPools[4]: total MON backing each agent
  userBets: mapping(user => mapping(agentId => amount))
  agentTileBets[4]: array of tile bets per agent
  agentFinalPnL[4]: profit/loss for each agent
  winners[]: array of winning agent IDs (handles ties)
  totalPrize, platformCut (5%)
  payoutsClaimed: mapping(user => bool)
}
```

### Events
- `UserBetPlaced(roundId, user, agentId, amount, timestamp)`
- `AgentTileBetRecorded(roundId, agentId, tileId, amount, targetPrice)`
- `RoundSettled(roundId, winners[], agentPnLs[], platformCut)`
- `WinningsClaimed(roundId, user, amount)`
- `RoundCancelled(roundId, reason)`

---

## 2. Database Schema

### New Tables

**`ai_agents`**
```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  total_wins INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`trading_rounds`**
```sql
CREATE TABLE trading_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL,
  contract_round_id TEXT NOT NULL,
  status TEXT NOT NULL, -- BETTING, TRADING, SETTLING, SETTLED, CANCELLED
  start_time TIMESTAMP NOT NULL,
  betting_end_time TIMESTAMP NOT NULL,
  round_end_time TIMESTAMP NOT NULL,
  starting_price TEXT,
  final_price TEXT,
  winner_agent_ids UUID[],
  total_pool TEXT,
  platform_cut TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`user_agent_bets`**
```sql
CREATE TABLE user_agent_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  round_id UUID REFERENCES trading_rounds(id),
  agent_id UUID REFERENCES ai_agents(id),
  amount TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, won, lost, refunded
  payout_amount TEXT,
  payout_tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`agent_tile_bets`**
```sql
CREATE TABLE agent_tile_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES trading_rounds(id),
  agent_id UUID REFERENCES ai_agents(id),
  tile_col_index INTEGER NOT NULL,
  tile_row_index INTEGER NOT NULL,
  target_price TEXT NOT NULL,
  amount TEXT NOT NULL,
  multiplier REAL NOT NULL,
  contract_tx_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, won, lost
  profit_loss TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`agent_round_balances`**
```sql
CREATE TABLE agent_round_balances (
  round_id UUID REFERENCES trading_rounds(id),
  agent_id UUID REFERENCES ai_agents(id),
  starting_balance TEXT DEFAULT '0',
  allocated_to_tiles TEXT DEFAULT '0',
  current_balance TEXT DEFAULT '0',
  tiles_won INTEGER DEFAULT 0,
  tiles_lost INTEGER DEFAULT 0,
  final_pnl TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (round_id, agent_id)
);
```

**`price_snapshots`**
```sql
CREATE TABLE price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES trading_rounds(id),
  timestamp TIMESTAMP NOT NULL,
  price TEXT NOT NULL,
  source TEXT DEFAULT 'binance'
);
```

### Indexes
```sql
CREATE INDEX idx_user_bets_round ON user_agent_bets(round_id, agent_id, status);
CREATE INDEX idx_agent_bets_round ON agent_tile_bets(round_id, agent_id, status);
CREATE INDEX idx_balances_round ON agent_round_balances(round_id, agent_id);
CREATE INDEX idx_rounds_status ON trading_rounds(status, created_at DESC);
```

---

## 3. Backend Services (7 Services)

### 3.1 `PriceService`
**Purpose**: Manage Binance WebSocket connection and price data

**Methods**:
- `connect()` - Connect to `wss://stream.binance.com:9443/ws/btcusdt@ticker`
- `getCurrentPrice()` - Return latest price
- `subscribeToRound(roundId, callback)` - Stream prices for active round
- `recordSnapshot(roundId, price)` - Log to `price_snapshots` every 5 seconds
- `handleDisconnection()` - Trigger round cancellation if no data for >30 sec
- `disconnect()` - Clean up WebSocket connection

**Failure Detection**:
- Track last message timestamp
- If `Date.now() - lastMessage > 30000ms` → call `TradingRoundService.cancelRound()`
- Auto-reconnect up to 3 attempts before cancelling

---

### 3.2 `ContractService`
**Purpose**: All blockchain interactions with `TradingRoundManager.sol`

**Methods**:
- `createRound(roundData)` - Deploy new round on-chain
- `verifyUserDeposit(txHash, roundId, agentId, amount)` - Validate user bet transaction
- `lockBettingPhase(roundId)` - Call contract to close betting
- `recordAgentTileBet(roundId, agentId, tileData, amount)` - Submit agent bet on-chain
- `settleRound(roundId, agentPnLs[])` - Submit results to contract
- `claimWinningsForUser(roundId, userAddress)` - Execute payout (called by backend)
- `cancelRound(roundId, reason)` - Emergency refund
- `getAgentPoolBalance(roundId, agentId)` - Query contract state
- `listenToEvents()` - Subscribe to contract events

**Transaction Retry Logic**:
- 3 attempts with exponential backoff (1s, 3s, 9s)
- Gas estimation before each tx
- Receipt verification after submission

---

### 3.3 `PlayerBettingService`
**Purpose**: User bet placement and payout management

**Methods**:
- `placeBet(userId, roundId, agentId, amount, txHash)`:
  - Validate: min 0.1 MON, betting phase active
  - Call `ContractService.verifyUserDeposit()`
  - Insert into `user_agent_bets`
  - Update `agent_round_balances.starting_balance`
  - Broadcast WebSocket: `agent_pool_update`

- `getUserBets(userId, roundId)` - Fetch user's bets for round

- `processPayouts(roundId)` - Auto-trigger payouts for all winners:
  ```typescript
  const winners = await getWinningUsers(roundId);
  for (const user of winners) {
    const amount = await PayoutCalculationService.calculateUserPayout(user.id, roundId);
    const txHash = await ContractService.claimWinningsForUser(roundId, user.address);
    await updateBet(user.betId, { status: 'won', payout_amount: amount, payout_tx_hash: txHash });
  }
  ```

---

### 3.4 `AgentBettingService`
**Purpose**: AI agent tile bet generation and evaluation

**Methods**:
- `generateAgentBets(roundId, agentId)`:
  - Query `agent_round_balances.starting_balance`
  - Get strategy from `AIAgentStrategyService`
  - Calculate current price column: `Math.floor(priceHistory.length)`
  - Generate tile bets ONLY for columns > `currentColumn + 1`
  - Use shared `calculateMultiplier()` function
  - Ensure sum = 100% of pool
  - Return array of tile bets

- `placeAgentBetsGradually(roundId, agentId, tileBets[])`:
  - **Spread over 30 seconds**: Place 1 bet every `30000 / tileBets.length` ms
  - For each tile: 
    - Call `ContractService.recordAgentTileBet()`
    - Insert into `agent_tile_bets`
    - Update `agent_round_balances.allocated_to_tiles`
    - Broadcast WebSocket: `agent_bet_placed`

- `evaluateBet(roundId, agentId, tileId, currentPrice)`:
  - Check if price crossed tile's target
  - Calculate win/loss based on multiplier
  - Update `agent_round_balances.current_balance`
  - Update `agent_tile_bets` status and profit_loss
  - Broadcast WebSocket: `agent_bet_resolved`

**Past Bet Prevention**:
```typescript
const currentColumn = Math.floor(priceHistory.length);
const minValidColumn = currentColumn + 2; // At least 2 tiles ahead
tileBets = tileBets.filter(bet => bet.colIndex >= minValidColumn);
```

---

### 3.5 `AIAgentStrategyService`
**Purpose**: Define 4 strategy patterns

**4 Strategies**:

**Alpha Bot (Aggressive)**
- Distribution: 20% near (2-4 cols ahead), 30% mid (5-9), 50% far (10+)
- Multiplier preference: High (2.5x+)
- Direction: Adaptive (follows 5-min trend)

**Beta Trader (Conservative)**
- Distribution: 60% near, 30% mid, 10% far
- Multiplier preference: Low (1.2x-1.8x)
- Direction: Neutral (50/50 above/below current price)

**Gamma Predictor (Momentum)**
- Distribution: 35% near, 45% mid, 20% far
- Multiplier preference: Medium (1.5x-2.5x)
- Direction: Bullish (70% on upper tiles)

**Delta Oracle (Contrarian)**
- Distribution: 25% near, 35% mid, 40% far
- Multiplier preference: Very high (3x+)
- Direction: Bearish (70% on lower tiles)

**Methods**:
- `getStrategy(agentId)` - Return strategy config
- `calculateBets(strategy, pool, currentPrice, currentColumn, priceHistory)` - Generate deterministic tile bets

**Deterministic Seeding**:
- Use `hash(roundId + agentId + timestamp)` for reproducibility

---

### 3.6 `TradingRoundService`
**Purpose**: Orchestrate round lifecycle and automation

**Main Auto-Loop**:
```typescript
async autoManageRounds() {
  console.log('🤖 Auto-round manager started');
  
  while (true) {
    try {
      // PHASE 1: BET PHASE
      const round = await this.startNewRound();
      console.log(`📢 Round ${round.round_number} - BETTING OPEN`);
      await sleep(BETTING_DURATION_MS); // 15 min (15 sec testing)
      
      // PHASE 2: TRADING PHASE START
      console.log(`🎯 Round ${round.round_number} - BETTING CLOSED, BOTS TRADING`);
      await this.transitionToBettingEnd(round.id);
      
      const tradingDuration = ROUND_DURATION_MS - BETTING_DURATION_MS; // 45 min
      await sleep(tradingDuration);
      
      // PHASE 3: CASHOUT PHASE
      console.log(`💰 Round ${round.round_number} - CASHOUT PHASE`);
      await this.settleRound(round.id);
      
      // PHASE 4: COOLDOWN
      console.log(`⏸️  Cooldown - Next round in 10 sec`);
      await sleep(10000);
      
    } catch (error) {
      console.error('❌ Round error:', error);
      await this.handleRoundFailure(round.id, error.message);
      await sleep(5000);
    }
  }
}
```

**Methods**:
- `startNewRound()` - Create round, initialize balances, broadcast
- `transitionToBettingEnd(roundId)` - Lock betting, trigger AI bets
- `monitorTradingPhase(roundId)` - Price monitoring, bet evaluation
- `settleRound(roundId)` - Calculate P&L, auto-payout winners
- `handleRoundFailure(roundId, reason)` - Cancel and refund

---

### 3.7 `PayoutCalculationService`
**Purpose**: Winnings math

**Methods**:
- `calculateAgentPnL(roundId, agentId)`:
  ```typescript
  finalBalance = starting + Σ(wonBets * multiplier) - Σ(lostBets)
  pnl = finalBalance - starting
  ```

- `determineWinners(roundId)`:
  ```typescript
  maxPnL = max(agentPnLs[])
  winners = agentIds where pnl === maxPnL
  ```

- `calculateUserPayout(userId, roundId)`:
  ```typescript
  totalPool = Σ(all user bets)
  platformCut = totalPool * 0.05
  prizePool = totalPool - platformCut
  
  if (user bet on winning agent):
    if (single winner):
      winnerAgentPool = Σ(bets on winner)
      userShare = userBet / winnerAgentPool
      payout = prizePool * userShare
    
    else if (multiple winners):
      allWinnersPool = Σ(bets on all winning agents)
      thisWinnerPool = Σ(bets on this specific winning agent)
      agentShare = thisWinnerPool / allWinnersPool
      userShare = userBet / thisWinnerPool
      payout = prizePool * agentShare * userShare
  ```

---

## 4. Shared Module: Tile Multiplier Calculation

**File**: `shared/tile-multiplier.ts` (symlinked between backend/frontend)

```typescript
export const TILE_CONFIG = {
  CELL_WIDTH: 60,
  PRICE_STEP: 1.5,
  HEAD_SCREEN_X: 250
} as const;

export function calculateMultiplier(tileCol: number, currentCol: number): number {
  const distance = tileCol - currentCol;
  if (distance <= 0) return 0; // Invalid (past)
  if (distance <= 3) return 1.1 + (distance * 0.1); // 1.2x-1.4x
  if (distance <= 8) return 1.5 + ((distance - 3) * 0.2); // 1.7x-2.5x
  return 2.5 + ((distance - 8) * 0.3); // 2.8x+
}

export function getTileTargetPrice(rowIndex: number, basePrice: number): number {
  return basePrice + (rowIndex * TILE_CONFIG.PRICE_STEP);
}

export function isPriceInTileRange(price: number, tileRowIndex: number, basePrice: number): boolean {
  const tileBottom = getTileTargetPrice(tileRowIndex, basePrice);
  const tileTop = getTileTargetPrice(tileRowIndex + 1, basePrice);
  return price >= tileBottom && price < tileTop;
}
```

---

## 5. API Endpoints

### Trading Rounds
- `GET /api/trading/rounds/current` → Active round info
- `GET /api/trading/rounds/:id` → Specific round details
- `GET /api/trading/rounds/history` → Past 20 rounds

### Agents
- `GET /api/trading/agents` → 4 agents with lifetime stats
- `GET /api/trading/agents/:id/performance` → Win rate, avg P&L

### Betting
- `POST /api/trading/bets` → Place user bet (verify tx, min 0.1 MON)
- `GET /api/trading/bets/user/:userId` → User's bet history

### Live Data
- `GET /api/trading/rounds/:id/leaderboard` → Current P&L rankings
- `GET /api/trading/rounds/:id/agent-bets/:agentId` → Agent's tile positions

### Admin
- `POST /api/admin/rounds/cancel/:roundId` → Emergency cancel
- `GET /api/admin/rounds/:id/audit` → Full data dump

---

## 6. WebSocket Events

### Round Lifecycle
- `round_started` → `{ roundId, bettingEndTime, roundEndTime, agents[] }`
- `betting_ending` → `{ roundId, secondsRemaining }` (30 sec warning)
- `trading_started` → `{ roundId, agentPools[], tradingEndTime }`
- `round_settled` → `{ roundId, winners[], finalPnLs[], userPayouts[] }`
- `round_cancelled` → `{ roundId, reason }`

### Real-Time Updates (Every 5 Seconds)
- `agent_pool_update` → `{ roundId, agentId, newPoolSize, backerCount }`
- `agent_bet_placed` → `{ roundId, agentId, tileCol, tileRow, amount, multiplier }`
- `agent_bet_resolved` → `{ roundId, agentId, tileId, won: bool, profitLoss }`
- `leaderboard_update` → `{ roundId, rankings: [{ agentId, pnl, rank }] }`
- `price_update` → `{ roundId, price, timestamp }` (every 1 sec from Binance)

---

## 7. CLI Admin Commands

### Setup in `backend/package.json`:
```json
{
  "scripts": {
    "admin:start-round": "bun run src/cli/start-round.ts",
    "admin:cancel-round": "bun run src/cli/cancel-round.ts",
    "admin:settle-round": "bun run src/cli/settle-round.ts",
    "admin:view-round": "bun run src/cli/view-round.ts",
    "admin:list-rounds": "bun run src/cli/list-rounds.ts",
    "admin:seed-agents": "bun run src/cli/seed-agents.ts",
    "admin:stop-rounds": "bun run src/cli/stop-rounds.ts"
  }
}
```

### Usage:
```bash
# Seed 4 AI agents (run once)
cd backend
bun run admin:seed-agents

# Manually start a round (for testing)
bun run admin:start-round

# View round status
bun run admin:view-round <roundId>

# Cancel stuck round
bun run admin:cancel-round <roundId>

# List all rounds
bun run admin:list-rounds

# Emergency stop auto-loop
bun run admin:stop-rounds
```

---

## 8. Frontend Integration

### Enhanced `TapTrading.tsx` Layout

```
┌─────────────────────────────────────────────────────┐
│ Round #42 | Phase: TRADING | Time: 8:34 remaining   │
├──────────────┬──────────────────────┬────────────────┤
│              │                      │ Leaderboard    │
│ Agent Cards  │   Betting Grid       │ 1. Alpha +25   │
│ (4 agents)   │   (with AI overlays) │ 2. Gamma +10   │
│              │                      │ 3. Beta -5     │
│ [Bet Panel]  │                      │ 4. Delta -15   │
│              │                      ├────────────────┤
│              │                      │ Your Bets      │
│              │                      │ Alpha: 10 MON  │
│              │                      │ Est: +15.8 MON │
└──────────────┴──────────────────────┴────────────────┘
```

### New Components

**`<RoundPhaseHeader>`**
- Phase badge (BETTING = green, TRADING = yellow, SETTLED = blue)
- Countdown timer with millisecond precision
- Round number display

**`<AgentCard>` (4 instances)**
- Agent avatar with color coding
- Strategy tooltip
- Current pool size (live updates)
- Bet button (disabled during trading/settled)
- Shows user's existing bet

**`<BettingGrid>` (enhanced)**
- Existing price grid
- Overlay: colored dots for agent tile bets
- Tooltip: "Alpha: 5 MON @ 2.3x → WON +6.5"

**`<AgentLeaderboard>`**
- Live P&L bars (animated)
- Color-coded by rank
- Win probability estimate

**`<UserBetsPanel>`**
- User's bets in current round
- Total invested
- Estimated payout

---

## 9. Environment Configuration

### Production (`.env.production`)
```bash
ROUND_DURATION_MS=900000          # 15 min
BETTING_DURATION_MS=900000        # 15 min  
PLATFORM_CUT_PERCENT=5
MIN_BET_MON=0.1
AGENT_BET_SPREAD_DURATION_MS=30000 # 30 sec
```

### Testing (`.env.development`)
```bash
NODE_ENV=development
TESTING_MODE=true
TEST_ROUND_DURATION_MS=60000       # 1 min
TEST_BETTING_DURATION_MS=15000     # 15 sec
TEST_AGENT_BET_SPREAD_MS=5000      # 5 sec
```

---

## 10. Deployment

### Smart Contract
```bash
forge create TradingRoundManager --rpc-url $MONAD_RPC --private-key $ADMIN_KEY
forge verify-contract <address> TradingRoundManager --chain monad-testnet
```

### Database
```bash
cd backend
bun run db:generate
bun run db:push
bun run admin:seed-agents
```

### Backend (PM2)
```json
{
  "apps": [{
    "name": "trading-backend",
    "script": "src/index.ts",
    "interpreter": "bun",
    "instances": 1,
    "autorestart": true,
    "env": {
      "NODE_ENV": "production",
      "ROUND_DURATION_MS": "900000"
    }
  }]
}
```

```bash
pm2 start ecosystem.config.json --env production
pm2 save
```

---

## 11. File Structure

```
backend/src/
├── services/
│   ├── price.service.ts
│   ├── contract.service.ts
│   ├── player-betting.service.ts
│   ├── agent-betting.service.ts
│   ├── ai-agent-strategy.service.ts
│   ├── trading-round.service.ts
│   └── payout-calculation.service.ts
├── routes/
│   ├── trading-round.routes.ts
│   └── admin.routes.ts
├── cli/
│   ├── start-round.ts
│   ├── cancel-round.ts
│   ├── settle-round.ts
│   ├── view-round.ts
│   ├── list-rounds.ts
│   └── seed-agents.ts
├── shared/
│   └── tile-multiplier.ts
├── contracts/
│   └── TradingRoundManager.sol
└── db/schema.ts

frontend/src/
├── pages/
│   └── TapTrading.tsx
├── components/trading/
│   ├── RoundPhaseHeader.tsx
│   ├── AgentCard.tsx
│   ├── BettingGrid.tsx
│   ├── AgentLeaderboard.tsx
│   └── UserBetsPanel.tsx
└── shared/
    └── tile-multiplier.ts (symlink)
```

---

## 12. Key Requirements Summary

✅ **Automated Loop**: Runs continuously without manual intervention  
✅ **Phase Flow**: Bet → Trading → Cashout → Cooldown → Repeat  
✅ **Price Source**: Binance WebSocket (BTC/USDT)  
✅ **Agent Bets**: 100% pool usage, spread over 30 seconds  
✅ **Multiplier Sync**: Shared calculation between frontend/backend  
✅ **Past Bet Prevention**: Only future tiles allowed  
✅ **Platform Cut**: 5% from total pool  
✅ **Tie Handling**: Multiple winners share prize proportionally  
✅ **Auto Payouts**: Backend triggers all winner payouts  
✅ **Failure Handling**: Price API disconnect = cancel + refund  
✅ **Testing Mode**: 1-min rounds (15s bet, 45s trade, 10s cooldown)  
✅ **CLI Commands**: Emergency controls for admin  

---

## Implementation Checklist

- [ ] Deploy smart contract to Monad testnet
- [ ] Create database schema + migrations
- [ ] Implement 7 backend services
- [ ] Create shared tile-multiplier module
- [ ] Build API endpoints
- [ ] Integrate WebSocket events
- [ ] Create CLI admin commands
- [ ] Update frontend components
- [ ] Add auto-loop to index.ts
- [ ] Test full round cycle (local)
- [ ] Deploy to production
- [ ] Monitor auto-loop health

---

**Plan saved**: `TRADING_SYSTEM_PLAN.md`  
**Ready for implementation**: Awaiting approval to begin coding
