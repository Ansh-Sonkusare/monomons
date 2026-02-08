import { Camera } from '../engine/Camera';
import { WorldManager } from '../world/WorldManager';
import { Player, Direction } from '../entities/Player';
import { TILE_SIZE } from '../../../utils/Constants';
import { TERRAIN_COLORS, DECORATION_COLORS, DecorationType, TerrainType } from '../world/TerrainTypes';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.ctx = ctx;

        // Pixelated rendering
        this.ctx.imageSmoothingEnabled = false;
    }

    clear(): void {
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderWorld(world: WorldManager, camera: Camera): void {
        const startTileX = Math.floor(camera.x / TILE_SIZE) - 2;
        const startTileY = Math.floor(camera.y / TILE_SIZE) - 2;
        const endTileX = Math.ceil((camera.x + this.canvas.width) / TILE_SIZE) + 2;
        const endTileY = Math.ceil((camera.y + this.canvas.height) / TILE_SIZE) + 2;

        // Render terrain
        for (let tileY = startTileY; tileY < endTileY; tileY++) {
            for (let tileX = startTileX; tileX < endTileX; tileX++) {
                const tile = world.getTileAt(tileX, tileY);
                if (!tile) continue;

                const screenPos = camera.worldToScreen(tileX * TILE_SIZE, tileY * TILE_SIZE);
                this.renderTile(tile.terrain, screenPos.x, screenPos.y, tileX, tileY);
            }
        }

        // Render decorations
        for (let tileY = startTileY; tileY < endTileY; tileY++) {
            for (let tileX = startTileX; tileX < endTileX; tileX++) {
                const tile = world.getTileAt(tileX, tileY);
                if (!tile || !tile.decoration) continue;

                const screenPos = camera.worldToScreen(tileX * TILE_SIZE, tileY * TILE_SIZE);
                this.renderDecoration(tile.decoration.type, screenPos.x, screenPos.y);
            }
        }
    }

    private renderTile(terrain: TerrainType, x: number, y: number, tileX: number, tileY: number): void {
        const color = TERRAIN_COLORS[terrain];
        const hash = (tileX * 73856093) ^ (tileY * 19349663);
        const variation = (hash % 20) - 10;

        // Base terrain color with slight variation
        this.ctx.fillStyle = `rgb(${color.r + variation}, ${color.g + variation}, ${color.b + variation})`;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), TILE_SIZE, TILE_SIZE);

        // Add patterns based on terrain type
        if (terrain === TerrainType.WATER || terrain === TerrainType.DEEP_WATER) {
            // Water ripple effect
            const ripple = Math.sin(Date.now() / 500 + tileX + tileY) > 0.7;
            if (ripple) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fillRect(Math.floor(x) + 4, Math.floor(y) + 6, 3, 1);
                this.ctx.fillRect(Math.floor(x) + 9, Math.floor(y) + 10, 3, 1);
            }
        } else if (terrain === TerrainType.GRASS || terrain === TerrainType.DARK_GRASS) {
            // Grass texture
            const pattern = hash % 4;
            this.ctx.fillStyle = `rgba(40, 80, 30, 0.2)`;
            if (pattern === 0) {
                this.ctx.fillRect(Math.floor(x) + 3, Math.floor(y) + 5, 1, 2);
                this.ctx.fillRect(Math.floor(x) + 11, Math.floor(y) + 9, 1, 2);
            } else if (pattern === 1) {
                this.ctx.fillRect(Math.floor(x) + 7, Math.floor(y) + 3, 1, 2);
            }
        } else if (terrain === TerrainType.BEACH) {
            // Sand texture
            const dots = hash % 3;
            this.ctx.fillStyle = `rgba(200, 180, 140, 0.3)`;
            for (let i = 0; i < dots; i++) {
                const dx = (hash * (i + 1)) % TILE_SIZE;
                const dy = (hash * (i + 3)) % TILE_SIZE;
                this.ctx.fillRect(Math.floor(x) + dx, Math.floor(y) + dy, 1, 1);
            }
        } else if (terrain === TerrainType.MOUNTAIN) {
            // Rocky texture
            this.ctx.fillStyle = 'rgba(80, 80, 80, 0.2)';
            this.ctx.fillRect(Math.floor(x) + 2, Math.floor(y) + 3, 5, 4);
            this.ctx.fillRect(Math.floor(x) + 9, Math.floor(y) + 8, 4, 5);
        }

        // Draw subtle borders for non-water tiles
        if (terrain !== TerrainType.WATER && terrain !== TerrainType.DEEP_WATER) {
            this.ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(Math.floor(x), Math.floor(y), TILE_SIZE, TILE_SIZE);
        }
    }
    private renderDecoration(type: DecorationType, x: number, y: number): void {
        const colors = DECORATION_COLORS[type];

        switch (type) {
            case DecorationType.TREE:
                // Trunk
                this.ctx.fillStyle = `rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;
                this.ctx.fillRect(x + 6, y + 8, 4, 6);
                // Leaves
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x + 2, y + 2, 12, 10);
                this.ctx.fillRect(x + 4, y, 8, 8);
                break;

            case DecorationType.PINE_TREE:
                // Trunk
                this.ctx.fillStyle = `rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;
                this.ctx.fillRect(x + 6, y + 10, 4, 5);
                // Pine shape
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x + 5, y + 6, 6, 6);
                this.ctx.fillRect(x + 6, y + 3, 4, 4);
                this.ctx.fillRect(x + 7, y + 1, 2, 3);
                break;

            case DecorationType.ROCK:
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x + 4, y + 8, 8, 6);
                this.ctx.fillRect(x + 5, y + 6, 6, 3);
                break;

            case DecorationType.BOULDER:
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x + 2, y + 6, 12, 8);
                this.ctx.fillRect(x + 4, y + 4, 8, 4);
                break;

            case DecorationType.FLOWER:
                // Stem
                this.ctx.fillStyle = `rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;
                this.ctx.fillRect(x + 7, y + 8, 2, 6);
                // Petals
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x + 6, y + 6, 4, 4);
                break;

            case DecorationType.HOUSE:
                // Walls
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x + 2, y + 6, 12, 8);
                // Roof
                this.ctx.fillStyle = `rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;
                this.ctx.fillRect(x + 1, y + 4, 14, 4);
                this.ctx.fillRect(x + 3, y + 2, 10, 3);
                // Door
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(x + 6, y + 10, 4, 4);
                break;

            case DecorationType.FARM:
                // Field
                this.ctx.fillStyle = `rgb(${colors[0].r}, ${colors[0].g}, ${colors[0].b})`;
                this.ctx.fillRect(x, y, 16, 16);
                // Crops (rows)
                this.ctx.fillStyle = `rgb(${colors[1].r}, ${colors[1].g}, ${colors[1].b})`;
                for (let i = 0; i < 4; i++) {
                    this.ctx.fillRect(x + 2 + i * 3, y + 2, 2, 12);
                }
                break;
        }
    }

    renderPlayer(player: Player, camera: Camera): void {
        const screenPos = camera.worldToScreen(player.x, player.y);
        const x = Math.floor(screenPos.x - 12);
        const y = Math.floor(screenPos.y - 20);

        const walkFrame = player.getIsMoving() ? Math.floor(Date.now() / 150) % 2 : 0;

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 6, y + 34, 12, 3);

        // Legs (animated)
        this.ctx.fillStyle = '#2C5AA0';
        if (walkFrame === 0) {
            this.ctx.fillRect(x + 7, y + 26, 4, 8);
            this.ctx.fillRect(x + 13, y + 26, 4, 8);
        } else {
            this.ctx.fillRect(x + 7, y + 25, 4, 9);
            this.ctx.fillRect(x + 13, y + 27, 4, 7);
        }

        // Body/Shirt
        this.ctx.fillStyle = '#4080FF';
        this.ctx.fillRect(x + 6, y + 16, 12, 11);

        // Arms
        this.ctx.fillStyle = '#FFD4A3';
        if (player.direction === Direction.LEFT) {
            this.ctx.fillRect(x + 3, y + 18, 4, 7);
            this.ctx.fillRect(x + 17, y + 18, 4, 7);
        } else if (player.direction === Direction.RIGHT) {
            this.ctx.fillRect(x + 3, y + 18, 4, 7);
            this.ctx.fillRect(x + 17, y + 18, 4, 7);
        } else {
            this.ctx.fillRect(x + 3, y + 18, 4, 7);
            this.ctx.fillRect(x + 17, y + 18, 4, 7);
        }

        // Neck
        this.ctx.fillStyle = '#FFD4A3';
        this.ctx.fillRect(x + 9, y + 13, 6, 4);

        // Head
        this.ctx.fillStyle = '#FFD4A3';
        this.ctx.fillRect(x + 7, y + 6, 10, 9);

        // Hair
        this.ctx.fillStyle = '#4A2511';
        this.ctx.fillRect(x + 7, y + 4, 10, 4);
        this.ctx.fillRect(x + 6, y + 6, 12, 2);

        // Eyes (direction dependent)
        this.ctx.fillStyle = '#000000';
        if (player.direction === Direction.DOWN) {
            this.ctx.fillRect(x + 9, y + 10, 2, 2);
            this.ctx.fillRect(x + 13, y + 10, 2, 2);
        } else if (player.direction === Direction.UP) {
            this.ctx.fillRect(x + 9, y + 9, 2, 1);
            this.ctx.fillRect(x + 13, y + 9, 2, 1);
        } else if (player.direction === Direction.LEFT) {
            this.ctx.fillRect(x + 8, y + 10, 2, 2);
            this.ctx.fillRect(x + 12, y + 10, 1, 2);
        } else {
            this.ctx.fillRect(x + 11, y + 10, 1, 2);
            this.ctx.fillRect(x + 14, y + 10, 2, 2);
        }

        // Mouth
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 11, y + 13, 2, 1);

        // Add outline for better visibility
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 7, y + 6, 10, 9); // Head outline

        // Render wallet address above player
        if (player.address) {
            const shortAddress = player.address.slice(0, 6) + '...' + player.address.slice(-4);
            this.ctx.font = '8px monospace';
            this.ctx.textAlign = 'center';
            
            // Background for text
            const textWidth = this.ctx.measureText(shortAddress).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(x + 12 - textWidth / 2 - 2, y - 8, textWidth + 4, 10);
            
            // Render text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(shortAddress, x + 12, y);
            this.ctx.textAlign = 'left';
        }
    }

    renderUI(player: Player, debugInfo?: string[]): void {
        // Debug info
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 100);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`X: ${player.getWorldTileX()}`, 20, 30);
        this.ctx.fillText(`Y: ${player.getWorldTileY()}`, 20, 50);
        this.ctx.fillText(`WASD to move`, 20, 70);

        if (debugInfo) {
            debugInfo.forEach((info, index) => {
                this.ctx.fillText(info, 20, 90 + (index * 20));
            });
        }
    }
}
