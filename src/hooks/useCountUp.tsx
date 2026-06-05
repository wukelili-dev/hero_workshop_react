import { useState, useEffect } from 'react';

export function useCountUp(end: number, duration: number = 500): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let animFrame: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
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

export function AnimatedNumber({ value, duration = 500 }: { value: number; duration?: number }) {
  const display = useCountUp(value, duration);
  return <>{display.toLocaleString()}</>;
}
