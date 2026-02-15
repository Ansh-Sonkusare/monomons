export const TILE_CONFIG = {
  CELL_WIDTH: 60,
  PRICE_STEP: 25, // $25 increments for BTC price ($68k+)
  HEAD_SCREEN_X: 250
} as const;

export function calculateMultiplier(tileCol: number, currentCol: number): number {
  const distance = tileCol - currentCol;
  if (distance <= 0) return 0; // Invalid (past)
  if (distance <= 3) return 1.1 + (distance * 0.1); // 1.2x-1.4x
  if (distance <= 8) return 1.5 + ((distance - 3) * 0.2); // 1.7x-2.5x
  return 2.5 + ((distance - 8) * 0.3); // 2.8x+
}

export function getTileTargetPrice(rowIndex: number, basePrice: number): number {
  return basePrice + (rowIndex * TILE_CONFIG.PRICE_STEP);
}

export function isPriceInTileRange(price: number, tileRowIndex: number, basePrice: number): boolean {
  const tileBottom = getTileTargetPrice(tileRowIndex, basePrice);
  const tileTop = getTileTargetPrice(tileRowIndex + 1, basePrice);
  return price >= tileBottom && price < tileTop;
}
