import { clearDisplay, toggleTile } from './display.js'
import memoryMap from './ram.js'
import registers, { stack, reg } from './registers.js'

interface Nibbles {
  // High nibble of the higher byte
  readonly d: number

  // Low nibble of the higher byte
  readonly c: number

  // High nibble of the lower byte
  readonly b: number

  // Low nibble of the lower byte
  readonly a: number
}

type Instruction = (nibbles: Nibbles) => void
type BitMasks = Record<string, number>

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
}

/**
 * 0nnn - SYS addr
 *
 * Jump to a machine code routine at nnn.
 * This instruction is only used on the old computers on which Chip-8 was originally implemented.
 * Ignored by modern interpreters but included here for posterity.
 */
const sys: Instruction = () => {}

/**
 * 00e0 - CLS
 *
 * Clear the display.
 */
const cls: Instruction = () => clearDisplay()

/**
 * 00EE - RET
 *
 * Return from a subroutine.
 * The interpreter sets the program counter to the address at the top of the stack, then subtracts 1 from the stack pointer.
 */
const ret: Instruction = () => {
  const returnAddr = stack.pop()
  if (returnAddr) {
    registers.programCounter = returnAddr
  }
}

/**
 * 1nnn - JP addr
 *
 * Jump to location nnn.
 * The interpreter sets the program counter to nnn.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const jpAddr: Instruction = ({ c, b, a }) => {
  registers.programCounter = (c << 8) | (b << 4) | a
}

/**
 * 2nnn - CALL addr
 *
 * Call subroutine at nnn.
 * The interpreter increments the stack pointer, then puts the current PC on the top of the stack. The PC is then set to nnn.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const call: Instruction = ({ c, b, a }) => {
  stack.push(registers.programCounter)
  registers.programCounter = (c << 8) | (b << 4) | a
}

/**
 * 3xkk - SE Vx, byte
 *
 * Skip next instruction if Vx = kk.
 * The interpreter compares register Vx to kk, and if they are equal, increments the program counter by 2.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const seByte: Instruction = ({ c, b, a }) => {
  if (registers[reg(c)] === ((b << 4) | a)) {
    registers.programCounter += 2
  }
}

/**
 * 4xkk - SNE Vx, byte
 *
 * Skip next instruction if Vx != kk.
 * The interpreter compares register Vx to kk, and if they are not equal, increments the program counter by 2.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const sneByte: Instruction = ({ c, b, a }) => {
  if (registers[reg(c)] !== ((b << 4) | a)) {
    registers.programCounter += 2
  }
}

/**
 * 5xy0 - SE Vx, Vy
 *
 * Skip next instruction if Vx = Vy.
 * The interpreter compares register Vx to register Vy, and if they are equal, increments the program counter by 2.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const seReg: Instruction = ({ c, b }) => {
  if (registers[reg(c)] === registers[reg(b)]) {
    registers.programCounter += 2
  }
}

/**
 * 6xkk - LD Vx, byte
 *
 * Set Vx = kk.
 * The interpreter puts the value kk into register Vx.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ldByte: Instruction = ({ c, b, a }) => {
  registers[reg(c)] = (b << 4) | a
}

/**
 * 7xkk - ADD Vx, byte
 *
 * Set Vx = Vx + kk.
 * Adds the value kk to the value of register Vx, then stores the result in Vx.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const addByte: Instruction = ({ c, b, a }) => {
  registers[reg(c)] = registers[reg(c)] + ((b << 4) | a)
}

/**
 * 8xy0 - LD Vx, Vy
 *
 * Set Vx = Vy.
 * Stores the value of register Vy in register Vx.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ldVx: Instruction = ({ c, b }) => {
  registers[reg(c)] = registers[reg(b)]
}

/**
 * 8xy1 - OR Vx, Vy
 *
 * Set Vx = Vx OR Vy.
 * Performs a bitwise OR on the values of Vx and Vy, then stores the result in Vx. A bitwise OR compares
 * the corresponding bits from two values, and if either bit is 1, then the same bit in the result is also 1. Otherwise, it is 0.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const or: Instruction = ({ c, b }) => {
  registers[reg(c)] = registers[reg(c)] | registers[reg(b)]
}

/**
 * 8xy2 - AND Vx, Vy
 *
 * Set Vx = Vx AND Vy.
 * Performs a bitwise AND on the values of Vx and Vy, then stores the result in Vx. A bitwise AND compares
 * the corresponding bits from two values, and if both bits are 1, then the same bit in the result is also 1. Otherwise, it is 0.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const and: Instruction = ({ c, b }) => {
  registers[reg(c)] = registers[reg(c)] & registers[reg(b)]
}

/**
 * 8xy3 - XOR Vx, Vy
 *
 * Set Vx = Vx XOR Vy.
 * Performs a bitwise exclusive OR on the values of Vx and Vy, then stores the result in Vx. An exclusive OR compares
 * the corresponding bits from two values, and if the bits are not both the same, then the corresponding bit in the result is set to 1. Otherwise, it is 0.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const xor: Instruction = ({ c, b }) => {
  registers[reg(c)] = registers[reg(c)] ^ registers[reg(b)]
}

/**
 * 8xy4 - ADD Vx, Vy
 *
 * Set Vx = Vx + Vy, set VF = carry.
 * The values of Vx and Vy are added together. If the result is greater than 8 bits (i.e., > 255,) VF is set to 1, otherwise 0.
 * Only the lowest 8 bits of the result are kept, and stored in Vx.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const addReg: Instruction = ({ c, b }) => {
  const sum = registers[reg(c)] + registers[reg(b)]

  registers.vF = sum > 255 ? 1 : 0
  registers[reg(c)] = sum & 0xff
}

/**
 * 8xy5 - SUB Vx, Vy
 *
 * Set Vx = Vx - Vy, set VF = NOT borrow.
 * If Vx > Vy, then VF is set to 1, otherwise 0. Then Vy is subtracted from Vx, and the results stored in Vx.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const sub: Instruction = ({ c, b }) => {
  const difference = registers[reg(c)] - registers[reg(b)]

  registers.vF = difference > 0 ? 1 : 0
  registers[reg(c)] = difference
}

/**
 * 8xy6 - SHR Vx {, Vy}
 *
 * Set Vx = Vx SHR 1.
 * If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const shr: Instruction = ({ c }) => {
  registers.vF = (registers[reg(c)] & 0x01) === 1 ? 1 : 0
  registers[reg(c)] = registers[reg(c)] / 2
}

/**
 * 8xy7 - SUBN Vx, Vy
 *
 * Set Vx = Vy - Vx, set VF = NOT borrow.
 * If Vy > Vx, then VF is set to 1, otherwise 0. Then Vx is subtracted from Vy, and the results stored in Vx.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const subn: Instruction = ({ c, b }) => {
  const difference = registers[reg(b)] - registers[reg(c)]

  registers.vF = difference > 0 ? 1 : 0
  registers[reg(c)] = difference
}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const shl: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const sne2: Instruction = (nibbles) => {}

/**
 * Annn - LD I, addr
 *
 * Set I = nnn.
 * The value of register I is set to nnn.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ldi: Instruction = ({ c, b, a }) => {
  registers.addressIndex = (c << 8) | (b << 4) | a
}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const jp2: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const rnd: Instruction = (nibbles) => {}

/**
 * Dxyn - DRW Vx, Vy, nibble
 *
 * Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
 * The interpreter reads n bytes from memory, starting at the address stored in I.
 * These bytes are then displayed as sprites on screen at coordinates (Vx, Vy).
 * Sprites are XORed onto the existing screen. If this causes any pixels to be erased, VF
 * is set to 1, otherwise it is set to 0. If the sprite is positioned so part of it is
 * outside the coordinates of the display, it wraps around to the opposite side of the screen.
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const drw: Instruction = ({ c, b, a }) => {
  const x = registers[reg(c)]
  const y = registers[reg(b)]
  const bytesToDraw = memoryMap.slice(
    registers.addressIndex,
    registers.addressIndex + a
  )

  registers.vF = 0
  bytesToDraw.forEach((byte, index) => {
    for (let i = 7; i >= 0; i--) {
      const bit = (masks[i] & byte) >> i
      if (!bit) continue

      if (toggleTile(x + 7 - i, y + index)) {
        registers.vF = 1
      }
    }
  })
}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const skp: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const sknp: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ld4: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ld5: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ld6: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ld7: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const add3: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ld8: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ld9: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const lda: Instruction = (nibbles) => {}

/**
 *
 * @param nibbles Object containing the 4 nibbles of two bytes from highest to lowest, labelled d, c, b, and a.
 */
const ldb: Instruction = (nibbles) => {}

/**
 * Executes the given 2 byte intruction as specified by opcode.
 *
 * @param opcode the opcode of the 2 byte instruction to be executed.
 * @returns whether or not pc should be incremented by 2 bytes
 */
function executeInstruction(opcode: number): boolean {
  const d = (0xf000 & opcode) >> 12
  const c = (0x0f00 & opcode) >> 8
  const b = (0x00f0 & opcode) >> 4
  const a = (0x000f & opcode) >> 0
  const nibbles = { d, c, b, a }

  let increment = true
  switch (d) {
    case 0x0:
      if (a === 0x0) cls(nibbles)
      if (a === 0xe) ret(nibbles)
      sys(nibbles)
      break

    case 0x1:
      jpAddr(nibbles)
      increment = false
      break

    case 0x2:
      call(nibbles)
      break

    case 0x3:
      seByte(nibbles)
      break

    case 0x4:
      sneByte(nibbles)
      break

    case 0x5:
      seReg(nibbles)
      break

    case 0x6:
      ldByte(nibbles)
      break

    case 0x7:
      addByte(nibbles)
      break

    case 0x8:
      if (a === 0x0) ldVx(nibbles)
      if (a === 0x1) or(nibbles)
      if (a === 0x2) and(nibbles)
      if (a === 0x3) xor(nibbles)
      if (a === 0x4) addReg(nibbles)
      if (a === 0x5) sub(nibbles)
      if (a === 0x6) shr(nibbles)
      if (a === 0x7) subn(nibbles)
      if (a === 0xe) shl(nibbles)
      break

    case 0x9:
      sne2(nibbles)
      break

    case 0xa:
      ldi(nibbles)
      break

    case 0xb:
      jp2(nibbles)
      break

    case 0xc:
      rnd(nibbles)
      break

    case 0xd:
      drw(nibbles)
      break

    case 0xe:
      if (a === 0xe) skp(nibbles)
      if (a === 0x1) sknp(nibbles)
      break

    case 0xf:
      if (b === 0x5 && a === 0x5) lda(nibbles)
      else if (b === 0x6 && a === 0x5) ldb(nibbles)
      else if (a === 0x5) ld6(nibbles)

      if (a === 0x7) ld4(nibbles)
      if (a === 0xa) ld5(nibbles)
      if (a === 0x8) ld7(nibbles)
      if (a === 0xe) add3(nibbles)
      if (a === 0x9) ld8(nibbles)
      if (a === 0x3) ld9(nibbles)
  }

  return increment
}

export default executeInstruction
