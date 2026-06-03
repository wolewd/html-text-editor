import { WolComponent, html, define } from "wolfe";
import "../components/title-bar.ts";
import "../components/tool-bar.ts";
import "../components/code-editor.ts";
import "../components/code-preview.ts";
import "../components/editor-footer.ts";

@define("text-editor")
export class TextEditor extends WolComponent {
  protected render() {
    return html`
      <div class="flex flex-col h-screen overflow-hidden font-mono bg-stone-50 dark:bg-stone-950">
        <title-bar></title-bar>
        <div class="flex-1 flex overflow-hidden">
          <!-- Left: toolbar + editor -->
          <div class="w-1/2 flex flex-col">
            <tool-bar></tool-bar>
            <div class="flex-1 overflow-hidden">
              <code-editor></code-editor>
            </div>
          </div>
          <!-- Right: preview header + iframe -->
          <div class="w-1/2">
            <code-preview></code-preview>
          </div>
        </div>
        <editor-footer></editor-footer>
      </div>
    `;
  }
}
