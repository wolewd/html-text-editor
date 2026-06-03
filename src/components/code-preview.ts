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
    // Read directly from textarea DOM on every store update
    this._unsub = editorStore.subscribe(() => {
      const ta = document.getElementById("wol-code-editor") as HTMLTextAreaElement | null;
      const el = this.find<HTMLDivElement>("#preview-output");
      if (el && ta) el.innerHTML = ta.value;
    });
    return () => { this._unsub?.(); };
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
