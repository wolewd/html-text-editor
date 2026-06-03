import { WolComponent, html, define } from "wolfe";
import { updateStats, saveHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo, reset as resetHistory } from "../lib/history.ts";

@define("code-editor")
export class CodeEditor extends WolComponent {
  protected override onMount() {
    const ta = this.find<HTMLTextAreaElement>("textarea")!;

    // Seed with a starter paragraph
    const initial = "<p>Start writing...</p>";
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
