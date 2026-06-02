import { WolComponent, html, define, subscribe } from "wolfe";
import { editorStore, toggleDark, updateStats, saveHtml } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";

// SVG icons as strings
const icons: Record<string, string> = {
  bold: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 6.4 3.9h.1m6.9 3.7c.3.4.4.8.4 1.3 0 2.9-2.7 3.6-6.3 3.6-2.6 0-5.1-.6-6.8-1.3"/><line x1="4" y1="11.9" x2="20" y2="11.9"/></svg>`,
  h1: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>`,
  h2: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 6c-2.2 0-4 1.8-4 4 0 4 4 4 4 8h-4"/></svg>`,
  h3: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>`,
  quote: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
  ul: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>`,
  ol: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
  code: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  codeblock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="m8 9-3 3 3 3"/><path d="m16 9 3 3-3 3"/><path d="M12 7v10"/></svg>`,
  link: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  unlink: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/></svg>`,
  table: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>`,
  hr: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="7" y2="6"/><line x1="3" y1="18" x2="7" y2="18"/></svg>`,
  undo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  alignLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>`,
  alignCenter: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
  alignRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>`,
  indent: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="3 8 7 12 3 16"/></svg>`,
  outdent: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="7 8 3 12 7 16"/></svg>`,
  clear: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  super: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19 8 12l4 7"/><path d="M6.05 16h3.9"/><path d="M20 12c0-2 2-2 2-4s-2.5-2-2.5-.5"/></svg>`,
  sub: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5 8 12l4-7"/><path d="M6 9h4"/><path d="M20 19c0-2 2-2 2-4s-2.5-2-2.5-.5"/></svg>`,
};

function btn(icon: string, title: string, onClick: () => void, extraClass = "") {
  const el = document.createElement("button");
  el.type = "button";
  el.title = title;
  el.innerHTML = icons[icon] ?? icon;
  el.className = `toolbar-btn p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer transition-colors ${extraClass}`;
  el.addEventListener("mousedown", (e) => { e.preventDefault(); onClick(); });
  return el;
}

function divider() {
  const el = document.createElement("div");
  el.className = "w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 self-center flex-shrink-0";
  return el;
}

@define("wolfe-editor")
export class WolfeEditor extends WolComponent {
  @subscribe(editorStore)
  state!: EditorState;

  private editorEl: HTMLElement | null = null;
  private bubbleToolbar: HTMLElement | null = null;
  private toolbarEl: HTMLElement | null = null;
  private htmlOutputEl: HTMLElement | null = null;

  protected override onMount() {
    this.editorEl = this.find<HTMLElement>("#wol-editor");
    this.bubbleToolbar = document.getElementById("bubble-toolbar");
    this.toolbarEl = this.find<HTMLElement>("#main-toolbar");
    this.htmlOutputEl = this.find<HTMLElement>("#html-output");

    if (!this.editorEl) return;

    this.editorEl.addEventListener("input", () => this._onInput());
    this.editorEl.addEventListener("keydown", (e) => this._onKeydown(e as KeyboardEvent));
    this.editorEl.addEventListener("mouseup", () => this._updateBubble());
    this.editorEl.addEventListener("keyup", () => this._updateBubble());
    this.editorEl.addEventListener("focus", () => editorStore.setState({ isFocused: true }));
    this.editorEl.addEventListener("blur", () => {
      editorStore.setState({ isFocused: false });
      setTimeout(() => this._hideBubble(), 200);
    });
    document.addEventListener("selectionchange", () => this._updateActiveStates());

    this._buildBubbleToolbar();
    this._buildMainToolbar();
  }

  protected override onDestroy() {
    document.getElementById("bubble-toolbar")?.remove();
  }

  private _onInput() {
    if (!this.editorEl) return;
    updateStats(this.editorEl);
    saveHtml(this.editorEl);
    if (this.htmlOutputEl && editorStore.getState.showHtml) {
      this.htmlOutputEl.textContent = this.editorEl.innerHTML;
    }
  }

  private _onKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key) {
        case "b": e.preventDefault(); this._exec("bold"); break;
        case "i": e.preventDefault(); this._exec("italic"); break;
        case "u": e.preventDefault(); this._exec("underline"); break;
        case "z": e.preventDefault(); document.execCommand("undo"); break;
        case "y": e.preventDefault(); document.execCommand("redo"); break;
        case "k": e.preventDefault(); this._openLinkModal(); break;
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      switch (e.key) {
        case "Z": e.preventDefault(); document.execCommand("redo"); break;
        case "X": e.preventDefault(); this._exec("strikethrough"); break;
      }
    }
    // Tab for indent
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) document.execCommand("outdent");
      else document.execCommand("indent");
    }
  }

  private _exec(cmd: string, value?: string) {
    this.editorEl?.focus();
    document.execCommand(cmd, false, value);
    this._onInput();
    this._updateActiveStates();
  }

  private _format(tag: string) {
    this.editorEl?.focus();
    document.execCommand("formatBlock", false, tag);
    this._onInput();
  }

  private _insertRaw(html: string) {
    this.editorEl?.focus();
    document.execCommand("insertHTML", false, html);
    this._onInput();
  }

  private _openLinkModal() {
    const sel = window.getSelection();
    const text = sel?.toString() || "";
    const range = sel?.getRangeAt(0);
    const anchor = range ? this._getAnchorAt(range) : null;
    editorStore.setState({
      showLinkModal: true,
      pendingUrl: anchor?.href || "",
      pendingLinkText: text,
      savedSelection: range ? range.cloneRange() : null,
    });
  }

  private _getAnchorAt(range: Range): HTMLAnchorElement | null {
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== this.editorEl) {
      if (node.nodeType === 1 && (node as HTMLElement).tagName === "A")
        return node as HTMLAnchorElement;
      node = node.parentNode;
    }
    return null;
  }

  private _applyLink() {
    const { savedSelection, pendingUrl, pendingLinkText } = editorStore.getState;
    if (!savedSelection || !pendingUrl) {
      editorStore.setState({ showLinkModal: false });
      return;
    }
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedSelection);
    this.editorEl?.focus();
    const text = pendingLinkText || pendingUrl;
    const anchor = `<a href="${pendingUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    if (sel?.toString()) {
      document.execCommand("insertHTML", false, anchor);
    } else {
      document.execCommand("insertHTML", false, anchor);
    }
    editorStore.setState({ showLinkModal: false, pendingUrl: "", pendingLinkText: "" });
    this._onInput();
  }

  private _insertTable() {
    const { tableRows, tableCols } = editorStore.getState;
    let html = `<table><thead><tr>`;
    for (let c = 0; c < tableCols; c++) html += `<th>Header ${c + 1}</th>`;
    html += `</tr></thead><tbody>`;
    for (let r = 0; r < tableRows - 1; r++) {
      html += `<tr>`;
      for (let c = 0; c < tableCols; c++) html += `<td>Cell</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table><p><br></p>`;
    this._insertRaw(html);
    editorStore.setState({ showTableModal: false });
  }

  private _updateActiveStates() {
    const toolbar = this.toolbarEl;
    if (!toolbar) return;
    const cmds = ["bold", "italic", "underline", "strikethrough"];
    cmds.forEach(cmd => {
      const btn = toolbar.querySelector(`[data-cmd="${cmd}"]`) as HTMLElement | null;
      if (btn) {
        const active = document.queryCommandState(cmd);
        btn.classList.toggle("active", active);
      }
    });
  }

  private _buildBubbleToolbar() {
    let bubble = document.getElementById("bubble-toolbar");
    if (!bubble) {
      bubble = document.createElement("div");
      bubble.id = "bubble-toolbar";
      bubble.className = "bg-gray-900 dark:bg-gray-100 rounded-lg shadow-2xl border border-gray-700 dark:border-gray-200 p-1 gap-0.5 items-center";
      document.body.appendChild(bubble);
    }
    this.bubbleToolbar = bubble;

    const addBtn = (icon: string, title: string, cmd: string, value?: string) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = title;
      b.setAttribute("data-cmd", cmd);
      b.innerHTML = icons[icon] ?? icon;
      b.className = "p-1.5 rounded text-gray-200 dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-200 cursor-pointer transition-colors toolbar-btn";
      b.addEventListener("mousedown", (e) => { e.preventDefault(); this._exec(cmd, value); });
      bubble!.appendChild(b);
      return b;
    };

    addBtn("bold", "Bold", "bold");
    addBtn("italic", "Italic", "italic");
    addBtn("underline", "Underline", "underline");
    addBtn("strikethrough", "Strikethrough", "strikethrough");

    const d = document.createElement("div");
    d.className = "w-px h-4 bg-gray-600 dark:bg-gray-300 mx-0.5 self-center";
    bubble.appendChild(d);

    const linkB = document.createElement("button");
    linkB.type = "button";
    linkB.title = "Link";
    linkB.innerHTML = icons["link"]!;
    linkB.className = "p-1.5 rounded text-gray-200 dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-200 cursor-pointer transition-colors";
    linkB.addEventListener("mousedown", (e) => { e.preventDefault(); this._openLinkModal(); });
    bubble.appendChild(linkB);
  }

  private _updateBubble() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      this._hideBubble();
      return;
    }
    // Check selection is inside editor
    const range = sel.getRangeAt(0);
    if (!this.editorEl?.contains(range.commonAncestorContainer)) {
      this._hideBubble();
      return;
    }
    const rect = range.getBoundingClientRect();
    const bubble = this.bubbleToolbar;
    if (!bubble) return;
    bubble.classList.add("visible");
    const bw = bubble.offsetWidth;
    let left = rect.left + rect.width / 2 - bw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${rect.top - bubble.offsetHeight - 8 + window.scrollY}px`;
    this._updateActiveStatesBubble(bubble);
  }

  private _updateActiveStatesBubble(bubble: HTMLElement) {
    ["bold", "italic", "underline", "strikethrough"].forEach(cmd => {
      const b = bubble.querySelector(`[data-cmd="${cmd}"]`) as HTMLElement | null;
      if (b) b.classList.toggle("active", document.queryCommandState(cmd));
    });
  }

  private _hideBubble() {
    this.bubbleToolbar?.classList.remove("visible");
  }

  private _buildMainToolbar() {
    const toolbar = this.toolbarEl;
    if (!toolbar) return;
    toolbar.innerHTML = "";
    toolbar.className = "flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 sticky top-0 z-10";

    const addBtn = (icon: string, title: string, action: () => void, cmd?: string) => {
      const b = btn(icon, title, action);
      if (cmd) b.setAttribute("data-cmd", cmd);
      toolbar.appendChild(b);
      return b;
    };

    // History
    addBtn("undo", "Undo (Ctrl+Z)", () => document.execCommand("undo"));
    addBtn("redo", "Redo (Ctrl+Y)", () => document.execCommand("redo"));
    toolbar.appendChild(divider());

    // Text format
    addBtn("bold", "Bold (Ctrl+B)", () => this._exec("bold"), "bold");
    addBtn("italic", "Italic (Ctrl+I)", () => this._exec("italic"), "italic");
    addBtn("underline", "Underline (Ctrl+U)", () => this._exec("underline"), "underline");
    addBtn("strikethrough", "Strikethrough", () => this._exec("strikethrough"), "strikethrough");
    addBtn("super", "Superscript", () => this._exec("superscript"));
    addBtn("sub", "Subscript", () => this._exec("subscript"));
    addBtn("clear", "Clear Formatting", () => this._exec("removeFormat"));
    toolbar.appendChild(divider());

    // Headings
    addBtn("h1", "Heading 1", () => this._format("h1"));
    addBtn("h2", "Heading 2", () => this._format("h2"));
    addBtn("h3", "Heading 3", () => this._format("h3"));

    // Paragraph/format select
    const sel = document.createElement("select");
    sel.title = "Format Block";
    sel.className = "h-7 px-1.5 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer ml-0.5";
    [["p", "Paragraph"], ["pre", "Code Block"], ["blockquote", "Blockquote"], ["h1","H1"],["h2","H2"],["h3","H3"],["h4","H4"],["h5","H5"],["h6","H6"]].forEach(([v, l]) => {
      const o = document.createElement("option");
      o.value = v!; o.textContent = l!;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => { this._format(sel.value); sel.value = "p"; });
    toolbar.appendChild(sel);
    toolbar.appendChild(divider());

    // Lists
    addBtn("ul", "Bullet List", () => this._exec("insertUnorderedList"));
    addBtn("ol", "Numbered List", () => this._exec("insertOrderedList"));
    addBtn("indent", "Indent", () => this._exec("indent"));
    addBtn("outdent", "Outdent", () => this._exec("outdent"));
    toolbar.appendChild(divider());

    // Alignment
    addBtn("alignLeft", "Align Left", () => this._exec("justifyLeft"));
    addBtn("alignCenter", "Align Center", () => this._exec("justifyCenter"));
    addBtn("alignRight", "Align Right", () => this._exec("justifyRight"));
    toolbar.appendChild(divider());

    // Insert
    addBtn("link", "Insert Link (Ctrl+K)", () => this._openLinkModal());
    addBtn("unlink", "Remove Link", () => this._exec("unlink"));
    addBtn("quote", "Blockquote", () => this._format("blockquote"));
    addBtn("code", "Inline Code", () => {
      const sel = window.getSelection();
      const text = sel?.toString() || "code";
      document.execCommand("insertHTML", false, `<code>${text}</code>`);
      this._onInput();
    });
    addBtn("codeblock", "Code Block", () => {
      this._insertRaw(`<pre><code>code here</code></pre><p><br></p>`);
    });
    addBtn("table", "Insert Table", () => editorStore.setState({ showTableModal: true }));
    addBtn("hr", "Horizontal Rule", () => { this._insertRaw(`<hr><p><br></p>`); });
    toolbar.appendChild(divider());

    // Font size
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "text-xs text-gray-400 dark:text-gray-500 ml-0.5";
    sizeLabel.textContent = "Size:";
    toolbar.appendChild(sizeLabel);
    const sizeSel = document.createElement("select");
    sizeSel.title = "Font Size";
    sizeSel.className = "h-7 px-1.5 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer";
    [["1","8px"],["2","10px"],["3","12px"],["4","14px"],["5","18px"],["6","24px"],["7","36px"]].forEach(([v, l]) => {
      const o = document.createElement("option");
      o.value = v!; o.textContent = l!;
      if (v === "3") o.selected = true;
      sizeSel.appendChild(o);
    });
    sizeSel.addEventListener("change", () => { this._exec("fontSize", sizeSel.value); });
    toolbar.appendChild(sizeSel);
    toolbar.appendChild(divider());

    // Color pickers
    const fgLabel = document.createElement("span");
    fgLabel.className = "text-xs text-gray-400 dark:text-gray-500";
    fgLabel.textContent = "A";
    toolbar.appendChild(fgLabel);
    const colorPick = document.createElement("input");
    colorPick.type = "color";
    colorPick.title = "Text Color";
    colorPick.value = "#000000";
    colorPick.className = "w-6 h-6 rounded cursor-pointer border border-gray-200 dark:border-gray-600 p-0 bg-transparent";
    colorPick.addEventListener("change", () => { this._exec("foreColor", colorPick.value); });
    toolbar.appendChild(colorPick);

    const bgPick = document.createElement("input");
    bgPick.type = "color";
    bgPick.title = "Highlight Color";
    bgPick.value = "#ffff00";
    bgPick.className = "w-6 h-6 rounded cursor-pointer border border-gray-200 dark:border-gray-600 p-0 bg-transparent";
    bgPick.addEventListener("change", () => { this._exec("hiliteColor", bgPick.value); });
    toolbar.appendChild(bgPick);
    toolbar.appendChild(divider());

    // Dark mode + HTML view toggles (right side)
    const spacer = document.createElement("div");
    spacer.className = "flex-1";
    toolbar.appendChild(spacer);

    const htmlBtn = document.createElement("button");
    htmlBtn.type = "button";
    htmlBtn.title = "Toggle HTML Output";
    htmlBtn.innerHTML = `${icons["html"]} <span class="text-xs ml-1">HTML</span>`;
    htmlBtn.className = "toolbar-btn flex items-center px-2 py-1 rounded text-xs font-mono text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-pointer";
    htmlBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const next = !editorStore.getState.showHtml;
      editorStore.setState({ showHtml: next });
      htmlBtn.classList.toggle("active", next);
      const panel = this.find<HTMLElement>("#html-panel");
      if (panel) panel.classList.toggle("hidden", !next);
      if (next && this.editorEl && this.htmlOutputEl) {
        this.htmlOutputEl.textContent = this.editorEl.innerHTML;
      }
    });
    toolbar.appendChild(htmlBtn);

    const darkBtn = document.createElement("button");
    darkBtn.type = "button";
    darkBtn.title = "Toggle Dark Mode";
    darkBtn.innerHTML = icons["moon"]!;
    darkBtn.className = "toolbar-btn p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-600 ml-1";
    darkBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      toggleDark();
      darkBtn.innerHTML = editorStore.getState.dark ? icons["sun"]! : icons["moon"]!;
    });
    toolbar.appendChild(darkBtn);
  }

  private _copyHtml() {
    const html = this.editorEl?.innerHTML || "";
    navigator.clipboard.writeText(html).then(() => {
      const copyBtn = this.find<HTMLElement>("#copy-btn");
      if (copyBtn) {
        copyBtn.innerHTML = icons["check"]!;
        setTimeout(() => { copyBtn.innerHTML = icons["copy"]!; }, 1500);
      }
    });
  }

  protected render() {
    const { state } = this;
    const isDark = state?.dark ?? false;

    return html`
      <div class="flex flex-col h-screen overflow-hidden font-mono bg-white dark:bg-gray-950">

        <!-- Header -->
        <header class="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 tracking-tight">WolFe Editor</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">WYSIWYG</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
            <span>${state?.wordCount ?? 0} words</span>
            <span class="text-gray-300 dark:text-gray-600">·</span>
            <span>${state?.charCount ?? 0} chars</span>
          </div>
        </header>

        <!-- Toolbar -->
        <div id="main-toolbar"></div>

        <!-- Editor + HTML split -->
        <div class="flex flex-1 overflow-hidden">

          <!-- Content editable area -->
          <div class="flex-1 overflow-y-auto">
            <div
              id="wol-editor"
              contenteditable="true"
              data-placeholder="Start typing… or paste some content here."
              class="min-h-full px-12 py-10 text-base text-gray-800 dark:text-gray-100 leading-relaxed max-w-4xl mx-auto focus:outline-none"
            ></div>
          </div>

          <!-- HTML Output Panel -->
          <div id="html-panel" class="hidden w-96 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-gray-950">
            <div class="flex items-center justify-between px-3 py-2 border-b border-gray-800 flex-shrink-0">
              <span class="text-xs font-mono text-indigo-400 font-semibold tracking-wide">HTML OUTPUT</span>
              <button
                id="copy-btn"
                type="button"
                title="Copy HTML"
                class="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 cursor-pointer transition-colors"
              >${icons["copy"]}</button>
            </div>
            <pre id="html-output" class="flex-1 overflow-auto text-xs text-green-400 font-mono p-3 whitespace-pre-wrap break-all leading-relaxed"></pre>
          </div>
        </div>

        <!-- Status bar -->
        <footer class="flex items-center justify-between px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full ${(state?.isFocused) ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}"></span>
              ${(state?.isFocused) ? 'Editing' : 'Ready'}
            </span>
          </div>
          <div class="text-xs text-gray-300 dark:text-gray-600 font-mono">
            Ctrl+B Bold · Ctrl+I Italic · Ctrl+K Link · Tab Indent
          </div>
        </footer>

        <!-- Link Modal -->
        ${(state?.showLinkModal) ? html`
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">Insert Link</span>
              <button type="button" class="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" @click=${() => editorStore.setState({ showLinkModal: false })}>
                ${icons["close"]}
              </button>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value="${state?.pendingUrl ?? ''}"
                  class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  @input=${(e: Event) => editorStore.setState({ pendingUrl: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Link Text (optional)</label>
                <input
                  type="text"
                  placeholder="Display text"
                  value="${state?.pendingLinkText ?? ''}"
                  class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  @input=${(e: Event) => editorStore.setState({ pendingLinkText: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div class="flex gap-2 pt-1">
                <button type="button" class="flex-1 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 cursor-pointer transition-colors" @click=${() => this._applyLink()}>
                  Insert Link
                </button>
                <button type="button" class="py-2 px-4 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" @click=${() => editorStore.setState({ showLinkModal: false })}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        ` : null}

        <!-- Table Modal -->
        ${(state?.showTableModal) ? html`
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-xs overflow-hidden">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">Insert Table</span>
              <button type="button" class="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" @click=${() => editorStore.setState({ showTableModal: false })}>
                ${icons["close"]}
              </button>
            </div>
            <div class="p-4 flex flex-col gap-3">
              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Rows</label>
                  <input type="number" min="1" max="20" value="${state?.tableRows ?? 3}"
                    class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    @input=${(e: Event) => editorStore.setState({ tableRows: parseInt((e.target as HTMLInputElement).value) || 3 })}
                  />
                </div>
                <div class="flex-1">
                  <label class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Columns</label>
                  <input type="number" min="1" max="10" value="${state?.tableCols ?? 3}"
                    class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    @input=${(e: Event) => editorStore.setState({ tableCols: parseInt((e.target as HTMLInputElement).value) || 3 })}
                  />
                </div>
              </div>
              <div class="flex gap-2 pt-1">
                <button type="button" class="flex-1 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 cursor-pointer transition-colors" @click=${() => this._insertTable()}>
                  Insert Table
                </button>
                <button type="button" class="py-2 px-4 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" @click=${() => editorStore.setState({ showTableModal: false })}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        ` : null}

      </div>
    `;
  }

  protected override onUpdate() {
    // Wire up copy button after re-render
    const copyBtn = this.find<HTMLElement>("#copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this._copyHtml());
    }
  }
}
