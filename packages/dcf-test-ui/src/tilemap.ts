// Tile types
export const T = {
  FLOOR: 0,
  WALL: 1,
  BAR: 2,
  COIN_TABLE: 3,
  DICE_TABLE: 4,
  FIREPLACE: 5,
  DOOR: 6,
  BARKEEP: 7,
} as const;

export type TileType = (typeof T)[keyof typeof T];

// 20x15 tavern map
export const MAP: TileType[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,0,4,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,3,3,0,0,0,4,4,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const COLS = MAP[0].length;
export const ROWS = MAP.length;
export const TILE_SIZE = 40;

// Colors for each tile
export const TILE_COLORS: Record<TileType, string> = {
  [T.FLOOR]: '#c4a45a',     // warm wood
  [T.WALL]: '#4a4a4a',      // stone
  [T.BAR]: '#6b3a1f',       // dark wood counter
  [T.COIN_TABLE]: '#8b5e34', // table wood
  [T.DICE_TABLE]: '#5c6b3a', // green felt
  [T.FIREPLACE]: '#b33a1f',  // red/orange
  [T.DOOR]: '#2d5a1f',       // green door
  [T.BARKEEP]: '#c4a45a',    // floor (NPC stands on floor)
};

// Tile labels (rendered as text on the tile)
export const TILE_LABELS: Partial<Record<TileType, string>> = {
  [T.BAR]: '🍺',
  [T.COIN_TABLE]: '🪙',
  [T.DICE_TABLE]: '🎲',
  [T.FIREPLACE]: '🔥',
  [T.DOOR]: '🚪',
  [T.BARKEEP]: '🧙',
};

// Solid tiles block movement
export const SOLID: Set<TileType> = new Set([T.WALL, T.BAR, T.COIN_TABLE, T.DICE_TABLE, T.FIREPLACE]);

// Interactive tiles
export const INTERACTIVE: Set<TileType> = new Set([T.COIN_TABLE, T.DOOR, T.BARKEEP]);

// Check if a position is walkable
export function canWalk(x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  return !SOLID.has(MAP[y][x]);
}

// Check if player is adjacent to a tile type
export function adjacentTo(px: number, py: number, tileType: TileType): boolean {
  const neighbors = [
    [px - 1, py], [px + 1, py],
    [px, py - 1], [px, py + 1],
  ];
  return neighbors.some(([x, y]) =>
    x >= 0 && x < COLS && y >= 0 && y < ROWS && MAP[y][x] === tileType
  );
}

// Player spawn position (near the door)
export const SPAWN = { x: 9, y: 12 };
