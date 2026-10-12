import React from 'react';
import { LucideIcon, BookOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-neutral-200 my-4">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-neutral-900">{title}</h3>
      {description && <p className="text-sm text-neutral-500 max-w-sm mt-1">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-black transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

