import { Store } from "wolfe";

export type EditorState = {
  html: string;
  wordCount: number;
  charCount: number;
  showHtml: boolean;
};

export const editorStore = new Store<EditorState>({
  html: "",
  wordCount: 0,
  charCount: 0,
  showHtml: false,
});

export function updateStats(el: HTMLElement) {
  const text = el.innerText ?? "";
  const isEmpty = !text.trim() || text.trim() === "\n";
  editorStore.setState({
    wordCount: isEmpty ? 0 : text.trim().split(/\s+/).length,
    charCount: isEmpty ? 0 : text.replace(/\n/g, "").length,
  });
}

export function saveHtml(el: HTMLElement) {
  editorStore.setState({ html: el.innerHTML });
}
