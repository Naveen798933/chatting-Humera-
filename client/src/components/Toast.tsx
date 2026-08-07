import React, { useState, useEffect } from 'react';
import { toast as toastManager, Toast as ToastType } from '../lib/toast';
import { CheckCircle2, XCircle, Info, Heart, X } from 'lucide-react';

const ToastItem: React.FC<{ toast: ToastType; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mount animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const configs = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      bg: 'bg-emerald-500/15 border-emerald-500/40',
      text: 'text-emerald-200',
    },
    error: {
      icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
      bg: 'bg-rose-500/15 border-rose-500/40',
      text: 'text-rose-200',
    },
    love: {
      icon: <Heart className="w-4 h-4 text-pink-400 fill-current shrink-0 animate-heartbeat" />,
      bg: 'bg-pink-500/15 border-pink-500/40',
      text: 'text-pink-200',
    },
    info: {
      icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
      bg: 'bg-sky-500/15 border-sky-500/40',
      text: 'text-sky-200',
    },
  };

  const c = configs[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl
        ${c.bg} ${c.text}
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
      `}
      style={{ maxWidth: '340px', minWidth: '240px' }}
    >
      {c.icon}
      <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-current opacity-50 hover:opacity-100 transition-opacity ml-1 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const unsub = toastManager.subscribe(setToasts);
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 items-center pointer-events-none px-4">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem
            toast={t}
            onDismiss={() => toastManager.dismiss(t.id)}
          />
        </div>
      ))}
    </div>
  );
};
