import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import Ticks from '../common/Ticks';
import { format, isToday, isYesterday } from 'date-fns';
import { Image, Mic, FileText, Users, BarChart3, Bot, Sparkles, Pin } from 'lucide-react';

const formatChatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
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
        <span className="text-sky-400 font-bold flex items-center gap-1">
          <span className="animate-pulse">typing...</span>
        </span>
      );
    }

    if (!lastMsg) {
      return <span className="italic text-slate-500">Tap to start chatting</span>;
    }

    if (lastMsg.isDeleted) {
      return <span className="italic text-slate-500">🚫 Message was deleted</span>;
    }

    if (lastMsg.type === 'SYSTEM') {
      return <span className="italic text-slate-500">{lastMsg.content}</span>;
    }

    if (lastMsg.type === 'POLL') {
      return (
        <span className="flex items-center gap-1 text-sky-400 font-medium">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Live Poll</span>
        </span>
      );
    }

    if (lastMsg.type === 'AI') {
      return (
        <span className="flex items-center gap-1 text-purple-400 font-medium">
          <Bot className="w-3.5 h-3.5" />
          <span className="truncate">{lastMsg.content}</span>
        </span>
      );
    }

    let prefix = '';
    if (isGroup && lastMsg.sender && !isMeSender) {
      prefix = `${lastMsg.sender.name.split(' ')[0]}: `;
    }

    if (lastMsg.type === 'IMAGE') {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Image className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <span>{prefix}Photo {lastMsg.content ? `• ${lastMsg.content}` : ''}</span>
        </span>
      );
    }

    if (lastMsg.type === 'AUDIO') {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <Mic className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
          <span>{prefix}Voice note</span>
        </span>
      );
    }

    if (lastMsg.type === 'DOCUMENT') {
      return (
        <span className="flex items-center gap-1 text-slate-400">
          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          <span>{prefix}{lastMsg.fileName || 'Document'}</span>
        </span>
      );
    }

    return (
      <span className="text-slate-400 truncate">
        {prefix}{lastMsg.content}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition border-b border-white/5 relative select-none ${
        isSelected
          ? 'bg-[#16264A] border-l-4 border-l-sky-400 shadow-[inset_0_1px_0_0_rgba(56,189,248,0.1)]'
          : 'hover:bg-[#13203E]/50'
      }`}
    >
      <Avatar
        src={chat.avatar}
        name={chat.name || (isGroup ? 'Group' : 'User')}
        size="md"
        isOnline={isOnline}
        showOnlineStatus={!isGroup}
      />

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
            {isGroup && <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
            <span className="truncate">{chat.name}</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
            {formatChatTime(lastMsg?.createdAt || chat.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-[210px]">
            {isMeSender && lastMsg && !lastMsg.isDeleted && lastMsg.type !== 'SYSTEM' && (
              <Ticks status={lastMsg.status} className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <div className="truncate">{renderLastMessageContent()}</div>
          </div>

          {chat.unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-black text-[10px] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(56,189,248,0.4)]">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
