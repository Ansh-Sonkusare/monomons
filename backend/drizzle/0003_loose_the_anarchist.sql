CREATE TABLE "agent_round_balances" (
	"round_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"starting_balance" text DEFAULT '0' NOT NULL,
	"allocated_to_tiles" text DEFAULT '0' NOT NULL,
	"current_balance" text DEFAULT '0' NOT NULL,
	"tiles_won" integer DEFAULT 0 NOT NULL,
	"tiles_lost" integer DEFAULT 0 NOT NULL,
	"final_pnl" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_tile_bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"tile_col_index" integer NOT NULL,
	"tile_row_index" integer NOT NULL,
	"target_price" text NOT NULL,
	"amount" text NOT NULL,
	"multiplier" real NOT NULL,
	"contract_tx_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"profit_loss" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"strategy_type" text NOT NULL,
	"avatar_color" text NOT NULL,
	"total_wins" integer DEFAULT 0 NOT NULL,
	"total_rounds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"price" text NOT NULL,
	"source" text DEFAULT 'binance' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_number" integer NOT NULL,
	"contract_round_id" text NOT NULL,
	"status" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"betting_end_time" timestamp NOT NULL,
	"round_end_time" timestamp NOT NULL,
	"starting_price" text,
	"final_price" text,
	"winner_agent_ids" uuid[],
	"total_pool" text,
	"platform_cut" text,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_agent_bets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"amount" text NOT NULL,
	"tx_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_amount" text,
	"payout_tx_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_agent_bets_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
ALTER TABLE "agent_round_balances" ADD CONSTRAINT "agent_round_balances_round_id_trading_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."trading_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_round_balances" ADD CONSTRAINT "agent_round_balances_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tile_bets" ADD CONSTRAINT "agent_tile_bets_round_id_trading_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."trading_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tile_bets" ADD CONSTRAINT "agent_tile_bets_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_round_id_trading_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."trading_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agent_bets" ADD CONSTRAINT "user_agent_bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agent_bets" ADD CONSTRAINT "user_agent_bets_round_id_trading_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."trading_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_agent_bets" ADD CONSTRAINT "user_agent_bets_agent_id_ai_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pk_agent_round_balances" ON "agent_round_balances" USING btree ("round_id","agent_id");--> statement-breakpoint
CREATE INDEX "idx_balances_round" ON "agent_round_balances" USING btree ("round_id","agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_bets_round" ON "agent_tile_bets" USING btree ("round_id","agent_id","status");--> statement-breakpoint
CREATE INDEX "idx_rounds_status" ON "trading_rounds" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_bets_round" ON "user_agent_bets" USING btree ("round_id","agent_id","status");