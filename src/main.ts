import registers, { resetRegisters } from './registers.js'
import memoryMap, { clearRom, loadRom } from './ram.js'
import executeInstruction from './intructions.js'
import { clearDisplay } from './display.js'

// Most chip8 programs perform well at
// around 700 instructions per second.
const STABLE_EXEC_SPEED = 700
const ONE_SECOND = 1000

let running: number | undefined
function limitExecutionSpeed(
  cb: Function,
  limit: number = STABLE_EXEC_SPEED
): void {
  running = window.setInterval(cb, ONE_SECOND / limit)
}

function start(): void {
  if (!running) {
    limitExecutionSpeed(mainLoop)
  }
}

function stop(): void {
  window.clearInterval(running)
  running = undefined

  resetRegisters()
  clearDisplay()
}

function mainLoop(): void {
  const highByte = memoryMap[registers.programCounter]
  const lowByte = memoryMap[registers.programCounter + 1]
  const opcode = (highByte << 8) | lowByte

  const increment = executeInstruction(opcode)
  if (increment) {
    registers.programCounter += 2
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start')
  const stopBtn = document.getElementById('stop')

  startBtn?.addEventListener('click', start)
  stopBtn?.addEventListener('click', stop)

  const input = document.getElementById('file') as HTMLInputElement
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return

    stop()
    file.arrayBuffer().then((buffer) => {
      loadRom(buffer)
    })
  })
})
