import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
  theme = 'light',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-13 h-13',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Clean, Simple Book Icon Mark */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Rounded base */}
          <rect width="44" height="44" rx="10" fill="#111111" />
          
          {/* Left Book Page */}
          <path
            d="M10 16C14 14.5 19 16 21 17.5V33C19 31.5 14 30 10 31.5V16Z"
            fill="#FFFFFF"
          />
          
          {/* Right Book Page */}
          <path
            d="M34 16C30 14.5 25 16 23 17.5V33C25 31.5 30 30 34 31.5V16Z"
            fill="#FFFFFF"
          />
          
          {/* Yellow Bookmark Ribbon Accent */}
          <path
            d="M20.5 11H23.5V20L22 18.5L20.5 20V11Z"
            fill="#FACC15"
          />
        </svg>
      </div>

      {variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center tracking-tight">
            <span
              className={`font-black tracking-tight ${textSizes[size]} ${
                isDark ? 'text-white' : 'text-[#111111]'
              }`}
            >
              Notes
            </span>
            <span
              className={`font-semibold ml-1.5 ${textSizes[size]} ${
                isDark ? 'text-neutral-200' : 'text-[#171717]'
              }`}
            >
              Center
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] ml-1 self-center" />
          </div>

          {showTagline && (
            <span
              className={`text-[0.68rem] font-medium tracking-normal mt-0.5 ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              Your Notes. Your Preparation. Your Success.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
