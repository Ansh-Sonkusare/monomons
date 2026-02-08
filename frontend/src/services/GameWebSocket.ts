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

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private onPlayersUpdate?: (players: OnlinePlayer[]) => void;
  private onPlayerJoined?: (player: OnlinePlayer) => void;
  private onPlayerLeft?: (playerId: string) => void;
  private onPlayerMoved?: (playerId: string, position: PlayerPosition) => void;
  private onAuthSuccess?: (player: OnlinePlayer, onlinePlayers: OnlinePlayer[]) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private authenticated = false;

  constructor(token: string) {
    this.token = token;
  }

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
    this.ws = new WebSocket(`${wsUrl}/ws/game`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
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
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.authenticated = false;
      this.attemptReconnect();
    };
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case "auth_success":
        console.log("Authentication successful", message.player);
        this.authenticated = true;
        if (this.onAuthSuccess) {
          this.onAuthSuccess(message.player, message.onlinePlayers);
        }
        break;

      case "player_joined":
        console.log("Player joined:", message.player);
        if (this.onPlayerJoined) {
          this.onPlayerJoined(message.player);
        }
        break;

      case "player_left":
        console.log("Player left:", message.playerId);
        if (this.onPlayerLeft) {
          this.onPlayerLeft(message.playerId);
        }
        break;

      case "player_moved":
        if (this.onPlayerMoved) {
          this.onPlayerMoved(message.playerId, message.position);
        }
        break;

      case "error":
        console.error("Server error:", message.error);
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  sendMove(position: PlayerPosition) {
    if (!this.authenticated) return;
    this.send({
      type: "move",
      position,
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event handlers
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
