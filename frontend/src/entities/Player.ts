import { PLAYER_SPEED, PLAYER_SIZE, TILE_SIZE } from '../utils/Constants';
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
    private speed: number;
    private isMoving: boolean;

    constructor(startX: number, startY: number) {
        this.x = startX;
        this.y = startY;
        this.direction = Direction.DOWN;
        this.speed = PLAYER_SPEED;
        this.isMoving = false;
    }

    update(input: InputManager, world: WorldManager): void {
        let dx = 0;
        let dy = 0;
        this.isMoving = false;

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
