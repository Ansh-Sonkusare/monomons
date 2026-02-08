import { Camera } from './Camera';
import { WorldManager } from '../world/WorldManager';
import { Player, Direction } from '../entities/Player';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../renderer/Renderer';
import { FRAME_TIME, TILE_SIZE } from '../../../utils/Constants';
import { GameWebSocket, type OnlinePlayer } from '../../../services/GameWebSocket';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private camera: Camera;
    private world: WorldManager;
    private player: Player;
    private input: InputManager;
    private renderer: Renderer;
    private lastFrameTime: number;
    private animationId: number | null;
    private ws: GameWebSocket | null = null;
    private otherPlayers: Map<string, Player> = new Map();
    private lastPositionSent: { x: number; y: number } = { x: 0, y: 0 };
    private positionSendInterval = 100; // Send position every 100ms
    private lastPositionSendTime = 0;

    constructor(canvas: HTMLCanvasElement, token?: string) {
        this.canvas = canvas;
        this.resizeCanvas();

        // Initialize systems
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.world = new WorldManager(); // Random seed
        this.player = new Player(TILE_SIZE * 10, TILE_SIZE * 10); // Start position
        this.input = new InputManager();
        this.renderer = new Renderer(canvas);

        this.lastFrameTime = performance.now();
        this.animationId = null;

        if (token) {
            this.initWebSocket(token);
        }

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    private resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.camera) {
            this.camera.updateSize(this.canvas.width, this.canvas.height);
        }
    }

    private initWebSocket(token: string): void {
        this.ws = new GameWebSocket(token);

        this.ws.onAuth((player, onlinePlayers) => {
            console.log("Authenticated as:", player);
            // Set player position from server
            this.player.x = player.position.x;
            this.player.y = player.position.y;
            this.lastPositionSent = { x: this.player.x, y: this.player.y };

            // Add other online players
            onlinePlayers.forEach((otherPlayer) => {
                if (otherPlayer.id !== player.id) {
                    this.addOtherPlayer(otherPlayer);
                }
            });
        });

        this.ws.onPlayerJoin((player) => {
            console.log("New player joined:", player);
            this.addOtherPlayer(player);
        });

        this.ws.onPlayerLeave((playerId) => {
            console.log("Player left:", playerId);
            this.otherPlayers.delete(playerId);
        });

        this.ws.onPlayerMove((playerId, position) => {
            const otherPlayer = this.otherPlayers.get(playerId);
            if (otherPlayer) {
                console.log(`Player ${playerId} moved to`, position);
                otherPlayer.x = position.x;
                otherPlayer.y = position.y;
                // Convert string direction to enum
                try {
                    const directionMap: { [key: string]: Direction } = {
                        'up': Direction.UP,
                        'down': Direction.DOWN,
                        'left': Direction.LEFT,
                        'right': Direction.RIGHT
                    };
                    const dirStr = position.direction ? position.direction.toLowerCase() : 'down';
                    otherPlayer.direction = directionMap[dirStr] !== undefined ? directionMap[dirStr] : Direction.DOWN;
                    
                    // Force update logs
                    console.log(`[Move] Updated player ${playerId} to ${position.x}, ${position.y} facing ${dirStr}`);
                } catch (e) {
                    console.error("Error updating direction:", e);
                }
            } else {
                console.log(`Player ${playerId} not found in otherPlayers`);
            }
        });

        this.ws.connect();
    }

    private addOtherPlayer(playerData: OnlinePlayer): void {
        try {
            const player = new Player(playerData.position.x, playerData.position.y, playerData.address);
            // Convert string direction to enum
            const directionMap: { [key: string]: Direction } = {
                'up': Direction.UP,
                'down': Direction.DOWN,
                'left': Direction.LEFT,
                'right': Direction.RIGHT
            };
            const dirStr = playerData.position.direction ? playerData.position.direction.toLowerCase() : 'down';
            player.direction = directionMap[dirStr] !== undefined ? directionMap[dirStr] : Direction.DOWN;
            
            this.otherPlayers.set(playerData.id, player);
            console.log(`Added other player ${playerData.id} at (${player.x}, ${player.y})`, this.otherPlayers.size, 'total players');
        } catch (e) {
            console.error("Error adding other player:", e);
        }
    }

    private sendPositionUpdate(): void {
        if (!this.ws || !this.ws.isConnected()) return;

        const now = Date.now();
        const distanceMoved = Math.abs(this.player.x - this.lastPositionSent.x) + 
                             Math.abs(this.player.y - this.lastPositionSent.y);

        if (distanceMoved > 1 || now - this.lastPositionSendTime > this.positionSendInterval) {
            const directionString = Direction[this.player.direction].toLowerCase();
            this.ws.sendMove({
                x: this.player.x,
                y: this.player.y,
                direction: directionString,
            });

            this.lastPositionSent = { x: this.player.x, y: this.player.y };
            this.lastPositionSendTime = now;
        }
    }

    start(): void {
        this.gameLoop();
    }

    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ws) {
            this.ws.disconnect();
        }
    }

    private gameLoop = (): void => {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= FRAME_TIME) {
            this.update();
            this.render();
            this.lastFrameTime = currentTime - (deltaTime % FRAME_TIME);
        }

        this.animationId = requestAnimationFrame(this.gameLoop);
    };

    private update(): void {
        // Update player
        this.player.update(this.input, this.world);

        // Send position update to server
        this.sendPositionUpdate();

        // Update camera to follow player
        this.camera.follow(this.player.x, this.player.y);
        this.camera.update();

        // Update world chunks based on player position
        this.world.updateChunks(this.player.getWorldTileX(), this.player.getWorldTileY());
    }

    private debugInfo: string[] = [];

    private render(): void {
        this.renderer.clear();
        this.renderer.renderWorld(this.world, this.camera);
        
        // Render other players
        this.otherPlayers.forEach((otherPlayer) => {
            this.renderer.renderPlayer(otherPlayer, this.camera);
        });
        
        // Render local player on top
        this.renderer.renderPlayer(this.player, this.camera);
        
        // Update debug info
        this.debugInfo = [
            `Players Online: ${this.otherPlayers.size + 1}`,
            `Remote Players: ${Array.from(this.otherPlayers.keys()).join(', ')}`
        ];
        this.renderer.renderUI(this.player, this.debugInfo);
    }
}
