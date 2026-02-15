import type { ServerWebSocket } from 'bun';

type WebSocketData = {
  userId?: string;
  subscribedRounds: Set<string>;
};

export class WebSocketService {
  private clients: Set<ServerWebSocket<WebSocketData>> = new Set();

  addClient(ws: ServerWebSocket<WebSocketData>) {
    this.clients.add(ws);
    console.log(`✅ WebSocket client connected. Total: ${this.clients.size}`);
  }

  removeClient(ws: ServerWebSocket<WebSocketData>) {
    this.clients.delete(ws);
    console.log(`❌ WebSocket client disconnected. Total: ${this.clients.size}`);
  }

  subscribeToRound(ws: ServerWebSocket<WebSocketData>, roundId: string) {
    ws.data.subscribedRounds.add(roundId);
  }

  unsubscribeFromRound(ws: ServerWebSocket<WebSocketData>, roundId: string) {
    ws.data.subscribedRounds.delete(roundId);
  }

  // Round Lifecycle Events
  broadcastRoundStarted(roundId: string, data: any) {
    this.broadcast('round_started', { roundId, ...data });
  }

  broadcastBettingEnding(roundId: string, secondsRemaining: number) {
    this.broadcast('betting_ending', { roundId, secondsRemaining }, roundId);
  }

  broadcastTradingStarted(roundId: string, data: any) {
    this.broadcast('trading_started', { roundId, ...data }, roundId);
  }

  broadcastRoundSettled(roundId: string, data: any) {
    this.broadcast('round_settled', { roundId, ...data }, roundId);
  }

  broadcastRoundCancelled(roundId: string, reason: string) {
    this.broadcast('round_cancelled', { roundId, reason }, roundId);
  }

  // Real-time Updates
  broadcastAgentPoolUpdate(roundId: string, data: any) {
    this.broadcast('agent_pool_update', { roundId, ...data }, roundId);
  }

  broadcastAgentBetPlaced(roundId: string, data: any) {
    this.broadcast('agent_bet_placed', { roundId, ...data }, roundId);
  }

  broadcastAgentBetResolved(roundId: string, data: any) {
    this.broadcast('agent_bet_resolved', { roundId, ...data }, roundId);
  }

  broadcastLeaderboardUpdate(roundId: string, rankings: any[]) {
    this.broadcast('leaderboard_update', { roundId, rankings }, roundId);
  }

  broadcastPriceUpdate(roundId: string, price: string, timestamp: Date) {
    this.broadcast('price_update', { roundId, price, timestamp }, roundId);
  }

  private broadcast(event: string, data: any, roundId?: string) {
    const message = JSON.stringify({ event, data, timestamp: new Date() });

    let sentCount = 0;
    this.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        // If roundId specified, only send to subscribers
        if (roundId) {
          if (client.data.subscribedRounds.has(roundId)) {
            client.send(message);
            sentCount++;
          }
        } else {
          // Broadcast to all
          client.send(message);
          sentCount++;
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Broadcast ${event} to ${sentCount} clients`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
