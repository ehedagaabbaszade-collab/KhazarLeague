import { useEffect, useState } from 'react';

/** Count to an API-provided integer while respecting the user's motion setting. */
export default function AnimatedCount({ value, duration = 680, className }) {
  if (value === null || value === undefined || value === '') return <span className={className}>—</span>;
  const target = Number(value);
  if (!Number.isFinite(target)) return <span className={className}>{value}</span>;

  return <AnimatedInteger target={target} duration={duration} className={className} />;
}

function AnimatedInteger({ target, duration, className }) {
  const [shown, setShown] = useState(target === 0 ? 0 : 0);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || duration <= 0 || target === 0) {
      setShown(target);
      return undefined;
    }

    let frame = 0;
    let start = 0;
    const tick = now => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(target * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, target]);

  return <span className={className} aria-label={String(target)}>{shown.toLocaleString('az-AZ')}</span>;
}
