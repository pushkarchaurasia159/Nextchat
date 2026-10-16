import React from 'react';
import { Pin, X } from 'lucide-react';

const PinnedBanner = ({ message, onUnpin, onJumpTo }) => {
  if (!message) return null;

  return (
    <div
      onClick={onJumpTo}
      className="bg-[#0E1A34]/95 border-b border-sky-400/20 px-4 py-2 flex items-center justify-between backdrop-blur-xl cursor-pointer hover:bg-[#16264A] transition z-10 select-none animate-slide-down"
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400 flex-shrink-0">
          <Pin className="w-3.5 h-3.5 fill-current" />
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
            Pinned Message
          </span>
          <span className="text-xs text-slate-200 truncate">
            {message.content || (message.type === 'POLL' ? '📊 Poll' : '📎 Media')}
          </span>
        </div>
      </div>

      {onUnpin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUnpin();
          }}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="Unpin Message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default PinnedBanner;
