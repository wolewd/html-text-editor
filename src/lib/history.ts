const MAX = 50;

let undone: string[] = [];
let redone: string[] = [];

function ed(): HTMLElement | null {
  return document.getElementById("wol-editor");
}

export function save() {
  const el = ed();
  if (!el) return;
  undone.push(el.innerHTML);
  if (undone.length > MAX) undone.shift();
  redone = [];
}

export function undo() {
  if (undone.length <= 1) return;
  const el = ed();
  if (!el) return;
  redone.push(undone.pop()!);
  el.innerHTML = undone[undone.length - 1]!;
  placeCursorAtEnd(el);
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

export function redo() {
  if (!redone.length) return;
  const el = ed();
  if (!el) return;
  undone.push(redone.pop()!);
  el.innerHTML = undone[undone.length - 1]!;
  placeCursorAtEnd(el);
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

function placeCursorAtEnd(el: HTMLElement) {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  sel.selectAllChildren(el);
  sel.collapseToEnd();
}
