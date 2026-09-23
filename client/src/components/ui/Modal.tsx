import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[8px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-muted text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-lg border border-border text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-10 px-4 rounded-lg bg-expense text-white text-sm font-medium"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
