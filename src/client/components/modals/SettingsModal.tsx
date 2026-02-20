import React from 'react';
import { Settings, Cpu } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { AppSettings, PromptConfig } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export const SettingsModal = ({ isOpen, onClose, settings, setSettings }: SettingsModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Workbench Engine Settings"
    icon={<Settings className="w-5 h-5 text-indigo-600" />}
    maxWidth="4xl"
    overflowHidden
    footer={
      <>
        <button
          onClick={() => setSettings(DEFAULT_SETTINGS)}
          className="px-6 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest transition-colors"
        >
          Restore Defaults
        </button>
        <button
          onClick={onClose}
          className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
        >
          Apply Settings
        </button>
      </>
    }
  >
    <div className="p-8 space-y-10">
      <section className="space-y-4">
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Engine Configuration</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Model Selection</label>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm text-slate-900"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            >
              <option value="gpt-4o">GPT-4o (Most Capable)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Efficient)</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
            </select>
          </div>
        </div>
      </section>

      {Object.entries(settings.prompts).map(([key, config]: [string, PromptConfig]) => (
        <section key={key} className="space-y-4 border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              {key.replace(/([A-Z])/g, ' $1').trim()} Prompt
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-tight">System Instruction</label>
              <textarea
                className="w-full h-40 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 leading-relaxed shadow-inner"
                value={config.system}
                onChange={(e) => {
                  const newPrompts = { ...settings.prompts };
                  newPrompts[key as keyof typeof settings.prompts].system = e.target.value;
                  setSettings({ ...settings, prompts: newPrompts });
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-tight">User Prompt Template</label>
              <textarea
                className="w-full h-40 p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 leading-relaxed shadow-inner"
                value={config.user}
                onChange={(e) => {
                  const newPrompts = { ...settings.prompts };
                  newPrompts[key as keyof typeof settings.prompts].user = e.target.value;
                  setSettings({ ...settings, prompts: newPrompts });
                }}
              />
              <p className="text-[9px] text-slate-500 font-medium italic mt-1">
                {'Placeholders: {{resumeText}}, {{jobText}}, {{improvements}}, {{input}}'}
              </p>
            </div>
          </div>
        </section>
      ))}
    </div>
  </Modal>
);
