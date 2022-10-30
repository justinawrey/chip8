import registers, { resetRegisters } from "./registers.ts";
import memoryMap, { loadRom } from "./ram.ts";
import executeInstruction from "./intructions.ts";
import { clearDisplay } from "./display.ts";

// Most chip8 programs perform well at
// around 700 instructions per second.
const STABLE_EXEC_SPEED = 700;
const ONE_SECOND = 1000;

let running: number | undefined;
function limitExecutionSpeed(
  cb: () => void,
  limit: number = STABLE_EXEC_SPEED,
): void {
  running = setInterval(cb, ONE_SECOND / limit);
}

function start(): void {
  if (!running) {
    limitExecutionSpeed(mainLoop);
  }
}

function stop(): void {
  clearInterval(running);
  running = undefined;

  resetRegisters();
  clearDisplay();
}

function mainLoop(): void {
  const highByte = memoryMap[registers.programCounter];
  const lowByte = memoryMap[registers.programCounter + 1];
  const opcode = (highByte << 8) | lowByte;

  const increment = executeInstruction(opcode);
  if (increment) {
    registers.programCounter += 2;
  }
}

// Entry point to the program
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start")!;
  const stopBtn = document.getElementById("stop")!;

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);

  const input = document.getElementsByTagName("input")[0];
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    stop();
    file.arrayBuffer().then((buffer) => {
      loadRom(buffer);
    });
  });
});
