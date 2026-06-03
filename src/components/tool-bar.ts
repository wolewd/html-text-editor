import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo } from "../lib/history.ts";
import { format, isFormatActive } from "../lib/format.ts";

const icons: Record<string, string> = {
  bold: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 6.4 3.9h.1m6.9 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.3 3.6-2.6 0-5.1-.6-6.8-1.3"/><line x1="4" y1="11.9" x2="20" y2="11.9"/></svg>`,
  undo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
};

function btn(icon: string, title: string, onClick: () => void, extraClass = "") {
  const el = document.createElement("button");
  el.type = "button";
  el.title = title;
  el.innerHTML = icons[icon]!;
  el.className = `toolbar-btn p-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 cursor-pointer transition-colors aria-pressed:bg-stone-900 dark:aria-pressed:bg-stone-100 aria-pressed:text-stone-50 dark:aria-pressed:text-stone-900 ${extraClass}`;
  el.addEventListener("mousedown", (e) => { e.preventDefault(); onClick(); });
  return el;
}

@define("tool-bar")
export class ToolBar extends WolComponent {

  protected override onMount() {
    this._build();
    document.addEventListener("selectionchange", () => this._updateActiveStates());
    document.addEventListener("wolfe:format-change", () => this._updateActiveStates());
  }

  private _updateActiveStates() {
    ["bold", "italic", "underline", "strikethrough"].forEach(cmd => {
      const active = isFormatActive(cmd);
      const b = this.querySelector(`[data-cmd="${cmd}"]`) as HTMLElement | null;
      if (b) b.setAttribute("aria-pressed", String(active));
    });
  }

  private _build() {
    const t = this.find<HTMLElement>("#toolbar-inner");
    if (!t) return;
    t.className = "flex flex-wrap items-center gap-0.5 p-1.5";

    const d = document.createElement("div");
    d.className = "w-px h-5 bg-stone-200 dark:bg-stone-700 mx-0.5 self-center flex-shrink-0";

    const add = (ic: string, ti: string, fn: () => void, cmd?: string) => {
      const b = btn(ic, ti, fn);
      if (cmd) b.setAttribute("data-cmd", cmd);
      t.appendChild(b);
    };

    add("undo", "Undo (Ctrl+Z)", () => { document.getElementById("wol-editor")?.focus(); undo(); });
    add("redo", "Redo (Ctrl+Y)", () => { document.getElementById("wol-editor")?.focus(); redo(); });
    t.appendChild(d.cloneNode());
    add("bold", "Bold (Ctrl+B)", () => { saveHistory(); format("bold"); this._updateActiveStates(); }, "bold");
    add("italic", "Italic (Ctrl+I)", () => { saveHistory(); format("italic"); this._updateActiveStates(); }, "italic");
    add("underline", "Underline (Ctrl+U)", () => { saveHistory(); format("underline"); this._updateActiveStates(); }, "underline");
    add("strikethrough", "Strikethrough (Ctrl+Shift+X)", () => { saveHistory(); format("strikethrough"); this._updateActiveStates(); }, "strikethrough");

    // Spacer
    const spacer = document.createElement("div");
    spacer.className = "flex-1";
    t.appendChild(spacer);

    // HTML toggle
    const htmlBtn = document.createElement("button");
    htmlBtn.type = "button";
    htmlBtn.title = "Toggle HTML";
    htmlBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';
    htmlBtn.className = "p-1.5 rounded text-xs font-mono text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors";
    htmlBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      editorStore.setState((prev) => ({ showHtml: !prev.showHtml }));
    });
    t.appendChild(htmlBtn);
  }

  protected render() {
    return html`
      <div class="flex-shrink-0 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
        <div id="toolbar-inner"></div>
      </div>
    `;
  }
}
