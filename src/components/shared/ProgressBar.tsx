import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  color?: string;
  bgColor?: string;
  height?: string;
  showText?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  color = 'bg-green-500',
  bgColor = 'bg-gray-700',
  height = 'h-3',
  showText = true,
  label,
}) => {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className="w-full">
      {(showText || label) && (
        <div className="flex justify-between text-xs text-amber-200/80 mb-0.5">
          {label && <span>{label}</span>}
          {showText && (
            <span>
              {current}/{max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${height} ${bgColor} rounded overflow-hidden border border-amber-900/30`}>
        <div
          className={`${color} ${height} rounded transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
