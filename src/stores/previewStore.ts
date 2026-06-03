const LS_KEY = "wolfe:show-preview";

export function isPreviewShown(): boolean {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v !== null ? v === "true" : true;
  } catch { return true; }
}

export function togglePreview(): boolean {
  const next = !isPreviewShown();
  try { localStorage.setItem(LS_KEY, String(next)); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent("wolfe:preview-toggle"));
  return next;
}
