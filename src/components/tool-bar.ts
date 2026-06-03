import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo } from "../lib/history.ts";
import { format, isFormatActive, applyBlock, currentBlockTag } from "../lib/format.ts";

const ICONS: Record<string, string> = {
  bold:          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic:        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 6.4 3.9h.1m6.9 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.3 3.6-2.6 0-5.1-.6-6.8-1.3"/><line x1="4" y1="11.9" x2="20" y2="11.9"/></svg>`,
  undo:          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo:          `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  code:          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
};

@define("tool-bar")
export class ToolBar extends WolComponent {
  private _blockSel:   HTMLSelectElement | null = null;
  private _cmdBtns     = new Map<string, HTMLButtonElement>();
  private _pendingTag: string | null = null;

  protected override onMount() {
    this._build();

    const sync = () => requestAnimationFrame(() => this._sync());

    document.addEventListener("selectionchange",    sync);
    document.addEventListener("wolfe:block-applied", sync);
    document.addEventListener("wolfe:format-change", sync);

    return () => {
      document.removeEventListener("selectionchange",    sync);
      document.removeEventListener("wolfe:block-applied", sync);
      document.removeEventListener("wolfe:format-change", sync);
    };
  }

  protected render() {
    return html``;
  }

  private _sync() {
    if (this._blockSel && this._pendingTag === null) {
      // Only update from DOM when we're not in the middle of applying a block.
      // During apply, _pendingTag holds the chosen value so stale
      // selectionchange events can't overwrite what the user just picked.
      const tag = currentBlockTag();
      if (tag === "mixed") {
        if (!this._blockSel.querySelector("option[value=mixed]")) {
          const o = document.createElement("option");
          o.value = "mixed";
          o.textContent = "mixed";
          o.disabled = true;
          this._blockSel.appendChild(o);
        }
      } else {
        this._blockSel.querySelector("option[value=mixed]")?.remove();
      }
      this._blockSel.value = tag;
    }
    for (const [cmd, btn] of this._cmdBtns) {
      btn.setAttribute("aria-pressed", String(isFormatActive(cmd)));
    }
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
      d.className = "w-px h-5 bg-stone-200 dark:bg-stone-700 mx-0.5 self-center flex-shrink-0";
      return d;
    };

    const mkBtn = (iconKey: string, title: string, onDown: () => void, cmd?: string) => {
      const b = document.createElement("button");
      b.type      = "button";
      b.title     = title;
      b.innerHTML = ICONS[iconKey]!;
      b.className = "p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 cursor-pointer transition-colors aria-pressed:bg-stone-900 dark:aria-pressed:bg-stone-100 aria-pressed:text-stone-50 dark:aria-pressed:text-stone-900";
      b.addEventListener("mousedown", (e) => { e.preventDefault(); onDown(); });
      if (cmd) this._cmdBtns.set(cmd, b);
      return b;
    };

    // ── undo / redo ──────────────────────────────────────────────────────────
    row.appendChild(mkBtn("undo", "Undo (Ctrl+Z)", () => { document.getElementById("wol-editor")?.focus(); undo(); }));
    row.appendChild(mkBtn("redo", "Redo (Ctrl+Y)", () => { document.getElementById("wol-editor")?.focus(); redo(); }));
    row.appendChild(sep());

    // ── inline format ────────────────────────────────────────────────────────
    row.appendChild(mkBtn("bold",          "Bold (Ctrl+B)",           () => { saveHistory(); format("bold");          document.dispatchEvent(new CustomEvent("wolfe:format-change")); }, "bold"));
    row.appendChild(mkBtn("italic",        "Italic (Ctrl+I)",          () => { saveHistory(); format("italic");        document.dispatchEvent(new CustomEvent("wolfe:format-change")); }, "italic"));
    row.appendChild(mkBtn("underline",     "Underline (Ctrl+U)",       () => { saveHistory(); format("underline");     document.dispatchEvent(new CustomEvent("wolfe:format-change")); }, "underline"));
    row.appendChild(mkBtn("strikethrough", "Strikethrough (Ctrl+⇧X)", () => { saveHistory(); format("strikethrough"); document.dispatchEvent(new CustomEvent("wolfe:format-change")); }, "strikethrough"));
    row.appendChild(sep());

    // ── block select ─────────────────────────────────────────────────────────
    const blockSel = document.createElement("select");
    blockSel.title     = "Block type";
    blockSel.className = "h-7 px-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer font-mono";

    for (const [v, label] of [
      ["p",  "paragraph"],
      ["h1", "heading 1"],
      ["h2", "heading 2"],
      ["h3", "heading 3"],
      ["h4", "heading 4"],
      ["h5", "heading 5"],
      ["h6", "heading 6"],
    ] as const) {
      const o = document.createElement("option");
      o.value       = v;
      o.textContent = label;
      blockSel.appendChild(o);
    }

    let savedRange: Range | null = null;
    let savedSel:   { sn: Node; so: number; en: Node; eo: number } | null = null;

    blockSel.addEventListener("mousedown", () => {
      const s = window.getSelection();
      if (s?.rangeCount) {
        const r  = s.getRangeAt(0);
        savedRange = r.cloneRange();
        savedSel   = { sn: r.startContainer, so: r.startOffset, en: r.endContainer, eo: r.endOffset };
      }
    });

    blockSel.addEventListener("change", () => {
      const chosenTag    = blockSel.value;
      this._pendingTag   = chosenTag;   // block _sync() from overwriting while DOM settles

      saveHistory();
      applyBlock(chosenTag, savedRange ?? undefined, savedSel ?? undefined);
      savedRange = null;
      savedSel   = null;

      // Set the value directly — fast path so the select never flickers
      blockSel.value = chosenTag;
      document.dispatchEvent(new CustomEvent("wolfe:block-applied"));

      // Release the lock after two frames (the rAF inside sync has fired by then)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this._pendingTag = null;
        // Final sync with real DOM state now that everything has settled
        if (this._blockSel) this._blockSel.value = currentBlockTag();
      }));
    });

    this._blockSel = blockSel;
    row.appendChild(blockSel);

    // ── spacer ───────────────────────────────────────────────────────────────
    const spacer = document.createElement("div");
    spacer.className = "flex-1";
    row.appendChild(spacer);

    // ── HTML toggle ──────────────────────────────────────────────────────────
    const htmlBtn = document.createElement("button");
    htmlBtn.type      = "button";
    htmlBtn.title     = "Toggle HTML panel";
    htmlBtn.innerHTML = ICONS.code;
    htmlBtn.className = "p-1.5 rounded text-xs font-mono text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors";
    htmlBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      editorStore.setState((prev) => ({ showHtml: !prev.showHtml }));
    });
    row.appendChild(htmlBtn);
  }
}
