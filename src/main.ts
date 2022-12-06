import registers, { drawRegisters, resetRegisters } from "./registers.ts";
import memoryMap, { loadRom } from "./ram.ts";
import executeInstruction, {
  drawInstruction,
  resetDrawn,
} from "./intructions.ts";
import {
  clearDisplay,
  clearState,
  draw,
  drawTitleScreen,
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
  throttleCounter = 0;

  resetRegisters();
  clearDisplay();
  clearState();
  resetDrawn();
}

function timerLoop(timer: "delayTimer" | "soundTimer"): () => void {
  return () => {
    if (registers[timer] > 0) {
      registers[timer] -= 1;
    }
  };
}

let throttleCounter = 0;
function mainLoop(): void {
  throttleCounter++;

  const highByte = memoryMap[registers.programCounter];
  const lowByte = memoryMap[registers.programCounter + 1];
  const opcode = (highByte << 8) | lowByte;

  const [increment, instruction] = executeInstruction(opcode);
  if (increment) {
    registers.programCounter += 2;
  }

  if ((document.getElementById("hardware") as HTMLInputElement).checked) {
    if (throttleCounter > 18) {
      drawRegisters();
      drawInstruction(instruction);
      throttleCounter = 0;
    }
  }
}

// Entry point to the program
document.addEventListener("DOMContentLoaded", () => {
  drawTitleScreen();

  Object.keys(keys).forEach((key) => {
    const button = document.getElementById(`key-${key}`)!;
    button.addEventListener("mousedown", () => pressKey(key));
    button.addEventListener("mouseup", () => releaseKey(key));
    globalThis.addEventListener("keydown", (e) => {
      if (e.key === key.toLowerCase() || e.key === key) {
        pressKey(key);
        button.classList.add("pressed");
      }
    });

    globalThis.addEventListener("keyup", (e) => {
      if (e.key === key.toLowerCase() || e.key === key) {
        releaseKey(key);
        button.classList.remove("pressed");
      }
    });
  });

  const select = document.getElementById("rom")!;
  select.addEventListener("change", async (e) => {
    const rom = (e.target as HTMLSelectElement).value;
    if (rom === "default") {
      stop();
      drawTitleScreen();
      drawRegisters(true);
      return;
    }

    const res = await fetch(`rom/${rom}.ch8`);
    res.arrayBuffer().then((buffer) => loadRom(new Uint8Array(buffer)));

    stop();
    start();
  });

  const gridToggle = document.getElementById("grid")!;
  gridToggle.addEventListener(
    "change",
    (e) => {
      setGrid((e.target as HTMLInputElement).checked);
      draw(true);
    },
  );

  const themeToggle = document.getElementById("theme")!;
  themeToggle.addEventListener("change", () => {
    toggleTheme();
    draw(true);
  });

  const hardwareToggle = document.getElementById("hardware")!;
  function addRegisters() {
    let i = 0;
    const hardware = document.createElement("div");
    hardware.id = "reg-hardware";

    let row = document.createElement("span");
    for (const register in registers) {
      i++;
      const div = document.createElement("div");
      div.id = `reg-${register}`;
      row.appendChild(div);

      if (i % 4 === 0) {
        hardware.appendChild(row);
        row = document.createElement("span");
      }
    }
    document.getElementsByClassName("container")[0].appendChild(hardware);
    const instructions = document.createElement("ul");
    instructions.id = "instructions-list";
    hardware.appendChild(instructions);

    drawRegisters(true);
  }
  addRegisters();

  hardwareToggle.addEventListener("change", (e) => {
    const checked = (e.target as HTMLInputElement).checked;

    if (checked) {
      addRegisters();
    } else {
      document.getElementById("reg-hardware")?.remove();
    }
  });
});
