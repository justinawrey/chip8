import { ROM_START } from './ram.js'

type Registers = Record<string, number>

const stack: number[] = []
const registers: Registers = {
  // General purpose numbers
  v0: 0,
  v1: 0,
  v2: 0,
  v3: 0,
  v4: 0,
  v5: 0,
  v6: 0,
  v7: 0,
  v8: 0,
  v9: 0,
  vA: 0,
  vB: 0,
  vC: 0,
  vD: 0,
  vE: 0,
  vF: 0,

  // Specific purpose numbers
  addressIndex: 0,
  delayTimer: 0,
  soundTimer: 0,
  programCounter: ROM_START,
}

function reg(which: number): string {
  return `v${Number(which).toString(16).toUpperCase()}`
}

function resetRegisters(): void {
  for (let register in registers) {
    registers[register] = 0
  }

  registers.programCounter = ROM_START
}

export { registers as default, stack, resetRegisters, reg }
