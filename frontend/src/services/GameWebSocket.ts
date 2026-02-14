import { logger } from '../utils/logger';

export interface PlayerPosition {
  x: number;
  y: number;
  direction: string;
}

export interface OnlinePlayer {
  id: string;
  address: string;
  username: string | null;
  position: PlayerPosition;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface BattlePokemon {
    id: string; 
    speciesName: string;
    speciesId: number;
    types: string[];
    stats: {
        hp: number;
        maxHp: number;
        attack: number;
        defense: number;
        spAttack: number;
        spDefense: number;
        speed: number;
    };
    moves: { name: string; type: string }[];
    ability: { name: string; description?: string };
    status?: string;
    cooldowns: Record<string, number>;
}

export interface BattlePlayer {
    id: string;
    name: string;
    team: BattlePokemon[];
    activePokemonIndex: number;
    faintedCount: number;
}

export interface BattleState {
    id: string;
    turn: number;
    playerA: BattlePlayer;
    playerB: BattlePlayer;
    log: string[];
    winner?: string;
    phase: 'betting' | 'waiting' | 'action' | 'finished';
    bettingEndTime?: number;
    canBet: boolean;
}

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private onPlayerJoined?: (player: OnlinePlayer) => void;
  private onPlayerLeft?: (playerId: string) => void;
  private onPlayerMoved?: (playerId: string, position: PlayerPosition) => void;
  private onAuthSuccess?: (player: OnlinePlayer, onlinePlayers: OnlinePlayer[]) => void;
  
  private onRoomState?: (players: OnlinePlayer[]) => void;
  private onRoomPlayerJoined?: (player: OnlinePlayer) => void;
  private onRoomPlayerLeft?: (playerId: string) => void;
  private onRoomMessage?: (message: ChatMessage) => void;
  
  private onBattleStateUpdate?: (state: BattleState) => void;

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private authenticated = false;
  private pendingRoomJoin: string | null = null;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
    this.ws = new WebSocket(`${wsUrl}/ws/game`);

    this.ws.onopen = () => {
      logger.info('websocket', 'WebSocket connected');
      this.reconnectAttempts = 0;
      this.authenticated = false;
      
      // Authenticate immediately after connection
      this.send({
        type: "auth",
        token: this.token,
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        logger.error('websocket', 'Failed to parse WebSocket message', error);
      }
    };

    this.ws.onerror = (error) => {
      logger.error('websocket', 'WebSocket error', error);
    };

    this.ws.onclose = () => {
      logger.info('websocket', 'WebSocket disconnected');
      this.authenticated = false;
      this.attemptReconnect();
    };
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "auth_success":
        logger.info('websocket', 'Authentication successful', message.player);
        this.authenticated = true;
        if (this.onAuthSuccess) {
          this.onAuthSuccess(message.player, message.onlinePlayers);
        }
        if (this.pendingRoomJoin) {
            this.send({ type: 'join_room', roomId: this.pendingRoomJoin });
            this.pendingRoomJoin = null;
        }
        break;

      case "player_joined":
        logger.info('websocket', 'Player joined', message.player);
        if (this.onPlayerJoined) {
          this.onPlayerJoined(message.player);
        }
        break;

      case "player_left":
        logger.info('websocket', 'Player left', message.playerId);
        if (this.onPlayerLeft) {
          this.onPlayerLeft(message.playerId);
        }
        break;
      
      case "room_state":
        if (this.onRoomState) this.onRoomState(message.players);
        break;
        
      case "room_player_joined":
        if (this.onRoomPlayerJoined) this.onRoomPlayerJoined(message.player);
        break;

      case "room_player_left":
        if (this.onRoomPlayerLeft) this.onRoomPlayerLeft(message.playerId);
        break;

      case "room_message":
        if (this.onRoomMessage) this.onRoomMessage(message.message);
        break;

      case "battle_state":
      case "battle_update":
        if (this.onBattleStateUpdate) this.onBattleStateUpdate(message.state);
        break;

      case "player_moved":
        if (this.onPlayerMoved) {
          this.onPlayerMoved(message.playerId, message.position);
        }
        break;

      case "error":
        logger.error('websocket', 'Server error', message.error);
        break;

      default:
        logger.info('websocket', 'Unknown message type', message.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      logger.info('websocket', `Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      logger.error('websocket', 'Max reconnection attempts reached');
    }
  }

  sendMove(position: PlayerPosition) {
    if (!this.authenticated) return;
    this.send({
      type: "move",
      position,
    });
  }

  joinRoom(roomId: string) {
    if (this.authenticated) {
        this.send({ type: 'join_room', roomId });
    } else {
        this.pendingRoomJoin = roomId;
    }
  }

  sendChatMessage(roomId: string, text: string) {
    if (!this.authenticated) return;
    this.send({
        type: 'chat_message',
        roomId,
        text
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      logger.warn('websocket', 'WebSocket is not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event handlers
  onBattleUpdate(callback: (state: BattleState) => void) {
      this.onBattleStateUpdate = callback;
  }

  onRoomEvent(
    callbacks: {
        onState?: (players: OnlinePlayer[]) => void;
        onJoin?: (player: OnlinePlayer) => void;
        onLeave?: (playerId: string) => void;
        onMessage?: (message: ChatMessage) => void;
    }
  ) {
      if (callbacks.onState) this.onRoomState = callbacks.onState;
      if (callbacks.onJoin) this.onRoomPlayerJoined = callbacks.onJoin;
      if (callbacks.onLeave) this.onRoomPlayerLeft = callbacks.onLeave;
      if (callbacks.onMessage) this.onRoomMessage = callbacks.onMessage;
  }

  onAuth(callback: (player: OnlinePlayer, onlinePlayers: OnlinePlayer[]) => void) {
    this.onAuthSuccess = callback;
  }

  onPlayerJoin(callback: (player: OnlinePlayer) => void) {
    this.onPlayerJoined = callback;
  }

  onPlayerLeave(callback: (playerId: string) => void) {
    this.onPlayerLeft = callback;
  }

  onPlayerMove(callback: (playerId: string, position: PlayerPosition) => void) {
    this.onPlayerMoved = callback;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
