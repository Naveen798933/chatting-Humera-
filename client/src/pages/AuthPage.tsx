import React, { useState, useEffect, useRef } from 'react';
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
  User,
  AtSign,
  Mail,
  Check,
  UserPlus,
  LogIn,
  Camera,
  MapPin,
  FileText,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';
import { userApi } from '../lib/api';
import { toast } from '../lib/toast';

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
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
];

export const AuthPage: React.FC = () => {
  const { login, signup, loginError, authenticateBiometric } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [identifier, setIdentifier] = useState('naveen');
  const [password, setPassword] = useState('7989');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);

  // Sign Up / Register State
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupBio, setSignupBio] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupAvatar, setSignupAvatar] = useState(PRESET_AVATARS[0]);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

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
    }, 350);
    return () => clearTimeout(timer);
  }, [signupUsername]);

  // Compute password strength
  const getPasswordStrength = (pass: string): { label: string; color: string; percent: number } => {
    if (!pass) return { label: 'Empty', color: 'bg-slate-600', percent: 0 };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { label: 'Weak', color: 'bg-rose-500', percent: 25 };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', percent: 50 };
    if (score === 3) return { label: 'Good', color: 'bg-sky-400', percent: 75 };
    return { label: 'Strong', color: 'bg-emerald-400', percent: 100 };
  };

  const strength = getPasswordStrength(signupPassword);

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setSignupAvatar(compressed);
          toast.love('Custom profile photo ready! ✨');
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    if (usernameStatus === 'taken') {
      toast.error('Please choose a different username');
      return;
    }
    setIsLoading(true);
    const result = await signup(
      signupEmail,
      signupPassword,
      signupDisplayName,
      signupUsername,
      signupAvatar,
      signupBio,
      signupCity
    );
    setIsLoading(false);
    if (result.success) {
      toast.love('Welcome to Our Universe! 🎉');
    }
  };

  const handleBiometric = async () => {
    setIsBioLoading(true);
    try {
      await authenticateBiometric();
    } catch (_) {}
    setIsBioLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 relative overflow-hidden bg-space-950">
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

      {/* ── Background Cosmic Aura ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent-pink/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* ── Main Auth Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="aurora-border w-full max-w-lg glass-panel-aurora p-4 xs:p-5 sm:p-8 rounded-3xl shadow-2xl relative z-10 my-2 xs:my-4 max-h-[96dvh] overflow-y-auto scrollbar-none"
      >
        <div className="text-center mb-6">
          {/* Brand Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-accent-pink via-purple-500 to-indigo-500 p-0.5 shadow-xl shadow-pink-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-pink-400 animate-heartbeat" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-200 via-purple-100 to-indigo-200 bg-clip-text text-transparent">
            Our Universe
          </h1>
          <p className="text-xs text-pink-300/80 mt-1 font-medium">
            {authMode === 'signin' ? 'Sign in to access your private encrypted space' : 'Create an account & connect instantly with friends'}
          </p>
        </div>

        {/* ── Auth Mode Switcher Tabs ── */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signin'
                ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register User</span>
          </button>
        </div>

        {/* ── Error Banner ── */}
        {loginError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-lg"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{loginError}</span>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ─── SIGN IN SECTION ─────────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
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
                  className="w-full px-4 py-3 pl-10 rounded-2xl glass-input text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Password / Secret Key</span>
                <span className="text-[10px] text-pink-300/80 font-normal">Decoy PIN: 0000</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-2xl glass-input text-xs font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-pink-500 bg-space-900 border-white/20"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-pink-300 hover:text-pink-200 font-semibold text-[11px] transition-colors"
              >
                Need an account?
              </button>
            </div>

            {/* Quick Demo One-Click Logins */}
            <div className="pt-2">
              <p className="text-[10px] text-slate-400 mb-2 font-medium">Quick switch demo accounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setIdentifier('naveen'); setPassword('7989'); }}
                  className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                    identifier.toLowerCase() === 'naveen'
                      ? 'bg-pink-500/25 border-pink-500/80 text-pink-200 font-bold shadow-md shadow-pink-500/20'
                      : 'glass-card border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    <span className="truncate">@naveen</span>
                  </div>
                  <span className="text-[9px] text-pink-400/80 font-mono">7989</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIdentifier('humera'); setPassword('1402'); }}
                  className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                    identifier.toLowerCase() === 'humera'
                      ? 'bg-purple-500/25 border-purple-500/80 text-purple-200 font-bold shadow-md shadow-purple-500/20'
                      : 'glass-card border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="truncate">@humera</span>
                  </div>
                  <span className="text-[9px] text-purple-400/80 font-mono">1402</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-love w-full py-3.5 rounded-2xl text-xs font-bold mt-3 shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Universe</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBiometric}
              disabled={isBioLoading}
              className="btn-secondary w-full py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2"
            >
              {isBioLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4 text-pink-400" />
              )}
              <span>Biometric / Face Unlock</span>
            </button>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ─── REGISTER / SIGN UP SECTION ───────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {/* Display Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Full / Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signupDisplayName}
                  onChange={(e) => setSignupDisplayName(e.target.value)}
                  placeholder="e.g. Alex Carter"
                  className="w-full px-4 py-2.5 pl-10 rounded-2xl glass-input text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Unique Username</span>
                {usernameStatus === 'available' && (
                  <span className="text-emerald-400 text-[10px] lowercase flex items-center gap-0.5 font-bold">
                    <Check className="w-3 h-3" /> available
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-rose-400 text-[10px] lowercase font-bold">already taken</span>
                )}
                {usernameStatus === 'checking' && (
                  <span className="text-amber-400 text-[10px] lowercase font-bold">checking...</span>
                )}
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. alex_carter (letters, numbers, _)"
                  className={`w-full px-4 py-2.5 pl-10 rounded-2xl glass-input text-xs font-medium ${
                    usernameStatus === 'available' ? 'border-emerald-500/50' : usernameStatus === 'taken' ? 'border-rose-500/50' : ''
                  }`}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
            </div>

            {/* Email */}
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
                  className="w-full px-4 py-2.5 pl-10 rounded-2xl glass-input text-xs font-medium"
                  required
                />
              </div>
            </div>

            {/* Password with Strength Indicator */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Password</span>
                {signupPassword && (
                  <span className={`text-[10px] font-bold ${
                    strength.label === 'Strong' ? 'text-emerald-400' : strength.label === 'Good' ? 'text-sky-400' : strength.label === 'Fair' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {strength.label}
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create secure password"
                  className="w-full px-4 py-2.5 pl-10 pr-10 rounded-2xl glass-input text-xs font-medium"
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

              {/* Password strength bar */}
              {signupPassword && (
                <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.percent}%` }}
                  />
                </div>
              )}
            </div>

            {/* Optional Bio & Location */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Location (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupCity}
                    onChange={(e) => setSignupCity(e.target.value)}
                    placeholder="e.g. New York"
                    className="w-full px-3 py-2 pl-8 rounded-xl glass-input text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Bio (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupBio}
                    onChange={(e) => setSignupBio(e.target.value)}
                    placeholder="Short status..."
                    className="w-full px-3 py-2 pl-8 rounded-xl glass-input text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Profile Avatar Selection & Custom Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Profile Avatar
                </label>
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="text-[10px] text-pink-300 hover:text-pink-200 font-bold flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  <span>Upload Photo</span>
                </button>
              </div>

              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomAvatarUpload}
              />

              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {/* Active Selected Avatar preview */}
                <div className="relative p-0.5 rounded-full ring-2 ring-pink-400 shrink-0">
                  <img
                    src={signupAvatar}
                    alt="selected avatar"
                    className="w-10 h-10 rounded-full object-cover shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold">
                    ✓
                  </div>
                </div>

                <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-0.5" />

                {PRESET_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSignupAvatar(av)}
                    className={`relative rounded-full p-0.5 transition-all shrink-0 ${
                      signupAvatar === av ? 'ring-2 ring-pink-400 scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={av} alt="avatar option" className="w-9 h-9 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || usernameStatus === 'taken'}
              className="btn-love w-full py-3.5 rounded-2xl text-xs font-bold mt-3 shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register &amp; Enter Universe</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Already have an account? <span className="text-pink-300 font-bold">Sign In</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-center gap-2 text-slate-500 text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Multi-User Real-Time Platform</span>
        </div>
      </motion.div>
    </div>
  );
};
