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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop">
      <div className="w-full max-w-md glass-panel bg-[#070D1E] rounded-3xl shadow-2xl border border-sky-400/20 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0E1A34]/80 flex items-center justify-between border-b border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-400" />
            Start New Chat
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone number or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full glass-input text-white placeholder-slate-500 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching contacts...
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-1">
              <Phone className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-white">No contacts found</p>
              <p>Registered users will appear here.</p>
            </div>
          ) : (
            results.map((targetUser) => (
              <div
                key={targetUser.id}
                onClick={() => handleSelectUser(targetUser)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#13203E] cursor-pointer transition"
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
                    <h4 className="text-xs font-bold text-white truncate">
                      {targetUser.name}
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {targetUser.isOnline ? 'Online' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {targetUser.phone}
                  </p>
                  <p className="text-[10px] text-slate-400 italic truncate mt-0.5">
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
