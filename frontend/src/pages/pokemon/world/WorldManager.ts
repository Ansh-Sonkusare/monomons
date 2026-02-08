import { Chunk, type Tile } from './Chunk';
import { TerrainGenerator } from './TerrainGenerator';
import { CHUNK_SIZE, CHUNK_LOAD_RADIUS, CHUNK_UNLOAD_RADIUS } from '../../../utils/Constants';

export class WorldManager {
    private chunks: Map<string, Chunk>;
    private generator: TerrainGenerator;

    constructor(seed?: number) {
        this.chunks = new Map();
        this.generator = new TerrainGenerator(seed);
    }

    private getChunkKey(chunkX: number, chunkY: number): string {
        return `${chunkX},${chunkY}`;
    }

    private getChunk(chunkX: number, chunkY: number): Chunk {
        const key = this.getChunkKey(chunkX, chunkY);
        let chunk = this.chunks.get(key);

        if (!chunk) {
            chunk = new Chunk(chunkX, chunkY, this.generator);
            this.chunks.set(key, chunk);
        }

        return chunk;
    }

    getTileAt(worldX: number, worldY: number): Tile | null {
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkY = Math.floor(worldY / CHUNK_SIZE);
        const localX = worldX - chunkX * CHUNK_SIZE;
        const localY = worldY - chunkY * CHUNK_SIZE;

        const chunk = this.getChunk(chunkX, chunkY);
        return chunk.getTile(localX, localY);
    }

    updateChunks(playerWorldX: number, playerWorldY: number): void {
        const playerChunkX = Math.floor(playerWorldX / CHUNK_SIZE);
        const playerChunkY = Math.floor(playerWorldY / CHUNK_SIZE);

        // Load chunks around player
        for (let y = -CHUNK_LOAD_RADIUS; y <= CHUNK_LOAD_RADIUS; y++) {
            for (let x = -CHUNK_LOAD_RADIUS; x <= CHUNK_LOAD_RADIUS; x++) {
                this.getChunk(playerChunkX + x, playerChunkY + y);
            }
        }

        // Unload far chunks to save memory
        const chunksToRemove: string[] = [];
        this.chunks.forEach((chunk, key) => {
            const dx = Math.abs(chunk.chunkX - playerChunkX);
            const dy = Math.abs(chunk.chunkY - playerChunkY);
            if (dx > CHUNK_UNLOAD_RADIUS || dy > CHUNK_UNLOAD_RADIUS) {
                chunksToRemove.push(key);
            }
        });

        chunksToRemove.forEach(key => this.chunks.delete(key));
    }

    getLoadedChunks(): Chunk[] {
        return Array.from(this.chunks.values());
    }

    isWalkable(worldX: number, worldY: number): boolean {
        const tile = this.getTileAt(Math.floor(worldX), Math.floor(worldY));
        if (!tile) return false;

        // Check terrain walkability
        if (!this.generator.isTerrainWalkable(tile.terrain)) {
            return false;
        }

        // Check decoration collision
        if (tile.decoration && tile.decoration.solid) {
            return false;
        }

        return true;
    }
}
