import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { Sparkles, Heart, Send, BookOpen, Calendar, Wand2, X } from 'lucide-react';
import { motion } from './motion';

export const LoveAIAssistant: React.FC = () => {
  const { currentUser, partnerUser } = useAuth();
  const { memories, messages } = useUniverse();

  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateDateIdeas = () => {
    setLoading(true);
    setTimeout(() => {
      setAiResponse(
        `✨ **Custom Romantic Date Ideas for ${currentUser?.petName} & ${partnerUser?.petName}**:\n\n` +
        `1. **Midnight Stargazing & Hot Cocoa**: Set up cozy blankets on the balcony, play acoustic music, and gaze at constellations together.\n` +
        `2. **Surprise Cooking Duel**: Bake a cake together where each of you decorates one half with your favorite memories.\n` +
        `3. **Memory Lane Walk**: Revisit your first date cafe and recreate your very first photo together!`
      );
      setLoading(false);
    }, 1000);
  };

  const generateLovePoem = () => {
    setLoading(true);
    setTimeout(() => {
      setAiResponse(
        `📜 **A Dedicated Poem for ${partnerUser?.petName}**:\n\n` +
        `Across the miles and through the starry skies,\n` +
        `I find my home within your loving eyes.\n` +
        `From early morning smiles to quiet night,\n` +
        `You make our universe so pure and bright.\n\n` +
        `Forever yours, ${currentUser?.petName} ❤️`
      );
      setLoading(false);
    }, 1000);
  };

  const summarizeHighlights = () => {
    setLoading(true);
    setTimeout(() => {
      setAiResponse(
        `📊 **Recent Universe Highlights**:\n\n` +
        `• You have saved **${memories.length} precious memories** together in your shared gallery.\n` +
        `• Total **${messages.length} messages** exchanged with love and care.\n` +
        `• Relationship Milestone: Stronger and deeper love every single second! 💕`
      );
      setLoading(false);
    }, 1000);
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setAiResponse(
        `🤖 **Love AI Insight**:\n\n` +
        `For "${prompt}": Relationship expert tip — express your gratitude with small daily gestures, a surprise voice note, and quality uninterrupted time together.`
      );
      setPrompt('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-pink via-accent-purple to-accent-violet p-0.5 shadow-xl shadow-purple-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-space-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-accent-pink animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Love AI Assistant</h2>
            <p className="text-xs text-slate-300">Personalized relationship planner & romantic writer for {currentUser?.petName} & {partnerUser?.petName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={generateDateIdeas}
            className="p-4 rounded-2xl glass-card border border-pink-500/20 hover:border-pink-500/50 text-left hover:scale-105 transition-all space-y-1"
          >
            <Calendar className="w-5 h-5 text-pink-400" />
            <p className="font-bold text-xs text-white">Date Ideas</p>
            <p className="text-[10px] text-slate-400">Generate surprise date plans</p>
          </button>

          <button
            onClick={generateLovePoem}
            className="p-4 rounded-2xl glass-card border border-purple-500/20 hover:border-purple-500/50 text-left hover:scale-105 transition-all space-y-1"
          >
            <BookOpen className="w-5 h-5 text-purple-400" />
            <p className="font-bold text-xs text-white">Draft Love Poem</p>
            <p className="text-[10px] text-slate-400">Write custom romantic poetry</p>
          </button>

          <button
            onClick={summarizeHighlights}
            className="p-4 rounded-2xl glass-card border border-amber-500/20 hover:border-amber-500/50 text-left hover:scale-105 transition-all space-y-1"
          >
            <Wand2 className="w-5 h-5 text-amber-400" />
            <p className="font-bold text-xs text-white">Chat Highlights</p>
            <p className="text-[10px] text-slate-400">Summarize relationship milestone</p>
          </button>
        </div>

        {loading && (
          <div className="p-6 rounded-2xl glass-card border border-pink-500/30 text-center animate-pulse text-xs text-pink-300 font-bold">
            Love AI is composing your personalized message... ✨
          </div>
        )}

        {aiResponse && !loading && (
          <motion.div className="p-6 rounded-2xl glass-panel-glow border border-pink-400/40 text-slate-100 text-xs leading-relaxed whitespace-pre-wrap relative">
            <button
              onClick={() => setAiResponse(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {aiResponse}
          </motion.div>
        )}

        <form onSubmit={handleCustomQuery} className="flex gap-2 pt-4 border-t border-white/10">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Love AI e.g. 'What is a cute anniversary surprise gift for Humera?'"
            className="flex-1 px-4 py-3 rounded-2xl glass-input text-xs"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-lg shadow-pink-500/25"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
