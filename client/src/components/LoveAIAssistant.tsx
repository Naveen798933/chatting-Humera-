import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Sparkles, Heart, Send, BookOpen, Calendar, Wand2, X, Activity, Gift, Star, MessageCircle, Compass, HeartHandshake, Plane, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { toast } from '../lib/toast';

// ── Response templates ────────────────────────────────────────────────────────

const DATE_IDEAS = [
  (n: string, h: string) =>
    `💫 **Romantic Date Ideas for ${n} & ${h}**\n\n**1. Midnight Rooftop Stargazing**\nBring hot cocoa, cozy blankets and an acoustic playlist. Count constellations together and make wishes 🌠\n\n**2. Surprise Cooking Duel**\nEach decorate one half of a cake with your favourite memory. Eat the whole thing together 🎂\n\n**3. Memory Lane Walk**\nRevisit your first-date café, recreate your first photo together, then discover a new place nearby 📸\n\n**4. Sunset Picnic**\nSimple spread, your favourite songs, and nothing else but each other 🌅\n\n**5. Online Movie & Cinema Night**\nSame movie, shared playlist, video call — pretend you're sitting side by side 🎬`,
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
    `🎁 **Surprise Gift Ideas for ${h}**\n\n**Digital Gifts (Right Now)**\n• 🌟 Commission a custom digital portrait of you both\n• 🎵 Create a Spotify playlist titled "Every Song Reminds Me of You"\n• 📖 Write a short love story set in your favourite universe\n\n**Shipped Gifts (Special Moments)**\n• 💐 Preserved rose bouquet that lasts 3+ years\n• 📸 A printed photo album of your best moments together\n• 🧁 Have a surprise dessert delivered to their door\n• ✉️ A handwritten letter in a wax-sealed envelope\n\n**Experience Gifts (Plan Together)**\n• Stargazing camping trip\n• Cooking masterclass for two\n• Custom star map of the night you first met 🌌`,
];

const HOROSCOPE_COMPATIBILITY = (n: string, h: string) =>
  `🔮 **Cosmic Love Forecast & Synergy for ${n} & ${h}**\n\n✨ **Cosmic Alignment:** Venus and Jupiter align in your shared sector of deep emotional connection.\n\n💖 **Love Synergy Score:** 99.8% (Twin Flames in Harmony)\n\n🌟 **Today's Romantic Advice:**\nA spontaneous compliment or unexpected voice note will spark butterflies today. The universe favors deep conversations after sunset!\n\n🍀 **Lucky Elements:**\n• Lucky Hour: 11:11 PM\n• Shared Power Color: Rose Gold & Cosmic Indigo\n• Cosmic Sign: Infinite Love ♾️`;

const VACATION_PLANNER = (n: string, h: string) =>
  `✈️ **Dream Couple Itinerary for ${n} & ${h}**\n\n🏝️ **Destination: Maldives Ocean Villa Retreat**\n\n• **Day 1: Arrival & Sunset Cruise** — Private overwater villa check-in, champagne by the lagoon, dolphin watching cruise.\n• **Day 2: Undersea Dining & Coral Reef Snorkeling** — Explore bioluminescent waters together and dine beneath the sea.\n• **Day 3: Spa for Two & Starlit Beach Cinema** — Couples aromatherapy massage and private outdoor movie setup right on the sand!\n\n💡 *Tip: Put this on your shared bucket list in Love Vault!*`;

const SWEET_APOLOGY = (n: string, h: string) =>
  `💌 **Gentle & Loving Reconciliation Message**\n\n"Hey ${h}, I love you more than words can explain, and you mean the world to me. I'm truly sorry for any misunderstanding between us. My only goal is to make you smile and feel cherished. Let's talk whenever you're ready — I'm right here holding your hand in my heart."\n\n*— Yours always, ${n}* ❤️`;

const CONVERSATION_STARTERS = () =>
  `💬 **Deep Conversation Starters**\n\n1. If you could relive one day of our relationship, which would you choose and why?\n2. What's a dream you've never told anyone — not even me?\n3. What small thing do I do that makes you feel most loved?\n4. If we could live anywhere in the world, where would feel like home?\n5. What do you hope we're doing together 10 years from now?\n6. What's your favourite memory of us so far?\n7. What's something you want to learn, and can I learn it with you?\n\n*P.S. — Take turns answering. No rushing. Just honesty.* 💕`;

const CUSTOM_RESPONSES = [
  'Express your love through small, consistent daily gestures — a good morning text, an unprompted compliment, or simply saying "I was thinking about you today." These moments compound into a lifetime of trust.',
  'The strongest couples don\'t avoid conflict — they repair quickly and with kindness. After every argument, ask: "What do we want this to look like next time?" and commit to it.',
  'Quality time beats quantity every time. Even 20 minutes of fully present, phone-away, eyes-on-each-other connection is worth more than 3 hours of passive coexistence.',
  'Love languages matter. Reflect on whether you\'re giving your partner love the way *they* receive it — not just the way *you* prefer to give it.',
  'Surprise isn\'t about expense — it\'s about intentionality. A handwritten note slipped somewhere unexpected says "I was thinking of you" better than a thousand emojis.',
];

function getHealthScore(msgCount: number, memCount: number) {
  const base = Math.min(50, Math.floor(msgCount / 2));
  const bonus = Math.min(30, memCount * 5);
  const love = 20; // baseline love bonus 💕
  return Math.min(100, base + bonus + love);
}

interface LoveAIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

export const LoveAIAssistant: React.FC<LoveAIAssistantProps> = ({
  isOpen = true,
  onClose,
  isModal = true
}) => {
  const { currentUser, partnerUser } = useAuth();
  const { anniversaryDate, memories, messages, sendMessage } = useUniverse();

  const n = currentUser?.petName || currentUser?.displayName || 'User';
  const h = partnerUser?.petName || partnerUser?.displayName || 'Partner';

  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const startMs = new Date(anniversaryDate || '2024-02-14').getTime();
  const daysTogether = Math.max(0, Math.floor((Date.now() - (isNaN(startMs) ? new Date('2024-02-14').getTime() : startMs)) / (1000 * 60 * 60 * 24)));
  const healthScore = getHealthScore(messages.length, memories.length);

  const typingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const respond = (text: string, action: string) => {
    setLoading(true);
    setActiveAction(action);
    setAiResponse('');
    setCopied(false);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    
    setTimeout(() => {
      setLoading(false);
      let charIdx = 0;
      const step = Math.max(1, Math.floor(text.length / 40));
      typingIntervalRef.current = setInterval(() => {
        charIdx += step;
        if (charIdx >= text.length) {
          setAiResponse(text);
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        } else {
          setAiResponse(text.slice(0, charIdx));
        }
      }, 20);
    }, 400);
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const idx = Math.floor(Math.random() * CUSTOM_RESPONSES.length);
    respond(`🤖 **Cupid Love AI for "${prompt}"**\n\n${CUSTOM_RESPONSES[idx]}\n\n*Tip for ${n} & ${h}: Mutual appreciation is your superpower!* 💖`, 'custom');
    toast.love('Response generated! ✨');
    setPrompt('');
  };

  const handleSendToChat = () => {
    if (!aiResponse) return;
    sendMessage(aiResponse.replace(/\*\*/g, ''), 'text');
    toast.love('Sent to Chat! 💌');
  };

  const actions = [
    {
      id: 'dateIdeas',
      label: 'Date Planner',
      sub: 'Surprise date ideas',
      icon: <Calendar className="w-5 h-5 text-pink-400" />,
      color: 'border-pink-500/20 hover:border-pink-500/50',
      onClick: () => respond(DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)](n, h), 'dateIdeas'),
    },
    {
      id: 'poem',
      label: 'Love Poem',
      sub: 'Romantic poetry writer',
      icon: <BookOpen className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/20 hover:border-purple-500/50',
      onClick: () => respond(POEMS[Math.floor(Math.random() * POEMS.length)](n, h), 'poem'),
    },
    {
      id: 'horoscope',
      label: 'Love Forecast',
      sub: 'Cosmic synergy & advice',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/20 hover:border-amber-500/50',
      onClick: () => respond(HOROSCOPE_COMPATIBILITY(n, h), 'horoscope'),
    },
    {
      id: 'anniversary',
      label: 'Milestone Love',
      sub: `${daysTogether} days together`,
      icon: <Heart className="w-5 h-5 text-rose-400 fill-current" />,
      color: 'border-rose-500/20 hover:border-rose-500/50',
      onClick: () => respond(ANNIVERSARY_MESSAGES[0](n, h, daysTogether), 'anniversary'),
    },
    {
      id: 'vacation',
      label: 'Dream Trips',
      sub: 'Romantic getaway ideas',
      icon: <Plane className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/20 hover:border-teal-500/50',
      onClick: () => respond(VACATION_PLANNER(n, h), 'vacation'),
    },
    {
      id: 'gifts',
      label: 'Gift Ideas',
      sub: `Surprise gifts for ${h}`,
      icon: <Gift className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/20 hover:border-amber-500/50',
      onClick: () => respond(GIFT_IDEAS[0](h), 'gifts'),
    },
    {
      id: 'apology',
      label: 'Sweet Message',
      sub: 'Warm loving words',
      icon: <HeartHandshake className="w-5 h-5 text-pink-400" />,
      color: 'border-pink-500/20 hover:border-pink-500/50',
      onClick: () => respond(SWEET_APOLOGY(n, h), 'apology'),
    },
    {
      id: 'starters',
      label: 'Deep Talk',
      sub: 'Heart-to-heart topics',
      icon: <MessageCircle className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/20 hover:border-cyan-500/50',
      onClick: () => respond(CONVERSATION_STARTERS(), 'starters'),
    },
    {
      id: 'highlights',
      label: 'Universe Stats',
      sub: 'Your journey summary',
      icon: <Wand2 className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/20 hover:border-indigo-500/50',
      onClick: () => respond(
        `📊 **Universe Highlights for ${n} & ${h}**\n\n• **${memories.length}** precious memories saved together\n• **${messages.length}** messages exchanged with love\n• **${daysTogether}** beautiful days together\n• **${(daysTogether * 1440).toLocaleString()}** minutes of choosing each other\n\nRelationship milestone: You're building something irreplaceable 💕`,
        'highlights'
      ),
    },
  ];

  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-pink via-accent-purple to-accent-violet p-0.5 shadow-xl shadow-purple-500/30 flex-shrink-0">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-accent-pink animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Cupid Love AI Assistant</h2>
            <p className="text-xs text-slate-400 mt-1">
              Personalised planner &amp; romantic companion for <span className="text-pink-300 font-semibold">{n}</span> &amp; <span className="text-purple-300 font-semibold">{h}</span>
            </p>
          </div>
        </div>

        {/* Relationship Health Score */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Activity className="w-4 h-4 text-pink-400" />
              <span>Relationship Health &amp; Synergy</span>
            </div>
            <span className="text-sm font-extrabold text-pink-300">{healthScore}/100</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-purple-400 transition-all duration-1000 shadow-md shadow-pink-500/40"
              style={{ width: `${healthScore}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Based on {messages.length} messages, {memories.length} memories, and {daysTogether} days together.{' '}
            {healthScore >= 80 ? '🔥 Deeply bonded & thriving!' : healthScore >= 60 ? '💕 Growing beautifully' : '🌱 Keep nurturing!'}
          </p>
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={loading}
              className={`p-3.5 rounded-2xl glass-card border ${action.color} text-left hover:scale-[1.02] active:scale-95 transition-all space-y-1.5 disabled:opacity-50 min-h-[72px]`}
            >
              <div className="flex items-center justify-between">
                {action.icon}
                <span className="text-[9px] font-bold text-pink-300/80 uppercase">AI Prompt</span>
              </div>
              <p className="font-bold text-xs text-white truncate">{action.label}</p>
              <p className="text-[10px] text-slate-400 leading-snug truncate">{action.sub}</p>
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-5 rounded-2xl glass-card border border-pink-500/30 text-center space-y-2">
            <div className="flex justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-pink-300 font-semibold">Cupid Love AI is composing magic for you... ✨</p>
          </div>
        )}

        {/* AI Generated Response */}
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
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(aiResponse.replace(/\*\*/g, ''));
                  setCopied(true);
                  toast.success('Copied to clipboard! 📋');
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSendToChat}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Chat</span>
              </button>

              <button
                onClick={() => actions.find(a => a.id === activeAction)?.onClick()}
                className="px-3 py-1.5 rounded-xl text-xs text-pink-400 hover:text-pink-300 transition-colors ml-auto"
              >
                🔄 Regenerate
              </button>
            </div>
          </motion.div>
        )}

        {/* Custom Question Form */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <form onSubmit={handleCustomQuery} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask Cupid AI e.g. "How to make ${h} feel extra special today?"`}
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

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              `How to make ${h} feel extra loved today?`,
              `Plan a surprise weekend date for ${n} & ${h}`,
              `Write a sweet bedtime text for Jaanu`,
              `Tips for handling long distance connection`
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(chip);
                  const randomIdx = Math.floor(Math.random() * CUSTOM_RESPONSES.length);
                  respond(`🤖 **Cupid Love AI Insight for "${chip}"**\n\n${CUSTOM_RESPONSES[randomIdx]}`, 'custom');
                  toast.love('Insight generated! ✨');
                }}
                className="px-3 py-1.5 rounded-full glass-card text-[10px] text-pink-300 hover:text-white border border-pink-500/20 whitespace-nowrap hover:bg-white/10"
              >
                ✨ {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="w-full max-h-[90vh] overflow-y-auto my-auto scrollbar-none">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
