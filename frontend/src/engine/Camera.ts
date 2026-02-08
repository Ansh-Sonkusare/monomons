import { CAMERA_SMOOTH } from '../utils/Constants';

export class Camera {
    public x: number;
    public y: number;
    private targetX: number;
    private targetY: number;
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    follow(targetX: number, targetY: number): void {
        // Center camera on target
        this.targetX = targetX - this.canvasWidth / 2;
        this.targetY = targetY - this.canvasHeight / 2;
    }

    update(): void {
        // Smooth camera movement
        this.x += (this.targetX - this.x) * CAMERA_SMOOTH;
        this.y += (this.targetY - this.y) * CAMERA_SMOOTH;
    }

    updateSize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        return {
            x: worldX - this.x,
            y: worldY - this.y,
        };
    }

    screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: screenX + this.x,
            y: screenY + this.y,
        };
    }
}
