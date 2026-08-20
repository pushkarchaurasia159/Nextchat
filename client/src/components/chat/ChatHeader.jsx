import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import { ArrowLeft, Search, MoreVertical, Info, Users } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const formatLastSeen = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) {
    return `today at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `yesterday at ${format(date, 'h:mm a')}`;
  }
  return `on ${format(date, 'dd/MM/yyyy')} at ${format(date, 'h:mm a')}`;
};

const ChatHeader = ({ onOpenInfo, onToggleSearch, onBack }) => {
  const { user } = useAuth();
  const { activeChat, typingUsers, onlineUsersMap } = useChat();

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
        <span className="text-[#00a884] font-medium animate-pulse">
          {names} {activeTyping.length > 1 ? 'are' : 'is'} typing...
        </span>
      );
    }

    if (isGroup) {
      const participantNames = (activeChat.participants || [])
        .map((p) => (p.userId === user?.id ? 'You' : p.name.split(' ')[0]))
        .join(', ');
      return <span className="truncate">{participantNames}</span>;
    }

    if (isOnline) {
      return <span className="text-[#00a884] font-medium">online</span>;
    }

    if (lastSeen) {
      return <span>last seen {formatLastSeen(lastSeen)}</span>;
    }

    return <span>{activeChat.description || 'offline'}</span>;
  };

  return (
    <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222d34] flex-shrink-0 z-10">
      {/* Contact / Group Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back button on mobile */}
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-2 rounded-full text-[#aebac1] hover:text-[#e9edef] hover:bg-[#374248] transition"
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
            <h2 className="text-sm font-semibold text-[#e9edef] group-hover:text-[#00a884] transition truncate flex items-center gap-1.5">
              {isGroup && <Users className="w-3.5 h-3.5 text-[#00a884] flex-shrink-0" />}
              <span className="truncate">{activeChat.name}</span>
            </h2>
            <p className="text-[11px] text-[#8696a0] truncate max-w-[240px] sm:max-w-[400px]">
              {renderSubtitle()}
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 text-[#aebac1]">
        <button
          onClick={onToggleSearch}
          className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition"
          title="Search in chat"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenInfo}
          className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition"
          title={isGroup ? 'Group Info' : 'Contact Info'}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
