import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import { X, Search, UserPlus, Phone } from 'lucide-react';

const NewChatModal = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const { createDirectChat } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError('');
      return;
    }

    const search = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setResults(data.users || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 250);
    return () => clearTimeout(debounce);
  }, [query, isOpen, token]);

  if (!isOpen) return null;

  const handleSelectUser = async (targetUser) => {
    try {
      setLoading(true);
      await createDirectChat(targetUser.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#111b21] rounded-2xl shadow-2xl border border-[#222d34] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34]">
          <h2 className="text-base font-semibold text-[#e9edef] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00a884]" />
            Start New Chat
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374248] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#222d34]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone number or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#222d34]/40">
          {loading ? (
            <div className="p-8 text-center text-[#8696a0] text-xs">
              <div className="w-5 h-5 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching contacts...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0] text-xs space-y-1">
              <Phone className="w-8 h-8 mx-auto text-[#8696a0]/40 mb-2" />
              <p className="font-medium text-[#e9edef]">No users found</p>
              <p>Make sure other users have registered with their phone number.</p>
            </div>
          ) : (
            results.map((targetUser) => (
              <div
                key={targetUser.id}
                onClick={() => handleSelectUser(targetUser)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#202c33] cursor-pointer transition"
              >
                <Avatar
                  src={targetUser.avatar}
                  name={targetUser.name}
                  size="md"
                  isOnline={targetUser.isOnline}
                  showOnlineStatus={true}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#e9edef] truncate">
                      {targetUser.name}
                    </h4>
                    <span className="text-xs text-[#00a884] font-medium">
                      {targetUser.isOnline ? 'Online' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[#8696a0] truncate font-mono">
                    {targetUser.phone}
                  </p>
                  <p className="text-[11px] text-[#8696a0] truncate italic mt-0.5">
                    {targetUser.about}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
