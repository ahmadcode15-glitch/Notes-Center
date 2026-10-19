import React, { useEffect, useState } from 'react';

interface WatermarkProps {
  username?: string;
  sessionId?: string;
  opacity?: number;
  enabled?: boolean;
}

export const Watermark: React.FC<WatermarkProps> = ({
  username = 'Student',
  sessionId = 'SESSION',
  opacity = 0.16,
  enabled = true,
}) => {
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  const watermarkText = `Notes Center • @${username} • ${sessionId?.substring(0, 10) || 'STUDENT'} • ${timestamp}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden select-none grid grid-cols-2 sm:grid-cols-3 gap-y-20 gap-x-10 p-6"
      style={{ opacity: Math.max(opacity, 0.16) }}
    >
      {Array.from({ length: 36 }).map((_, i) => (
        <div
          key={i}
          className="transform -rotate-25 whitespace-nowrap text-[11px] font-mono font-bold tracking-widest text-neutral-800 uppercase select-none pointer-events-none"
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};

