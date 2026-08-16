import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AUTHORIZED_USERS } from '../lib/constants';
import { Heart, Lock, AlertCircle, Sparkles, Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { motion } from '../components/motion';

const PARTICLES = [
  { char: '❤️', left: '8%',  delay: '0s',   duration: '12s', size: '1rem'  },
  { char: '✨', left: '18%', delay: '1.5s', duration: '9s',  size: '0.9rem' },
  { char: '💖', left: '28%', delay: '3s',   duration: '14s', size: '1.1rem' },
  { char: '⭐', left: '40%', delay: '0.8s', duration: '11s', size: '0.85rem'},
  { char: '💕', left: '52%', delay: '2.2s', duration: '10s', size: '1rem'  },
  { char: '🌸', left: '63%', delay: '4s',   duration: '13s', size: '1rem'  },
  { char: '✨', left: '74%', delay: '1s',   duration: '9.5s','size': '0.9rem'},
  { char: '❤️', left: '84%', delay: '2.8s', duration: '12s', size: '0.95rem'},
  { char: '💫', left: '92%', delay: '0.3s', duration: '11s', size: '1.1rem' },
];

export const AuthPage: React.FC = () => {
  const { login, loginError } = useAuth();
  const [selectedUser, setSelectedUser] = useState<'naveen' | 'humera'>('naveen');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSubtitleVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const emailToUse = isCustomMode
      ? customEmail
      : (selectedUser === 'naveen' ? AUTHORIZED_USERS[0].email : AUTHORIZED_USERS[1].email);

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    login(emailToUse, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Floating CSS Particles ── */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="auth-particle select-none"
          style={{
            left: p.left,
            bottom: '-20px',
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.size,
          }}
        >
          {p.char}
        </span>
      ))}

      {/* ── Cosmic Background Orbs ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent-pink/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-violet/4 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* ── Main Card ── */}
      <motion.div className="aurora-border w-full max-w-md glass-panel-aurora p-8 rounded-3xl shadow-2xl relative overflow-hidden z-10">
        {/* Inner gradient overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-pink/5 via-transparent to-accent-purple/5 pointer-events-none z-0" />

        {/* ── Header ── */}
        <div className="text-center mb-8 relative z-10">
          {/* Logo with spinning rings */}
          <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
            <div className="sparkle-ring" />
            <div className="sparkle-ring-inner" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-2xl shadow-pink-500/40 flex items-center justify-center relative z-10">
              <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
                <Heart className="w-10 h-10 text-accent-pink animate-heartbeat fill-current" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            Our Private Universe
          </h2>

          <div
            className={`overflow-hidden transition-all duration-700 ${subtitleVisible ? 'max-h-10 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
          >
            <p className="text-xs text-pink-300/80 font-medium tracking-wider">
              ✨ A secret galaxy built for two ✨
            </p>
          </div>
        </div>

        {/* ── Error Alert ── */}
        {loginError && (
          <motion.div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{loginError}</span>
          </motion.div>
        )}

        {/* ── Login Form ── */}
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">

          {/* User selector */}
          {!isCustomMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                Who are you?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Naveen */}
                <button
                  type="button"
                  onClick={() => setSelectedUser('naveen')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                    selectedUser === 'naveen'
                      ? 'bg-accent-pink/20 border-accent-pink scale-[1.03] glow-border-pink'
                      : 'bg-white/5 border-white/10 hover:border-pink-400/30 hover:bg-white/8'
                  }`}
                >
                  {selectedUser === 'naveen' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent pointer-events-none rounded-2xl" />
                  )}
                  <div className="relative">
                    <img
                      src={AUTHORIZED_USERS[0].photoURL}
                      alt="Naveen"
                      className={`w-12 h-12 rounded-full object-cover mb-3 border-2 shadow-md transition-all ${
                        selectedUser === 'naveen' ? 'border-pink-400 shadow-pink-500/40' : 'border-pink-400/30'
                      }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Naveen&background=ff70a6&color=fff`;
                      }}
                    />
                    <p className="font-bold text-sm text-white">{AUTHORIZED_USERS[0].realName}</p>
                    <p className="text-[10px] text-pink-300 font-medium mt-0.5">{AUTHORIZED_USERS[0].petName}</p>
                    {selectedUser === 'naveen' && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-space-950" />
                    )}
                  </div>
                </button>

                {/* Humera */}
                <button
                  type="button"
                  onClick={() => setSelectedUser('humera')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                    selectedUser === 'humera'
                      ? 'bg-accent-purple/20 border-accent-purple scale-[1.03] glow-border-purple'
                      : 'bg-white/5 border-white/10 hover:border-purple-400/30 hover:bg-white/8'
                  }`}
                >
                  {selectedUser === 'humera' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none rounded-2xl" />
                  )}
                  <div className="relative">
                    <img
                      src={AUTHORIZED_USERS[1].photoURL}
                      alt="Humera"
                      className={`w-12 h-12 rounded-full object-cover mb-3 border-2 shadow-md transition-all ${
                        selectedUser === 'humera' ? 'border-purple-400 shadow-purple-500/40' : 'border-purple-400/30'
                      }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Humera&background=a855f7&color=fff`;
                      }}
                    />
                    <p className="font-bold text-sm text-white">{AUTHORIZED_USERS[1].realName}</p>
                    <p className="text-[10px] text-purple-300 font-medium mt-0.5">{AUTHORIZED_USERS[1].petName}</p>
                    {selectedUser === 'humera' && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-space-950" />
                    )}
                  </div>
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

          {/* Password field */}
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-love w-full py-4 rounded-2xl text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 disabled:animate-none"
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

        {/* ── Custom Email Toggle ── */}
        <div className="mt-5 text-center relative z-10">
          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-xs text-slate-500 hover:text-pink-300 underline transition-colors"
          >
            {isCustomMode ? '← Back to profile select' : 'Use custom email'}
          </button>
        </div>

        {/* ── Encrypted Badge ── */}
        <div className="mt-5 flex items-center justify-center gap-1.5 relative z-10">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
            Private & End-to-End Encrypted
          </span>
        </div>
      </motion.div>
    </div>
  );
};
