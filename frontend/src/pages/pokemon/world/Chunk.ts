import { TerrainType, type Decoration } from './TerrainTypes';
import { TerrainGenerator } from './TerrainGenerator';
import { CHUNK_SIZE } from '../../../utils/Constants';

export interface Tile {
    terrain: TerrainType;
    decoration: Decoration | null;
}

export class Chunk {
    public tiles: Tile[][];
    public chunkX: number;
    public chunkY: number;
    private generator: TerrainGenerator;

    constructor(chunkX: number, chunkY: number, generator: TerrainGenerator) {
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.generator = generator;
        this.tiles = [];
        this.generate();
    }

    private generate(): void {
        for (let y = 0; y < CHUNK_SIZE; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < CHUNK_SIZE; x++) {
                const worldX = this.chunkX * CHUNK_SIZE + x;
                const worldY = this.chunkY * CHUNK_SIZE + y;

                const terrain = this.generator.getTerrainAt(worldX, worldY);
                const decoration = this.generator.getDecorationsAt(worldX, worldY, terrain);

                this.tiles[y][x] = {
                    terrain,
                    decoration,
                };
            }
        }
    }

    getTile(localX: number, localY: number): Tile | null {
        if (localX < 0 || localX >= CHUNK_SIZE || localY < 0 || localY >= CHUNK_SIZE) {
            return null;
        }
        return this.tiles[localY][localX];
    }
}
