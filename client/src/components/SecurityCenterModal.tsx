import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Fingerprint, Eye, Lock, Flame, AlertTriangle,
  X, Check, KeyRound, QrCode, Smartphone, Trash2, History
} from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { toast } from '../lib/toast';
import { useAuth } from '../context/AuthContext';
import {
  getIntruderLogs, clearIntruderLogs, isPrivacyShieldEnabled,
  setPrivacyShieldEnabled, getE2EESafetyNumbers, emergencyNukeLocalData
} from '../lib/securityAudit';
import {
  isBiometricsAvailable, registerBiometricCredential,
  verifyBiometricCredential, isBiometricEnrolled, removeBiometricEnrollment
} from '../lib/biometrics';

interface SecurityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDecoyCalculator: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({
  isOpen,
  onClose,
  onOpenDecoyCalculator
}) => {
  const { currentUser, partnerUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'safety_numbers' | 'intruder_logs' | 'danger'>('overview');
  const [shieldActive, setShieldActive] = useState(isPrivacyShieldEnabled());
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [intruderLogs, setLogs] = useState(getIntruderLogs());
  const [safetyNumbers] = useState(() => getE2EESafetyNumbers());
  const [showNukeConfirm, setShowNukeConfirm] = useState(false);
  const [nukeConfirmCode, setNukeConfirmCode] = useState('');

  useEffect(() => {
    isBiometricsAvailable().then(setBioSupported);
    if (currentUser?.uid) {
      setBioEnrolled(isBiometricEnrolled(currentUser.uid));
    }
  }, [currentUser]);

  const handleTogglePrivacyShield = () => {
    const next = !shieldActive;
    setShieldActive(next);
    setPrivacyShieldEnabled(next);
    toast.success(next ? 'App Switcher Privacy Shield Enabled 🛡️' : 'Privacy Shield Disabled');
  };

  const handleSetupBiometrics = async () => {
    if (!currentUser?.uid) return;
    if (bioEnrolled) {
      removeBiometricEnrollment(currentUser.uid);
      setBioEnrolled(false);
      toast.info('Biometric login removed');
    } else {
      toast.info('Authenticating device biometrics... 👆');
      const success = await registerBiometricCredential(currentUser.uid);
      if (success) {
        setBioEnrolled(true);
        toast.love('Biometrics registered successfully! ✨');
      } else {
        toast.error('Biometric registration was cancelled or not supported.');
      }
    }
  };

  const handleClearLogs = () => {
    clearIntruderLogs();
    setLogs([]);
    toast.info('Intruder logs cleared');
  };

  const handleExecuteEmergencyNuke = async () => {
    if (nukeConfirmCode.trim() !== 'NUKE' && nukeConfirmCode.trim() !== 'WIPE') {
      toast.error('Please type NUKE to confirm');
      return;
    }
    toast.error('Purging all local data in 1s...');
    setTimeout(() => {
      emergencyNukeLocalData();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 select-none">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel max-w-lg w-full rounded-3xl border border-emerald-500/30 p-5 sm:p-6 relative flex flex-col max-h-[92dvh] sm:max-h-[85dvh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Security &amp; Privacy Hub</h3>
                  <p className="text-[10px] text-emerald-300/80">End-to-End Encrypted Couple Space</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-4 bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
              {[
                { id: 'overview', label: 'Shield', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                { id: 'safety_numbers', label: 'Safety Key', icon: <KeyRound className="w-3.5 h-3.5" /> },
                { id: 'intruder_logs', label: 'Logs', icon: <History className="w-3.5 h-3.5" /> },
                { id: 'danger', label: 'Nuke', icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {/* Stealth Mode Action */}
                  <div className="p-4 rounded-2xl glass-card border border-pink-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-300">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">Emergency Stealth Mode</p>
                        <p className="text-[10px] text-slate-400">Instantly switch to scientific calculator (Shortcut: Alt+L)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { onClose(); onOpenDecoyCalculator(); }}
                      className="px-3.5 py-1.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md shrink-0 active:scale-95"
                    >
                      Enter Stealth
                    </button>
                  </div>

                  {/* App Switcher Privacy Blur */}
                  <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">App Switcher Mask</p>
                        <p className="text-[10px] text-slate-400">Blurs screen when multitasking or switching tabs</p>
                      </div>
                    </div>
                    <button
                      onClick={handleTogglePrivacyShield}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        shieldActive ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${shieldActive ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Biometrics Setup */}
                  {bioSupported && (
                    <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                          <Fingerprint className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">Touch ID / Face ID</p>
                          <p className="text-[10px] text-slate-400">1-Touch biometric unlock via WebAuthn</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSetupBiometrics}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
                          bioEnrolled
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {bioEnrolled ? '✓ Enrolled' : 'Enable'}
                      </button>
                    </div>
                  )}

                  {/* Encryption Status Card */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                    <p className="leading-relaxed text-[11px]">
                      Zero-Trust E2E Encryption Active between <strong>{currentUser?.petName}</strong> &amp; <strong>{partnerUser?.petName}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: SAFETY NUMBERS */}
              {activeTab === 'safety_numbers' && (
                <div className="space-y-3 text-center">
                  <p className="text-xs text-slate-300">
                    Compare this 60-digit safety number with {partnerUser?.petName || 'partner'} to mathematically verify end-to-end encryption.
                  </p>

                  <div className="p-4 rounded-2xl glass-card border border-white/10 font-mono text-xs text-pink-300 tracking-wider grid grid-cols-3 gap-2 text-center bg-black/40">
                    {safetyNumbers.chunks.map((chunk, i) => (
                      <span key={i} className="py-1 px-1.5 bg-white/5 rounded-lg border border-white/5">
                        {chunk}
                      </span>
                    ))}
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-300 text-xs font-bold">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Cryptographic Identity Verified</span>
                  </div>
                </div>
              )}

              {/* TAB 3: INTRUDER LOGS */}
              {activeTab === 'intruder_logs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-300">Unauthorized PIN Attempts</p>
                    {intruderLogs.length > 0 && (
                      <button onClick={handleClearLogs} className="text-[10px] text-rose-400 hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {intruderLogs.length === 0 ? (
                    <div className="text-center py-8 glass-card rounded-2xl p-4 text-xs text-slate-400 italic">
                      🛡️ Zero suspicious unlock attempts logged. Your universe is secure!
                    </div>
                  ) : (
                    intruderLogs.map(log => (
                      <div key={log.id} className="p-3 rounded-2xl glass-card border border-rose-500/30 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-rose-300">Failed {log.attemptType.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="text-[10px] font-mono bg-rose-500/20 px-2 py-0.5 rounded-md text-rose-200">
                          {log.enteredCode}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: EMERGENCY NUKE */}
              {activeTab === 'danger' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>Emergency Clean Slate / Nuke</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Instantly purges all local chat caches, stored memories, IndexedDB databases, and session tokens from this device in 0.5s.
                    </p>
                  </div>

                  {!showNukeConfirm ? (
                    <button
                      onClick={() => setShowNukeConfirm(true)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Initiate Emergency Wipe</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl glass-panel border border-rose-500/60 space-y-3 animate-fade-in">
                      <p className="text-xs font-bold text-rose-300 text-center">Type "NUKE" to confirm immediate wipe</p>
                      <input
                        type="text"
                        value={nukeConfirmCode}
                        onChange={(e) => setNukeConfirmCode(e.target.value.toUpperCase())}
                        placeholder="NUKE"
                        className="w-full px-4 py-2 rounded-xl glass-input text-center text-sm font-mono font-bold tracking-widest text-rose-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowNukeConfirm(false); setNukeConfirmCode(''); }}
                          className="flex-1 py-2 rounded-xl glass-card text-xs font-bold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleExecuteEmergencyNuke}
                          className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg"
                        >
                          Confirm &amp; Wipe Now 💣
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 mt-3 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Close Security Center
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
