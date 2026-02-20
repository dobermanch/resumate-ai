import React from 'react';

interface SectionHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const SectionHeader = ({ title, actions }: SectionHeaderProps) => (
  <div className="flex justify-between items-center">
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    {actions}
  </div>
);
