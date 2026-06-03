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

/** Wrap the current line(s) in block-level tags.
 * If already inside a heading, replaces the tag instead. */
export function wrapBlock(tag: string): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const pos = ta.selectionStart;
  const text = ta.value;

  // ── Check if we're inside an existing heading ─────────────────────────
  const heading = findEnclosingHeading(text, pos);
  if (heading) {
    replaceHeading(ta, text, heading, tag);
    return;
  }

  // ── Check if cursor is inside a <p> tag ──────────────────────────────
  const pTag = findEnclosingTag(text, pos, "p");
  if (pTag) {
    replaceHeading(ta, text, pTag, tag);
    return;
  }

  // ── Check if the current line is already a block tag (<p> or heading) ─
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const lineEnd = text.indexOf("\n", pos);
  const lineContent = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

  // Match: <p>content</p> or <hN>content</hN>
  const lineBlock = lineContent.match(/^<(p|h[1-6])>(.*)<\/\1>$/);
  if (lineBlock) {
    const inner = lineBlock[2]!;
    const replacement = `<${tag}>${inner}</${tag}>`;
    ta.setRangeText(replacement, lineStart, lineStart + lineContent.length, "end");
    const cursor = lineStart + tag.length + 2;
    ta.selectionStart = cursor;
    ta.selectionEnd = cursor;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // ── Not inside a heading — wrap current line ──────────────────────────
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const lineEndIdx = text.indexOf("\n", end);
  const actualEnd = lineEndIdx === -1 ? text.length : lineEndIdx;

  const content = text.substring(lineStart, actualEnd);
  const wrapped = `<${tag}>${content}</${tag}>`;

  ta.setRangeText(wrapped, lineStart, actualEnd, "end");
  const cursor = lineStart + tag.length + 2;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

function replaceHeading(ta: HTMLTextAreaElement, text: string, heading: { openStart: number; openEnd: number; closeStart: number; closeEnd: number }, tag: string): void {
  const before = text.substring(0, heading.openStart);
  const content = text.substring(heading.openEnd, heading.closeStart);
  const after = text.substring(heading.closeEnd);
  ta.value = `${before}<${tag}>${content}</${tag}>${after}`;
  const cursor = heading.openStart + tag.length + 2;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Find the enclosing heading around `pos`, or null */
function findEnclosingHeading(text: string, pos: number): { openStart: number; openEnd: number; closeStart: number; closeEnd: number } | null {
  const before = text.substring(0, pos);
  const after = text.substring(pos);

  // Scan backwards for <h1> through <h6>
  const m = before.match(/<h([1-6])>(?!.*<\/h\1>)/);
  if (!m || m.index === undefined) return null;

  const tag = `h${m[1]}`;
  return findEnclosingTag(text, pos, tag);
}

/** Find enclosing <tag>...</tag> around `pos`, or null */
function findEnclosingTag(text: string, pos: number, tag: string): { openStart: number; openEnd: number; closeStart: number; closeEnd: number } | null {
  const before = text.substring(0, pos);
  const after = text.substring(pos);

  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;

  // Use lastIndexOfUnclosed to find the last unclosed opening tag before cursor
  const openStart = lastIndexOfUnclosed(before, openTag, closeTag);
  if (openStart === -1) return null;

  const openEnd = openStart + openTag.length;
  const closeStart = after.indexOf(closeTag);
  if (closeStart === -1) return null;
  const closeEnd = pos + closeStart + closeTag.length;

  return { openStart, openEnd, closeStart: pos + closeStart, closeEnd };
}

/** Wrap selected lines in a list (<ul> or <ol>).
 * If cursor is already inside a list item, appends a new <li> instead. */
export function wrapList(tag: "ul" | "ol"): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const pos = ta.selectionStart;
  const text = ta.value;

  // ── Check if we're inside an existing <li> ────────────────────────────
  const before = text.substring(0, pos);
  const after = text.substring(pos);

  // Find the last <li> before cursor that hasn't been closed yet
  const liOpen = lastIndexOfUnclosed(before, "<li>", "</li>");
  if (liOpen !== -1) {
    // Check if this <li> is inside a <ul> or <ol>
    const beforeLi = before.substring(0, liOpen);
    const listOpen = lastIndexOfUnclosed(beforeLi, "<ul>", "</ul>") !== -1 ||
                     lastIndexOfUnclosed(beforeLi, "<ol>", "</ol>") !== -1;
    if (listOpen) {
      // We're inside a list item — find its closing </li> and append a new one
      const liClose = after.indexOf("</li>");
      const insertPos = liClose === -1 ? pos + after.length : pos + liClose + 5;
      const indent = "  ";
      const newLi = `\n${indent}<li></li>`;
      ta.setRangeText(newLi, insertPos, insertPos, "end");
      const cursor = insertPos + indent.length + 5; // after \n  <li>
      ta.selectionStart = cursor;
      ta.selectionEnd = cursor;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
  }

  // ── Not inside a list — original wrap behavior ───────────────────────
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIdx = text.indexOf("\n", end);
  const actualEnd = lineEndIdx === -1 ? text.length : lineEndIdx;

  const selected = text.substring(lineStart, actualEnd);
  const lines = selected.split("\n").filter((l) => l.trim() !== "");

  if (lines.length === 0) {
    const tpl = `<${tag}>\n  <li></li>\n</${tag}>`;
    ta.setRangeText(tpl, start, end, "end");
    const cursor = lineStart + tag.length + 9;
    ta.selectionStart = cursor;
    ta.selectionEnd = cursor;
  } else {
    const items = lines.map((l) => `  <li>${l}</li>`).join("\n");
    const wrapped = `<${tag}>\n${items}\n</${tag}>`;
    ta.setRangeText(wrapped, lineStart, actualEnd, "end");
    const cursor = lineStart + tag.length + 9;
    ta.selectionStart = cursor;
    ta.selectionEnd = cursor;
  }
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Find the last occurrence of `open` before the string end that hasn't been closed by `close` */
function lastIndexOfUnclosed(haystack: string, open: string, close: string): number {
  let depth = 0;
  let i = haystack.length;
  while (i >= 0) {
    const closeIdx = haystack.lastIndexOf(close, i);
    const openIdx = haystack.lastIndexOf(open, i);
    if (closeIdx > openIdx) {
      depth++;
      i = closeIdx - 1;
    } else if (openIdx !== -1) {
      if (depth === 0) return openIdx;
      depth--;
      i = openIdx - 1;
    } else {
      break;
    }
  }
  return -1;
}

/** Insert a horizontal rule on its own line at the cursor */
export function insertHr(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const pos = ta.selectionStart;
  const text = ta.value;

  // Find the start of the current line
  const lineStart = text.lastIndexOf("\n", pos - 1) + 1;
  const before = text.substring(lineStart, pos);

  // If the line before cursor is not empty, put <hr> on a new line
  const prefix = before.trim() ? "\n" : "";
  // If there's text after cursor on this line, push it to next line
  const lineEnd = text.indexOf("\n", pos);
  const after = text.substring(pos, lineEnd === -1 ? text.length : lineEnd);
  const suffix = after.trim() ? "\n" : "";

  const replacement = `${prefix}<hr>${suffix}`;
  ta.setRangeText(replacement, pos, pos, "end");
  // Place cursor on the line after <hr>
  const cursor = pos + prefix.length + 4 + suffix.length;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insert a line break at the cursor */
export function insertBr(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const pos = ta.selectionStart;
  ta.setRangeText("<br>", pos, ta.selectionEnd, "end");
  // Place cursor after <br>
  const cursor = pos + 4;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insert a 2×2 table with header row at the cursor */
export function insertTable(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const tpl = [
    "<table>",
    "  <tr>",
    "    <th>Column 1</th>",
    "    <th>Column 2</th>",
    "  </tr>",
    "  <tr>",
    "    <td></td>",
    "    <td></td>",
    "  </tr>",
    "  <tr>",
    "    <td></td>",
    "    <td></td>",
    "  </tr>",
    "</table>",
  ].join("\n");

  const pos = ta.selectionStart;
  ta.setRangeText(tpl, pos, ta.selectionEnd, "end");
  // Place cursor inside the first <td>
  const cursor = pos + tpl.indexOf("<td>") + 4;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insert a code block at the cursor */
export function insertCodeBlock(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const tpl = "<code><pre>\n\n</pre></code>";
  const pos = ta.selectionStart;
  ta.setRangeText(tpl, pos, ta.selectionEnd, "end");
  // Place cursor inside the code block
  const cursor = pos + 12; // after <code><pre>\n
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insert a link — wraps selection or inserts placeholder */
export function insertLink(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const url = prompt("URL:", "https://");
  if (!url) return;

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end) || "link";
  const wrapped = `<a href="${url}">${selected}</a>`;

  ta.setRangeText(wrapped, start, end, "end");
  const cursor = start + wrapped.length - 4; // before </a>
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insert an image */
export function insertImage(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const url = prompt("Image URL:", "https://");
  if (!url) return;

  const img = `<img src="${url}" alt="">`;
  const pos = ta.selectionStart;
  ta.setRangeText(img, pos, ta.selectionEnd, "end");
  // Place cursor on alt text
  const cursor = pos + img.indexOf('alt="') + 5;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Insert a video */
export function insertVideo(): void {
  const ta = getEditor();
  if (!ta) return;
  ta.focus();

  const url = prompt("Video URL:", "https://");
  if (!url) return;

  const video = `<video src="${url}" controls></video>`;
  const pos = ta.selectionStart;
  ta.setRangeText(video, pos, ta.selectionEnd, "end");
  const cursor = pos + video.length;
  ta.selectionStart = cursor;
  ta.selectionEnd = cursor;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}
