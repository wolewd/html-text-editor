import { WolComponent, html, define } from "wolfe";
import { editorStore, updateStats, saveHtml } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo } from "../lib/history.ts";

@define("write-area")
export class WriteArea extends WolComponent {
  private _state: EditorState;
  private _unsub: (() => void) | null = null;
  private editorEl: HTMLElement | null = null;

  constructor() {
    super();
    this._state = { ...editorStore.state };
  }

  protected override onMount() {
    this.editorEl = this.find<HTMLElement>("#wol-editor");
    if (!this.editorEl) return;

    // Default to <p> paragraphs
    this.editorEl.focus();
    document.execCommand("defaultParagraphSeparator", false, "p");
    if (!this.editorEl.innerHTML.trim() || this.editorEl.innerHTML === "<br>") {
      this.editorEl.innerHTML = "<p><br></p>";
    }
    saveHistory();

    this.editorEl.addEventListener("input", (e) => {
      if (!this.editorEl) return;
      if (e.isTrusted) saveHistory();
      updateStats(this.editorEl);
      saveHtml(this.editorEl);
    });

    this.editorEl.addEventListener("keydown", (e) => {
      const ev = e as KeyboardEvent;
      const ctrl = ev.ctrlKey || ev.metaKey;
      if (ctrl && !ev.shiftKey) {
        switch (ev.key) {
          case "b": ev.preventDefault(); saveHistory(); document.execCommand("bold"); break;
          case "i": ev.preventDefault(); saveHistory(); document.execCommand("italic"); break;
          case "u": ev.preventDefault(); saveHistory(); document.execCommand("underline"); break;
          case "z": ev.preventDefault(); undo(); break;
          case "y": ev.preventDefault(); redo(); break;
        }
        document.dispatchEvent(new CustomEvent("wolfe:format-change"));
      }
      if (ctrl && ev.shiftKey && ev.key === "X") {
        ev.preventDefault();
        saveHistory();
        document.execCommand("strikethrough");
        document.dispatchEvent(new CustomEvent("wolfe:format-change"));
      }
    });

    this._unsub = editorStore.subscribe((s) => {
      this._state = s as EditorState;
      this.update();
    });

    return () => { this._unsub?.(); this._unsub = null; };
  }

  protected render() {
    return html`
      <div class="w-full h-full overflow-y-auto p-8 bg-stone-50 dark:bg-stone-950">
        <div
          id="wol-editor"
          contenteditable="true"
          class="focus:outline-none min-h-[calc(100%-2rem)] max-w-4xl mx-auto shadow bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-sans text-base text-stone-800 dark:text-stone-100 leading-relaxed p-12"
        ></div>
      </div>
    `;
  }
}
