import React from 'react';
import { Globe, RefreshCcw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { CountdownTimer } from '../CountdownTimer';
import type { TunnelInfo } from '@/types';

interface TunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tunnelInfo: TunnelInfo;
  tunnelDuration: number;
  setTunnelDuration: (d: number) => void;
  onStart: () => void;
  onStop: () => void;
}

export const TunnelModal = ({ isOpen, onClose, tunnelInfo, tunnelDuration, setTunnelDuration, onStart, onStop }: TunnelModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Share Publicly"
    icon={<Globe className="w-5 h-5 text-indigo-600" />}
    maxWidth="md"
  >
    <div className="p-6 space-y-4">
      {tunnelInfo.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{tunnelInfo.error}</p>
      )}

      {!tunnelInfo.isRunning && !tunnelInfo.isLoading && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Expose this app publicly via a secure tunnel using{' '}
            <span className="font-mono text-xs bg-slate-100 px-1 rounded">localhost.run</span>.
          </p>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Auto-close after</label>
            <select
              value={tunnelDuration}
              onChange={e => setTunnelDuration(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>Indefinite</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={240}>4 hours</option>
            </select>
          </div>
          <button
            onClick={onStart}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Start Tunnel
          </button>
        </div>
      )}

      {tunnelInfo.isLoading && (
        <div className="text-center py-6 space-y-2">
          <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Establishing tunnel…</p>
        </div>
      )}

      {tunnelInfo.isRunning && tunnelInfo.url && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 border">
            <p className="text-xs text-slate-500 font-medium mb-1">Public URL</p>
            <a
              href={tunnelInfo.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-indigo-600 font-mono break-all hover:underline"
            >
              {tunnelInfo.url}
            </a>
          </div>
          {tunnelInfo.qrCode && (
            <div className="flex justify-center">
              <img src={tunnelInfo.qrCode} alt="QR Code" className="w-40 h-40 rounded-lg border" />
            </div>
          )}
          {tunnelInfo.expiresAt ? (
            <p className="text-xs text-center text-slate-500">
              Closes in <CountdownTimer expiresAt={tunnelInfo.expiresAt} onExpire={onStop} />
            </p>
          ) : (
            <p className="text-xs text-center text-slate-400">Running indefinitely</p>
          )}
          <button
            onClick={onStop}
            className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-all"
          >
            Stop Tunnel
          </button>
        </div>
      )}
    </div>
  </Modal>
);
