import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";
import { preprocess } from "../lib/preprocess.ts";

@define("html-area")
export class HtmlArea extends WolComponent {
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
    return () => { this._unsub?.(); };
  }

  protected render() {
    const { showHtml, html: rawHtml } = this._state;
    return html`
      <div class=${showHtml
        ? "absolute right-0 top-0 bottom-0 w-96 border-l border-stone-200 dark:border-stone-800 flex flex-col bg-stone-100 dark:bg-stone-950 z-10"
        : "hidden"}>
        <div class="flex items-center px-3 py-2 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
          <span class="text-[10px] font-mono text-stone-400 dark:text-stone-500 tracking-widest uppercase">HTML Output</span>
        </div>
        <pre class="flex-1 overflow-auto text-xs text-green-400 dark:text-green-500 font-mono p-4 whitespace-pre-wrap break-all leading-relaxed">${preprocess(rawHtml)}</pre>
      </div>
    `;
  }
}
