import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageBubble from './MessageBubble';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { Lock, ShieldCheck } from 'lucide-react';

const formatDateSeparator = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
};

const MessageList = ({ onViewMedia, searchQuery }) => {
  const { messages, loadingMessages, activeChat } = useChat();
  const bottomRef = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = searchQuery
    ? messages.filter(
        (m) =>
          m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 chat-pattern-dark relative">
      {/* End-to-end encryption / privacy badge banner */}
      <div className="flex justify-center my-3">
        <div className="bg-[#182229]/80 backdrop-blur-sm border border-[#222d34] text-[#ffd279] text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm text-center max-w-sm flex items-center gap-1.5 select-none">
          <Lock className="w-3.5 h-3.5 flex-shrink-0 text-[#ffd279]" />
          <span>Messages are real-time, private, and secured on NextChat.</span>
        </div>
      </div>

      {loadingMessages && messages.length === 0 ? (
        <div className="p-8 text-center text-[#8696a0] text-xs">
          <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading chat history...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="p-12 text-center text-[#8696a0] text-xs">
          {searchQuery
            ? `No messages matching "${searchQuery}"`
            : 'No messages here yet. Say hello! 👋'}
        </div>
      ) : (
        filteredMessages.map((msg, index) => {
          // Show date separator when day changes
          const prevMsg = filteredMessages[index - 1];
          const isNewDay =
            !prevMsg ||
            !isSameDay(
              new Date(msg.createdAt || Date.now()),
              new Date(prevMsg.createdAt || Date.now())
            );

          return (
            <React.Fragment key={msg.id || index}>
              {isNewDay && (
                <div className="flex justify-center my-3 select-none">
                  <span className="bg-[#182229] border border-[#222d34] text-[#8696a0] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-sm">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble message={msg} onViewMedia={onViewMedia} />
            </React.Fragment>
          );
        })
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
