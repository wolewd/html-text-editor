// CSS is injected at build time
const STYLE = "__CSS_INLINE__";
(function injectCSS() {
  if (document.getElementById("wysiwyg-css")) return;
  const style = document.createElement("style");
  style.id = "wysiwyg-css";
  style.textContent = STYLE;
  document.head.appendChild(style);
})();

import { WolComponent, html, define } from "wolfe";
import "./pages/text-editor.ts";
import { editorStore } from "./stores/editorStore.ts";
import type { EditorState } from "./stores/editorStore.ts";

@define("wysiwyg-editor")
class WysiwygEditor extends WolComponent {
  static observedAttributes = ["value", "theme", "height"];

  private _unsub: (() => void) | null = null;

  get value(): string {
    return editorStore.getState.html;
  }

  set value(html: string) {
    editorStore.setState({ html });
  }

  protected override onPropsChange(
    prev: Record<string, string | null>,
    next: Record<string, string | null>
  ) {
    if (prev.value !== next.value && next.value !== null) {
      editorStore.setState({ html: next.value });
    }
    if (next.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (next.theme === "light") {
      document.documentElement.classList.remove("dark");
    }
  }

  protected override onMount() {
    // Sync initial value attribute
    const val = this.getAttribute("value");
    if (val !== null) editorStore.setState({ html: val });

    // Dispatch change events on content updates
    this._unsub = editorStore.subscribe((s: EditorState) => {
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { html: s.html, wordCount: s.wordCount, charCount: s.charCount },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  protected override onDestroy() {
    this._unsub?.();
  }

  protected render() {
    return html`<text-editor></text-editor>`;
  }
}

// Auto-initialize any <wysiwyg-editor> elements already in the DOM
function autoInit() {
  document.querySelectorAll("wysiwyg-editor").forEach((el) => {
    // Elements are auto-upgraded by the browser when define() registers the tag
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
