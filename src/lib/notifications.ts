/**
 * Minimal toast notification — shows at bottom-left, auto-dismisses.
 */

let _timer: ReturnType<typeof setTimeout> | null = null;
let _el: HTMLDivElement | null = null;

export function toast(message: string): void {
  // Remove existing toast
  if (_timer) clearTimeout(_timer);
  if (_el) _el.remove();

  _el = document.createElement("div");
  _el.textContent = message;
  _el.className = [
    "fixed bottom-4 right-4 z-50 px-4 py-2 rounded text-sm font-mono",
    "bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-800",
    "shadow-lg transition-opacity duration-200 opacity-0",
  ].join(" ");

  document.body.appendChild(_el);

  // Fade in
  requestAnimationFrame(() => { if (_el) _el.style.opacity = "1"; });

  // Auto-dismiss after 2s
  _timer = setTimeout(() => {
    if (_el) {
      _el.style.opacity = "0";
      setTimeout(() => { if (_el) _el.remove(); _el = null; }, 200);
    }
    _timer = null;
  }, 2000);
}
