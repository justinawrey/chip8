import { clearDisplay, toggleTile } from "./display.ts";
import memoryMap from "./ram.ts";
import registers, { kk, nnn, reg, stack } from "./registers.ts";

interface Nibbles {
  // High nibble of the higher byte
  readonly d: number;

  // Low nibble of the higher byte
  readonly c: number;

  // High nibble of the lower byte
  readonly b: number;

  // Low nibble of the lower byte
  readonly a: number;
}

type Instruction = (nibbles: Nibbles) => void;
type BitMasks = Record<string, number>;

// Bitmasks for retrieving certain bits from bytes
const masks: BitMasks = {
  7: 0x80,
  6: 0x40,
  5: 0x20,
  4: 0x10,
  3: 0x08,
  2: 0x04,
  1: 0x02,
  0: 0x01,
};

/**
 * 0nnn - SYS addr
 *
 * Jump to a machine code routine at nnn.
 * This instruction is only used on the old computers on which Chip-8 was originally implemented.
 * Ignored by modern interpreters but included here for posterity.
 */
const _sys: Instruction = () => {};

/**
 * 00e0 - CLS
 *
 * Clear the display.
 */
const cls: Instruction = () => clearDisplay();

/**
 * 00EE - RET
 *
 * Return from a subroutine.
 * The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
 */
const ret: Instruction = () => {
  const returnAddr = stack.pop();
  if (returnAddr) {
    registers.programCounter = returnAddr;
  }
};

/**
 * 1nnn - JP addr
 *
 * Jump to location nnn.
 * The interpreter sets the program counter to nnn.
 */
const jpAddr: Instruction = ({ c, b, a }) => {
  registers.programCounter = nnn(c, b, a);
};

/**
 * 2nnn - CALL addr
 *
 * Call subroutine at nnn.
 * The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
 */
const call: Instruction = ({ c, b, a }) => {
  stack.push(registers.programCounter);
  registers.programCounter = nnn(c, b, a);
};

/**
 * 3xkk - SE Vx, byte
 *
 * Skip next instruction if Vx = kk.
 * The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.
 */
const seByte: Instruction = ({ c, b, a }) => {
  if (registers[reg(c)] === kk(b, a)) {
    registers.programCounter += 2;
  }
};

/**
 * 4xkk - SNE Vx, byte
 *
 * Skip next instruction if Vx != kk.
 * The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
 */
const sneByte: Instruction = ({ c, b, a }) => {
  if (registers[reg(c)] !== kk(b, a)) {
    registers.programCounter += 2;
  }
};

/**
 * 5xy0 - SE Vx, Vy
 *
 * Skip next instruction if Vx = Vy.
 * The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
 */
const seReg: Instruction = ({ c, b }) => {
  if (registers[reg(c)] === registers[reg(b)]) {
    registers.programCounter += 2;
  }
};

/**
 * 6xkk - LD Vx, byte
 *
 * Set Vx = kk.
 * The interpreter puts the value kk into register Vx.
 */
const ldByte: Instruction = ({ c, b, a }) => {
  registers[reg(c)] = kk(b, a);
};

/**
 * 7xkk - ADD Vx, byte
 *
 * Set Vx = Vx + kk.
 * Adds the value kk to the value of register Vx, then stores the result in Vx.
 */
const addByte: Instruction = ({ c, b, a }) => {
  registers[reg(c)] += kk(b, a);
};

/**
 * 8xy0 - LD Vx, Vy
 *
 * Set Vx = Vy.
 * Stores the value of register Vy in register Vx.
 */
const ldVx: Instruction = ({ c, b }) => {
  registers[reg(c)] = registers[reg(b)];
};

/**
 * 8xy1 - OR Vx, Vy
 *
 * Set Vx = Vx OR Vy.
 * Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares
 * the corresponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
 */
const or: Instruction = ({ c, b }) => {
  registers[reg(c)] |= registers[reg(b)];
};

/**
 * 8xy2 - AND Vx, Vy
 *
 * Set Vx = Vx AND Vy.
 * Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares
 * the corresponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
 */
const and: Instruction = ({ c, b }) => {
  registers[reg(c)] &= registers[reg(b)];
};

/**
 * 8xy3 - XOR Vx, Vy
 *
 * Set Vx = Vx XOR Vy.
 * Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares
 * the corresponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
 */
const xor: Instruction = ({ c, b }) => {
  registers[reg(c)] ^= registers[reg(b)];
};

/**
 * 8xy4 - ADD Vx, Vy
 *
 * Set Vx = Vx + Vy, set VF = carry.
 * The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0.
 * Only the lowest 8 bits of the result are kept, and stored in Vx.
 */
const addReg: Instruction = ({ c, b }) => {
  const sum = registers[reg(c)] + registers[reg(b)];

  registers.vF = sum > 255 ? 1 : 0;
  registers[reg(c)] = sum & 0xff;
};

/**
 * 8xy5 - SUB Vx, Vy
 *
 * Set Vx = Vx - Vy, set VF = NOT borrow.
 * If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
 */
const sub: Instruction = ({ c, b }) => {
  const difference = registers[reg(c)] - registers[reg(b)];

  registers.vF = difference > 0 ? 1 : 0;
  registers[reg(c)] = difference;
};

/**
 * 8xy6 - SHR Vx {, Vy}
 *
 * Set Vx = Vx SHR 1.
 * If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
 */
const shr: Instruction = ({ c }) => {
  registers.vF = (registers[reg(c)] & 0x01) === 1 ? 1 : 0;
  registers[reg(c)] /= 2;
};

/**
 * 8xy7 - SUBN Vx, Vy
 *
 * Set Vx = Vy - Vx, set VF = NOT borrow.
 * If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
 */
const subn: Instruction = ({ c, b }) => {
  const difference = registers[reg(b)] - registers[reg(c)];

  registers.vF = difference > 0 ? 1 : 0;
  registers[reg(c)] = difference;
};

/**
 * 8xyE - SHL Vx {, Vy}
 *
 * Set Vx = Vx SHL 1.
 * If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.
 */
const shl: Instruction = ({ c }) => {
  registers.vF = (registers[reg(c)] & 0x80) === 1 ? 1 : 0;
  registers[reg(c)] *= 2;
};

/**
 * 9xy0 - SNE Vx, Vy
 *
 * Skip next instruction if Vx != Vy.
 * The values of Vx and Vy are compared, and if they are not equal, the program counter is increased by 2.
 */
const sneReg: Instruction = ({ c, b }) => {
  if (registers[reg(c)] !== registers[reg(b)]) {
    registers.programCounter += 2;
  }
};

/**
 * Annn - LD I, addr
 *
 * Set I = nnn.
 * The value of register I is set to nnn.
 */
const ldi: Instruction = ({ c, b, a }) => {
  registers.addressIndex = nnn(c, b, a);
};

/**
 * Bnnn - JP V0, addr
 *
 * Jump to location nnn + V0.
 * The program counter is set to nnn plus the value of V0.
 */
const jpv0Addr: Instruction = ({ c, b, a }) => {
  registers.programCounter = nnn(c, b, a) + registers.v0;
};

/**
 * Cxkk - RND Vx, byte
 *
 * Set Vx = random byte AND kk.
 * The interpreter generates a random number from 0 to 255, which is then ANDed with the value kk.
 * The results are stored in Vx. See instruction 8xy2 for more information on AND.
 */
const rnd: Instruction = (_nibbles) => {};

/**
 * Dxyn - DRW Vx, Vy, nibble
 *
 * Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
 * The interpreter reads n bytes from memory, starting at the address stored in I.
 * These bytes are then displayed as sprites on screen at coordinates (Vx, Vy).
 * Sprites are XORed onto the existing screen. If this causes any pixels to be erased, VF
 * is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is
 * outside the coordinates of the display, it wraps around to the opposite side of the screen.
 */
const drw: Instruction = ({ c, b, a }) => {
  const x = registers[reg(c)];
  const y = registers[reg(b)];
  const bytesToDraw = memoryMap.slice(
    registers.addressIndex,
    registers.addressIndex + a,
  );

  registers.vF = 0;
  bytesToDraw.forEach((byte, index) => {
    for (let i = 7; i >= 0; i--) {
      const bit = (masks[i] & byte) >> i;
      if (!bit) continue;

      if (toggleTile(x + 7 - i, y + index)) {
        registers.vF = 1;
      }
    }
  });
};

/**
 * Ex9E - SKP Vx
 *
 * Skip next instruction if key with the value of Vx is pressed.
 * Checks the keyboard, and if the key corresponding to the value of Vx is currently in the down position, PC is increased by 2.
 */
const skp: Instruction = (_nibbles) => {};

/**
 * ExA1 - SKNP Vx
 *
 * Skip next instruction if key with the value of Vx is not pressed.
 * Checks the keyboard, and if the key corresponding to the value of Vx is currently in the up position, PC is increased by 2.
 */
const sknp: Instruction = (_nibbles) => {};

/**
 * Fx07 - LD Vx, DT
 *
 * Set Vx = delay timer value.
 * The value of DT is placed into Vx.
 */
const ldvxdt: Instruction = (_nibbles) => {};

/**
 * Fx0A - LD Vx, K
 *
 * Wait for a key press, store the value of the key in Vx.
 * All execution stops until a key is pressed, then the value of that key is stored in Vx.
 */
const ldkey: Instruction = (_nibbles) => {};

/**
 * Fx15 - LD DT, Vx
 *
 * Set delay timer = Vx.
 * DT is set equal to the value of Vx.
 */
const lddtvx: Instruction = (_nibbles) => {};

/**
 * Fx18 - LD ST, Vx
 *
 * Set sound timer = Vx.
 * ST is set equal to the value of Vx.
 */
const ldstvx: Instruction = (_nibbles) => {};

/**
 * Fx1E - ADD I, Vx
 *
 * Set I = I + Vx.
 * The values of I and Vx are added, and the results are stored in I.
 */
const addivx: Instruction = (_nibbles) => {};

/**
 * Fx29 - LD F, Vx
 *
 * Set I = location of sprite for digit Vx.
 * The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx.
 */
const ldfont: Instruction = (_nibbles) => {};

/**
 * Fx33 - LD B, Vx
 *
 * Store BCD representation of Vx in memory locations I, I+1, and I+2.
 * The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I, the tens digit at location I+1, and the ones digit at location I+2.
 */
const ldbcd: Instruction = (_nibbles) => {};

/**
 * Fx55 - LD [I], Vx
 *
 * Store registers V0 through Vx in memory starting at location I.
 * The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
 */
const lda: Instruction = (_nibbles) => {};

/**
 * Fx65 - LD Vx, [I]
 *
 * Read registers V0 through Vx from memory starting at location I.
 * The interpreter reads values from memory starting at location I into registers V0 through Vx.
 */
const ldb: Instruction = (_nibbles) => {};

/**
 * Executes the given 2 byte intruction as specified by opcode.
 *
 * @param opcode the opcode of the 2 byte instruction to be executed.
 * @returns whether or not pc should be incremented by 2 bytes
 */
function executeInstruction(opcode: number): boolean {
  const d = (0xf000 & opcode) >> 12;
  const c = (0x0f00 & opcode) >> 8;
  const b = (0x00f0 & opcode) >> 4;
  const a = (0x000f & opcode) >> 0;
  const nibbles = { d, c, b, a };

  let increment = true;
  switch (d) {
    case 0x0:
      if (a === 0x0) cls(nibbles);
      if (a === 0xe) {
        ret(nibbles);
        increment = false;
      }
      break;

    case 0x1:
      jpAddr(nibbles);
      increment = false;
      break;

    case 0x2:
      call(nibbles);
      increment = false;
      break;

    case 0x3:
      seByte(nibbles);
      break;

    case 0x4:
      sneByte(nibbles);
      break;

    case 0x5:
      seReg(nibbles);
      break;

    case 0x6:
      ldByte(nibbles);
      break;

    case 0x7:
      addByte(nibbles);
      break;

    case 0x8:
      if (a === 0x0) ldVx(nibbles);
      if (a === 0x1) or(nibbles);
      if (a === 0x2) and(nibbles);
      if (a === 0x3) xor(nibbles);
      if (a === 0x4) addReg(nibbles);
      if (a === 0x5) sub(nibbles);
      if (a === 0x6) shr(nibbles);
      if (a === 0x7) subn(nibbles);
      if (a === 0xe) shl(nibbles);
      break;

    case 0x9:
      sneReg(nibbles);
      break;

    case 0xa:
      ldi(nibbles);
      break;

    case 0xb:
      jpv0Addr(nibbles);
      increment = false;
      break;

    case 0xc:
      rnd(nibbles);
      break;

    case 0xd:
      drw(nibbles);
      break;

    case 0xe:
      if (a === 0xe) skp(nibbles);
      if (a === 0x1) sknp(nibbles);
      break;

    case 0xf:
      if (b === 0x5 && a === 0x5) lda(nibbles);
      else if (b === 0x6 && a === 0x5) ldb(nibbles);
      else if (a === 0x5) lddtvx(nibbles);

      if (a === 0x7) ldvxdt(nibbles);
      if (a === 0xa) ldkey(nibbles);
      if (a === 0x8) ldstvx(nibbles);
      if (a === 0xe) addivx(nibbles);
      if (a === 0x9) ldfont(nibbles);
      if (a === 0x3) ldbcd(nibbles);
  }

  return increment;
}

export default executeInstruction;
