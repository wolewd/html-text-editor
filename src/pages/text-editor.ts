import { WolComponent, html, define } from "wolfe";
import "../components/title-bar.ts";
import "../components/tool-bar.ts";
import "../components/code-editor.ts";
import "../components/code-preview.ts";
import "../components/editor-footer.ts";
import { isPreviewShown, togglePreview } from "../stores/previewStore.ts";

@define("text-editor")
export class TextEditor extends WolComponent {
  private _showPreview = isPreviewShown();
  // tailwind: translate-x-0 translate-x-full

  protected override onMount() {
    const handler = () => {
      this._showPreview = isPreviewShown();
      this.update();
    };
    document.addEventListener("wolfe:preview-toggle", handler);
    return () => document.removeEventListener("wolfe:preview-toggle", handler);
  }

  protected render() {
    const show = this._showPreview;
    const panelClass = `absolute right-0 top-0 bottom-0 w-2xl max-w-full border-l border-stone-200 dark:border-stone-800 shadow-lg flex flex-col bg-white dark:bg-stone-900 transition-all duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'}`;
    return html`
      <div class="flex flex-col h-screen overflow-hidden font-mono bg-stone-50 dark:bg-stone-950">
        <title-bar></title-bar>
        <tool-bar></tool-bar>
        <div class="flex-1 overflow-hidden relative">
          <code-editor class="block w-full h-full"></code-editor>
          <div
            class=${panelClass}
          >
            <div class="flex items-center justify-between px-4 h-10 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 shrink-0">
              <span class="text-[10px] font-mono text-stone-400 tracking-widest uppercase">Preview</span>
              <button
                @mousedown=${(e: Event) => { e.preventDefault(); togglePreview(); }}
                class="p-1 rounded text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"
                title="Close preview"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="flex-1 overflow-hidden">
              <code-preview class="block w-full h-full"></code-preview>
            </div>
          </div>
        </div>
        <editor-footer></editor-footer>
      </div>
    `;
  }
}
