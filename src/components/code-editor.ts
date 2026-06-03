import { WolComponent, html, define } from "wolfe";
import { updateStats, saveHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo, reset as resetHistory } from "../lib/history.ts";

const STORAGE_KEY = "wolfe:editor-html";

@define("code-editor")
export class CodeEditor extends WolComponent {
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  protected override onMount() {
    const ta = this.find<HTMLTextAreaElement>("textarea")!;

    // Restore from localStorage or use starter
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved ?? "<p>Start writing...</p>";
    ta.value = initial;
    resetHistory(initial);
    saveHtml(initial);
    updateStats(initial);
    ta.focus();

    // ── Input handler ─────────────────────────────────────────────────────
    ta.addEventListener("input", () => {
      const value = ta.value;
      saveHistory(value);
      saveHtml(value);
      updateStats(value);
      // Debounce localStorage write (500ms)
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => localStorage.setItem(STORAGE_KEY, value), 500);
    });

    // ── Keyboard shortcuts ────────────────────────────────────────────────
    ta.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey) {
        switch (e.key) {
          case "b": e.preventDefault(); this._insert("<strong>", "</strong>"); return;
          case "i": e.preventDefault(); this._insert("<em>", "</em>");         return;
          case "u": e.preventDefault(); this._insert("<u>", "</u>");           return;
          case "z": e.preventDefault(); this._undo();                          return;
          case "y": e.preventDefault(); this._redo();                          return;
        }
      }
      if (ctrl && e.shiftKey && e.key === "X") {
        e.preventDefault();
        this._insert("<s>", "</s>");
      }

      // Tab → 2-space indent
      if (e.key === "Tab") {
        e.preventDefault();
        this._insert("  ", "");
      }

      // Alt+Enter → jump past closing tag, new line below
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        this._jumpOut();
      }
    });
  }

  /** Apply undo: restore textarea value from history */
  private _undo() {
    const prev = undo();
    if (prev === null) return;
    const ta = this.find<HTMLTextAreaElement>("textarea")!;
    ta.value = prev;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
  }

  /** Apply redo */
  private _redo() {
    const next = redo();
    if (next === null) return;
    const ta = this.find<HTMLTextAreaElement>("textarea")!;
    ta.value = next;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
  }

  /** Insert open/close tags around the textarea selection */
  private _insert(openTag: string, closeTag: string) {
    const ta = this.find<HTMLTextAreaElement>("textarea")!;
    ta.focus();

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const wrapped = openTag + selected + closeTag;

    ta.setRangeText(wrapped, start, end, "select");
    ta.selectionStart = start + openTag.length;
    ta.selectionEnd = start + openTag.length + selected.length;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /** Alt+Enter: jump to next line, create one if at the end */
  private _jumpOut() {
    const ta = this.find<HTMLTextAreaElement>("textarea")!;
    const pos = ta.selectionStart;
    const text = ta.value;

    const nextNewline = text.indexOf("\n", pos);
    if (nextNewline !== -1) {
      const cursor = nextNewline + 1;
      ta.selectionStart = cursor;
      ta.selectionEnd = cursor;
    } else {
      ta.setRangeText("\n", text.length, text.length, "end");
      const cursor = text.length + 1;
      ta.selectionStart = cursor;
      ta.selectionEnd = cursor;
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  protected render() {
    return html`
      <div class="w-full h-full">
      <textarea
        id="wol-code-editor"
        spellcheck="false"
        class="w-full h-full resize-none bg-white text-stone-700 font-mono text-sm leading-relaxed p-6 border-0 border-r border-stone-200 dark:border-stone-800 outline-none selection:bg-stone-200"
        placeholder="<p>Start writing HTML...</p>"
      ></textarea>
      </div>
    `;
  }
}
