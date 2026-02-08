import { PLAYER_SPEED, PLAYER_SIZE, TILE_SIZE } from '../../../utils/Constants';
import { InputManager } from '../input/InputManager';
import { WorldManager } from '../world/WorldManager';

export enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

export class Player {
    public x: number;
    public y: number;
    public direction: Direction;
    public address?: string;
    private speed: number;
    private isMoving: boolean;

    // Interpolation for remote players
    public targetX?: number;
    public targetY?: number;
    private lerpFactor: number = 0.2; // Smoothing factor

    constructor(startX: number, startY: number, address?: string) {
        this.x = startX;
        this.y = startY;
        this.direction = Direction.DOWN;
        this.address = address;
        this.speed = PLAYER_SPEED;
        this.isMoving = false;
    }

    update(input: InputManager | null, world: WorldManager): void {
        this.isMoving = false;

        // If local player (has input)
        if (input) {
            let dx = 0;
            let dy = 0;

            if (input.isMovingUp()) {
                dy -= this.speed;
                this.direction = Direction.UP;
                this.isMoving = true;
            }
            if (input.isMovingDown()) {
                dy += this.speed;
                this.direction = Direction.DOWN;
                this.isMoving = true;
            }
            if (input.isMovingLeft()) {
                dx -= this.speed;
                this.direction = Direction.LEFT;
                this.isMoving = true;
            }
            if (input.isMovingRight()) {
                dx += this.speed;
                this.direction = Direction.RIGHT;
                this.isMoving = true;
            }

            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                dx /= Math.sqrt(2);
                dy /= Math.sqrt(2);
            }

            // Check collision before moving
            const newX = this.x + dx;
            const newY = this.y + dy;

            // Check multiple points around player for collision
            const canMove = this.canMoveTo(newX, newY, world);

            if (canMove) {
                this.x = newX;
                this.y = newY;
            } else {
                // Try sliding along walls
                if (this.canMoveTo(newX, this.y, world)) {
                    this.x = newX;
                } else if (this.canMoveTo(this.x, newY, world)) {
                    this.y = newY;
                }
            }
        } else {
            // Remote player interpolation
            if (this.targetX !== undefined && this.targetY !== undefined) {
                const dx = this.targetX - this.x;
                const dy = this.targetY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 1) {
                    this.x += dx * this.lerpFactor;
                    this.y += dy * this.lerpFactor;
                    this.isMoving = true;

                    // Update direction based on movement
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                    } else {
                        this.direction = dy > 0 ? Direction.DOWN : Direction.UP;
                    }
                } else {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.isMoving = false;
                }
            }
        }
    }

    private canMoveTo(x: number, y: number, world: WorldManager): boolean {
        // Check corners of player hitbox
        const halfSize = PLAYER_SIZE / 2;
        const checkPoints = [
            { x: x - halfSize, y: y - halfSize },
            { x: x + halfSize, y: y - halfSize },
            { x: x - halfSize, y: y + halfSize },
            { x: x + halfSize, y: y + halfSize },
        ];

        for (const point of checkPoints) {
            const tileX = Math.floor(point.x / TILE_SIZE);
            const tileY = Math.floor(point.y / TILE_SIZE);

            if (!world.isWalkable(tileX, tileY)) {
                return false;
            }
        }

        return true;
    }

    getWorldTileX(): number {
        return Math.floor(this.x / TILE_SIZE);
    }

    getWorldTileY(): number {
        return Math.floor(this.y / TILE_SIZE);
    }

    getIsMoving(): boolean {
        return this.isMoving;
    }
}
