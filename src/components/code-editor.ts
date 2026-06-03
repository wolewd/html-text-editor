import { WolComponent, html, define } from "wolfe";
import { updateStats, saveHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo, reset as resetHistory } from "../lib/history.ts";
import { getEditor, insertInline } from "../lib/tag-insert.ts";

const STORAGE_KEY = "wolfe:editor-html";

@define("code-editor")
export class CodeEditor extends WolComponent {
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  protected override onMount() {
    const ta = this.find<HTMLTextAreaElement>("textarea")!;

    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved ?? "<p>Start writing...</p>";
    ta.value = initial;
    resetHistory(initial);
    saveHtml(initial);
    updateStats(initial);
    ta.focus();

    ta.addEventListener("input", () => {
      const value = ta.value;
      saveHistory(value);
      saveHtml(value);
      updateStats(value);
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => localStorage.setItem(STORAGE_KEY, value), 500);
    });

    ta.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey) {
        switch (e.key) {
          case "b": e.preventDefault(); insertInline("<strong>", "</strong>"); return;
          case "i": e.preventDefault(); insertInline("<em>", "</em>");         return;
          case "u": e.preventDefault(); insertInline("<u>", "</u>");           return;
          case "z": e.preventDefault(); undoFromHistory();                     return;
          case "y": e.preventDefault(); redoFromHistory();                     return;
        }
      }
      if (ctrl && e.shiftKey && e.key === "X") {
        e.preventDefault();
        insertInline("<s>", "</s>");
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertInline("  ", "");
      }
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        jumpOut();
      }
    });
  }

  protected render() {
    return html`
      <div class="w-full h-full">
      <textarea
        id="wol-code-editor"
        spellcheck="false"
        class="w-full h-full resize-none bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 font-mono text-sm leading-relaxed p-6 border-0 border-r border-stone-200 dark:border-stone-800 outline-none selection:bg-stone-200 dark:selection:bg-stone-700"
        placeholder="<p>Start writing HTML...</p>"
      ></textarea>
      </div>
    `;
  }
}

export function undoFromHistory() {
  const prev = undo();
  if (prev === null) return;
  const ta = getEditor();
  if (!ta) return;
  ta.value = prev;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
}

export function redoFromHistory() {
  const next = redo();
  if (next === null) return;
  const ta = getEditor();
  if (!ta) return;
  ta.value = next;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
}

function jumpOut() {
  const ta = getEditor();
  if (!ta) return;
  const pos = ta.selectionStart;
  const text = ta.value;
  const nextNewline = text.indexOf("\n", pos);
  if (nextNewline !== -1) {
    ta.selectionStart = nextNewline + 1;
    ta.selectionEnd = nextNewline + 1;
  } else {
    ta.setRangeText("\n", text.length, text.length, "end");
    ta.selectionStart = text.length + 1;
    ta.selectionEnd = text.length + 1;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
