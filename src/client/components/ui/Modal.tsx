import React from 'react';
import { X } from 'lucide-react';

const MAX_WIDTH_MAP = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '4xl': 'max-w-4xl',
} as const;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_MAP;
  children: React.ReactNode;
  footer?: React.ReactNode;
  overflowHidden?: boolean;
}

export const Modal = ({ isOpen, onClose, title, icon, maxWidth = '4xl', children, footer, overflowHidden }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm text-slate-900">
      <div className={`bg-white rounded-3xl w-full ${MAX_WIDTH_MAP[maxWidth]} shadow-2xl border flex flex-col ${overflowHidden ? 'overflow-hidden max-h-[90vh]' : ''}`}>
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X />
          </button>
        </div>
        <div className={`flex-1 ${overflowHidden ? 'overflow-y-auto' : ''}`}>
          {children}
        </div>
        {footer && (
          <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
