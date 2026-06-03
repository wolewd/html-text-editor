import { WolComponent, html, define } from "wolfe";
import { editorStore, updateStats, saveHtml } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo } from "../lib/history.ts";
import { format, isApplyingBlock } from "../lib/format.ts";

@define("write-area")
export class WriteArea extends WolComponent {
  private _state: EditorState;
  private _unsub: (() => void) | null = null;
  private editorEl: HTMLElement | null = null;

  constructor() {
    super();
    this._state = { ...editorStore.state };
  }

  protected override onMount() {
    this.editorEl = this.find<HTMLElement>("#wol-editor");
    if (!this.editorEl) return;

    // Seed editor with a <p> wrapper so the browser naturally wraps new text in paragraphs
    if (!this.editorEl.innerHTML.trim() || this.editorEl.innerHTML === "<br>") {
      this.editorEl.innerHTML = "<p><br></p>";
    }
    saveHistory();
    this.editorEl.focus();

    this.editorEl.addEventListener("input", (e) => {
      if (!this.editorEl) return;

      // Normalize <div> blocks back to <p> — browser defaults to div after headings
      const divs = Array.from(this.editorEl.querySelectorAll(":scope > div"));
      for (const div of divs) {
        const p = document.createElement("p");
        while (div.firstChild) p.appendChild(div.firstChild);
        div.replaceWith(p);
      }

      if (e.isTrusted) saveHistory();

      // Re-wrap bare <br> or empty editor — browser drops <p> when user deletes all content
      const html = this.editorEl.innerHTML;
      if (!isApplyingBlock() && (html === "<br>" || html === "")) {
        this.editorEl.innerHTML = "<p><br></p>";
      }

      updateStats(this.editorEl);
      saveHtml(this.editorEl);
    });

    this.editorEl.addEventListener("keydown", (e) => {
      const ev = e as KeyboardEvent;

      // Enter inside a heading: create another heading of the same type
      if (ev.key === "Enter" && !ev.shiftKey) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
          let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
          while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
          const h = (node as HTMLElement)?.closest?.("h1, h2, h3, h4, h5, h6");
          if (h) {
            ev.preventDefault();
            const tag = h.tagName.toLowerCase();
            const next = document.createElement(tag);
            next.innerHTML = "<br>";
            h.after(next);
            const nr = document.createRange();
            nr.selectNodeContents(next);
            nr.collapse(true);
            sel.removeAllRanges();
            sel.addRange(nr);
            return;
          }
        }
      }

      const ctrl = ev.ctrlKey || ev.metaKey;
      if (ctrl && !ev.shiftKey) {
        switch (ev.key) {
          case "b": ev.preventDefault(); saveHistory(); format("bold"); break;
          case "i": ev.preventDefault(); saveHistory(); format("italic"); break;
          case "u": ev.preventDefault(); saveHistory(); format("underline"); break;
          case "z": ev.preventDefault(); undo(); break;
          case "y": ev.preventDefault(); redo(); break;
        }
        document.dispatchEvent(new CustomEvent("wolfe:format-change"));
      }
      if (ctrl && ev.shiftKey && ev.key === "X") {
        ev.preventDefault();
        saveHistory();
        format("strikethrough");
        document.dispatchEvent(new CustomEvent("wolfe:format-change"));
      }
    });

    this._unsub = editorStore.subscribe((s) => {
      this._state = s as EditorState;
      this.update();
    });

    return () => { this._unsub?.(); this._unsub = null; };
  }

  protected render() {
    return html`
      <div class="w-full h-full overflow-y-auto p-8 bg-stone-50 dark:bg-stone-950">
        <div
          id="wol-editor"
          contenteditable="true"
          class="focus:outline-none min-h-[calc(100%-2rem)] max-w-4xl mx-auto shadow bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-sans text-base text-stone-800 dark:text-stone-100 leading-relaxed p-12"
        ></div>
      </div>
    `;
  }
}
