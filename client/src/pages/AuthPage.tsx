import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Lock,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Fingerprint,
  Clock,
  User,
  AtSign,
  Mail,
  Check,
  UserPlus,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';
import { userApi } from '../lib/api';

const PARTICLES = [
  { char: '❤️', left: '5%', delay: '0s', duration: '12s', size: '1rem' },
  { char: '✨', left: '12%', delay: '1.5s', duration: '9s', size: '0.9rem' },
  { char: '💖', left: '20%', delay: '3s', duration: '14s', size: '1.1rem' },
  { char: '⭐', left: '28%', delay: '0.8s', duration: '11s', size: '0.85rem' },
  { char: '💕', left: '36%', delay: '2.2s', duration: '10s', size: '1rem' },
  { char: '🌸', left: '44%', delay: '4s', duration: '13s', size: '1rem' },
  { char: '✨', left: '52%', delay: '1s', duration: '9.5s', size: '0.9rem' },
  { char: '❤️', left: '60%', delay: '2.8s', duration: '12s', size: '0.95rem' },
  { char: '💫', left: '68%', delay: '0.3s', duration: '11s', size: '1.1rem' },
  { char: '🌙', left: '76%', delay: '1.8s', duration: '13s', size: '0.9rem' },
  { char: '💜', left: '82%', delay: '3.5s', duration: '10s', size: '1rem' },
  { char: '🌟', left: '88%', delay: '0.6s', duration: '12s', size: '0.95rem' },
  { char: '💞', left: '93%', delay: '2s', duration: '11s', size: '1rem' }
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
];

export const AuthPage: React.FC = () => {
  const { login, signup, loginError, authenticateBiometric } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('naveen');
  const [password, setPassword] = useState('7989');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);

  // Sign Up State
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupAvatar, setSignupAvatar] = useState(PRESET_AVATARS[0]);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Debounced username availability checker
  useEffect(() => {
    const u = signupUsername.trim().toLowerCase().replace(/^@/, '');
    if (u.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const isAvail = await userApi.isUsernameAvailable(u);
      setUsernameStatus(isAvail ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(timer);
  }, [signupUsername]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    await login(identifier, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    await signup(signupEmail, signupPassword, signupDisplayName, signupUsername, signupAvatar);
    setIsLoading(false);
  };

  const handleBiometric = async () => {
    setIsBioLoading(true);
    try {
      await authenticateBiometric();
    } catch (_) {}
    setIsBioLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-space-950">
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
            fontSize: p.size
          }}
        >
          {p.char}
        </span>
      ))}

      {/* ── Background Aura ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-pink/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* ── Main Auth Card ── */}
      <motion.div className="aurora-border w-full max-w-md glass-panel-aurora p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          {/* Brand Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-accent-pink to-accent-purple p-0.5 shadow-xl shadow-pink-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-pink-400 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            Our Universe
          </h1>
          <p className="text-xs text-pink-300/80 mt-1 font-medium">
            Secure, encrypted multi-user messaging platform
          </p>
        </div>

        {/* ── Auth Mode Switcher (Sign In vs Sign Up) ── */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signin'
                ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* ── Error Banner ── */}
        {loginError && (
          <motion.div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{loginError}</span>
          </motion.div>
        )}

        {/* ── SIGN IN FORM ── */}
        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username or Email
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. naveen or you@email.com"
                  className="w-full px-4 py-3 pl-10 rounded-2xl glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password / Secret Key
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl glass-input text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Logins */}
            <div className="pt-1">
              <p className="text-[10px] text-slate-400 mb-2 font-medium">Quick switch demo accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setIdentifier('naveen'); setPassword('7989'); }}
                  className={`p-2 rounded-xl border text-left text-xs flex items-center gap-2 ${
                    identifier.toLowerCase() === 'naveen'
                      ? 'bg-pink-500/20 border-pink-500 text-pink-200 font-bold'
                      : 'glass-card border-white/10 text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>@naveen</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier('humera'); setPassword('1402'); }}
                  className={`p-2 rounded-xl border text-left text-xs flex items-center gap-2 ${
                    identifier.toLowerCase() === 'humera'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-200 font-bold'
                      : 'glass-card border-white/10 text-slate-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>@humera</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-love w-full py-3.5 rounded-2xl text-xs font-bold mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBiometric}
              disabled={isBioLoading}
              className="btn-secondary w-full py-2.5 rounded-2xl text-xs"
            >
              {isBioLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4 text-pink-400" />
              )}
              <span>Biometric Unlock</span>
            </button>
          </form>
        )}

        {/* ── SIGN UP FORM ── */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signupDisplayName}
                  onChange={(e) => setSignupDisplayName(e.target.value)}
                  placeholder="e.g. Alex Carter"
                  className="w-full px-4 py-2.5 pl-10 rounded-2xl glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Unique Username</span>
                {usernameStatus === 'available' && (
                  <span className="text-emerald-400 text-[10px] lowercase flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> available
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-rose-400 text-[10px] lowercase">already taken</span>
                )}
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. alex_dev (letters, numbers, _)"
                  className={`w-full px-4 py-2.5 pl-10 rounded-2xl glass-input text-xs ${
                    usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-rose-500/50' : ''
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-4 py-2.5 pl-10 rounded-2xl glass-input text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create strong password"
                  className="w-full px-4 py-2.5 pl-10 pr-10 rounded-2xl glass-input text-xs"
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Choose Avatar
              </label>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSignupAvatar(av)}
                    className={`relative rounded-full p-0.5 transition-all ${
                      signupAvatar === av ? 'ring-2 ring-pink-400 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || usernameStatus === 'taken'}
              className="btn-love w-full py-3.5 rounded-2xl text-xs font-bold mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Join</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-slate-500 text-[10px]">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>Encrypted Multi-User Social Space</span>
        </div>
      </motion.div>
    </div>
  );
};
