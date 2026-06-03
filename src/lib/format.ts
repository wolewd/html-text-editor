/**
 * DOM-based formatting — zero deprecated APIs.
 */

const TAG: Record<string, string> = {
  bold:          "STRONG",
  italic:        "EM",
  underline:     "U",
  strikethrough: "S",
};

// Never include "div" here — #wol-editor is a div and closest() would match it,
// making every paragraph appear as an unknown block type.
const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
const BLOCK_SEL  = BLOCK_TAGS.join(", ");

// ── Inline format ────────────────────────────────────────────────────────────

export function format(cmd: string) {
  const editor = document.getElementById("wol-editor");
  if (!editor) return;
  editor.focus();

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

  editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

function applyFormat(range: Range, tag: string) {
  if (range.collapsed) return;
  const wrapper = document.createElement(tag);
  try {
    range.surroundContents(wrapper);
  } catch {
    const frag = range.extractContents();
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
  }
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
  const first  = wrapper.firstChild;
  const last   = wrapper.lastChild;

  while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
  parent.removeChild(wrapper);

  if (first && last) {
    const nr = document.createRange();
    nr.setStartBefore(first);
    nr.setEndAfter(last);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(nr);
  }

  document.dispatchEvent(new Event("selectionchange"));
}

function convertAllBlocks(root: HTMLElement, range: Range, tag: string) {
  let sNode: Node | null = range.startContainer;
  while (sNode && sNode !== root && !(sNode.nodeType === Node.ELEMENT_NODE && (sNode as HTMLElement).matches(BLOCK_SEL))) {
    sNode = sNode.parentNode;
  }
  let eNode: Node | null = range.endContainer;
  while (eNode && eNode !== root && !(eNode.nodeType === Node.ELEMENT_NODE && (eNode as HTMLElement).matches(BLOCK_SEL))) {
    eNode = eNode.parentNode;
  }
  if (!sNode || !eNode || sNode === root || eNode === root) return;

  let cur: Node | null = sNode;
  while (cur) {
    const next = cur.nextSibling;
    if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).matches(BLOCK_SEL)) {
      const el  = cur as HTMLElement;
      if (el.tagName.toLowerCase() !== tag) {
        const rep = document.createElement(tag);
        while (el.firstChild) rep.appendChild(el.firstChild);
        el.replaceWith(rep);
        if (cur === sNode) sNode = rep;
        if (cur === eNode) eNode = rep;
        cur = rep;
      }
    }
    if (cur === eNode) break;
    cur = next;
  }
}

export function isFormatActive(cmd: string): boolean {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
  const tag = TAG[cmd];
  if (!tag) return false;
  return !!(node as HTMLElement)?.closest?.(tag);
}

// ── Block format ─────────────────────────────────────────────────────────────

let _busy = false;
export function isApplyingBlock() { return _busy; }

export function applyBlock(
  tag: string,
  savedRange?: Range,
  savedSel?: { sn: Node; so: number; en: Node; eo: number },
) {
  const editor = document.getElementById("wol-editor");
  if (!editor) return;
  _busy = true;

  const sel   = window.getSelection();
  const range = savedRange ?? (sel?.rangeCount ? sel.getRangeAt(0) : null);
  if (!range) { _busy = false; return; }

  let node: Node | null = range.commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

  // If the common ancestor IS the editor root, we have a multi-block selection
  const block = node === editor
    ? null
    : (node as HTMLElement)?.closest?.(BLOCK_SEL) as HTMLElement | null;

  if (!block || block === editor) {
    convertAllBlocks(editor, range, tag);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
    restoreSelection(savedSel, savedRange);
    _busy = false;
    return;
  }

  if (block.tagName.toLowerCase() === tag) { _busy = false; return; }

  const rep = document.createElement(tag);
  while (block.firstChild) rep.appendChild(block.firstChild);
  block.replaceWith(rep);

  editor.dispatchEvent(new InputEvent("input", { bubbles: true }));

  // Restore cursor inside the new element
  const nr = document.createRange();
  nr.selectNodeContents(rep);
  nr.collapse(false);
  sel?.removeAllRanges();
  sel?.addRange(nr);

  editor.focus();
  _busy = false;
}

function restoreSelection(
  savedSel?: { sn: Node; so: number; en: Node; eo: number },
  savedRange?: Range,
) {
  const sel = window.getSelection();
  if (!sel) return;

  if (savedSel?.sn.parentNode && savedSel.en.parentNode) {
    try {
      const nr = document.createRange();
      nr.setStart(savedSel.sn, savedSel.so);
      nr.setEnd(savedSel.en, savedSel.eo);
      sel.removeAllRanges();
      sel.addRange(nr);
      return;
    } catch { /* fall through */ }
  }
  if (savedRange) {
    try { sel.removeAllRanges(); sel.addRange(savedRange); } catch { /* ignore */ }
  }
}

function getSelectedBlocks(root: HTMLElement, range: Range): HTMLElement[] {
  let s: Node | null = range.startContainer;
  while (s && s !== root && !(s.nodeType === Node.ELEMENT_NODE && (s as HTMLElement).matches(BLOCK_SEL))) s = s.parentNode;
  let e: Node | null = range.endContainer;
  while (e && e !== root && !(e.nodeType === Node.ELEMENT_NODE && (e as HTMLElement).matches(BLOCK_SEL))) e = e.parentNode;

  const result: HTMLElement[] = [];
  if (!s || !e || s === root || e === root) return result;

  // Handle reverse selection
  if (s.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING) [s, e] = [e, s];

  let cur: Node | null = s;
  while (cur) {
    if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).matches(BLOCK_SEL)) {
      result.push(cur as HTMLElement);
    }
    if (cur === e) break;
    cur = cur.nextSibling;
  }
  return result;
}

function convertAllBlocks(root: HTMLElement, range: Range, tag: string) {
  let sNode: Node | null = range.startContainer;
  while (sNode && sNode !== root && !(sNode.nodeType === Node.ELEMENT_NODE && (sNode as HTMLElement).matches(BLOCK_SEL))) {
    sNode = sNode.parentNode;
  }
  let eNode: Node | null = range.endContainer;
  while (eNode && eNode !== root && !(eNode.nodeType === Node.ELEMENT_NODE && (eNode as HTMLElement).matches(BLOCK_SEL))) {
    eNode = eNode.parentNode;
  }
  if (!sNode || !eNode || sNode === root || eNode === root) return;

  let cur: Node | null = sNode;
  while (cur) {
    const next = cur.nextSibling; // save BEFORE replaceWith detaches cur

    if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).matches(BLOCK_SEL)) {
      const el  = cur as HTMLElement;
      if (el.tagName.toLowerCase() !== tag) {
        const rep = document.createElement(tag);
        while (el.firstChild) rep.appendChild(el.firstChild);
        el.replaceWith(rep);
        if (cur === sNode) sNode = rep;
        if (cur === eNode) eNode = rep;
        cur = rep;
      }
    }

    if (cur === eNode) break;
    cur = next;
  }
}

export function currentBlockTag(): string {
  const editor = document.getElementById("wol-editor");
  if (!editor) return "p";
  const sel = window.getSelection();
  if (!sel?.rangeCount) return "p";

  const range = sel.getRangeAt(0);

  // Multi-block selection — check all blocks in range
  if (!range.collapsed) {
    const blocks = getSelectedBlocks(editor, range);
    if (blocks.length > 1) {
      const tags = new Set(blocks.map(b => b.tagName.toLowerCase()));
      return tags.size === 1 ? [...tags][0] : "mixed";
    }
  }

  // Single cursor — walk up to find the block
  let node: Node | null = range.commonAncestorContainer;
  while (node && node !== editor) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase();
      if ((BLOCK_TAGS as readonly string[]).includes(tag)) return tag;
    }
    node = node.parentNode;
  }

  return "p";
}
