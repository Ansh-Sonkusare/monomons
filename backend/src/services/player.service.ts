import { db } from "../db";
import { players, users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface PlayerPosition {
  x: number;
  y: number;
  direction: string;
}

export interface OnlinePlayer {
  id: string;
  userId: string;
  address: string;
  username: string | null;
  position: PlayerPosition;
  lastSeen: Date;
  roomId?: string;
  sessionId?: string;
}

class PlayerStateManager {
  private onlinePlayers: Map<string, OnlinePlayer> = new Map();
  private dirtyPlayers: Set<string> = new Set();
  private saveInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Save player states every 2 seconds
    this.saveInterval = setInterval(() => this.flushUpdates(), 2000);
  }

  async getOrCreatePlayer(userId: string, address: string) {
    // Check if user exists in DB by address
    const [user] = await db.select().from(users).where(eq(users.address, address)).limit(1);
    
    if (!user) {
      throw new Error("User not found");
    }

    let [player] = await db
      .select()
      .from(players)
      .where(eq(players.userId, user.id))
      .limit(1);

    // Check if player is already online BEFORE doing anything else
    if (player) {
      const existingOnline = this.onlinePlayers.get(player.id);
      if (existingOnline) {
        console.log(`Player ${player.id} already has active session, reusing it`);
        return existingOnline;
      }
    }

    if (!player) {
      // Create new player
      [player] = await db
        .insert(players)
        .values({
          userId: user.id,
          username: address.slice(0, 10),
          positionX: 0,
          positionY: 0,
          direction: "down",
          isOnline: true,
          lastSeen: new Date(),
        })
        .returning();
    } else {
      // Update online status
      await db
        .update(players)
        .set({ isOnline: true, lastSeen: new Date() })
        .where(eq(players.id, player.id));
    }

    const onlinePlayer: OnlinePlayer = {
      id: player.id,
      userId: player.userId,
      address,
      username: player.username,
      position: {
        x: player.positionX,
        y: player.positionY,
        direction: player.direction,
      },
      lastSeen: player.lastSeen,
      sessionId: Math.random().toString(36).substring(2) + Date.now().toString(),
    };

    this.onlinePlayers.set(player.id, onlinePlayer);
    return onlinePlayer;
  }

  async updatePlayerPosition(playerId: string, position: PlayerPosition) {
    const player = this.onlinePlayers.get(playerId);
    if (!player) return;

    player.position = position;
    player.lastSeen = new Date();

    // Mark as dirty instead of saving immediately
    this.dirtyPlayers.add(playerId);
  }

  private async flushUpdates() {
    if (this.dirtyPlayers.size === 0) return;

    const playersToSave = Array.from(this.dirtyPlayers);
    this.dirtyPlayers.clear();

    for (const playerId of playersToSave) {
      const player = this.onlinePlayers.get(playerId);
      if (!player) continue;

      try {
        await db
          .update(players)
          .set({
            positionX: player.position.x,
            positionY: player.position.y,
            direction: player.position.direction,
            lastSeen: player.lastSeen,
          })
          .where(eq(players.id, playerId));
      } catch (error) {
        console.error("Failed to save player state:", error);
      }
    }
  }

  async removePlayer(playerId: string, sessionId?: string) {
    const player = this.onlinePlayers.get(playerId);
    
    // If sessionId provided, only delete if it matches (prevent race condition on refresh)
    if (sessionId && player?.sessionId && player.sessionId !== sessionId) {
        console.log(`Skipping removePlayer for ${playerId}: sessionId mismatch`);
        return;
    }

    this.onlinePlayers.delete(playerId);
    this.dirtyPlayers.delete(playerId); // Remove from pending updates

    // Update offline status in DB with final position
    if (player) {
      await db
        .update(players)
        .set({
          positionX: player.position.x,
          positionY: player.position.y,
          direction: player.position.direction,
          isOnline: false,
          lastSeen: new Date()
        })
        .where(eq(players.id, playerId));
    } else {
      await db
        .update(players)
        .set({ isOnline: false, lastSeen: new Date() })
        .where(eq(players.id, playerId));
    }
  }

  getOnlinePlayers(): OnlinePlayer[] {
    return Array.from(this.onlinePlayers.values());
  }

  getPlayersInRoom(roomId: string): OnlinePlayer[] {
    return Array.from(this.onlinePlayers.values()).filter(p => p.roomId === roomId);
  }

  setPlayerRoom(playerId: string, roomId: string | null) {
    const player = this.onlinePlayers.get(playerId);
    if (!player) return;
    
    if (roomId) {
      player.roomId = roomId;
    } else {
      delete player.roomId;
    }
  }

  getPlayer(playerId: string): OnlinePlayer | undefined {
    return this.onlinePlayers.get(playerId);
  }
}

export const playerStateManager = new PlayerStateManager();
