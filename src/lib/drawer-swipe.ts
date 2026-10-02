const SWIPE_HANDLE_SELECTOR = "[data-drawer-swipe-handle]";
const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, [contenteditable='true'], [data-base-ui-swipe-ignore]";

export function canStartDrawerSwipe(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(SWIPE_HANDLE_SELECTOR) !== null &&
    target.closest(INTERACTIVE_SELECTOR) === null
  );
}
