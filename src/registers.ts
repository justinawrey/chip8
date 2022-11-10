import { ROM_START } from "./ram.ts";

type Registers = Record<string, number>;

let stack: number[] = [];
const _registers: Registers = {
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

  // Specific purpose registers
  addressIndex: 0,
  delayTimer: 0,
  soundTimer: 0,
  programCounter: ROM_START,
};

const registers = new Proxy(_registers, {
  set(obj, prop, value, receiver) {
    if (typeof prop === "symbol") {
      return Reflect.set(obj, prop, value, receiver);
    }

    // Unsigned 8-bit registers can hold values from 0-255.
    // These are the general purpose registers, the delay timer, and the sound timer.
    if (
      prop.startsWith("v") || prop === "delayTimer" || prop === "soundTimer"
    ) {
      return Reflect.set(obj, prop, value % 256, receiver);
    }

    // Unsigned 16-bit registers can hold values from 0-65535.
    // These are the address index register and the program counter.
    if (prop === "addressIndex" || prop === "programCounter") {
      return Reflect.set(obj, prop, value % 65536, receiver);
    }

    return false;
  },
});

function reg(which: number): string {
  return `v${Number(which).toString(16).toUpperCase()}`;
}

function nnn(c: number, b: number, a: number): number {
  return (c << 8) | (b << 4) | a;
}

function kk(b: number, a: number): number {
  return (b << 4) | a;
}

function resetRegisters(): void {
  for (const register in registers) {
    registers[register] = 0;
  }

  registers.programCounter = ROM_START;
  stack = [];
}

export { kk, nnn, reg, registers as default, resetRegisters, stack };
