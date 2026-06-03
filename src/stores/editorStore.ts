import { Store } from "wolfe";

export type EditorState = {
  html: string;
  wordCount: number;
  charCount: number;
  dark: boolean;
  showHtml: boolean;
  showLinkModal: boolean;
  showTableModal: boolean;
  pendingUrl: string;
  pendingLinkText: string;
  savedSelection: Range | null;
  tableRows: number;
  tableCols: number;
  isFocused: boolean;
};

export const editorStore = new Store<EditorState>({
  html: "",
  wordCount: 0,
  charCount: 0,
  dark: false,
  showHtml: true,
  showLinkModal: false,
  showTableModal: false,
  pendingUrl: "",
  pendingLinkText: "",
  savedSelection: null,
  tableRows: 3,
  tableCols: 3,
  isFocused: false,
});

export function toggleDark() {
  editorStore.setState((prev) => {
    const next = !prev.dark;
    if (next) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark", "bg-stone-950", "text-stone-100");
      document.body.classList.remove("bg-stone-50", "text-stone-900");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark", "bg-stone-950", "text-stone-100");
      document.body.classList.add("bg-stone-50", "text-stone-900");
    }
    return { dark: next };
  });
}

export function updateStats(el: HTMLElement) {
  // Ignore the empty placeholder <p><br></p>
  if (el.innerHTML === "<p><br></p>") {
    editorStore.setState({ wordCount: 0, charCount: 0 });
    return;
  }
  const text = el.innerText || "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  editorStore.setState({ wordCount: words, charCount: chars });
}

export function saveHtml(el: HTMLElement) {
  editorStore.setState({ html: el.innerHTML });
}
