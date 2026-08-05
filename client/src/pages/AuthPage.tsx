import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AUTHORIZED_USERS } from '../lib/constants';
import { Heart, Lock, AlertCircle, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from '../components/motion';

export const AuthPage: React.FC = () => {
  const { login, loginError } = useAuth();
  const [selectedUser, setSelectedUser] = useState<'naveen' | 'humera'>('naveen');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const emailToUse = isCustomMode
      ? customEmail
      : (selectedUser === 'naveen' ? AUTHORIZED_USERS[0].email : AUTHORIZED_USERS[1].email);

    setIsLoading(true);
    // Small delay to show the loading state (better UX)
    await new Promise(r => setTimeout(r, 600));
    login(emailToUse, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cosmic background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-pink/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-violet/5 rounded-full blur-3xl" />
      </div>

      <motion.div className="w-full max-w-md glass-panel-glow p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden z-10">
        {/* Inner glow border */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-pink/5 via-transparent to-accent-purple/5 pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-2xl shadow-pink-500/40 flex items-center justify-center">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Heart className="w-9 h-9 text-accent-pink animate-heartbeat fill-current" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            Our Private Universe
          </h2>
          <p className="text-xs text-pink-300/80 mt-2 font-medium tracking-wide">
            ✨ Exclusively for Naveen &amp; Humera ✨
          </p>
        </div>

        {loginError && (
          <motion.div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{loginError}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          {/* User selector */}
          {!isCustomMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                Who are you?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser('naveen')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                    selectedUser === 'naveen'
                      ? 'bg-accent-pink/20 border-accent-pink shadow-lg shadow-pink-500/25 scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <img
                    src={AUTHORIZED_USERS[0].photoURL}
                    alt="Naveen"
                    className="w-12 h-12 rounded-full object-cover mb-3 border-2 border-pink-400/50 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Naveen&background=ff70a6&color=fff`;
                    }}
                  />
                  <p className="font-bold text-sm text-white">{AUTHORIZED_USERS[0].realName}</p>
                  <p className="text-[10px] text-pink-300 font-medium mt-0.5">{AUTHORIZED_USERS[0].petName}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUser('humera')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                    selectedUser === 'humera'
                      ? 'bg-accent-purple/20 border-accent-purple shadow-lg shadow-purple-500/25 scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8'
                  }`}
                >
                  <img
                    src={AUTHORIZED_USERS[1].photoURL}
                    alt="Humera"
                    className="w-12 h-12 rounded-full object-cover mb-3 border-2 border-purple-400/50 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Humera&background=a855f7&color=fff`;
                    }}
                  />
                  <p className="font-bold text-sm text-white">{AUTHORIZED_USERS[1].realName}</p>
                  <p className="text-[10px] text-purple-300 font-medium mt-0.5">{AUTHORIZED_USERS[1].petName}</p>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                required
              />
            </div>
          )}

          {/* Password field — no hints for security */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Universe Secret Key
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your secret key"
                className="w-full px-4 py-3.5 pl-10 pr-12 rounded-2xl glass-input text-sm"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-pink-300 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-pink via-accent-purple to-accent-violet text-white font-bold text-sm shadow-2xl shadow-pink-500/30 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Entering Universe...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Enter Our Universe</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-xs text-slate-500 hover:text-pink-300 underline transition-colors"
          >
            {isCustomMode ? '← Back to profile select' : 'Use custom email'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
