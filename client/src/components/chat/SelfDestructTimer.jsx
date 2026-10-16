import React, { useState, useEffect } from 'react';
import { Flame, Clock } from 'lucide-react';

const SelfDestructTimer = ({ expiresAt, duration = 10 }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!expiresAt) return duration;
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    return diff;
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const percentage = Math.min(100, Math.max(0, (secondsLeft / duration) * 100));

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-mono font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse"
      title={`Vanishes in ${secondsLeft}s`}
    >
      <Flame className="w-3 h-3 text-rose-400 fill-current" />
      <span>{secondsLeft}s</span>
    </div>
  );
};

export default SelfDestructTimer;
