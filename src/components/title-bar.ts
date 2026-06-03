import { WolComponent, html, define } from "wolfe";

const THEME_KEY = "wolfe:theme";

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function toggleTheme() {
  const root = document.documentElement;
  if (root.classList.contains("dark")) {
    root.classList.remove("dark");
    try { localStorage.setItem(THEME_KEY, "light"); } catch {}
  } else {
    root.classList.add("dark");
    try { localStorage.setItem(THEME_KEY, "dark"); } catch {}
  }
}

const SUN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const MOON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

@define("title-bar")
export class TitleBar extends WolComponent {

  protected override onMount() {
    this._setIcon();
    const handler = () => {
      this.update();
      requestAnimationFrame(() => this._setIcon());
    };
    document.addEventListener("wolfe:theme-toggle", handler);
    return () => document.removeEventListener("wolfe:theme-toggle", handler);
  }

  protected override onUpdate() {
    this._setIcon();
  }

  private _setIcon() {
    const btn = this.find<HTMLButtonElement>("button");
    if (btn) btn.innerHTML = isDark() ? MOON : SUN;
  }

  protected render() {
    return html`
      <header class="flex items-center justify-between px-5 h-13 shrink-0 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 select-none">
        <span class="font-mono font-semibold text-sm text-stone-800 dark:text-stone-200">
          <span class="text-stone-400 dark:text-stone-500">~/</span>wolfe editor
        </span>
        <button
          @mousedown=${(e: Event) => { e.preventDefault(); toggleTheme(); document.dispatchEvent(new CustomEvent("wolfe:theme-toggle")); }}
          class="p-1.5 rounded-md border border-stone-300 dark:border-stone-500 bg-stone-50 dark:bg-stone-800 transition-colors cursor-pointer text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-stone-800 dark:hover:text-stone-200"
          title="Toggle theme"
        ></button>
      </header>
    `;
  }
}
