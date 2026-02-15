import { pgTable, text, timestamp, uuid, boolean, integer, real, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  address: text('address').notNull().unique(),
  nonce: text('nonce'),
  nonceTimestamp: timestamp('nonce_timestamp'),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiAgents = pgTable('ai_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  strategyType: text('strategy_type').notNull(),
  avatarColor: text('avatar_color').notNull(),
  totalWins: integer('total_wins').default(0).notNull(),
  totalRounds: integer('total_rounds').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tradingRounds = pgTable('trading_rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundNumber: integer('round_number').notNull(),
  contractRoundId: text('contract_round_id').notNull(),
  status: text('status').notNull(), // BETTING, TRADING, SETTLING, SETTLED, CANCELLED
  startTime: timestamp('start_time').notNull(),
  bettingEndTime: timestamp('betting_end_time').notNull(),
  roundEndTime: timestamp('round_end_time').notNull(),
  startingPrice: text('starting_price'),
  finalPrice: text('final_price'),
  winnerAgentIds: uuid('winner_agent_ids').array(),
  totalPool: text('total_pool'),
  platformCut: text('platform_cut'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  statusIdx: index('idx_rounds_status').on(table.status, table.createdAt),
}));

export const userAgentBets = pgTable('user_agent_bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roundId: uuid('round_id').notNull().references(() => tradingRounds.id),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id),
  amount: text('amount').notNull(),
  txHash: text('tx_hash').notNull().unique(),
  status: text('status').default('pending').notNull(), // pending, won, lost, refunded
  payoutAmount: text('payout_amount'),
  payoutTxHash: text('payout_tx_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userBetsIdx: index('idx_user_bets_round').on(table.roundId, table.agentId, table.status),
}));

export const agentTileBets = pgTable('agent_tile_bets', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id').notNull().references(() => tradingRounds.id),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id),
  tileColIndex: integer('tile_col_index').notNull(),
  tileRowIndex: integer('tile_row_index').notNull(),
  targetPrice: text('target_price').notNull(),
  amount: text('amount').notNull(),
  multiplier: real('multiplier').notNull(),
  contractTxHash: text('contract_tx_hash'),
  status: text('status').default('pending').notNull(), // pending, won, lost
  profitLoss: text('profit_loss'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  agentBetsIdx: index('idx_agent_bets_round').on(table.roundId, table.agentId, table.status),
}));

export const agentRoundBalances = pgTable('agent_round_balances', {
  roundId: uuid('round_id').notNull().references(() => tradingRounds.id),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id),
  startingBalance: text('starting_balance').default('0').notNull(),
  allocatedToTiles: text('allocated_to_tiles').default('0').notNull(),
  currentBalance: text('current_balance').default('0').notNull(),
  tilesWon: integer('tiles_won').default(0).notNull(),
  tilesLost: integer('tiles_lost').default(0).notNull(),
  finalPnl: text('final_pnl'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: index('pk_agent_round_balances').on(table.roundId, table.agentId),
  balancesIdx: index('idx_balances_round').on(table.roundId, table.agentId),
}));

export const priceSnapshots = pgTable('price_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id').notNull().references(() => tradingRounds.id),
  timestamp: timestamp('timestamp').notNull(),
  price: text('price').notNull(),
  source: text('source').default('binance').notNull(),
});

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  username: text('username'),
  positionX: real('position_x').default(0).notNull(),
  positionY: real('position_y').default(0).notNull(),
  direction: text('direction').default('down').notNull(),
  isOnline: boolean('is_online').default(false).notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bets = pgTable("bets", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    userAddress: text("user_address").notNull(),
    roomId: text("room_id").notNull(),
    choice: text("choice").notNull(), // 'playerA' or 'playerB'
    amount: text("amount").notNull(), // ETH amount (store as string/wei)
    txHash: text("tx_hash").unique().notNull(),
    status: text("status").default('pending'), // 'pending', 'won', 'lost', 'refunded'
    createdAt: timestamp("created_at").defaultNow(),
    payoutTxHash: text("payout_tx_hash"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AiAgent = typeof aiAgents.$inferSelect;
export type NewAiAgent = typeof aiAgents.$inferInsert;
export type TradingRound = typeof tradingRounds.$inferSelect;
export type NewTradingRound = typeof tradingRounds.$inferInsert;
export type UserAgentBet = typeof userAgentBets.$inferSelect;
export type NewUserAgentBet = typeof userAgentBets.$inferInsert;
export type AgentTileBet = typeof agentTileBets.$inferSelect;
export type NewAgentTileBet = typeof agentTileBets.$inferInsert;
export type AgentRoundBalance = typeof agentRoundBalances.$inferSelect;
export type NewAgentRoundBalance = typeof agentRoundBalances.$inferInsert;
export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type NewPriceSnapshot = typeof priceSnapshots.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Bet = typeof bets.$inferSelect;
export type NewBet = typeof bets.$inferInsert;
