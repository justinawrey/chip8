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

const registerDisplayNames: Record<keyof typeof _registers, string> = {
  v0: "V0",
  v1: "V1",
  v2: "V2",
  v3: "V3",
  v4: "V4",
  v5: "V5",
  v6: "V6",
  v7: "V7",
  v8: "V8",
  v9: "V9",
  vA: "VA",
  vB: "VB",
  vC: "VC",
  vD: "VD",
  vE: "VE",
  vF: "VF",
  addressIndex: "I",
  delayTimer: "DT",
  soundTimer: "ST",
  programCounter: "PC",
};

const registers = new Proxy(_registers, {
  set(obj, prop, value, receiver) {
    // Handle 8-bit and 16-bit overflow
    function wrap(value: number, max: number): number {
      // Handle negative numbers
      if (value < 0) {
        value = Math.abs(value);
        return max - (value % max);
      }

      return value % max;
    }

    if (typeof prop === "symbol") {
      return Reflect.set(obj, prop, value, receiver);
    }

    // Unsigned 8-bit registers can hold values from 0-255.
    // These are the general purpose registers, the delay timer, and the sound timer.
    if (
      prop.startsWith("v") || prop === "delayTimer" || prop === "soundTimer"
    ) {
      return Reflect.set(obj, prop, wrap(value, 256), receiver);
    }

    // Unsigned 16-bit registers can hold values from 0-65535.
    // These are the address index register and the program counter.
    if (prop === "addressIndex" || prop === "programCounter") {
      return Reflect.set(obj, prop, wrap(value, 65536), receiver);
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

const oldRegisters = {
  ...registers,
};
let firstDrawDone = false;

function drawRegisters(): void {
  for (const register in registers) {
    // Don't update DOM for registers that haven't changed
    // Always draw for the first time
    const value = registers[register];
    if (firstDrawDone) {
      if (value === oldRegisters[register]) {
        continue;
      }

      oldRegisters[register] = value;
    }

    // Update DOM
    const el = document.getElementById(`reg-${register}`);
    if (el) {
      el.innerHTML = `<b>${registerDisplayNames[register]}</b>: ${value}`;
    }
  }

  firstDrawDone = true;
}

export {
  drawRegisters,
  kk,
  nnn,
  reg,
  registers as default,
  resetRegisters,
  stack,
};
