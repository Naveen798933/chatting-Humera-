import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useAuth } from '../context/AuthContext';
import { PrivacySettings } from '../types';
import { toast } from '../lib/toast';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, updateProfile } = useAuth();

  const [settings, setSettings] = useState<PrivacySettings>(() => {
    return (
      currentUser?.privacySettings || {
        whoCanMessage: 'everyone',
        whoCanAdd: 'everyone',
        showOnline: true,
        showReadReceipts: true,
        showLastSeen: true,
        whoCanSeeProfile: 'everyone'
      }
    );
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    await updateProfile({ privacySettings: settings });
    toast.success('Privacy settings saved! 🛡️');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto scrollbar-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">Privacy &amp; Security</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Who can message me */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Who can send me messages?</label>
              <select
                value={settings.whoCanMessage}
                onChange={(e) => setSettings(s => ({ ...s, whoCanMessage: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl glass-input"
              >
                <option value="everyone" className="bg-space-950">Everyone on platform</option>
                <option value="friends" className="bg-space-950">Only accepted friends</option>
                <option value="nobody" className="bg-space-950">Nobody (paused)</option>
              </select>
            </div>

            {/* Who can add me */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">Who can send friend requests?</label>
              <select
                value={settings.whoCanAdd}
                onChange={(e) => setSettings(s => ({ ...s, whoCanAdd: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl glass-input"
              >
                <option value="everyone" className="bg-space-950">Everyone</option>
                <option value="friends_of_friends" className="bg-space-950">Friends of friends</option>
                <option value="nobody" className="bg-space-950">Nobody</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Show Online Status</span>
                <input
                  type="checkbox"
                  checked={settings.showOnline}
                  onChange={(e) => setSettings(s => ({ ...s, showOnline: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Send Read Receipts (✓✓ Seen)</span>
                <input
                  type="checkbox"
                  checked={settings.showReadReceipts}
                  onChange={(e) => setSettings(s => ({ ...s, showReadReceipts: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Show Last Seen timestamp</span>
                <input
                  type="checkbox"
                  checked={settings.showLastSeen}
                  onChange={(e) => setSettings(s => ({ ...s, showLastSeen: e.target.checked }))}
                  className="w-4 h-4 accent-pink-500 rounded"
                />
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex gap-2">
            <button
              onClick={handleSave}
              className="btn-love flex-1 py-2.5 rounded-xl text-xs font-bold"
            >
              Save Settings
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-card text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
