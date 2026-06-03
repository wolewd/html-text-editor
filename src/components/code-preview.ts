import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";

function wrapHtml(source: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
    font-size: 16px;
    line-height: 1.75;
    color: #1c1917;
    background: #fff;
    max-width: 42rem;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }
  h1 { font-size: 2.25rem; font-weight: 700; margin: 2rem 0 0.75rem; line-height: 1.25; letter-spacing: -0.025em; }
  h2 { font-size: 1.875rem; font-weight: 700; margin: 1.75rem 0 0.625rem; line-height: 1.25; letter-spacing: -0.025em; }
  h3 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.5rem; line-height: 1.375; }
  h4 { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; line-height: 1.375; }
  h5 { font-size: 1.125rem; font-weight: 500; margin: 1rem 0 0.375rem; }
  h6 { font-size: 1rem; font-weight: 500; margin: 1rem 0 0.375rem; color: #78716c; }
  p { margin: 0.25rem 0; }
  strong, b { font-weight: 700; }
  em, i { font-style: italic; }
  u { text-decoration: underline; }
  s, del { text-decoration: line-through; }
  ul, ol { padding-left: 1.5rem; margin: 0.25rem 0; }
  li { margin: 0.125rem 0; }
</style>
</head>
<body>${source}</body>
</html>`;
}

@define("code-preview")
export class CodePreview extends WolComponent {
  private _state: EditorState;
  private _unsub: (() => void) | null = null;

  constructor() {
    super();
    this._state = { ...editorStore.state };
  }

  protected override onMount() {
    this._unsub = editorStore.subscribe((s) => {
      this._state = s as EditorState;
      this.update();
      // Write to iframe after the DOM patch completes
      requestAnimationFrame(() => this._writeIframe());
    });
    // Initial write once the iframe exists
    requestAnimationFrame(() => this._writeIframe());
    return () => { this._unsub?.(); };
  }

  private _writeIframe() {
    const iframe = this.find<HTMLIFrameElement>("iframe");
    if (!iframe || !iframe.contentDocument) return;
    iframe.contentDocument.open();
    iframe.contentDocument.write(wrapHtml(this._state.html));
    iframe.contentDocument.close();
  }

  protected render() {
    return html`
      <div class="w-full h-full bg-white flex flex-col">
        <div class="flex items-center px-4 h-[40px] border-b border-stone-200 bg-stone-50 flex-shrink-0">
          <span class="text-[10px] font-mono text-stone-400 tracking-widest uppercase">Preview</span>
        </div>
        <iframe
          class="w-full flex-1 border-0"
          sandbox="allow-same-origin"
          title="HTML Preview"
        ></iframe>
      </div>
    `;
  }
}
