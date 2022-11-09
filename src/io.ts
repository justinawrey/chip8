class Key {
  pressed = false;
}

function pressKey(id: string): void {
  const key = keys[id];
  key.pressed = true;
}

function releaseKey(id: string): void {
  const key = keys[id];
  key.pressed = false;
}

function checkKey(id: string): boolean {
  const key = keys[id];
  return key.pressed;
}

function checkKeys(): string | null {
  for (const key in keys) {
    const pressed = checkKey(key);
    if (pressed) {
      return key;
    }
  }

  return null;
}

const keys: Record<string, Key> = {
  0: new Key(),
  1: new Key(),
  2: new Key(),
  3: new Key(),
  4: new Key(),
  5: new Key(),
  6: new Key(),
  7: new Key(),
  8: new Key(),
  9: new Key(),
  A: new Key(),
  B: new Key(),
  C: new Key(),
  D: new Key(),
  E: new Key(),
  F: new Key(),
};

export { checkKey, checkKeys, keys, pressKey, releaseKey };
