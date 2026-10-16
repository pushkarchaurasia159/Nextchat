import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import AICopilotModal from './AICopilotModal';
import { ArrowLeft, Search, Info, Users, Sparkles, Ghost } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const formatLastSeen = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) return `today at ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `yesterday at ${format(date, 'h:mm a')}`;
  return `on ${format(date, 'dd/MM/yyyy')} at ${format(date, 'h:mm a')}`;
};

const ChatHeader = ({ onOpenInfo, onToggleSearch, onBack }) => {
  const { user, ghostMode } = useAuth();
  const { activeChat, typingUsers, onlineUsersMap } = useChat();
  const [showAIModal, setShowAIModal] = useState(false);

  if (!activeChat) return null;

  const isGroup = activeChat.isGroup;
  const otherUser = activeChat.otherUser;

  const isOnline = isGroup
    ? false
    : (otherUser && onlineUsersMap[otherUser.id]?.isOnline !== undefined
        ? onlineUsersMap[otherUser.id].isOnline
        : activeChat.isOnline);

  const lastSeen = otherUser && onlineUsersMap[otherUser.id]?.lastSeen
    ? onlineUsersMap[otherUser.id].lastSeen
    : activeChat.lastSeen;

  const activeTyping = typingUsers[activeChat.id] || [];
  const isTyping = activeTyping.length > 0;

  const renderSubtitle = () => {
    if (isTyping) {
      const names = activeTyping.map((t) => t.userName).join(', ');
      return (
        <span className="text-sky-400 font-bold animate-pulse">
          {names} {activeTyping.length > 1 ? 'are' : 'is'} typing...
        </span>
      );
    }

    if (isGroup) {
      const participantNames = (activeChat.participants || [])
        .map((p) => (p.userId === user?.id ? 'You' : p.name.split(' ')[0]))
        .join(', ');
      return <span className="truncate text-slate-400">{participantNames}</span>;
    }

    if (isOnline) {
      return <span className="text-emerald-400 font-semibold">online</span>;
    }

    if (lastSeen) {
      return <span className="text-slate-400">last seen {formatLastSeen(lastSeen)}</span>;
    }

    return <span className="text-slate-400">{activeChat.description || 'offline'}</span>;
  };

  return (
    <div className="h-16 glass-panel bg-[#0E1A34]/90 px-4 flex items-center justify-between border-b border-sky-400/10 flex-shrink-0 z-10">
      {/* Contact / Group Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={onOpenInfo}
          className="flex items-center gap-3 cursor-pointer group min-w-0"
        >
          <Avatar
            src={activeChat.avatar}
            name={activeChat.name}
            size="sm"
            isOnline={isOnline}
            showOnlineStatus={!isGroup}
          />
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-white group-hover:text-sky-400 transition truncate flex items-center gap-1.5">
              {isGroup && <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
              <span className="truncate">{activeChat.name}</span>
              {ghostMode && (
                <span title="Ghost Mode Active" className="text-purple-400">
                  <Ghost className="w-3 h-3" />
                </span>
              )}
            </h2>
            <p className="text-[11px] truncate max-w-[240px] sm:max-w-[400px]">
              {renderSubtitle()}
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 text-slate-400">
        {/* NextBot AI Copilot Trigger */}
        <button
          onClick={() => setShowAIModal(true)}
          className="p-2 rounded-xl hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition"
          title="Ask NextBot AI"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Search */}
        <button
          onClick={onToggleSearch}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          title="Search in chat"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Info */}
        <button
          onClick={onOpenInfo}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          title={isGroup ? 'Group Info' : 'Contact Info'}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      <AICopilotModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </div>
  );
};

export default ChatHeader;
