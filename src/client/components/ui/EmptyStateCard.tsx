import React from 'react';

interface EmptyStateCardProps {
  icon: React.ReactNode;
  description: string;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  onAction: () => void;
  isLoading?: boolean;
}

export const EmptyStateCard = ({ icon, description, actionLabel, actionIcon, onAction, isLoading }: EmptyStateCardProps) => (
  <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
    <div className="text-slate-200">{icon}</div>
    <p className="text-slate-400 text-sm">{description}</p>
    <button
      onClick={onAction}
      disabled={isLoading}
      className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-100 hover:-translate-y-0.5"
    >
      {actionIcon}
      {actionLabel}
    </button>
  </div>
);
