import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GroupInfoDrawer from '../group/GroupInfoDrawer';
import MediaViewerModal from '../common/MediaViewerModal';
import { ShieldCheck, Lock, Search, X } from 'lucide-react';

const ChatArea = ({ onBackToSidebar }) => {
  const { activeChat, selectChat } = useChat();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [previewMedia, setPreviewMedia] = useState(null);

  const handleOpenMedia = (mediaUrl, fileName) => {
    setPreviewMedia({ mediaUrl, fileName });
  };

  // Welcome Screen when no active conversation is selected
  if (!activeChat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#222e35] text-center p-8 border-b-8 border-[#00a884] select-none relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute w-96 h-96 bg-[#00a884]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md flex flex-col items-center space-y-4 z-10 animate-fade-in">
          <div className="relative mb-2">
            <img
              src="/logo.png"
              alt="NextChat Logo"
              className="w-24 h-24 rounded-3xl object-contain drop-shadow-[0_0_20px_rgba(0,168,132,0.5)] transform hover:scale-105 transition duration-300"
            />
          </div>

          <h1 className="text-3xl font-light text-[#e9edef] tracking-wide">
            NextChat Web
          </h1>

          <p className="text-sm text-[#8696a0] leading-relaxed">
            Send and receive messages, media attachments, and voice notes without keeping your phone online.
          </p>

          <div className="pt-8 flex items-center justify-center gap-2 text-xs text-[#8696a0]">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            <span>End-to-end encrypted & admin-powered</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full min-w-0 bg-[#0b141a] relative overflow-hidden">
      {/* Main Chat Flow (Header + Messages + Input) */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Chat Top Header */}
        <ChatHeader
          onOpenInfo={() => setIsInfoOpen(!isInfoOpen)}
          onToggleSearch={() => {
            setIsSearchOpen(!isSearchOpen);
            if (isSearchOpen) setSearchQuery('');
          }}
          onBack={onBackToSidebar}
        />

        {/* In-chat Search Bar (Collapsible) */}
        {isSearchOpen && (
          <div className="p-2.5 bg-[#202c33] border-b border-[#222d34] flex items-center gap-2 animate-slide-down">
            <Search className="w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search in this chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex-1 bg-[#111b21] text-xs text-[#e9edef] placeholder-[#8696a0] rounded-lg px-3 py-1.5 outline-none border border-[#2a3942]"
            />
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1 text-[#8696a0] hover:text-[#e9edef]"
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

        {/* Message Input Bar */}
        <MessageInput />
      </div>

      {/* Group / Contact Info Right Panel */}
      {isInfoOpen && (
        <GroupInfoDrawer
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
        />
      )}

      {/* Full-Screen Media Modal Lightbox */}
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
