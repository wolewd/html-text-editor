import { WolComponent, html, define } from "wolfe";

@define("title-bar")
export class TitleBar extends WolComponent {
  protected render() {
    return html`
      <header class="flex items-center px-5 h-[52px] flex-shrink-0 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 select-none">
        <span class="font-mono font-semibold text-sm text-stone-800 dark:text-stone-200">
          <span class="text-stone-400 dark:text-stone-500">~/</span>wolfe editor
        </span>
      </header>
    `;
  }
}
