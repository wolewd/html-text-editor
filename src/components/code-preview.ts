import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";

@define("code-preview")
export class CodePreview extends WolComponent {
  private _state: EditorState;
  private _unsub: (() => void) | null = null;

  constructor() {
    super();
    this._state = { ...editorStore.getState };
  }

  protected override onMount() {
    this._unsub = editorStore.subscribe((s) => {
      this._state = s;
      this.update();
    });
    return () => { this._unsub?.(); };
  }

  protected override onUpdate() {
    const el = this.find<HTMLDivElement>("#preview-output");
    if (el) el.innerHTML = this._state.html;
  }

  protected render() {
    return html`
      <div
        id="preview-output"
        class="prose max-w-2xl mx-auto py-8 px-6 bg-white dark:bg-stone-900 h-full overflow-auto"
      ></div>
    `;
  }
}
