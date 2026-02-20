import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: number;
  onExpire: () => void;
}

export const CountdownTimer = ({ expiresAt, onExpire }: CountdownTimerProps) => {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, expiresAt - Date.now());
      setRemaining(left);
      if (left === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const totalSeconds = Math.ceil(remaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [...(h > 0 ? [`${h}h`] : []), ...(m > 0 || h > 0 ? [`${m}m`] : []), [`${s}s`]];
  return <span className="font-mono font-bold text-slate-700">{parts.join(' ')}</span>;
};
