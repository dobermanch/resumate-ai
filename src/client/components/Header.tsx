import React from 'react';
import { Settings, Sparkles, Globe } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenTunnel: () => void;
  isLocalhost: boolean;
}

export const Header = ({ onOpenSettings, onOpenTunnel, isLocalhost }: HeaderProps) => (
  <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
        <Sparkles className="text-white w-6 h-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">ResuMate <span className="text-indigo-600">AI</span></h1>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">Boost your match. Beat the bots.</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {isLocalhost && (
        <button
          onClick={onOpenTunnel}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          title="Share publicly"
        >
          <Globe className="w-5 h-5" />
        </button>
      )}
      <button
        onClick={onOpenSettings}
        className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>
    </div>
  </header>
);
