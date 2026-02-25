import { pgTable, text, timestamp, uuid, boolean, integer, real, jsonb } from 'drizzle-orm/pg-core';

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
    choice: text("choice").notNull(),
    amount: text("amount").notNull(),
    txHash: text("tx_hash").unique().notNull(),
    status: text("status").default('pending'),
    createdAt: timestamp("created_at").defaultNow(),
    payoutTxHash: text("payout_tx_hash"),
});

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: integer('token_id').notNull().unique(),
  ownerAddress: text('owner_address').notNull(),
  rarity: text('rarity').notNull(),
  species: text('species').notNull(),
  stats: jsonb('stats'),
  moves: jsonb('moves'),
  ability: text('ability'),
  metadata: jsonb('metadata'),
  txHash: text('tx_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenId: integer('token_id').notNull().unique(),
  ownerAddress: text('owner_address').notNull(),
  rarity: text('rarity').notNull(),
  cardType: text('card_type').notNull(),
  effect: jsonb('effect'),
  name: text('name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  txHash: text('tx_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolls = pgTable('rolls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  userAddress: text('user_address').notNull(),
  rollType: text('roll_type').notNull(),
  cost: text('cost').notNull(),
  rarity: text('rarity'),
  resultTokenId: integer('result_token_id'),
  status: text('status').default('pending'),
  vrfRequestId: text('vrf_request_id'),
  txHash: text('tx_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userTeams = pgTable('user_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  characterId: uuid('character_id').notNull().references(() => characters.id),
  slot: integer('slot').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Bet = typeof bets.$inferSelect;
export type NewBet = typeof bets.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Roll = typeof rolls.$inferSelect;
export type NewRoll = typeof rolls.$inferInsert;
export type UserTeam = typeof userTeams.$inferSelect;
export type NewUserTeam = typeof userTeams.$inferInsert;
