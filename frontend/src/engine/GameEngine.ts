import { Camera } from './Camera';
import { WorldManager } from '../world/WorldManager';
import { Player } from '../entities/Player';
import { InputManager } from '../input/InputManager';
import { Renderer } from '../renderer/Renderer';
import { FRAME_TIME, TILE_SIZE } from '../utils/Constants';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private camera: Camera;
    private world: WorldManager;
    private player: Player;
    private input: InputManager;
    private renderer: Renderer;
    private lastFrameTime: number;
    private animationId: number | null;

    constructor(canvas: HTMLCanvasElement) {
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

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    private resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.camera) {
            this.camera.updateSize(this.canvas.width, this.canvas.height);
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

        // Update camera to follow player
        this.camera.follow(this.player.x, this.player.y);
        this.camera.update();

        // Update world chunks based on player position
        this.world.updateChunks(this.player.getWorldTileX(), this.player.getWorldTileY());
    }

    private render(): void {
        this.renderer.clear();
        this.renderer.renderWorld(this.world, this.camera);
        this.renderer.renderPlayer(this.player, this.camera);
        this.renderer.renderUI(this.player);
    }
}
