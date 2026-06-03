import { WolComponent, html, define } from "wolfe";
import { updateStats, saveHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo } from "../lib/history.ts";
import { format, isApplyingBlock } from "../lib/format.ts";

@define("write-area")
export class WriteArea extends WolComponent {
  protected override onMount() {
    const editorEl = this.find<HTMLElement>("#wol-editor")!;

    if (!editorEl.innerHTML.trim() || editorEl.innerHTML === "<br>") {
      editorEl.innerHTML = "<p><br></p>";
    }
    saveHistory();
    editorEl.focus();

    editorEl.addEventListener("input", (e) => {
      // Normalize <div> → <p>
      for (const div of Array.from(editorEl.querySelectorAll(":scope > div"))) {
        const p = document.createElement("p");
        while (div.firstChild) p.appendChild(div.firstChild);
        div.replaceWith(p);
      }

      if (e.isTrusted) saveHistory();

      const h = editorEl.innerHTML;
      if (!isApplyingBlock() && (h === "<br>" || h === "")) {
        editorEl.innerHTML = "<p><br></p>";
      }

      updateStats(editorEl);
      saveHtml(editorEl);
    });

    editorEl.addEventListener("keydown", (e) => {
      const ev = e as KeyboardEvent;

      if (ev.key === "Enter" && !ev.shiftKey) {
        const sel = window.getSelection();
        if (sel?.rangeCount) {
          let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
          while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
          const h = (node as HTMLElement)?.closest?.("h1,h2,h3,h4,h5,h6");
          if (h) {
            ev.preventDefault();
            const next = document.createElement(h.tagName.toLowerCase());
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
  }

  // render() is static — never changes, so patch() is a no-op every time.
  // write-area never calls update(), so this only ever runs once.
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
