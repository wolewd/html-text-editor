import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";

@define("editor-footer")
export class EditorFooter extends WolComponent {
  private _state: EditorState;
  private _unsub: (() => void) | null = null;

  constructor() {
    super();
    this._state = { ...editorStore.state };
  }

  protected override onMount() {
    this._unsub = editorStore.subscribe((s) => {
      this._state = s as EditorState;
      this.update();
    });
    return () => { this._unsub?.(); this._unsub = null; };
  }

  protected render() {
    const s = this._state;
    return html`
      <footer class="flex items-center justify-end px-5 py-2 flex-shrink-0 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs text-stone-400 dark:text-stone-500 font-mono">
        <div class="flex items-center gap-3">
          <span>${s.wordCount} words</span>
          <span class="text-stone-300 dark:text-stone-700">·</span>
          <span>${s.charCount} chars</span>
        </div>
      </footer>
    `;
  }
}
