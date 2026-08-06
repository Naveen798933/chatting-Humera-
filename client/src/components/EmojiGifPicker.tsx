import React, { useState } from 'react';
import { Smile, Image, X } from 'lucide-react';

interface EmojiGifPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker?: (url: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  Love: ['❤️', '💖', '🥰', '😍', '💋', '🥹', '💕', '💗', '💓', '💞', '💌', '🌹', '✨', '🔥'],
  Expressions: ['😂', '😇', '😴', '🤤', '🤫', '🤪', '🥳', '😎', '🤗', '🥺', '🙈', '🙊'],
  Activities: ['☕', '🍷', '🍕', '🍰', '🍿', '🎬', '✈️', '🏖️', '🌌', '🌙', '💍', '🎁']
};

const STICKERS = [
  'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=300&q=80'
];

export const EmojiGifPicker: React.FC<EmojiGifPickerProps> = ({ onSelectEmoji, onSelectSticker, onClose }) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'stickers'>('emoji');

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-space-900 border border-white/10 p-3 sm:p-4 rounded-2xl shadow-2xl space-y-3 w-[min(18rem,90vw)] max-w-full"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('emoji')}
            className={`px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'emoji' ? 'bg-accent-pink text-white' : 'text-slate-400'}`}
          >
            Emojis
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1 rounded-xl text-xs font-bold ${activeTab === 'stickers' ? 'bg-accent-purple text-white' : 'text-slate-400'}`}
          >
            Stickers
          </button>
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'emoji' ? (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
            <div key={cat}>
              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">{cat}</p>
              <div className="grid grid-cols-7 gap-1">
                {list.map((em) => (
                  <button
                    key={em}
                    onClick={() => onSelectEmoji(em)}
                    className="text-lg p-1 hover:bg-white/10 rounded-lg transition-transform hover:scale-125"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {STICKERS.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt="Sticker"
              onClick={() => onSelectSticker?.(url)}
              className="w-full h-20 object-cover rounded-xl border border-white/10 hover:border-pink-400 cursor-pointer"
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
