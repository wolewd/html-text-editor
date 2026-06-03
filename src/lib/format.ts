/**
 * DOM-based formatting — zero deprecated APIs.
 */

const TAG: Record<string, string> = {
  bold: "STRONG",
  italic: "EM",
  underline: "U",
  strikethrough: "S",
};

export function format(cmd: string) {
  const el = document.getElementById("wol-editor");
  if (!el) return;
  el.focus();

  const tag = TAG[cmd];
  if (!tag) return;

  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  const range = sel.getRangeAt(0);

  if (isFormatActive(cmd)) {
    removeFormat(range, tag);
  } else {
    applyFormat(range, tag);
  }

  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

function applyFormat(range: Range, tag: string) {
  if (range.collapsed) return;

  const wrapper = document.createElement(tag);

  try {
    range.surroundContents(wrapper);
  } catch {
    // Range straddles element boundaries — extract and wrap manually
    const frag = range.extractContents();
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
  }

  // Restore selection inside the wrapper with a fresh range — the original
  // range was mutated by surroundContents / extractContents.
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(newRange);
}

function removeFormat(range: Range, tag: string) {
  let node: Node | null = range.commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

  const wrapper = (node as HTMLElement)?.closest?.(tag);
  if (!wrapper) return;

  const parent = wrapper.parentNode!;
  const first = wrapper.firstChild;
  const last = wrapper.lastChild;

  while (wrapper.firstChild) {
    parent.insertBefore(wrapper.firstChild, wrapper);
  }
  parent.removeChild(wrapper);

  // Restore selection over the unwrapped content
  if (first && last) {
    const nr = document.createRange();
    nr.setStartBefore(first);
    nr.setEndAfter(last);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(nr);
  }
}

export function isFormatActive(cmd: string): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;

  let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

  const el = node as HTMLElement | null;
  if (!el?.closest) return false;

  const tag = TAG[cmd];
  if (!tag) return false;

  return !!el.closest(tag);
}
