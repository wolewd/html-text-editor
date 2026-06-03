import { WolComponent, html, define } from "wolfe";
import { save as saveHistory, undo, redo, canUndo, canRedo } from "../lib/history.ts";
import { insertInline, wrapBlock, wrapList, insertHr, insertBr, insertTable, insertTableColumn, insertTableRow, insertCodeBlock, insertLink, insertImage, insertVideo, getEditor } from "../lib/tag-insert.ts";
import { hint } from "../lib/notifications.ts";
import { togglePreview, isPreviewShown } from "../stores/previewStore.ts";

const ICONS: Record<string, string> = {
  bold:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 6.4 3.9h.1m6.9 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.3 3.6-2.6 0-5.1-.6-6.8-1.3"/><line x1="4" y1="11.9" x2="20" y2="11.9"/></svg>`,
  undo:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  sub:           `<svg width="15" height="15" viewBox="0 0 24 24"><text x="12" y="16" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">A<tspan font-size="9" dy="4">2</tspan></text></svg>`,
  sup:           `<svg width="15" height="15" viewBox="0 0 24 24"><text x="12" y="13" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">A<tspan font-size="9" dy="-6">2</tspan></text></svg>`,
  ul:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  ol:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="9" font-size="8" fill="currentColor" stroke="none">1</text><text x="3" y="15" font-size="8" fill="currentColor" stroke="none">2</text><text x="3" y="21" font-size="8" fill="currentColor" stroke="none">3</text></svg>`,
  hr:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  br:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7v4H5"/><polyline points="9 7 5 11 9 15"/></svg>`,
  table:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
  col:           `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="4" x2="4" y2="20"/><line x1="10" y1="4" x2="10" y2="20"/><path d="M14 12h6"/><polyline points="17 9 20 12 17 15"/></svg>`,
  row:           `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="4" x2="20" y2="4"/><line x1="4" y1="10" x2="20" y2="10"/><path d="M12 14v6"/><polyline points="9 17 12 20 15 17"/></svg>`,
  code:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  quote:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="5" x2="4" y2="19"/><line x1="9" y1="8" x2="20" y2="8"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="16" x2="16" y2="16"/></svg>`,
  link:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  image:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  video:         `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  copy:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  download:      `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  eye:           `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
};

@define("tool-bar")
export class ToolBar extends WolComponent {
  private _undoBtn: HTMLButtonElement | null = null;
  private _redoBtn: HTMLButtonElement | null = null;
  private _eyeBtn: HTMLButtonElement | null = null;

  protected override onMount() {
    this._build();
    this._syncEye();
    const timer = setInterval(() => this._sync(), 200);
    const onToggle = () => this._syncEye();
    document.addEventListener("wolfe:preview-toggle", onToggle);
    return () => {
      clearInterval(timer);
      document.removeEventListener("wolfe:preview-toggle", onToggle);
    };
  }

  protected render() { return html``; }

  private _sync() {
    if (this._undoBtn) this._undoBtn.disabled = !canUndo();
    if (this._redoBtn) this._redoBtn.disabled = !canRedo();
  }

  private _syncEye() {
    if (!this._eyeBtn) return;
    this._eyeBtn.innerHTML = isPreviewShown() ? ICONS.eyeOff! : ICONS.eye!;
    this._eyeBtn.title = isPreviewShown() ? "Hide preview" : "Show preview";
  }

  private _download() {
    const html = getEditor()?.value ?? "";
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const name = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.html`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  private _build() {
    const wrap = document.createElement("div");
    wrap.className = "flex-shrink-0 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900";

    const row = document.createElement("div");
    row.className = "flex flex-wrap items-center gap-0.5 p-1.5";
    wrap.appendChild(row);
    this.appendChild(wrap);

    const sep = () => {
      const d = document.createElement("div");
      d.className = "w-px h-4 bg-stone-200 dark:bg-stone-700 mx-1 self-center flex-shrink-0";
      return d;
    };

    const mkBtn = (iconKey: string, title: string, onClick: (btn: HTMLButtonElement) => void) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = title;
      b.innerHTML = ICONS[iconKey]!;
      b.className = [
        "p-1.5 rounded transition-colors cursor-pointer",
        "text-stone-500 dark:text-stone-400",
        "hover:bg-stone-100 dark:hover:bg-stone-800",
        "hover:text-stone-800 dark:hover:text-stone-200",
        "disabled:opacity-30 disabled:cursor-not-allowed",
      ].join(" ");
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onClick(b);
      });
      return b;
    };

    // ── Undo / Redo ───────────────────────────────────────────────────────
    const undoBtn = mkBtn("undo", "Undo (Ctrl+Z)", () => {
      const prev = undo();
      if (prev === null) return;
      const ta = getEditor();
      if (!ta) return;
      ta.value = prev;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.focus();
    });
    const redoBtn = mkBtn("redo", "Redo (Ctrl+Y)", () => {
      const next = redo();
      if (next === null) return;
      const ta = getEditor();
      if (!ta) return;
      ta.value = next;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.focus();
    });
    undoBtn.disabled = true;
    redoBtn.disabled = true;
    this._undoBtn = undoBtn;
    this._redoBtn = redoBtn;
    row.appendChild(undoBtn);
    row.appendChild(redoBtn);
    row.appendChild(sep());

    // ── Inline formats ────────────────────────────────────────────────────
    row.appendChild(mkBtn("bold",          "Bold (Ctrl+B)",           () => { saveHistory(getEditor()?.value ?? ""); insertInline("<strong>", "</strong>"); }));
    row.appendChild(mkBtn("italic",        "Italic (Ctrl+I)",         () => { saveHistory(getEditor()?.value ?? ""); insertInline("<em>",     "</em>");     }));
    row.appendChild(mkBtn("underline",     "Underline (Ctrl+U)",      () => { saveHistory(getEditor()?.value ?? ""); insertInline("<u>",      "</u>");      }));
    row.appendChild(mkBtn("strikethrough", "Strikethrough (Ctrl+⇧X)", () => { saveHistory(getEditor()?.value ?? ""); insertInline("<s>",      "</s>");      }));
    row.appendChild(mkBtn("sub",           "Subscript",                () => { saveHistory(getEditor()?.value ?? ""); insertInline("<sub>",    "</sub>");    }));
    row.appendChild(mkBtn("sup",           "Superscript",              () => { saveHistory(getEditor()?.value ?? ""); insertInline("<sup>",    "</sup>");    }));
    row.appendChild(sep());

    // ── Block buttons ─────────────────────────────────────────────────────
    const blockLabels: [string, string][] = [
      ["p",  "P"],
      ["h1", "H1"],
      ["h2", "H2"],
      ["h3", "H3"],
      ["h4", "H4"],
      ["h5", "H5"],
      ["h6", "H6"],
    ];

    for (const [tag, label] of blockLabels) {
      const b = document.createElement("button");
      b.type = "button";
      b.title = tag === "p" ? "Paragraph" : `Heading ${tag[1]}`;
      b.textContent = label;
      b.className = [
        "px-1.5 h-6 text-[11px] font-mono font-medium rounded transition-colors cursor-pointer",
        "text-stone-500 dark:text-stone-400",
        "hover:bg-stone-100 dark:hover:bg-stone-800",
        "hover:text-stone-800 dark:hover:text-stone-200",
      ].join(" ");
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const ta = getEditor();
        if (!ta) return;
        saveHistory(ta.value);
        wrapBlock(tag);
      });
      row.appendChild(b);
    }
    row.appendChild(sep());

    // ── Lists ─────────────────────────────────────────────────────────────
    row.appendChild(mkBtn("ul", "Unordered list", () => { saveHistory(getEditor()?.value ?? ""); wrapList("ul"); }));
    row.appendChild(mkBtn("ol", "Ordered list",   () => { saveHistory(getEditor()?.value ?? ""); wrapList("ol"); }));
    row.appendChild(sep());
    row.appendChild(mkBtn("hr", "Horizontal rule", () => { saveHistory(getEditor()?.value ?? ""); insertHr(); }));
    row.appendChild(mkBtn("br", "Line break",      () => { saveHistory(getEditor()?.value ?? ""); insertBr(); }));
    row.appendChild(sep());
    row.appendChild(mkBtn("table", "Insert table", () => { saveHistory(getEditor()?.value ?? ""); insertTable(); }));
    row.appendChild(mkBtn("col",   "Add column",   () => { saveHistory(getEditor()?.value ?? ""); insertTableColumn(); }));
    row.appendChild(mkBtn("row",   "Add row",      () => { saveHistory(getEditor()?.value ?? ""); insertTableRow(); }));
    row.appendChild(mkBtn("code", "Code block",    () => { saveHistory(getEditor()?.value ?? ""); insertCodeBlock(); }));
    row.appendChild(mkBtn("quote", "Blockquote",   () => { saveHistory(getEditor()?.value ?? ""); wrapBlock("blockquote"); }));
    row.appendChild(sep());
    row.appendChild(mkBtn("link", "Link",    () => { saveHistory(getEditor()?.value ?? ""); insertLink(); }));
    row.appendChild(mkBtn("image", "Image",  () => { saveHistory(getEditor()?.value ?? ""); insertImage(); }));
    row.appendChild(mkBtn("video", "Video",  () => { saveHistory(getEditor()?.value ?? ""); insertVideo(); }));
    row.appendChild(sep());
    row.appendChild(mkBtn("copy", "Copy HTML", (btn) => {
      navigator.clipboard.writeText(getEditor()?.value ?? "");
      hint(btn, "Copied!");
    }));
    row.appendChild(mkBtn("download", "Download HTML", (btn) => {
      this._download();
      hint(btn, "Downloaded!");
    }));
    row.appendChild(sep());
    row.appendChild(mkBtn("eye", "Toggle preview", () => { togglePreview(); }));
    this._eyeBtn = row.lastElementChild as HTMLButtonElement;

    // ── Spacer ────────────────────────────────────────────────────────────
    const spacer = document.createElement("div");
    spacer.className = "flex-1";
    row.appendChild(spacer);
  }
}
