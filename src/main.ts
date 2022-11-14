import registers, { resetRegisters } from "./registers.ts";
import memoryMap, { loadRom } from "./ram.ts";
import executeInstruction from "./intructions.ts";
import {
  clearDisplay,
  clearState,
  draw,
  setGrid,
  toggleTheme,
} from "./display.ts";
import { keys, pressKey, releaseKey } from "./io.ts";

// Most chip8 programs perform well at
// around 700 instructions per second.
const CPU_EXEC_SPEED = 700;
// Both DT and ST are updated at 60Hz.
const TIMER_EXEC_SPEED = 60;
const ONE_SECOND = 1000;

let cpu: number | undefined;
let dt: number | undefined;
let st: number | undefined;

function limitExecutionSpeed(
  cb: () => void,
  limit: number,
): number {
  return setInterval(cb, ONE_SECOND / limit);
}

function start(): void {
  if (!cpu) {
    cpu = limitExecutionSpeed(mainLoop, CPU_EXEC_SPEED);
  }

  if (!dt) {
    dt = limitExecutionSpeed(timerLoop("delayTimer"), TIMER_EXEC_SPEED);
  }

  if (!st) {
    st = limitExecutionSpeed(timerLoop("soundTimer"), TIMER_EXEC_SPEED);
  }
}

function stop(): void {
  clearInterval(cpu);
  clearInterval(dt);
  clearInterval(st);
  cpu = undefined;
  dt = undefined;
  st = undefined;

  resetRegisters();
  clearDisplay();
  clearState();
}

function timerLoop(timer: "delayTimer" | "soundTimer"): () => void {
  return () => {
    if (registers[timer] > 0) {
      registers[timer] -= 1;
    }
  };
}

function mainLoop(): void {
  const highByte = memoryMap[registers.programCounter];
  const lowByte = memoryMap[registers.programCounter + 1];
  const opcode = (highByte << 8) | lowByte;

  const increment = executeInstruction(opcode);
  if (increment) {
    registers.programCounter += 2;
  }

  draw();
}

// Entry point to the program
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start")!;
  const stopBtn = document.getElementById("stop")!;
  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);

  Object.keys(keys).forEach((key) => {
    const button = document.getElementById(`key-${key}`)!;
    button.addEventListener("mousedown", () => pressKey(key));
    button.addEventListener("mouseup", () => releaseKey(key));
  });

  const input = document.getElementsByTagName("input")[0];
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    stop();
    file.arrayBuffer().then(loadRom);
  });

  const gridToggle = document.getElementById("grid")!;
  gridToggle.addEventListener(
    "change",
    (e) => setGrid((e.target as HTMLInputElement).checked),
  );

  const themeToggle = document.getElementById("theme")!;
  themeToggle.addEventListener("change", toggleTheme);
});
