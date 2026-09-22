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
  color = 'bg-[#3f3527]',
  bgColor = 'bg-[#e9e2d2]',
  height = 'h-2',
  showText = true,
  label,
}) => {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className="w-full">
      {(showText || label) && (
        <div className="mb-0.5 flex justify-between text-xs text-[#9c917b]">
          {label && <span>{label}</span>}
          {showText && (
            <span>
              {current}/{max}
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${height} ${bgColor} overflow-hidden border border-[#8a7a63]/55`}>
        <div className={`${color} ${height} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
