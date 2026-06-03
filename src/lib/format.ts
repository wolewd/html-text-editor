/**
 * DOM-based formatting — zero deprecated APIs.
 */

const TAG: Record<string, string> = {
  bold: "STRONG",
  italic: "EM",
  underline: "U",
  strikethrough: "S",
};

const BLOCKS = ["p", "h1", "h2", "h3", "h4", "h5", "h6"];
const BLOCK_SEL = "p, div, h1, h2, h3, h4, h5, h6";

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

// ── Block-level (headings / paragraph) ─────────────────────────────────────

let _busy = false;

export function isApplyingBlock() { return _busy; }

export function applyBlock(tag: string, savedRange?: Range, savedSel?: { sn: Node; so: number; en: Node; eo: number }) {
  const el = document.getElementById("wol-editor");
  if (!el) return;
  _busy = true;

  const sel = window.getSelection();
  const range = savedRange ?? (sel && sel.rangeCount ? sel.getRangeAt(0) : null);
  if (!range) return;

  let node: Node | null = range.commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

  const block = (node as HTMLElement)?.closest?.(BLOCK_SEL) as HTMLElement | null;
  if (!block || block === el) {
    // Multi-block selection — convert all blocks in the range
    convertAllBlocks(el, range, tag);
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    restoreSelection(savedSel, savedRange);
    el.focus();
    _busy = false;
    return;
  }
  const blockTag = block.tagName.toLowerCase();
  // Treat div as p — normalise to p before converting
  const from = blockTag === "div" ? "p" : blockTag;
  if (from === tag) return;

  const replacement = document.createElement(tag);
  while (block.firstChild) replacement.appendChild(block.firstChild);
  block.parentNode!.replaceChild(replacement, block);

  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  restoreSelection(savedSel, savedRange, replacement);
  el.focus();
  _busy = false;
}

function restoreSelection(
  savedSel?: { sn: Node; so: number; en: Node; eo: number },
  savedRange?: Range,
  fallbackNode?: Node,
) {
  const s = window.getSelection();
  if (savedSel && savedSel.sn.parentNode && savedSel.en.parentNode) {
    const nr = document.createRange();
    nr.setStart(savedSel.sn, savedSel.so);
    nr.setEnd(savedSel.en, savedSel.eo);
    s?.removeAllRanges();
    s?.addRange(nr);
  } else if (savedRange) {
    s?.removeAllRanges();
    s?.addRange(savedRange);
  } else if (fallbackNode) {
    const nr = document.createRange();
    nr.selectNodeContents(fallbackNode);
    nr.collapse(false);
    s?.removeAllRanges();
    s?.addRange(nr);
  }
}

function convertAllBlocks(root: HTMLElement, range: Range, tag: string) {
  let sNode: Node | null = range.startContainer;
  while (sNode && sNode !== root && (sNode.nodeType !== Node.ELEMENT_NODE || !(sNode as HTMLElement).matches(BLOCK_SEL))) {
    sNode = sNode.parentNode;
  }
  let eNode: Node | null = range.endContainer;
  while (eNode && eNode !== root && (eNode.nodeType !== Node.ELEMENT_NODE || !(eNode as HTMLElement).matches(BLOCK_SEL))) {
    eNode = eNode.parentNode;
  }
  if (!sNode || !eNode) return;

  let cur: Node | null = sNode;
  while (cur) {
    if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).matches(BLOCK_SEL)) {
      const el = cur as HTMLElement;
      const curTag = el.tagName.toLowerCase();
      const from = curTag === "div" ? "p" : curTag;
      if (from !== tag) {
        const rep = document.createElement(tag);
        while (el.firstChild) rep.appendChild(el.firstChild);
        el.replaceWith(rep);
        if (cur === sNode) sNode = rep;
        if (cur === eNode) { eNode = rep; cur = rep; break; }
        cur = rep;
      }
    }
    if (cur === eNode) break;
    cur = cur.nextSibling;
  }
}

export function currentBlockTag(): string {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return "p";

  let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

  const tag = (node as HTMLElement)?.closest?.(BLOCK_SEL)?.tagName?.toLowerCase();
  if (!tag || tag === "div") return "p";
  return BLOCKS.includes(tag) ? tag : "p";
}
