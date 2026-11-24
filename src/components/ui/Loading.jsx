import React from 'react';
import clsx from 'clsx';
import NLoader from './NLoader';

/**
 * Loading Component
 * Dead-centers the branded "N" separating & joining animation
 * both in full-screen overlays and container viewports.
 */
export default function Loading({
  fullScreen = false,
  size = 'lg',
  color = 'gradient',
  text,
  className = '',
}) {
  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg)]/85 backdrop-blur-md transition-colors duration-200"
        aria-live="polite"
      >
        <div className="flex flex-col items-center justify-center text-center p-6">
          <NLoader size={size || 'lg'} color={color} />
          {text && (
            <p className="mt-4 text-sm font-semibold text-[var(--color-text)] tracking-wide animate-pulse text-center max-w-xs">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'w-full flex-1 flex flex-col items-center justify-center text-center p-6 min-h-[280px] my-auto',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-center">
        <NLoader size={size || 'lg'} color={color} />
      </div>
      {text && (
        <p className="mt-4 text-sm font-semibold text-[var(--color-text)] tracking-wide animate-pulse text-center max-w-sm">
          {text}
        </p>
      )}
    </div>
  );
}
