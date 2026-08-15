import React, { useState } from 'react';
import { Smile, Image, X, Heart, Sparkles } from 'lucide-react';

interface EmojiGifPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker?: (url: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  'Romantic Love': ['❤️', '💖', '🥰', '😍', '💋', '🥹', '💕', '💗', '💓', '💞', '💌', '🌹', '✨', '🔥', '😘', '💍', '💐', '👰', '🤵', '💑'],
  'Cute & Fun': ['😂', '😇', '😴', '🤤', '🤫', '🤪', '🥳', '😎', '🤗', '🥺', '🙈', '🙊', '😻', '🦄', '🎀', '🍭', '🍓', '🧸', '🐣', '🌸'],
  'Couple Life': ['☕', '🍷', '🍕', '🍰', '🍿', '🎬', '✈️', '🏖️', '🌌', '🌙', '🎁', '🏖️', '📸', '🎧', '🎮', '🚗', '⛺', '🏡', '🛁', '🥞']
};

const STICKERS = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'
];

export const EmojiGifPicker: React.FC<EmojiGifPickerProps> = ({ onSelectEmoji, onSelectSticker, onClose }) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'stickers'>('emoji');

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-space-900/98 backdrop-blur-2xl border border-pink-500/30 p-3 sm:p-4 rounded-3xl shadow-2xl space-y-3 w-[min(22rem,92vw)] max-w-[calc(100vw-20px)]"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('emoji')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'emoji' ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'stickers' ? 'bg-gradient-to-r from-accent-purple to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>
        </div>

        <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'emoji' ? (
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-none">
          {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
            <div key={cat} className="space-y-1">
              <p className="text-[10px] uppercase font-extrabold text-pink-300/80 px-1">{cat}</p>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5">
                {list.map((em) => (
                  <button
                    key={em}
                    onClick={() => onSelectEmoji(em)}
                    className="text-xl h-10 w-full rounded-xl hover:bg-white/15 active:scale-125 transition-transform flex items-center justify-center min-h-[40px] touch-manipulation"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-none">
          {STICKERS.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="Sticker"
              onClick={() => onSelectSticker?.(url)}
              className="w-full h-24 object-cover rounded-2xl border border-white/10 hover:border-pink-400 cursor-pointer active:scale-95 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80"><rect fill="%23110a26" width="100" height="80"/><text fill="%23ff70a6" font-size="12" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">❤️ Sticker</text></svg>';
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
