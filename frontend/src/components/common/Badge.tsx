import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'suspended' | 'expired' | 'disabled' | 'paid' | 'pending' | 'failed' | 'yellow' | 'neutral' | 'blue';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    suspended: 'bg-amber-50 text-amber-700 border border-amber-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    expired: 'bg-red-50 text-red-700 border border-red-200',
    failed: 'bg-red-50 text-red-700 border border-red-200',
    disabled: 'bg-neutral-100 text-neutral-600 border border-neutral-300',
    yellow: 'bg-[#FEF9C3] text-neutral-900 border border-[#FACC15] font-semibold',
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
    blue: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md tracking-tight ${sizeClasses} ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};

