import React from 'react';
declare const __APP_VERSION__: string;
import { History } from 'lucide-react';
import type { ResumeVersion } from '@/types';

interface VersionTimelineProps {
  versions: ResumeVersion[];
  currentIndex: number;
  onSelect: (i: number) => void;
}

export const VersionTimeline = ({ versions, currentIndex, onSelect }: VersionTimelineProps) => (
  <nav className="w-16 border-r bg-slate-900 flex flex-col items-center py-6 gap-6 shrink-0 overflow-y-hide scrollbar-hide">
    <div className="text-slate-500 mb-2 shrink-0">
      <History className="w-5 h-5" />
    </div>
    <div className="flex flex-col gap-4 w-full items-center pb-6">
      {versions.map((v, i) => (
        <button
          key={v.id}
          onClick={() => onSelect(i)}
          className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 shrink-0 ${
            i === currentIndex
              ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <span className="text-xs font-bold">V{i}</span>
          {i === currentIndex && (
            <div className="absolute -right-1 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900" />
          )}
          <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {i === 0 ? "Initial Draft" : `Version ${i}`}
          </div>
        </button>
      ))}
    </div>
    <div className="mt-auto pb-0 text-[12px] text-slate-400 select-none text-center">
        <div>v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'}</div>
        <div className="mt-1">
          <a
            href="https://github.com/dobermanch/resumate-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400"
          >
            GitHub
          </a>
        </div>
    </div>
  </nav>
);
