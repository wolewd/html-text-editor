const MAX = 100;

let stack: string[] = [];
let index = -1;

function ed(): HTMLElement | null {
  return document.getElementById("wol-editor");
}

export function save() {
  const el = ed();
  if (!el) return;

  const html = el.innerHTML;

  // Don't save duplicate consecutive states
  if (stack[index] === html) return;

  // Discard any redo states ahead
  stack = stack.slice(0, index + 1);
  stack.push(html);
  if (stack.length > MAX) stack.shift();
  index = stack.length - 1;
}

export function undo() {
  if (index <= 0) return;
  const el = ed();
  if (!el) return;
  index--;
  el.innerHTML = stack[index]!;
  placeCursorAtEnd(el);
  el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: false }));
}

export function redo() {
  if (index >= stack.length - 1) return;
  const el = ed();
  if (!el) return;
  index++;
  el.innerHTML = stack[index]!;
  placeCursorAtEnd(el);
  el.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: false }));
}

export function canUndo() { return index > 0; }
export function canRedo() { return index < stack.length - 1; }

function placeCursorAtEnd(el: HTMLElement) {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  sel.selectAllChildren(el);
  sel.collapseToEnd();
}
