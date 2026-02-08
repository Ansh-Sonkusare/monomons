export class InputManager {
    private keys: Set<string>;

    constructor() {
        this.keys = new Set();
        this.setupListeners();
    }

    private setupListeners(): void {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
    }

    isKeyPressed(key: string): boolean {
        return this.keys.has(key.toLowerCase());
    }

    isMovingUp(): boolean {
        return this.isKeyPressed('w') || this.isKeyPressed('arrowup');
    }

    isMovingDown(): boolean {
        return this.isKeyPressed('s') || this.isKeyPressed('arrowdown');
    }

    isMovingLeft(): boolean {
        return this.isKeyPressed('a') || this.isKeyPressed('arrowleft');
    }

    isMovingRight(): boolean {
        return this.isKeyPressed('d') || this.isKeyPressed('arrowright');
    }
}
