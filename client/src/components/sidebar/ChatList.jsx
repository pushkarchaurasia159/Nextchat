import React from 'react';
import { useChat } from '../../context/ChatContext';
import ChatListItem from './ChatListItem';
import { Search, Filter, MessageSquare, Users } from 'lucide-react';

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

  // Filter chats based on search query and active tab
  const filteredChats = chats.filter((chat) => {
    // Search query filter
    const matchesSearch =
      !searchFilter ||
      chat.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (chat.latestMessage?.content &&
        chat.latestMessage.content.toLowerCase().includes(searchFilter.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    if (tabFilter === 'unread') {
      return (chat.unreadCount || 0) > 0;
    }
    if (tabFilter === 'groups') {
      return chat.isGroup;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#111b21]">
      {/* Search & Filter Bar */}
      <div className="p-2 space-y-2 border-b border-[#222d34]/60">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-[#00a884] border border-transparent transition"
          />
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              tabFilter === 'all'
                ? 'bg-[#00a884] text-[#111b21] font-bold'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTabFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              tabFilter === 'unread'
                ? 'bg-[#00a884] text-[#111b21] font-bold'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setTabFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              tabFilter === 'groups'
                ? 'bg-[#00a884] text-[#111b21] font-bold'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat List Items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {loadingChats && chats.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-xs">
            <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading conversations...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-[#8696a0]/40" />
            <p className="text-xs">
              {searchFilter
                ? 'No chats found matching your search.'
                : tabFilter === 'unread'
                ? 'No unread messages.'
                : tabFilter === 'groups'
                ? 'No groups yet.'
                : 'No conversations yet.'}
            </p>
            {!searchFilter && (
              <button
                onClick={onOpenNewChat}
                className="px-4 py-2 bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold rounded-lg transition"
              >
                Start a New Chat
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
