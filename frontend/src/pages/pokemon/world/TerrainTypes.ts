// Terrain types for the game world
export enum TerrainType {
    DEEP_WATER = 'deep_water',
    WATER = 'water',
    BEACH = 'beach',
    GRASS = 'grass',
    DARK_GRASS = 'dark_grass',
    DIRT = 'dirt',
    MOUNTAIN = 'mountain',
    SNOW = 'snow',
}

export interface TerrainColor {
    r: number;
    g: number;
    b: number;
}

export const TERRAIN_COLORS: Record<TerrainType, TerrainColor> = {
    [TerrainType.DEEP_WATER]: { r: 20, g: 60, b: 140 },
    [TerrainType.WATER]: { r: 50, g: 100, b: 200 },
    [TerrainType.BEACH]: { r: 230, g: 210, b: 160 },
    [TerrainType.GRASS]: { r: 80, g: 160, b: 60 },
    [TerrainType.DARK_GRASS]: { r: 60, g: 130, b: 50 },
    [TerrainType.DIRT]: { r: 140, g: 100, b: 70 },
    [TerrainType.MOUNTAIN]: { r: 110, g: 110, b: 110 },
    [TerrainType.SNOW]: { r: 240, g: 245, b: 250 },
};

// Decoration types
export enum DecorationType {
    TREE = 'tree',
    PINE_TREE = 'pine_tree',
    ROCK = 'rock',
    BOULDER = 'boulder',
    FLOWER = 'flower',
    GRASS_TUFT = 'grass_tuft',
    HOUSE = 'house',
    FARM = 'farm',
}

export interface Decoration {
    type: DecorationType;
    x: number;
    y: number;
    solid: boolean; // Can player walk through it?
}

export const DECORATION_COLORS: Record<DecorationType, TerrainColor[]> = {
    [DecorationType.TREE]: [
        { r: 40, g: 100, b: 30 },  // Leaves
        { r: 90, g: 60, b: 30 },    // Trunk
    ],
    [DecorationType.PINE_TREE]: [
        { r: 30, g: 80, b: 30 },    // Dark green
        { r: 80, g: 50, b: 30 },    // Trunk
    ],
    [DecorationType.ROCK]: [
        { r: 120, g: 120, b: 120 },
    ],
    [DecorationType.BOULDER]: [
        { r: 100, g: 100, b: 100 },
    ],
    [DecorationType.FLOWER]: [
        { r: 255, g: 50, b: 100 },  // Pink
        { r: 80, g: 160, b: 60 },   // Green stem
    ],
    [DecorationType.GRASS_TUFT]: [
        { r: 90, g: 170, b: 70 },
    ],
    [DecorationType.HOUSE]: [
        { r: 180, g: 100, b: 60 },  // Walls
        { r: 140, g: 60, b: 40 },   // Roof
    ],
    [DecorationType.FARM]: [
        { r: 160, g: 120, b: 60 },  // Field
        { r: 220, g: 180, b: 60 },  // Crops
    ],
};
