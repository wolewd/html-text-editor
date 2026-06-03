/**
 * Minimal floating hint — appears near the target element, auto-dismisses.
 */

let _timer: ReturnType<typeof setTimeout> | null = null;
let _el: HTMLDivElement | null = null;

export function hint(target: HTMLElement, message: string): void {
  if (_timer) clearTimeout(_timer);
  if (_el) _el.remove();

  const rect = target.getBoundingClientRect();

  _el = document.createElement("div");
  _el.textContent = message;
  _el.className = [
    "fixed z-50 px-2 py-1 rounded text-[11px] font-mono pointer-events-none",
    "bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-800",
    "shadow transition-opacity duration-150 opacity-0",
  ].join(" ");

  // Position above the target
  _el.style.left = `${rect.left + rect.width / 2}px`;
  _el.style.top = `${rect.top - 28}px`;
  _el.style.transform = "translateX(-50%)";

  document.body.appendChild(_el);

  requestAnimationFrame(() => { if (_el) _el.style.opacity = "1"; });

  _timer = setTimeout(() => {
    if (_el) {
      _el.style.opacity = "0";
      setTimeout(() => { if (_el) _el.remove(); _el = null; }, 150);
    }
    _timer = null;
  }, 1200);
}
