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
const oldState: boolean[] = [...displayState];

function clearState(): void {
  [displayState, oldState].forEach((state) => state.fill(false));
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

function draw(force = false): void {
  displayState.forEach((tile, i) => {
    if (!force) {
      // Pixel hasn't changed, don't redraw
      if (tile === oldState[i]) {
        return;
      }
    }
    oldState[i] = tile;

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

let grid = true;
function setGrid(to: boolean) {
  grid = to;
}

let inverted = true;
function toggleTheme() {
  inverted = !inverted;
}

function drawTitleScreen() {
  displayState.fill(false);
  oldState.fill(false);

  // C
  toggleTile(11, 8);
  toggleTile(12, 8);
  toggleTile(13, 8);
  toggleTile(14, 8);
  toggleTile(15, 8);
  toggleTile(10, 19);
  toggleTile(11, 19);
  toggleTile(12, 19);
  toggleTile(13, 19);
  toggleTile(14, 19);
  toggleTile(15, 19);
  toggleTile(10, 8);
  toggleTile(10, 9);
  toggleTile(10, 10);
  toggleTile(10, 11);
  toggleTile(10, 12);
  toggleTile(10, 13);
  toggleTile(10, 14);
  toggleTile(10, 15);
  toggleTile(10, 16);
  toggleTile(10, 17);
  toggleTile(10, 18);

  // H
  toggleTile(19, 11);
  toggleTile(19, 12);
  toggleTile(19, 13);
  toggleTile(19, 14);
  toggleTile(19, 15);
  toggleTile(19, 16);
  toggleTile(19, 17);
  toggleTile(19, 18);
  toggleTile(19, 19);
  toggleTile(19, 20);
  toggleTile(19, 21);
  toggleTile(19, 22);
  toggleTile(19, 23);
  toggleTile(24, 11);
  toggleTile(24, 12);
  toggleTile(24, 13);
  toggleTile(24, 14);
  toggleTile(24, 15);
  toggleTile(24, 16);
  toggleTile(24, 17);
  toggleTile(24, 18);
  toggleTile(24, 19);
  toggleTile(24, 20);
  toggleTile(24, 21);
  toggleTile(24, 22);
  toggleTile(24, 23);
  toggleTile(20, 17);
  toggleTile(21, 17);
  toggleTile(22, 17);
  toggleTile(23, 17);

  // I
  toggleTile(28, 8);
  toggleTile(29, 8);
  toggleTile(30, 8);
  toggleTile(31, 8);
  toggleTile(32, 8);
  toggleTile(28, 19);
  toggleTile(29, 19);
  toggleTile(30, 19);
  toggleTile(31, 19);
  toggleTile(32, 19);
  toggleTile(30, 9);
  toggleTile(30, 10);
  toggleTile(30, 11);
  toggleTile(30, 12);
  toggleTile(30, 13);
  toggleTile(30, 14);
  toggleTile(30, 15);
  toggleTile(30, 16);
  toggleTile(30, 17);
  toggleTile(30, 18);

  // P
  toggleTile(36, 11);
  toggleTile(36, 12);
  toggleTile(36, 13);
  toggleTile(36, 14);
  toggleTile(36, 15);
  toggleTile(36, 16);
  toggleTile(36, 17);
  toggleTile(36, 18);
  toggleTile(36, 19);
  toggleTile(36, 20);
  toggleTile(36, 21);
  toggleTile(36, 22);
  toggleTile(36, 23);
  toggleTile(41, 11);
  toggleTile(41, 12);
  toggleTile(41, 13);
  toggleTile(41, 14);
  toggleTile(41, 15);
  toggleTile(41, 16);
  toggleTile(41, 17);
  toggleTile(37, 17);
  toggleTile(38, 17);
  toggleTile(39, 17);
  toggleTile(40, 17);
  toggleTile(37, 11);
  toggleTile(38, 11);
  toggleTile(39, 11);
  toggleTile(40, 11);

  // -
  toggleTile(44, 14);
  toggleTile(45, 14);

  // 8
  toggleTile(48, 8);
  toggleTile(48, 9);
  toggleTile(48, 10);
  toggleTile(48, 11);
  toggleTile(48, 12);
  toggleTile(48, 13);
  toggleTile(48, 14);
  toggleTile(48, 15);
  toggleTile(48, 16);
  toggleTile(48, 17);
  toggleTile(48, 18);
  toggleTile(53, 8);
  toggleTile(53, 9);
  toggleTile(53, 10);
  toggleTile(53, 11);
  toggleTile(53, 12);
  toggleTile(53, 13);
  toggleTile(53, 14);
  toggleTile(53, 15);
  toggleTile(53, 16);
  toggleTile(53, 17);
  toggleTile(53, 18);
  toggleTile(53, 19);
  toggleTile(49, 8);
  toggleTile(50, 8);
  toggleTile(51, 8);
  toggleTile(52, 8);
  toggleTile(48, 19);
  toggleTile(49, 19);
  toggleTile(50, 19);
  toggleTile(51, 19);
  toggleTile(52, 19);
  toggleTile(49, 13);
  toggleTile(50, 13);
  toggleTile(51, 13);
  toggleTile(52, 13);

  draw(true);
}

export {
  clearDisplay,
  clearState,
  draw,
  drawTitleScreen,
  setGrid,
  toggleTheme,
  toggleTile,
};
