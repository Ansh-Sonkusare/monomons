import WebSocket from 'ws';
import { db } from '../db';
import { priceSnapshots } from '../db/schema';

type PriceCallback = (price: string) => void;

export class PriceService {
  private ws: WebSocket | null = null;
  private currentPrice: string = '0';
  private lastMessage: number = 0;
  private subscribers: Map<string, PriceCallback> = new Map();
  private snapshotInterval: Timer | null = null;
  private activeRoundId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect() {
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

    this.ws.on('open', () => {
      console.log('✅ Connected to Binance WebSocket');
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', (data: Buffer) => {
      const ticker = JSON.parse(data.toString());
      this.currentPrice = ticker.c; // Current price
      this.lastMessage = Date.now();

      // Notify all subscribers
      this.subscribers.forEach((callback) => callback(this.currentPrice));
    });

    this.ws.on('error', (error) => {
      console.error('❌ Binance WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.warn('⚠️ Binance WebSocket disconnected');
      this.handleDisconnection();
    });

    // Start monitoring connection health
    this.startHealthCheck();
  }

  private startHealthCheck() {
    setInterval(() => {
      if (Date.now() - this.lastMessage > 30000) {
        console.error('❌ No price data for 30+ seconds, triggering disconnect handler');
        this.handleDisconnection();
      }
    }, 5000);
  }

  private async handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));
      await this.connect();
    } else {
      console.error('❌ Max reconnect attempts reached - round must be cancelled');
      // TODO: Trigger round cancellation via TradingRoundService
    }
  }

  getCurrentPrice(): string {
    return this.currentPrice;
  }

  subscribeToRound(roundId: string, callback: PriceCallback) {
    this.activeRoundId = roundId;
    this.subscribers.set(roundId, callback);

    // Start recording snapshots every 5 seconds
    this.snapshotInterval = setInterval(async () => {
      await this.recordSnapshot(roundId, this.currentPrice);
    }, 5000);
  }

  unsubscribeFromRound(roundId: string) {
    this.subscribers.delete(roundId);
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
    this.activeRoundId = null;
  }

  private async recordSnapshot(roundId: string, price: string) {
    try {
      await db.insert(priceSnapshots).values({
        roundId,
        timestamp: new Date(),
        price,
        source: 'binance',
      });
    } catch (error) {
      console.error('Failed to record price snapshot:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    this.subscribers.clear();
  }
}

export const priceService = new PriceService();
