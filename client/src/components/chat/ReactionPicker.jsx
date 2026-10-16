import React from 'react';

const EMOJIS = ['❤️', '🔥', '😂', '🚀', '👍', '👏', '🎉', '⚡'];

const ReactionPicker = ({ onSelectEmoji, onClose }) => {
  return (
    <div
      className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-2xl z-40 animate-pop"
      onMouseLeave={onClose}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelectEmoji(emoji);
            onClose();
          }}
          className="text-lg p-1.5 rounded-xl hover:scale-125 hover:bg-white/10 transition duration-150 active:scale-95 select-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
