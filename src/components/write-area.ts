import { WolComponent, html, define } from "wolfe";
import { updateStats, saveHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo } from "../lib/history.ts";
import { format } from "../lib/format.ts";

const EMPTY_STATES = new Set(["", "<br>", "<div><br></div>"]);

function isEditorEmpty(innerHTML: string): boolean {
  return EMPTY_STATES.has(innerHTML.trim());
}

@define("write-area")
export class WriteArea extends WolComponent {
  protected override onMount() {
    const el = this.find<HTMLElement>("#wol-editor")!;

    // Boot state
    el.innerHTML = "<p><br></p>";
    saveHistory();
    el.focus();

    el.addEventListener("input", (e) => {
      if (!e.isTrusted) return;

      // Normalize bare <br> or empty div → clean paragraph
      if (isEditorEmpty(el.innerHTML)) {
        el.innerHTML = "<p><br></p>";
        placeCursor(el.querySelector("p")!);
      }

      saveHistory();
      updateStats(el);
      saveHtml(el);
      document.dispatchEvent(new CustomEvent("wolfe:format-change"));
    });

    el.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey) {
        switch (e.key) {
          case "b": e.preventDefault(); saveHistory(); format("bold");          return;
          case "i": e.preventDefault(); saveHistory(); format("italic");        return;
          case "u": e.preventDefault(); saveHistory(); format("underline");     return;
          case "z": e.preventDefault(); undo();                                 return;
          case "y": e.preventDefault(); redo();                                 return;
        }
      }
      if (ctrl && e.shiftKey && e.key === "X") {
        e.preventDefault();
        saveHistory();
        format("strikethrough");
      }
    });

    // Sync toolbar on selection change
    el.addEventListener("keyup",        () => dispatch("wolfe:format-change"));
    el.addEventListener("mouseup",      () => dispatch("wolfe:format-change"));
    el.addEventListener("focus",        () => dispatch("wolfe:format-change"));
  }

  protected render() {
    return html`
      <div class="w-full h-full overflow-y-auto p-8 bg-stone-50 dark:bg-stone-950">
        <div
          id="wol-editor"
          contenteditable="true"
          class="focus:outline-none min-h-[calc(100%-2rem)] max-w-4xl mx-auto shadow-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-sans text-base text-stone-800 dark:text-stone-100 leading-relaxed p-12
            [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-stone-900 dark:[&_h1]:text-stone-50
            [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-tight [&_h2]:mt-7 [&_h2]:mb-2.5 [&_h2]:text-stone-900 dark:[&_h2]:text-stone-50
            [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-stone-800 dark:[&_h3]:text-stone-100
            [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:leading-snug [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-stone-800 dark:[&_h4]:text-stone-100
            [&_h5]:text-lg [&_h5]:font-medium [&_h5]:leading-normal [&_h5]:mt-4 [&_h5]:mb-1.5 [&_h5]:text-stone-700 dark:[&_h5]:text-stone-200
            [&_h6]:text-base [&_h6]:font-medium [&_h6]:leading-normal [&_h6]:mt-4 [&_h6]:mb-1.5 [&_h6]:text-stone-500 dark:[&_h6]:text-stone-400
            [&_p]:my-1"
        ></div>
      </div>
    `;
  }
}

function placeCursor(node: Node) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  r.setStart(node, 0);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function dispatch(name: string) {
  document.dispatchEvent(new CustomEvent(name));
}
