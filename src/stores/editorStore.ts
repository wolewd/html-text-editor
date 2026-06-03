import { Store } from "wolfe";

export type EditorState = {
  html: string;
  wordCount: number;
  charCount: number;
  dark: boolean;
  showHtml: boolean;
};

export const editorStore = new Store<EditorState>({
  html: "",
  wordCount: 0,
  charCount: 0,
  dark: false,
  showHtml: true,
});

export function updateStats(el: HTMLElement) {
  if (el.innerHTML === "<p><br></p>") {
    editorStore.setState({ wordCount: 0, charCount: 0 });
    return;
  }
  const text = el.innerText ?? "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  editorStore.setState({ wordCount: words, charCount: text.length });
}

export function saveHtml(el: HTMLElement) {
  editorStore.setState({ html: el.innerHTML });
}
