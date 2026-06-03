import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";

let _cachedCSS = "";

async function getAppCSS(): Promise<string> {
  if (_cachedCSS) return _cachedCSS;
  try {
    const res = await fetch("/app.css");
    _cachedCSS = await res.text();
  } catch {
    _cachedCSS = "";
  }
  return _cachedCSS;
}

function wrapHtml(source: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${css}</style>
</head>
<body class="prose max-w-2xl mx-auto my-8 px-6 bg-white">${source}</body>
</html>`;
}

@define("code-preview")
export class CodePreview extends WolComponent {
  private _state: EditorState;
  private _unsub: (() => void) | null = null;

  constructor() {
    super();
    this._state = { ...editorStore.getState };
  }

  protected override onMount() {
    this._unsub = editorStore.subscribe((s) => {
      this._state = s;
      this.update();
      requestAnimationFrame(() => this._writeIframe());
    });
    requestAnimationFrame(() => this._writeIframe());
    return () => { this._unsub?.(); };
  }

  private async _writeIframe() {
    const iframe = this.find<HTMLIFrameElement>("iframe");
    if (!iframe) return;

    const css = await getAppCSS();
    iframe.srcdoc = wrapHtml(this._state.html, css);
  }

  protected render() {
    return html`
      <iframe
        class="w-full h-full border-0 bg-white"
        sandbox="allow-scripts"
        title="HTML Preview"
      ></iframe>
    `;
  }
}
