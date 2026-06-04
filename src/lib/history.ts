const MAX = 100;

let stack: string[] = [];
let index = -1;

export function save(value: string) {
  // Don't save duplicate consecutive states
  if (stack[index] === value) return;

  // Discard any redo states ahead
  stack = stack.slice(0, index + 1);
  stack.push(value);
  if (stack.length > MAX) stack.shift();
  else index = stack.length - 1;
}

export function undo(): string | null {
  if (index <= 0) return null;
  index--;
  return stack[index]!;
}

export function redo(): string | null {
  if (index >= stack.length - 1) return null;
  index++;
  return stack[index]!;
}

export function canUndo() { return index > 0; }
export function canRedo() { return index < stack.length - 1; }

// Clear history and seed with an initial value
export function reset(initialValue: string) {
  stack = [initialValue];
  index = 0;
}
