// Game configuration constants
export const TILE_SIZE = 16; // pixels
export const CHUNK_SIZE = 16; // tiles per chunk
export const CHUNK_PIXEL_SIZE = TILE_SIZE * CHUNK_SIZE; // 256 pixels

export const PLAYER_SPEED = 3; // pixels per frame
export const PLAYER_SIZE = 24; // pixels

export const CAMERA_SMOOTH = 0.1;

// Chunk management
export const CHUNK_LOAD_RADIUS = 3; // chunks around player
export const CHUNK_UNLOAD_RADIUS = 5; // chunks to keep in memory

// Terrain generation
export const NOISE_SCALE = 0.03;
export const MOISTURE_SCALE = 0.02;
export const ISLAND_SCALE = 0.005;

// Biome thresholds (0-1 range from noise)
export const WATER_THRESHOLD = 0.25;
export const BEACH_THRESHOLD = 0.3;
export const GRASS_THRESHOLD = 0.65;
export const MOUNTAIN_THRESHOLD = 0.75;
export const SNOW_THRESHOLD = 0.85;

// Decoration chances
export const TREE_CHANCE = 0.08;
export const ROCK_CHANCE = 0.05;
export const FLOWER_CHANCE = 0.15;
export const HOUSE_CHANCE = 0.002;
export const FARM_CHANCE = 0.003;

export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;
