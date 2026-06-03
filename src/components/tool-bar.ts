import { WolComponent, html, define } from "wolfe";
import { save as saveHistory, undo, redo, canUndo, canRedo } from "../lib/history.ts";
import { insertInline, wrapBlock, wrapList, getEditor } from "../lib/tag-insert.ts";

const ICONS: Record<string, string> = {
  bold:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 6.4 3.9h.1m6.9 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.3 3.6-2.6 0-5.1-.6-6.8-1.3"/><line x1="4" y1="11.9" x2="20" y2="11.9"/></svg>`,
  undo:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  ul:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  ol:            `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="9" font-size="8" fill="currentColor" stroke="none">1</text><text x="3" y="15" font-size="8" fill="currentColor" stroke="none">2</text><text x="3" y="21" font-size="8" fill="currentColor" stroke="none">3</text></svg>`,
};

@define("tool-bar")
export class ToolBar extends WolComponent {
  private _undoBtn: HTMLButtonElement | null = null;
  private _redoBtn: HTMLButtonElement | null = null;

  protected override onMount() {
    this._build();

    // Periodically sync undo/redo button states
    const timer = setInterval(() => this._sync(), 200);
    return () => clearInterval(timer);
  }

  protected render() { return html``; }

  private _sync() {
    if (this._undoBtn) this._undoBtn.disabled = !canUndo();
    if (this._redoBtn) this._redoBtn.disabled = !canRedo();
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

    const mkBtn = (iconKey: string, title: string, onClick: () => void) => {
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
        onClick();
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

    // ── Spacer ────────────────────────────────────────────────────────────
    const spacer = document.createElement("div");
    spacer.className = "flex-1";
    row.appendChild(spacer);
  }
}
