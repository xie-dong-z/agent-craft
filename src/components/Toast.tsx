import React, { useEffect, useRef } from 'react';
import { Check, Info, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => (
  <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-5 left-4 right-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6">
    {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />)}
  </div>
);

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(toast.id), 3200);
    return () => window.clearTimeout(timer);
  }, [toast.id]);

  const Icon = toast.type === 'info' ? Info : toast.type === 'warning' ? AlertCircle : Check;
  const accent = toast.type === 'warning'
    ? 'var(--vermilion)'
    : 'rgba(244,241,234,0.72)';

  return (
    <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[3px] border border-[rgba(244,241,234,0.16)] bg-[rgba(23,23,20,0.92)] backdrop-blur-md px-4 py-3 shadow-[0_16px_40px_-20px_rgba(23,23,20,0.5)]">
      <span className="mt-1 h-8 w-px shrink-0" style={{ background: accent }} />
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--paper-raised)]" />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-xs font-medium text-[var(--paper-raised)]">{toast.title}</p>
        {toast.description && (
          <p className="m-0 mt-1 text-xs leading-5 text-[rgba(244,241,234,0.62)]">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="关闭通知"
        className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[2px] text-[rgba(244,241,234,0.56)] transition-colors hover:bg-[rgba(244,241,234,0.1)] hover:text-[var(--paper-raised)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
