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
  opacity = 0.15,
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
        ).padStart(2, '0')}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  const watermarkText = `Notes Center  •  ${username}  •  ${sessionId.substring(0, 8)}  •  ${timestamp}`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none flex flex-wrap justify-around content-around gap-16 p-8"
      style={{ opacity }}
    >
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="transform -rotate-25 whitespace-nowrap text-xs font-semibold tracking-wider text-neutral-800"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  );
};

