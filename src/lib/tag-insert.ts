/**
 * Tag insertion helpers for the code-editor textarea.
 * These are called by the toolbar to insert HTML tags at the cursor position.
 */

const EDITOR_ID = "wol-code-editor";

export function getEditor(): HTMLTextAreaElement {
  return document.getElementById(EDITOR_ID) as HTMLTextAreaElement;
}

/** Wrap the current selection (or insert empty tags at cursor) */
export function insertInline(openTag: string, closeTag: string): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  const wrapped = openTag + selected + closeTag;

  ta.setRangeText(wrapped, start, end, "end");
  // Place cursor inside, right after the opening tag
  const cursor = start + openTag.length;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Wrap the current line(s) in block-level tags */
export function wrapBlock(tag: string): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;

  // Find line boundaries
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = text.indexOf("\n", end);
  const actualEnd = lineEndIdx === -1 ? text.length : lineEndIdx;

  const content = text.substring(lineStart, actualEnd);
  const wrapped = `<${tag}>${content}</${tag}>`;

  ta.setRangeText(wrapped, lineStart, actualEnd, "end");
  // Place cursor inside, right after the opening tag
  const cursor = lineStart + tag.length + 2; // after <tag>
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Wrap selected lines in a list (<ul> or <ol>) */
export function wrapList(tag: "ul" | "ol"): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const text = ta.value;

  // Find line boundaries
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = text.indexOf("\n", end);
  const actualEnd = lineEndIdx === -1 ? text.length : lineEndIdx;

  const selected = text.substring(lineStart, actualEnd);
  const lines = selected.split("\n").filter((l) => l.trim() !== "");

  if (lines.length === 0) {
    // No content — insert empty list template
    const tpl = `<${tag}>\n  <li></li>\n</${tag}>`;
    ta.setRangeText(tpl, start, end, "end");
    const cursor = lineStart + tag.length + 9; // after <tag>\n  <li>
    ta.selectionStart = cursor;
    ta.selectionEnd = cursor;
  } else {
    const items = lines.map((l) => `  <li>${l}</li>`).join("\n");
    const wrapped = `<${tag}>\n${items}\n</${tag}>`;
    ta.setRangeText(wrapped, lineStart, actualEnd, "end");
    // Place cursor inside the first <li>
    const cursor = lineStart + tag.length + 9; // after <tag>\n  <li>
    ta.selectionStart = cursor;
    ta.selectionEnd = cursor;
  }
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}
