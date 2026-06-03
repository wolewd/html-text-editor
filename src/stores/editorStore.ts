import { Store } from "wolfe";

const LS_KEY = "wolfe:showHtml";

function readShowHtml(): boolean {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v !== null ? v === "true" : false;
  } catch {
    return false;
  }
}

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
  showHtml: readShowHtml(),
});

export function toggleShowHtml() {
  editorStore.setState((prev) => {
    const next = !prev.showHtml;
    try { localStorage.setItem(LS_KEY, String(next)); } catch { /* ignore */ }
    return { showHtml: next };
  });
}

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
