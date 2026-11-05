import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const dialog = ref.current;
    if (!dialog) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );

    const initial = dialog.querySelector<HTMLElement>('[data-autofocus]') ?? getFocusable()[0] ?? dialog;
    initial.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [enabled, ref]);
}
