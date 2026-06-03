import { WolComponent, html, define } from "wolfe";
import { toggleShowHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo, canUndo, canRedo } from "../lib/history.ts";
import { format, isFormatActive, applyBlock, currentBlockTag } from "../lib/format.ts";

const ICONS: Record<string, string> = {
  bold:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic:        `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline:     `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 6.4 3.9h.1m6.9 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.3 3.6-2.6 0-5.1-.6-6.8-1.3"/><line x1="4" y1="11.9" x2="20" y2="11.9"/></svg>`,
  undo:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo:          `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  code:          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

const BLOCKS = [
  ["p",  "Paragraph"],
  ["h1", "Heading 1"],
  ["h2", "Heading 2"],
  ["h3", "Heading 3"],
  ["h4", "Heading 4"],
  ["h5", "Heading 5"],
  ["h6", "Heading 6"],
] as const;

@define("tool-bar")
export class ToolBar extends WolComponent {
  // Direct DOM refs — toolbar is imperative-only, never re-rendered
  private _blockSel: HTMLSelectElement | null = null;
  private _fmtBtns  = new Map<string, HTMLButtonElement>();
  private _undoBtn:  HTMLButtonElement | null = null;
  private _redoBtn:  HTMLButtonElement | null = null;

  protected override onMount() {
    this._build();
    this._sync();

    const sync = () => this._sync();
    document.addEventListener("selectionchange",     sync);
    document.addEventListener("wolfe:format-change", sync);
    document.addEventListener("wolfe:block-applied", sync);

    return () => {
      document.removeEventListener("selectionchange",     sync);
      document.removeEventListener("wolfe:format-change", sync);
      document.removeEventListener("wolfe:block-applied", sync);
    };
  }

  // Toolbar is pure imperative DOM — render() only provides the mount point
  protected render() { return html``; }

  private _sync() {
    // Format buttons
    for (const [cmd, btn] of this._fmtBtns) {
      const active = isFormatActive(cmd);
      btn.setAttribute("aria-pressed", String(active));
    }

    // Block select
    if (this._blockSel) {
      this._blockSel.value = currentBlockTag();
    }

    // Undo / redo availability
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

    const mkBtn = (iconKey: string, title: string, onClick: () => void, cmd?: string) => {
      const b = document.createElement("button");
      b.type      = "button";
      b.title     = title;
      b.innerHTML = ICONS[iconKey]!;
      b.className = [
        "p-1.5 rounded transition-colors cursor-pointer",
        "text-stone-500 dark:text-stone-400",
        "hover:bg-stone-100 dark:hover:bg-stone-800",
        "hover:text-stone-800 dark:hover:text-stone-200",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "aria-pressed:bg-stone-900 dark:aria-pressed:bg-stone-100",
        "aria-pressed:text-stone-50 dark:aria-pressed:text-stone-900",
      ].join(" ");
      // mousedown keeps focus in editor
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onClick();
        this._sync();
      });
      if (cmd) this._fmtBtns.set(cmd, b);
      return b;
    };

    // ── Undo / Redo ───────────────────────────────────────────────────────────
    const undoBtn = mkBtn("undo", "Undo (Ctrl+Z)", () => {
      document.getElementById("wol-editor")?.focus();
      undo();
    });
    const redoBtn = mkBtn("redo", "Redo (Ctrl+Y)", () => {
      document.getElementById("wol-editor")?.focus();
      redo();
    });
    undoBtn.disabled = true;
    redoBtn.disabled = true;
    this._undoBtn = undoBtn;
    this._redoBtn = redoBtn;
    row.appendChild(undoBtn);
    row.appendChild(redoBtn);
    row.appendChild(sep());

    // ── Inline formats ────────────────────────────────────────────────────────
    row.appendChild(mkBtn("bold",          "Bold (Ctrl+B)",           () => { saveHistory(); format("bold");          }, "bold"));
    row.appendChild(mkBtn("italic",        "Italic (Ctrl+I)",         () => { saveHistory(); format("italic");        }, "italic"));
    row.appendChild(mkBtn("underline",     "Underline (Ctrl+U)",      () => { saveHistory(); format("underline");     }, "underline"));
    row.appendChild(mkBtn("strikethrough", "Strikethrough (Ctrl+⇧X)", () => { saveHistory(); format("strikethrough"); }, "strikethrough"));
    row.appendChild(sep());

    // ── Block select ──────────────────────────────────────────────────────────
    const sel = document.createElement("select");
    sel.title     = "Block type";
    sel.className = "h-7 px-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer font-mono focus:outline-none";

    for (const [val, label] of BLOCKS) {
      const o = document.createElement("option");
      o.value       = val;
      o.textContent = label;
      sel.appendChild(o);
    }

    sel.addEventListener("mousedown", () => {
      // Ensure editor has focus so execCommand targets it
      document.getElementById("wol-editor")?.focus();
    });

    sel.addEventListener("change", () => {
      saveHistory();
      applyBlock(sel.value);
      // Re-focus editor after select interaction
      requestAnimationFrame(() => {
        document.getElementById("wol-editor")?.focus();
        this._sync();
      });
    });

    this._blockSel = sel;
    row.appendChild(sel);

    // ── Spacer ────────────────────────────────────────────────────────────────
    const spacer = document.createElement("div");
    spacer.className = "flex-1";
    row.appendChild(spacer);

    // ── HTML toggle ───────────────────────────────────────────────────────────
    const htmlBtn = document.createElement("button");
    htmlBtn.type      = "button";
    htmlBtn.title     = "Toggle HTML panel";
    htmlBtn.innerHTML = ICONS.code!;
    htmlBtn.className = "p-1.5 rounded text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors";
    htmlBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      toggleShowHtml();
    });
    row.appendChild(htmlBtn);
  }
}
