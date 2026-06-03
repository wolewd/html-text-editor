/**
 * Formatting via document.execCommand.
 * execCommand handles all cursor/wrapper edge cases the browser already solves.
 */

const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
type BlockTag = (typeof BLOCK_TAGS)[number];

function editor(): HTMLElement | null {
  return document.getElementById("wol-editor");
}

// ── Inline format ─────────────────────────────────────────────────────────────

const CMD: Record<string, string> = {
  bold:          "bold",
  italic:        "italic",
  underline:     "underline",
  strikethrough: "strikeThrough",
};

export function format(cmd: string) {
  const el = editor();
  if (!el) return;
  el.focus();
  const execCmd = CMD[cmd];
  if (!execCmd) return;
  document.execCommand(execCmd);
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

export function isFormatActive(cmd: string): boolean {
  const execCmd = CMD[cmd];
  if (!execCmd) return false;
  return document.queryCommandState(execCmd);
}

// ── Block format ──────────────────────────────────────────────────────────────

export function applyBlock(tag: string) {
  const el = editor();
  if (!el) return;
  el.focus();
  document.execCommand("formatBlock", false, tag);
  el.dispatchEvent(new InputEvent("input", { bubbles: true }));
  document.dispatchEvent(new CustomEvent("wolfe:block-applied"));
}

export function currentBlockTag(): string {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return "p";

  let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;

  const el = editor();
  if (!node || !el) return "p";

  let cur: Node | null = node;
  while (cur && cur !== el) {
    if (cur.nodeType === Node.ELEMENT_NODE) {
      const tag = (cur as HTMLElement).tagName.toLowerCase();
      if ((BLOCK_TAGS as readonly string[]).includes(tag)) return tag;
    }
    cur = cur.parentNode;
  }

  return "p";
}
