import SimplexNoise from '../../../utils/Noise';
import { TerrainType, type Decoration, DecorationType } from './TerrainTypes';
import {
    NOISE_SCALE,
    MOISTURE_SCALE,
    ISLAND_SCALE,
    WATER_THRESHOLD,
    BEACH_THRESHOLD,
    GRASS_THRESHOLD,
    MOUNTAIN_THRESHOLD,
    SNOW_THRESHOLD,
    TREE_CHANCE,
    ROCK_CHANCE,
    FLOWER_CHANCE,
    HOUSE_CHANCE,
    FARM_CHANCE,
} from '../../../utils/Constants';

// Dojo name generation
const DOJO_PREFIXES = ["Iron", "Shadow", "Thunder", "Crystal", "Dragon", "Phoenix", "Spirit", "Void", "Solar", "Lunar", "Ancient", "Mystic"];
const DOJO_SUFFIXES = ["Fist", "Strike", "Temple", "Sanctuary", "Grounds", "Arena", "Dojo", "Peak", "Valley", "Gate", "Haven", "Vault"];

export class TerrainGenerator {
    private elevationNoise: SimplexNoise;
    private moistureNoise: SimplexNoise;
    private islandNoise: SimplexNoise;
    private decorationNoise: SimplexNoise;

    constructor(seed: number = 12345) {
        this.elevationNoise = new SimplexNoise(seed);
        this.moistureNoise = new SimplexNoise(seed + 1);
        this.islandNoise = new SimplexNoise(seed + 2);
        this.decorationNoise = new SimplexNoise(seed + 3);
    }

    getTerrainAt(worldX: number, worldY: number): TerrainType {
        // Island mask - creates distinct islands separated by ocean
        const islandValue = this.islandNoise.octaveNoise2D(
            worldX * ISLAND_SCALE,
            worldY * ISLAND_SCALE,
            3,
            0.5
        );

        // Make islands more distinct
        const islandMask = islandValue > -0.2 ? 1 : 0;

        // Get elevation noise
        let elevation = this.elevationNoise.octaveNoise2D(
            worldX * NOISE_SCALE,
            worldY * NOISE_SCALE,
            5,
            0.5
        );

        // Normalize to 0-1
        elevation = (elevation + 1) / 2;

        // Apply island mask - lower elevation in ocean areas
        elevation = elevation * islandMask * 0.9 + (1 - islandMask) * 0.2;

        // Get moisture for biome variation
        const moisture = (this.moistureNoise.octaveNoise2D(
            worldX * MOISTURE_SCALE,
            worldY * MOISTURE_SCALE,
            3,
            0.5
        ) + 1) / 2;

        // Determine terrain type based on elevation and moisture
        if (elevation < WATER_THRESHOLD - 0.1) return TerrainType.DEEP_WATER;
        if (elevation < WATER_THRESHOLD) return TerrainType.WATER;
        if (elevation < BEACH_THRESHOLD) return TerrainType.BEACH;
        if (elevation < GRASS_THRESHOLD) {
            return moisture > 0.5 ? TerrainType.GRASS : TerrainType.DARK_GRASS;
        }
        if (elevation < MOUNTAIN_THRESHOLD) return TerrainType.MOUNTAIN;
        if (elevation < SNOW_THRESHOLD) return TerrainType.MOUNTAIN;
        return TerrainType.SNOW;
    }

    getDecorationsAt(worldX: number, worldY: number, terrain: TerrainType): Decoration | null {
        // Use noise to determine decoration placement
        const decorValue = (this.decorationNoise.noise2D(worldX * 0.1, worldY * 0.1) + 1) / 2;

        // Hash position for pseudo-random decoration selection
        const hash = Math.abs(Math.sin(worldX * 12.9898 + worldY * 78.233) * 43758.5453);
        const random = hash - Math.floor(hash);

        // Different decorations based on terrain
        switch (terrain) {
            case TerrainType.GRASS:
            case TerrainType.DARK_GRASS:
                if (decorValue < TREE_CHANCE) {
                    return {
                        type: DecorationType.TREE,
                        x: worldX,
                        y: worldY,
                        solid: true,
                    };
                }
                if (decorValue < TREE_CHANCE + FLOWER_CHANCE && random < 0.5) {
                    return {
                        type: DecorationType.FLOWER,
                        x: worldX,
                        y: worldY,
                        solid: false,
                    };
                }
                if (decorValue < TREE_CHANCE + FLOWER_CHANCE + HOUSE_CHANCE && random < 0.3) {
                    return {
                        type: DecorationType.HOUSE,
                        x: worldX,
                        y: worldY,
                        solid: true,
                    };
                }
                if (decorValue < TREE_CHANCE + FLOWER_CHANCE + HOUSE_CHANCE + FARM_CHANCE && random > 0.7) {
                    return {
                        type: DecorationType.FARM,
                        x: worldX,
                        y: worldY,
                        solid: false,
                    };
                }
                break;

            case TerrainType.MOUNTAIN:
                if (decorValue < ROCK_CHANCE * 2) {
                    return {
                        type: random > 0.5 ? DecorationType.BOULDER : DecorationType.ROCK,
                        x: worldX,
                        y: worldY,
                        solid: true,
                    };
                }
                break;

            case TerrainType.SNOW:
                if (decorValue < TREE_CHANCE * 0.5) {
                    return {
                        type: DecorationType.PINE_TREE,
                        x: worldX,
                        y: worldY,
                        solid: true,
                    };
                }
                break;
        }

        // Region-based generation for rare structures (Dojos)
        // Check independent of terrain switch to keep logic clean, but ensure valid terrain
        if (terrain === TerrainType.GRASS || terrain === TerrainType.DARK_GRASS || terrain === TerrainType.SNOW || terrain === TerrainType.BEACH) {
            const REGION_SIZE = 40; // More frequent dojos (was 80)
            const regionX = Math.floor(worldX / REGION_SIZE);
            const regionY = Math.floor(worldY / REGION_SIZE);

            // Seed random for this region
            // Using a different large prime set to avoid correlation with other noise
            const regionHash = Math.abs(Math.sin(regionX * 45.9898 + regionY * 78.233) * 63758.5453);
            const regionRandom = regionHash - Math.floor(regionHash);

            // Determine the relative position of the dojo in this region
            const dojoRelX = Math.floor(regionRandom * REGION_SIZE);
            const dojoRelY = Math.floor(((regionRandom * 100) % 1) * REGION_SIZE);

            // Check if current tile is the chosen dojo location
            // Use absolute coordinates for comparison
            // Fix: handle negative coordinates correctly for modulo/floor operations if needed, but here we mapped world to region.
            // worldX could be negative. Math.floor handles negative correctly (-1.5 -> -2).
            // A simple equality check is sufficient.
            const targetX = regionX * REGION_SIZE + dojoRelX;
            const targetY = regionY * REGION_SIZE + dojoRelY;

            if (worldX === targetX && worldY === targetY) {
                // Generate deterministic name
                const nameHash = Math.abs(Math.sin(worldX * 34.123 + worldY * 98.456) * 12345.678);
                const nameRandom = nameHash - Math.floor(nameHash);

                const prefixIndex = Math.floor(nameRandom * DOJO_PREFIXES.length);
                const suffixIndex = Math.floor(((nameRandom * 10) % 1) * DOJO_SUFFIXES.length);

                const dojoName = `${DOJO_PREFIXES[prefixIndex]} ${DOJO_SUFFIXES[suffixIndex]}`;

                return {
                    type: DecorationType.DOJO,
                    x: worldX,
                    y: worldY,
                    solid: true,
                    name: dojoName,
                    roomId: `room-${worldX}-${worldY}`
                };
            }
        }

        return null;
    }

    isTerrainWalkable(terrain: TerrainType): boolean {
        return terrain !== TerrainType.DEEP_WATER &&
            terrain !== TerrainType.WATER;
    }
}
