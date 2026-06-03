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

  protected override onMount() {
    const handler = () => {
      this._showPreview = isPreviewShown();
      this.update();
    };
    document.addEventListener("wolfe:preview-toggle", handler);
    return () => document.removeEventListener("wolfe:preview-toggle", handler);
  }

  protected render() {
    return html`
      <div class="flex flex-col h-screen overflow-hidden font-mono bg-stone-50 dark:bg-stone-950">
        <title-bar></title-bar>
        <tool-bar></tool-bar>
        <div class="flex-1 overflow-hidden relative">
          <code-editor class="block w-full h-full"></code-editor>
          ${this._showPreview ? html`
            <div class="absolute right-0 top-0 bottom-0 w-[512px] max-w-full border-l border-stone-200 dark:border-stone-800 shadow-lg z-10 flex flex-col bg-white">
              <div class="flex items-center justify-between px-4 h-[40px] border-b border-stone-200 bg-stone-50 flex-shrink-0">
                <span class="text-[10px] font-mono text-stone-400 tracking-widest uppercase">Preview</span>
                <button
                  @mousedown=${(e: Event) => { e.preventDefault(); togglePreview(); }}
                  class="p-1 rounded text-stone-400 hover:text-stone-600 hover:bg-stone-100 cursor-pointer"
                  title="Close preview"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="flex-1 overflow-hidden">
                <code-preview class="block w-full h-full"></code-preview>
              </div>
            </div>
          ` : null}
        </div>
        <editor-footer></editor-footer>
      </div>
    `;
  }
}
