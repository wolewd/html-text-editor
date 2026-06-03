import { WolComponent, html, define } from "wolfe";
import { editorStore } from "../stores/editorStore.ts";
import type { EditorState } from "../stores/editorStore.ts";

function wrapHtml(source: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
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

  private _writeIframe() {
    const iframe = this.find<HTMLIFrameElement>("iframe");
    if (!iframe || !iframe.contentDocument) return;
    iframe.contentDocument.open();
    iframe.contentDocument.write(wrapHtml(this._state.html));
    iframe.contentDocument.close();
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
