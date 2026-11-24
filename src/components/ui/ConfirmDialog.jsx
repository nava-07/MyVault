import React, { useState } from 'react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import NLoader from '@/components/ui/NLoader';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'danger',
  loading: externalLoading = false,
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleConfirm = async () => {
    if (!onConfirm) return;
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconContainer: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
      confirmButton: 'btn-danger',
      defaultConfirmText: 'Delete',
    },
    warning: {
      icon: AlertTriangle,
      iconContainer: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      confirmButton:
        'inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
      defaultConfirmText: 'Proceed',
    },
    info: {
      icon: Info,
      iconContainer: 'bg-primary-100 text-primary-600 dark:bg-primary-950/50 dark:text-primary-400',
      confirmButton: 'btn-primary',
      defaultConfirmText: 'Confirm',
    },
  };

  const config = variantConfig[variant] || variantConfig.danger;
  const Icon = config.icon;
  const resolvedConfirmText = confirmText || config.defaultConfirmText;

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? undefined : onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={clsx(
            'w-12 h-12 rounded-full flex items-center justify-center mb-4',
            config.iconContainer
          )}
        >
          <Icon className="w-6 h-6 stroke-[2]" />
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          {title}
        </h3>

        {message && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            {message}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn-ghost flex-1 py-2.5"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={clsx(
              config.confirmButton,
              'flex-1 py-2.5 inline-flex items-center justify-center gap-2'
            )}
          >
            {isLoading && <NLoader size="xs" color="currentColor" />}
            <span>{resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
