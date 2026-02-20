import React from 'react';

type AnalysisVariant = 'success' | 'warning' | 'steps';

interface AnalysisCardProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  variant: AnalysisVariant;
  emptyMessage: string;
}

export const AnalysisCard = ({ icon, title, items, variant, emptyMessage }: AnalysisCardProps) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
    <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {variant === 'steps' ? (
      <ul className="space-y-3">
        {items.length > 0 ? (
          items.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700 items-start">
              <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5">{i + 1}</span>
              {t}
            </li>
          ))
        ) : (
          <p className="text-slate-400 text-sm italic">{emptyMessage}</p>
        )}
      </ul>
    ) : (
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((g, i) => (
            <span
              key={i}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                variant === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-100'
              }`}
            >
              {g}
            </span>
          ))
        ) : (
          <p className="text-slate-400 text-sm italic">{emptyMessage}</p>
        )}
      </div>
    )}
  </div>
);
