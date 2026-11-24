import React from 'react';
import { FolderOpen } from 'lucide-react';
import clsx from 'clsx';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description,
  action,
  className = '',
}) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)]',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4 shadow-sm">
        {Icon && <Icon className="w-8 h-8 stroke-[1.75]" />}
      </div>

      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={clsx(
            action.className || 'btn-primary',
            'inline-flex items-center gap-2 shadow-sm hover:shadow'
          )}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
