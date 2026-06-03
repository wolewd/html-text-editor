import { Store } from "wolfe";

export type EditorState = {
  html: string;
  wordCount: number;
  charCount: number;
};

export const editorStore = new Store<EditorState>({
  html: "",
  wordCount: 0,
  charCount: 0,
});

export function updateStats(text: string) {
  const trimmed = text.trim();
  const isEmpty = !trimmed;
  editorStore.setState({
    wordCount: isEmpty ? 0 : trimmed.split(/\s+/).length,
    charCount: isEmpty ? 0 : text.replace(/\n/g, "").length,
  });
}

export function saveHtml(html: string) {
  editorStore.setState({ html });
}
