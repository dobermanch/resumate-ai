import React from 'react';
import { RefreshCcw, Copy } from 'lucide-react';

interface ActionButtonsProps {
  onRegenerate: () => void;
  onCopy: () => void;
  isGenerating: boolean;
  copyLabel?: string;
}

export const ActionButtons = ({ onRegenerate, onCopy, isGenerating, copyLabel = 'Copy' }: ActionButtonsProps) => (
  <div className="flex gap-2">
    <button
      onClick={onRegenerate}
      disabled={isGenerating}
      className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
    >
      <RefreshCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Regenerate
    </button>
    <button
      onClick={onCopy}
      className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
    >
      <Copy className="w-3.5 h-3.5" /> {copyLabel}
    </button>
  </div>
);
