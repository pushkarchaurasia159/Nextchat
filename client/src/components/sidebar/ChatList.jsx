import React from 'react';
import { useChat } from '../../context/ChatContext';
import ChatListItem from './ChatListItem';
import { Search, MessageSquare, Bot } from 'lucide-react';

const ChatList = ({ onOpenNewChat }) => {
  const {
    chats,
    activeChatId,
    selectChat,
    searchFilter,
    setSearchFilter,
    tabFilter,
    setTabFilter,
    loadingChats
  } = useChat();

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      !searchFilter ||
      chat.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (chat.latestMessage?.content &&
        chat.latestMessage.content.toLowerCase().includes(searchFilter.toLowerCase()));

    if (!matchesSearch) return false;

    if (tabFilter === 'unread') {
      return (chat.unreadCount || 0) > 0;
    }
    if (tabFilter === 'groups') {
      return chat.isGroup;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      {/* Search & Filter Bar */}
      <div className="p-3 space-y-2.5 border-b border-sky-400/10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full glass-input text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition"
          />
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-1.5 px-0.5">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              tabFilter === 'all'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTabFilter('unread')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              tabFilter === 'unread'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setTabFilter('groups')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              tabFilter === 'groups'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat List Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-white/5">
        {loadingChats && chats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading conversations...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-xs">
              {searchFilter
                ? 'No chats matching your search.'
                : tabFilter === 'unread'
                ? 'No unread messages.'
                : tabFilter === 'groups'
                ? 'No groups yet.'
                : 'No conversations yet.'}
            </p>
            {!searchFilter && (
              <button
                onClick={onOpenNewChat}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition"
              >
                Start New Chat
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={activeChatId === chat.id}
              onClick={() => selectChat(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
