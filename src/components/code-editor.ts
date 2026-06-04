import { WolComponent, html, define } from "wolfe";
import { updateStats, saveHtml } from "../stores/editorStore.ts";
import { save as saveHistory, undo, redo, reset as resetHistory } from "../lib/history.ts";
import { getEditor, insertInline } from "../lib/tag-insert.ts";

const STORAGE_KEY = "wolfe:editor-html";
const CARET_KEY = "wolfe:editor-caret";

const COLORS: Record<string, string> = {
  html:   "#e06c75",
  head:   "#e06c75",
  body:   "#e06c75",
  div:    "#e06c75",
  span:   "#e06c75",
  h1:     "#d19a66",
  h2:     "#d19a66",
  h3:     "#d19a66",
  h4:     "#d19a66",
  h5:     "#d19a66",
  h6:     "#d19a66",
  p:      "#98c379",
  a:      "#61afef",
  img:    "#61afef",
  video:  "#61afef",
  strong: "#c678dd",
  b:      "#c678dd",
  em:     "#c678dd",
  i:      "#c678dd",
  u:      "#c678dd",
  s:      "#c678dd",
  del:    "#c678dd",
  sub:    "#c678dd",
  sup:    "#c678dd",
  ul:     "#e5c07b",
  ol:     "#e5c07b",
  li:     "#e5c07b",
  table:  "#56b6c2",
  tr:     "#56b6c2",
  th:     "#56b6c2",
  td:     "#56b6c2",
  pre:    "#c678dd",
  code:   "#c678dd",
  blockquote: "#98c379",
  hr:     "#abb2bf",
  br:     "#abb2bf",
};

function highlight(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    .replace(
      /(&lt;\/?)([\w-]+)|(&lt;\/?)([\w-]+)([\s\S]*?)(\/?&gt;)/g,
      (_, openClose1, tag1, openClose2, tag2, attrs, close) => {
        if (tag1) {
          const color = COLORS[tag1] || "#abb2bf";
          return `${openClose1}<span style="color:${color}">${tag1}</span>`;
        }
        const color = COLORS[tag2] || "#abb2bf";
        const coloredAttrs = attrs.replace(
          /([\w-]+)(=)(&quot;|&#39;)(.*?)(\3)/g,
          '<span class="hl-attr">$1</span>$2<span class="hl-value">$3$4$5</span>'
        );
        return `${openClose2}<span style="color:${color}">${tag2}</span>${coloredAttrs}<span style="color:${color}">${close}</span>`;
      }
    );
}

function generateLineNumbers(text: string): string {
  const lineCount = (text.match(/\n/g) || []).length + 1;
  const nums: string[] = [];
  for (let i = 1; i <= lineCount; i++) {
    nums.push(String(i));
  }
  return nums.join("\n");
}

@define("code-editor")
export class CodeEditor extends WolComponent {
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;
  private _highlightEl: HTMLPreElement | null = null;
  private _lineNumsEl: HTMLPreElement | null = null;
  private _scrollWrapper: HTMLDivElement | null = null;

  protected override onMount() {
    const ta = this.find<HTMLTextAreaElement>("textarea")!;
    this._highlightEl = this.find<HTMLPreElement>("#wol-highlight")!;
    this._lineNumsEl = this.find<HTMLPreElement>("#wol-linenums")!;
    this._scrollWrapper = this.find<HTMLDivElement>("#wol-scroll")!;

    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved ?? "<p>Start writing...</p>";
    ta.value = initial;
    this._highlightEl.innerHTML = highlight(initial);
    this._lineNumsEl.textContent = generateLineNumbers(initial);
    resetHistory(initial);
    saveHtml(initial);
    updateStats(initial);

    // Restore cursor/scroll position
    try {
      const caret = JSON.parse(localStorage.getItem(CARET_KEY) || "{}");
      ta.selectionStart = caret.selectionStart ?? (saved ? ta.value.length : 0);
      ta.selectionEnd = caret.selectionEnd ?? (saved ? ta.value.length : 0);
      ta.scrollTop = caret.scrollTop ?? 0;
      if (this._scrollWrapper) {
        this._scrollWrapper.scrollTop = ta.scrollTop;
      }
    } catch {}

    // Save cursor on blur, click, and keyup (captures exact cursor position)
    const saveCaret = () => {
      try {
        localStorage.setItem(CARET_KEY, JSON.stringify({
          selectionStart: ta.selectionStart,
          selectionEnd: ta.selectionEnd,
          scrollTop: ta.scrollTop,
        }));
      } catch {}
    };
    ta.addEventListener("mouseup", saveCaret);
    ta.addEventListener("keyup", saveCaret);
    ta.addEventListener("blur", saveCaret);

    ta.focus();

    ta.addEventListener("input", () => {
      const value = ta.value;
      this._highlightEl!.innerHTML = highlight(value);
      this._lineNumsEl!.textContent = generateLineNumbers(value);
      saveHistory(value);
      saveHtml(value);
      updateStats(value);
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, value);
      }, 500);
    });

    ta.addEventListener("scroll", () => {
      if (this._scrollWrapper) {
        this._scrollWrapper.scrollTop = ta.scrollTop;
        this._scrollWrapper.scrollLeft = ta.scrollLeft;
      }
    });

    ta.addEventListener("keydown", (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && !e.shiftKey) {
        switch (e.key) {
          case "b": e.preventDefault(); insertInline("<strong>", "</strong>"); return;
          case "i": e.preventDefault(); insertInline("<em>", "</em>");         return;
          case "u": e.preventDefault(); insertInline("<u>", "</u>");           return;
          case "z": e.preventDefault(); undoFromHistory();                     return;
          case "y": e.preventDefault(); redoFromHistory();                     return;
        }
      }
      if (ctrl && e.shiftKey && e.key === "X") {
        e.preventDefault();
        insertInline("<s>", "</s>");
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertInline("  ", "");
      }
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        jumpOut();
      }
    });
  }

  protected override onUpdate() {
    // Sync highlight and line numbers after toolbar inserts
    const ta = this.find<HTMLTextAreaElement>("textarea");
    if (ta && this._highlightEl)
      this._highlightEl.innerHTML = highlight(ta.value);
    if (ta && this._lineNumsEl)
      this._lineNumsEl.textContent = generateLineNumbers(ta.value);
  }

  protected render() {
    return html`
      <div class="relative w-full h-full bg-white dark:bg-stone-900">
        <div id="wol-scroll" class="absolute inset-0 overflow-auto pointer-events-none">
          <div class="flex min-h-full">
            <pre
              id="wol-linenums"
              class="w-12 font-mono text-sm leading-relaxed pt-6 pr-2 pb-6 text-right text-stone-300 dark:text-stone-600 select-none border-r border-stone-200 dark:border-stone-800 shrink-0"
              aria-hidden="true"
            ></pre>
            <pre
              id="wol-highlight"
              class="flex-1 min-w-0 font-mono text-sm leading-relaxed pt-6 pr-6 pb-6 pl-2 whitespace-pre-wrap wrap-break-word"
              aria-hidden="true"
            ></pre>
          </div>
        </div>
        <textarea
          id="wol-code-editor"
          spellcheck="false"
          class="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-stone-700 dark:caret-stone-300 font-mono text-sm leading-relaxed p-6 pl-14 border-0 outline-none overflow-auto selection:bg-stone-200/50 dark:selection:bg-stone-700/50"
          placeholder="<p>Start writing HTML...</p>"
        ></textarea>
      </div>
    `;
  }
}

export function undoFromHistory() {
  const prev = undo();
  if (prev === null) return;
  const ta = getEditor();
  if (!ta) return;
  ta.value = prev;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
}

export function redoFromHistory() {
  const next = redo();
  if (next === null) return;
  const ta = getEditor();
  if (!ta) return;
  ta.value = next;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
}

function jumpOut() {
  const ta = getEditor();
  if (!ta) return;
  const pos = ta.selectionStart;
  const text = ta.value;
  const nextNewline = text.indexOf("\n", pos);
  if (nextNewline !== -1) {
    ta.selectionStart = nextNewline + 1;
    ta.selectionEnd = nextNewline + 1;
  } else {
    ta.setRangeText("\n", text.length, text.length, "end");
    ta.selectionStart = text.length + 1;
    ta.selectionEnd = text.length + 1;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
