import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import Ticks from '../common/Ticks';
import { format, isToday, isYesterday } from 'date-fns';
import { Image, Mic, FileText, Users, BellOff } from 'lucide-react';

const formatChatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'dd/MM/yyyy');
};

const ChatListItem = ({ chat, isSelected, onClick }) => {
  const { user } = useAuth();
  const { typingUsers, onlineUsersMap } = useChat();

  const isGroup = chat.isGroup;
  const isOnline = isGroup
    ? false
    : (chat.otherUser && onlineUsersMap[chat.otherUser.id]?.isOnline !== undefined
        ? onlineUsersMap[chat.otherUser.id].isOnline
        : chat.isOnline);

  const activeTyping = typingUsers[chat.id];
  const isTyping = activeTyping && activeTyping.length > 0;

  const lastMsg = chat.latestMessage;
  const isMeSender = lastMsg && lastMsg.senderId === user?.id;

  const renderLastMessageContent = () => {
    if (isTyping) {
      return (
        <span className="text-[#00a884] font-medium flex items-center gap-1">
          <span className="animate-pulse">typing...</span>
        </span>
      );
    }

    if (!lastMsg) {
      return <span className="italic text-[#8696a0]">Tap to start chatting</span>;
    }

    if (lastMsg.isDeleted) {
      return <span className="italic text-[#8696a0]">🚫 Message was deleted</span>;
    }

    if (lastMsg.type === 'SYSTEM') {
      return <span className="italic text-[#8696a0]">{lastMsg.content}</span>;
    }

    let prefix = '';
    if (isGroup && lastMsg.sender && !isMeSender) {
      prefix = `${lastMsg.sender.name.split(' ')[0]}: `;
    }

    if (lastMsg.type === 'IMAGE') {
      return (
        <span className="flex items-center gap-1 text-[#8696a0]">
          <Image className="w-3.5 h-3.5 flex-shrink-0 text-[#8696a0]" />
          <span>{prefix}Photo {lastMsg.content ? `• ${lastMsg.content}` : ''}</span>
        </span>
      );
    }

    if (lastMsg.type === 'AUDIO') {
      return (
        <span className="flex items-center gap-1 text-[#8696a0]">
          <Mic className="w-3.5 h-3.5 flex-shrink-0 text-[#00a884]" />
          <span>{prefix}Voice message</span>
        </span>
      );
    }

    if (lastMsg.type === 'DOCUMENT') {
      return (
        <span className="flex items-center gap-1 text-[#8696a0]">
          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-[#8696a0]" />
          <span>{prefix}{lastMsg.fileName || 'Document'}</span>
        </span>
      );
    }

    return (
      <span className="text-[#8696a0] truncate">
        {prefix}{lastMsg.content}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition border-b border-[#222d34]/60 ${
        isSelected
          ? 'bg-[#2a3942]'
          : 'hover:bg-[#202c33]'
      }`}
    >
      {/* Avatar */}
      <Avatar
        src={chat.avatar}
        name={chat.name || (isGroup ? 'Group' : 'User')}
        size="md"
        isOnline={isOnline}
        showOnlineStatus={!isGroup}
      />

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#e9edef] truncate flex items-center gap-1.5">
            {isGroup && <Users className="w-3.5 h-3.5 text-[#00a884] flex-shrink-0" />}
            <span className="truncate">{chat.name}</span>
          </h3>
          <span className="text-[11px] text-[#8696a0] flex-shrink-0">
            {formatChatTime(lastMsg?.createdAt || chat.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-[#8696a0] truncate max-w-[210px]">
            {isMeSender && lastMsg && !lastMsg.isDeleted && lastMsg.type !== 'SYSTEM' && (
              <Ticks status={lastMsg.status} className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <div className="truncate">{renderLastMessageContent()}</div>
          </div>

          {/* Unread Count Badge */}
          {chat.unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[11px] flex items-center justify-center flex-shrink-0">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
