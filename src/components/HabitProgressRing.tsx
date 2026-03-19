import { memo } from 'react';

interface HabitProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  isFuture?: boolean;
}

function getRingColor(percentage: number): string {
  if (percentage <= 0) return '#6B7280';   // gray-500
  if (percentage < 50) return '#EF4444';   // red
  if (percentage < 80) return '#A2CB8B';   // accent-light
  return '#84B179';                         // accent
}

const HabitProgressRing = memo<HabitProgressRingProps>(({
  percentage,
  size = 38,
  strokeWidth = 3,
  isFuture = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;
  const color = getRingColor(percentage);
  const isEmpty = percentage === 0 || isFuture;
  const isFull = percentage === 100 && !isFuture;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        {!isEmpty && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.3s ease-out',
              ...(isFull ? { filter: 'drop-shadow(0 0 4px rgba(132, 177, 121, 0.6))' } : {}),
            }}
          />
        )}
      </svg>
      {/* Percentage text */}
      {!isEmpty && (
        <span
          className="absolute text-white font-medium leading-none"
          style={{ fontSize: size <= 38 ? '8px' : '9px' }}
        >
          {clampedPct}%
        </span>
      )}
    </div>
  );
});

HabitProgressRing.displayName = 'HabitProgressRing';

export default HabitProgressRing;
