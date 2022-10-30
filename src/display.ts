const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d")!;

// Each "chip8 tile" will be equivalent to 10 actual pixels in the browser.
// This means that the canvas element in the browser has a true size of 640px by 320px.
const NUM_TILES_WIDTH = 64;
const NUM_TILES_HEIGHT = 32;
const TILE_DIMENSION = 10;

// A tile is 'on' when its black, and 'off' when its white.
const BLACK = "#000";
const WHITE = "#FFF";

/**
 * Clears display.
 * Sets all tiles to white.
 */
function clearDisplay(): void {
  ctx.fillStyle = WHITE;
  ctx.fillRect(
    0,
    0,
    NUM_TILES_WIDTH * TILE_DIMENSION,
    NUM_TILES_HEIGHT * TILE_DIMENSION,
  );
}

/**
 * Toggles a tile at (x, y).
 * If the given tile is white, set to black.
 * If the given tile is black, set to white.
 *
 * @param x x position of tile to draw
 * @param y y position of tile to draw
 * @returns whether or not the tile was "erased", e.g. changed from black to white
 */
function toggleTile(x: number, y: number): boolean {
  const trueX = (x % NUM_TILES_WIDTH) * TILE_DIMENSION;
  const trueY = (y % NUM_TILES_HEIGHT) * TILE_DIMENSION;
  const [r, g, b] = ctx.getImageData(trueX, trueY, 1, 1).data;
  let erased = false;

  // Tile is black, set it to white
  if (r === 0 && g === 0 && b === 0) {
    ctx.fillStyle = WHITE;
    erased = true;
  }

  // Tile is white, set it to black
  if (r === 255 && g === 255 && b === 255) {
    ctx.fillStyle = BLACK;
  }

  ctx.fillRect(trueX, trueY, TILE_DIMENSION, TILE_DIMENSION);
  return erased;
}

export { clearDisplay, toggleTile };
