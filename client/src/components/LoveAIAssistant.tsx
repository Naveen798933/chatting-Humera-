import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Sparkles, Heart, Send, BookOpen, Calendar, Wand2, X, Activity, Gift, Star, MessageCircle } from 'lucide-react';
import { motion } from './motion';
import { toast } from '../lib/toast';

// ── Response templates ────────────────────────────────────────────────────────

const DATE_IDEAS = [
  (n: string, h: string) =>
    `💫 **Romantic Date Ideas for ${n} & ${h}**\n\n**1. Midnight Rooftop Stargazing**\nBring hot cocoa, cozy blankets and acoustic playlist. Count constellations together and make wishes 🌠\n\n**2. Surprise Cooking Duel**\nEach decorate one half of a cake with your favourite memory. Eat the whole thing together 🎂\n\n**3. Memory Lane Walk**\nRevisit your first-date café, recreate your first photo together, then discover a new place nearby 📸\n\n**4. Sunset Picnic**\nSimple spread, your favourite songs, and nothing else but each other 🌅\n\n**5. Online Movie Night**\nSame movie, shared playlist, video call — pretend you're sitting side by side 🎬`,
  (n: string, h: string) =>
    `🌙 **Weekend Micro-Adventures for ${n} & ${h}**\n\n**1. Dawn Drive** — Leave at 5am for breakfast somewhere new. The early morning feels magical 🚗\n\n**2. Cook Something Impossible** — Pick the hardest recipe you can find and conquer it together 👨‍🍳\n\n**3. Letters to Future Selves** — Write each other a letter to open on your 5th anniversary 💌\n\n**4. Photo Walk** — Same city, new eyes. Photograph 10 things you love about where you live 📷`,
];

const POEMS = [
  (n: string, h: string) =>
    `📜 **A Poem for ${h} — from ${n}**\n\nAcross the miles and through the starry skies,\nI find my home within your loving eyes.\nFrom quiet mornings to the velvet night,\nYou make our small universe so pure and bright.\n\nEvery laugh we share is a galaxy born,\nEvery gentle word keeps me whole and warm.\nNo distance measures what my heart can feel —\nIn every moment, you are all that's real.\n\n*Forever yours, ${n}* ❤️`,
  (n: string, h: string) =>
    `🌸 **A Haiku Garden for ${h}**\n\n*Your laugh, a sunrise —*\n*Colours I had never seen*\n*Now I cannot live without.*\n\n*Distance counts in hours,*\n*But our love counts in heartbeats —*\n*Infinite. Yours. Mine.*\n\n*${n} thinks of you*\n*Every second you're away —*\n*Come home to my heart.*`,
];

const ANNIVERSARY_MESSAGES = [
  (n: string, h: string, days: number) =>
    `🎉 **${days} Days of Us — Anniversary Message**\n\n${days.toLocaleString()} days.\n${(days * 24).toLocaleString()} hours.\n${(days * 1440).toLocaleString()} minutes of choosing each other.\n\nEvery single one has been worth it.\n\n${h}, you changed the shape of my world. Before you, I had plans. After you, I have a life worth living.\n\nThank you for existing in the same universe as me. 💫\n\n*— ${n}, who still gets butterflies thinking about you* 🦋`,
];

const GIFT_IDEAS = [
  (h: string) =>
    `🎁 **Surprise Gift Ideas for ${h}**\n\n**Digital Gifts (Right Now)**\n• 🌟 Commission a custom digital portrait of you both\n• 🎵 Create a Spotify playlist titled "Every Song Reminds Me of You"\n• 📖 Write and PDF a short love story set in your favourite fictional universe\n\n**Shipped Gifts (Coming Soon)**\n• 💐 Preserved rose bouquet that lasts 3+ years\n• 📸 A printed photo book of your best moments together\n• 🧁 Have a surprise dessert delivered to her door\n• ✉️ A handwritten letter in a wax-sealed envelope\n\n**Experience Gifts (Plan Together)**\n• Stargazing camping trip\n• Cooking class for two\n• Custom star map of the night you first met 🌌`,
];

const CONVERSATION_STARTERS = () =>
  `💬 **Deep Conversation Starters**\n\n1. If you could relive one day of our relationship, which would you choose and why?\n2. What's a dream you've never told anyone — not even me?\n3. What small thing do I do that makes you feel most loved?\n4. If we could live anywhere in the world, where would feel like home?\n5. What do you hope we're doing together 10 years from now?\n6. What's your favourite memory of us so far?\n7. What's something you want to learn, and can I learn it with you?\n\n*P.S. — Take turns answering. No rushing. Just honesty.* 💕`;

const CUSTOM_RESPONSES = [
  'Express your love through small, consistent daily gestures — a good morning text, an unprompted compliment, or simply saying "I was thinking about you today." These moments compound.',
  'The strongest couples don\'t avoid conflict — they repair quickly and with kindness. After every argument, ask: "What do we want this to look like next time?" and commit to it.',
  'Quality time beats quantity every time. Even 20 minutes of fully present, phone-away, eyes-on-each-other connection is worth more than 3 hours of passive coexistence.',
  'Love languages matter. Reflect on whether you\'re giving your partner love the way *they* receive it — not just the way *you* prefer to give it.',
  'Surprise isn\'t about expense — it\'s about intentionality. A handwritten note slipped somewhere unexpected says "I was thinking of you" better than a thousand emojis.',
];

// ── Health Score ──────────────────────────────────────────────────────────────

function getHealthScore(msgCount: number, memCount: number) {
  const base = Math.min(50, Math.floor(msgCount / 2));
  const bonus = Math.min(30, memCount * 5);
  const love = 20; // baseline love bonus 💕
  return Math.min(100, base + bonus + love);
}

// ── Component ─────────────────────────────────────────────────────────────────

export const LoveAIAssistant: React.FC = () => {
  const { currentUser, partnerUser } = useAuth();
  const { memories, messages } = useUniverse();

  const n = currentUser?.petName ?? 'You';
  const h = partnerUser?.petName ?? 'Partner';

  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const daysTogether = Math.floor(
    (Date.now() - new Date('2024-02-14').getTime()) / (1000 * 60 * 60 * 24)
  );
  const healthScore = getHealthScore(messages.length, memories.length);

  const respond = (text: string, action: string) => {
    setLoading(true);
    setActiveAction(action);
    setTimeout(() => {
      setAiResponse(text);
      setLoading(false);
    }, 900);
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const idx = Math.floor(Math.random() * CUSTOM_RESPONSES.length);
    respond(`🤖 **Love AI Insight for "${prompt}"**\n\n${CUSTOM_RESPONSES[idx]}`, 'custom');
    toast.love('Response generated! ✨');
    setPrompt('');
  };

  const actions = [
    {
      id: 'dateIdeas',
      label: 'Date Ideas',
      sub: 'Surprise plans for you two',
      icon: <Calendar className="w-5 h-5 text-pink-400" />,
      color: 'border-pink-500/20 hover:border-pink-500/50',
      onClick: () => respond(DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)](n, h), 'dateIdeas'),
    },
    {
      id: 'poem',
      label: 'Love Poem',
      sub: 'Write romantic poetry',
      icon: <BookOpen className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/20 hover:border-purple-500/50',
      onClick: () => respond(POEMS[Math.floor(Math.random() * POEMS.length)](n, h), 'poem'),
    },
    {
      id: 'anniversary',
      label: 'Anniversary',
      sub: 'Celebrate your milestone',
      icon: <Heart className="w-5 h-5 text-rose-400 fill-current" />,
      color: 'border-rose-500/20 hover:border-rose-500/50',
      onClick: () => respond(ANNIVERSARY_MESSAGES[0](n, h, daysTogether), 'anniversary'),
    },
    {
      id: 'gifts',
      label: 'Gift Ideas',
      sub: `Surprise ideas for ${h}`,
      icon: <Gift className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/20 hover:border-amber-500/50',
      onClick: () => respond(GIFT_IDEAS[0](h), 'gifts'),
    },
    {
      id: 'starters',
      label: 'Deep Talk',
      sub: 'Conversation starters',
      icon: <MessageCircle className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/20 hover:border-cyan-500/50',
      onClick: () => respond(CONVERSATION_STARTERS(), 'starters'),
    },
    {
      id: 'highlights',
      label: 'Highlights',
      sub: 'Your universe stats',
      icon: <Wand2 className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/20 hover:border-indigo-500/50',
      onClick: () => respond(
        `📊 **Universe Highlights for ${n} & ${h}**\n\n• **${memories.length}** precious memories saved together\n• **${messages.length}** messages exchanged with love\n• **${daysTogether}** beautiful days together\n• **${(daysTogether * 1440).toLocaleString()}** minutes of choosing each other\n\nRelationship milestone: You're building something irreplaceable 💕`,
        'highlights'
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-pink via-accent-purple to-accent-violet p-0.5 shadow-xl shadow-purple-500/30 flex-shrink-0">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-accent-pink animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Love AI Assistant</h2>
            <p className="text-xs text-slate-400 mt-1">
              Personalised planner &amp; romantic writer for <span className="text-pink-300 font-semibold">{n}</span> &amp; <span className="text-purple-300 font-semibold">{h}</span>
            </p>
          </div>
        </div>

        {/* Relationship Health Score */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Activity className="w-4 h-4 text-pink-400" />
              <span>Relationship Health Score</span>
            </div>
            <span className="text-sm font-extrabold text-pink-300">{healthScore}/100</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-purple-400 transition-all duration-1000"
              style={{ width: `${healthScore}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Based on messages, memories, and time together.{' '}
            {healthScore >= 80 ? '🔥 Thriving!' : healthScore >= 60 ? '💕 Growing beautifully' : '🌱 Keep nurturing!'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={loading}
              className={`p-3.5 rounded-2xl glass-card border ${action.color} text-left hover:scale-[1.02] active:scale-95 transition-all space-y-1.5 disabled:opacity-50`}
            >
              {action.icon}
              <p className="font-bold text-xs text-white">{action.label}</p>
              <p className="text-[10px] text-slate-400 leading-snug">{action.sub}</p>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-5 rounded-2xl glass-card border border-pink-500/30 text-center space-y-2">
            <div className="flex justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-pink-300 font-semibold">Love AI is composing... ✨</p>
          </div>
        )}

        {/* Response */}
        {aiResponse && !loading && (
          <motion.div className="p-5 sm:p-6 rounded-2xl glass-panel-glow border border-pink-400/30 relative">
            <button
              onClick={() => setAiResponse(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap pr-6">
              {aiResponse.split('\n').map((line, i) => {
                // Bold **text** formatting
                const parts = line.split(/\*\*(.+?)\*\*/g);
                return (
                  <span key={i}>
                    {parts.map((part, j) =>
                      j % 2 === 1
                        ? <strong key={j} className="text-white font-bold">{part}</strong>
                        : <span key={j}>{part}</span>
                    )}
                    {i < aiResponse.split('\n').length - 1 && <br />}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(aiResponse.replace(/\*\*/g, ''));
                  toast.success('Copied to clipboard!');
                }}
                className="text-[10px] text-slate-400 hover:text-white transition-colors"
              >
                📋 Copy
              </button>
              <button
                onClick={() => actions.find(a => a.id === activeAction)?.onClick()}
                className="text-[10px] text-pink-400 hover:text-pink-300 transition-colors"
              >
                🔄 Regenerate
              </button>
            </div>
          </motion.div>
        )}

        {/* Custom Query */}
        <form onSubmit={handleCustomQuery} className="flex gap-2 pt-2 border-t border-white/10">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask Love AI e.g. "How to make ${h} feel extra special this week?"`}
            className="flex-1 px-4 py-3 rounded-2xl glass-input text-xs"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
