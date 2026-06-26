import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration: number = 500): number {
  const [count, setCount] = useState(end);
  const prevEnd = useRef(end);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = prevEnd.current;
    prevEnd.current = end;
    let animFrame: number;
    const startTime = performance.now();
    const from = startRef.current;
    const to = end;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [end, duration]);

  return count;
}

export function AnimatedNumber({ value, duration = 500 }: { value: number | undefined; duration?: number }) {
  const safeValue = value ?? 0;
  const display = useCountUp(safeValue, duration);
  return <>{display.toLocaleString()}</>;
}
