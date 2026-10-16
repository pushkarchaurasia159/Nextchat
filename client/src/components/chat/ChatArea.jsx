import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GroupInfoDrawer from '../group/GroupInfoDrawer';
import MediaViewerModal from '../common/MediaViewerModal';
import PinnedBanner from './PinnedBanner';
import { Lock, Search, X, Sparkles, Zap } from 'lucide-react';

const ChatArea = ({ onBackToSidebar }) => {
  const { activeChat, messages, pinMessage } = useChat();
  const { theme } = useTheme();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);

  const handleOpenMedia = (mediaUrl, fileName) => {
    setPreviewMedia({ mediaUrl, fileName });
  };

  // Find currently pinned message if any
  const pinnedMsg = messages.find((m) => m.isPinned && !m.isDeleted);

  // Welcome / Empty State
  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#070D1E] text-center p-8 select-none relative overflow-hidden">
        {/* Animated Background Mesh Glow */}
        <div className="absolute w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2.5s' }} />

        <div className="max-w-md flex flex-col items-center space-y-5 z-10 animate-pop">
          <div className="relative">
            <img
              src="/logo.png"
              alt="NextChat Logo"
              className="w-24 h-24 rounded-3xl object-contain drop-shadow-[0_0_25px_rgba(56,189,248,0.45)] transform hover:scale-105 transition duration-300"
            />
            <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-lg">
              v2.0
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              NextChat Matrix
            </h1>
            <p className="text-xs text-sky-400 font-semibold tracking-wide">
              Velvet Navy • AI Powered • Ephemeral • Passwordless OTP
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Select a conversation or tap <span className="text-sky-400 font-semibold">+</span> to launch a private or group chat with live polls, AI Copilot, and secret timers.
          </p>

          <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span>End-to-end encrypted • Zero clutter</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full min-w-0 bg-[#070D1E] relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Chat Flow */}
      <div className="flex-1 flex flex-col h-full min-w-0 z-10">
        {/* Chat Header */}
        <ChatHeader
          onOpenInfo={() => setIsInfoOpen(!isInfoOpen)}
          onToggleSearch={() => {
            setIsSearchOpen(!isSearchOpen);
            if (isSearchOpen) setSearchQuery('');
          }}
          onBack={onBackToSidebar}
        />

        {/* Pinned Message Banner */}
        {pinnedMsg && (
          <PinnedBanner
            message={pinnedMsg}
            onUnpin={() => pinMessage(pinnedMsg.id)}
            onJumpTo={() => {}}
          />
        )}

        {/* In-chat Search Bar */}
        {isSearchOpen && (
          <div className="p-2.5 glass-panel bg-[#0E1A34]/95 border-b border-sky-400/10 flex items-center gap-2 animate-slide-down">
            <Search className="w-4 h-4 text-sky-400" />
            <input
              type="text"
              placeholder="Search in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 glass-input text-xs text-white placeholder-slate-400 rounded-xl px-3 py-1.5 outline-none"
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Stream */}
        <MessageList
          onViewMedia={handleOpenMedia}
          searchQuery={searchQuery}
        />

        {/* Message Input */}
        <MessageInput />
      </div>

      {/* Group / Contact Info Right Panel */}
      {isInfoOpen && (
        <GroupInfoDrawer
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
        />
      )}

      {/* Full-Screen Lightbox */}
      {previewMedia && (
        <MediaViewerModal
          mediaUrl={previewMedia.mediaUrl}
          fileName={previewMedia.fileName}
          onClose={() => setPreviewMedia(null)}
        />
      )}
    </div>
  );
};

export default ChatArea;
