import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AUTHORIZED_USERS } from '../lib/firebase';
import { Heart, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from '../components/motion';

export const AuthPage: React.FC = () => {
  const { login, loginError } = useAuth();
  const [selectedUser, setSelectedUser] = useState<'naveen' | 'humera'>('naveen');
  const [password, setPassword] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = isCustomMode 
      ? customEmail 
      : (selectedUser === 'naveen' ? AUTHORIZED_USERS[0].email : AUTHORIZED_USERS[1].email);
    
    login(emailToUse, password || '1234');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <motion.div className="w-full max-w-md glass-panel-glow p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-accent-rose via-accent-pink to-accent-purple p-0.5 shadow-xl shadow-pink-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Heart className="w-8 h-8 text-accent-pink animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            Our Private Universe
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Exclusively for Naveen & Humera ❤️
          </p>
        </div>

        {loginError && (
          <motion.div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{loginError}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {!isCustomMode ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Your Identity:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser('naveen')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedUser === 'naveen'
                      ? 'bg-accent-pink/20 border-accent-pink shadow-lg shadow-pink-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <img
                    src={AUTHORIZED_USERS[0].photoURL}
                    alt="Naveen"
                    className="w-10 h-10 rounded-full object-cover mb-2 border border-pink-400/50"
                  />
                  <p className="font-bold text-sm text-white">{AUTHORIZED_USERS[0].realName}</p>
                  <p className="text-[10px] text-pink-300 font-medium">{AUTHORIZED_USERS[0].petName}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUser('humera')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedUser === 'humera'
                      ? 'bg-accent-purple/20 border-accent-purple shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <img
                    src={AUTHORIZED_USERS[1].photoURL}
                    alt="Humera"
                    className="w-10 h-10 rounded-full object-cover mb-2 border border-purple-400/50"
                  />
                  <p className="font-bold text-sm text-white">{AUTHORIZED_USERS[1].realName}</p>
                  <p className="text-[10px] text-purple-300 font-medium">{AUTHORIZED_USERS[1].petName}</p>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Email Address (Security Boundary Check):
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Enter email e.g. someone@gmail.com"
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Universe Secret Passcode:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secret PIN (e.g. 7989 / 1402)"
                className="w-full px-4 py-3 pl-10 rounded-2xl glass-input text-sm"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-pink via-accent-purple to-accent-violet text-white font-bold text-sm shadow-xl shadow-pink-500/30 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enter Our Universe</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsCustomMode(!isCustomMode)}
            className="text-xs text-slate-400 hover:text-pink-300 underline transition-colors"
          >
            {isCustomMode ? '← Back to quick profile select' : 'Test unauthorized email boundary rejection'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
