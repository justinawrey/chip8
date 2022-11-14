const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d")!;

// Each "chip8 tile" will be equivalent to 10 actual pixels in the browser.
// This means that the canvas element in the browser has a true size of 640px by 320px.
const NUM_TILES_WIDTH = 64;
const NUM_TILES_HEIGHT = 32;
const TILE_DIMENSION = 10;

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const GREY = "#EEEEEE";
const SLATE = "#333333";

// A tile is 'on' when its black, and 'off' when its white.
const displayState: boolean[] = new Array(
  NUM_TILES_WIDTH * NUM_TILES_HEIGHT,
).fill(false);

function clearState(): void {
  displayState.fill(false);
}

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

function draw(): void {
  displayState.forEach((tile, i) => {
    ctx.beginPath();
    if (tile) {
      ctx.fillStyle = inverted ? WHITE : BLACK;
    } else {
      ctx.fillStyle = inverted ? BLACK : WHITE;
    }

    const x = i % NUM_TILES_WIDTH;
    const y = Math.floor(i / NUM_TILES_WIDTH);

    ctx.rect(
      x * TILE_DIMENSION,
      y * TILE_DIMENSION,
      TILE_DIMENSION,
      TILE_DIMENSION,
    );
    ctx.fill();

    if (grid) {
      ctx.strokeStyle = inverted ? SLATE : GREY;
      ctx.stroke();
    }
  });
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
  const pos = y * NUM_TILES_WIDTH + x;
  const on = displayState[pos];
  let erased = false;

  // Tile is black, set it to white
  if (on) {
    displayState[pos] = false;
    erased = true;
  } else {
    displayState[pos] = true;
  }

  return erased;
}

let grid = false;
function setGrid(to: boolean) {
  grid = to;
}

let inverted = false;
function toggleTheme() {
  inverted = !inverted;
}

export { clearDisplay, clearState, draw, setGrid, toggleTheme, toggleTile };
