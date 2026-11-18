import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalDialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function ModalDialog({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = 'max-w-xl',
}: ModalDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
    >
      <div
        className={`w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="modal-dialog-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  entityLabel: string;
  itemName: string;
  errorMessage?: string | null;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  entityLabel,
  itemName,
  errorMessage,
  isDeleting = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <ModalDialog
      isOpen={isOpen}
      title={`Delete ${entityLabel}`}
      subtitle="This action removes the record from the hospital database."
      onClose={onCancel}
      maxWidthClass="max-w-md"
    >
      <p className="text-sm leading-relaxed text-slate-700">
        Are you sure you want to permanently remove <strong className="font-semibold text-slate-900">{itemName}</strong>?
      </p>
      {errorMessage && (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          {isDeleting ? 'Deleting...' : `Confirm Delete`}
        </button>
      </div>
    </ModalDialog>
  );
}
