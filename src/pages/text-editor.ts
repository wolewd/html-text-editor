import { WolComponent, html, define } from "wolfe";
import "../components/title-bar.ts";
import "../components/tool-bar.ts";
import "../components/write-area.ts";
import "../components/html-area.ts";
import "../components/editor-footer.ts";

@define("text-editor")
export class TextEditor extends WolComponent {
  protected render() {
    return html`
      <div class="flex flex-col h-screen overflow-hidden font-mono bg-stone-50 dark:bg-stone-950">
        <title-bar></title-bar>
        <tool-bar></tool-bar>
        <div class="flex-1 relative overflow-hidden">
          <write-area></write-area>
          <html-area></html-area>
        </div>
        <editor-footer></editor-footer>
      </div>
    `;
  }
}
