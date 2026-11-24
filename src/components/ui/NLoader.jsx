import React, { useId } from 'react';
import clsx from 'clsx';

/**
 * NLoader - Bold Letter "N" Separating & Joining Animation
 * Features an architectural capital "N" whose pillars separate outward
 * and magnetically converge back together with a glowing pulse.
 */
export default function NLoader({
  size = 'md',
  color = 'gradient', // 'gradient' | 'currentColor'
  className = '',
}) {
  const uniqueId = useId().replace(/:/g, '');

  const sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const selectedSize = sizeMap[size] || sizeMap.md;
  const isCurrentColor = color === 'currentColor';

  const gradLeftId = `nGradLeft_${uniqueId}`;
  const gradDiagId = `nGradDiag_${uniqueId}`;
  const gradRightId = `nGradRight_${uniqueId}`;

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center shrink-0 select-none', selectedSize, className)}
      role="status"
      aria-label="Loading N"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible animate-n-glow"
      >
        <defs>
          {!isCurrentColor && (
            <>
              {/* Left Pillar: Blue to Indigo */}
              <linearGradient id={gradLeftId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4338ca" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>

              {/* Diagonal Connector: Cyan to Indigo Glow */}
              <linearGradient id={gradDiagId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>

              {/* Right Pillar: Indigo to Deep Violet */}
              <linearGradient id={gradRightId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </>
          )}
        </defs>

        {/* Diagonal Stem of "N" */}
        <polygon
          points="8,6 16,6 40,38 40,42 32,42 8,10"
          fill={isCurrentColor ? 'currentColor' : `url(#${gradDiagId})`}
          className="animate-n-center"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {/* Left Vertical Pillar of "N" */}
        <rect
          x="8"
          y="6"
          width="8"
          height="36"
          rx="2"
          fill={isCurrentColor ? 'currentColor' : `url(#${gradLeftId})`}
          className="animate-n-left"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />

        {/* Right Vertical Pillar of "N" */}
        <rect
          x="32"
          y="6"
          width="8"
          height="36"
          rx="2"
          fill={isCurrentColor ? 'currentColor' : `url(#${gradRightId})`}
          className="animate-n-right"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      </svg>
    </div>
  );
}
