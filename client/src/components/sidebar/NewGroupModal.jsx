import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import { X, Users, Image as ImageIcon, Check, Search } from 'lucide-react';

const NewGroupModal = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const { createGroupChat } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setAvatarFile(null);
      setAvatarPreview(null);
      setSelectedUserIds([]);
      setError('');
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/search`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setAvailableUsers(data.users || []);
        }
      } catch (err) {
        console.error('Error fetching users for group:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group subject');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (description) formData.append('description', description.trim());
      formData.append('memberIds', JSON.stringify(selectedUserIds));
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await createGroupChat(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter((u) =>
    !searchQuery ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop">
      <div className="w-full max-w-lg glass-panel bg-[#070D1E] rounded-3xl shadow-2xl border border-sky-400/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0E1A34]/80 flex items-center justify-between border-b border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            Create NextChat Group
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 space-y-4 border-b border-white/10 overflow-y-auto">
            {/* Group Avatar & Name */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-2xl bg-[#0A1226] border-2 border-dashed border-sky-400/20 hover:border-sky-400 cursor-pointer flex items-center justify-center overflow-hidden transition group flex-shrink-0"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-500 group-hover:text-sky-400" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white">
                  Icon
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Group subject (required)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 outline-none"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <input
              type="text"
              placeholder="Group description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2 outline-none"
            />

            {/* Selected Member Chips */}
            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedUserIds.map((uid) => {
                  const u = availableUsers.find((user) => user.id === uid);
                  if (!u) return null;
                  return (
                    <span
                      key={uid}
                      onClick={() => toggleUser(uid)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs cursor-pointer hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition"
                    >
                      {u.name}
                      <X className="w-3 h-3" />
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Member Selection */}
          <div className="flex-1 flex flex-col min-h-0 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                Select Members ({selectedUserIds.length})
              </span>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full glass-input text-white placeholder-slate-500 text-xs rounded-xl pl-7 pr-2 py-1 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No contacts available to add
                </div>
              ) : (
                filteredUsers.map((targetUser) => {
                  const isSelected = selectedUserIds.includes(targetUser.id);
                  return (
                    <div
                      key={targetUser.id}
                      onClick={() => toggleUser(targetUser.id)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition ${
                        isSelected ? 'bg-sky-500/15' : 'hover:bg-[#13203E]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={targetUser.avatar}
                          name={targetUser.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">
                            {targetUser.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {targetUser.phone}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-sky-500 border-sky-500 text-slate-950 font-bold'
                            : 'border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="p-3 bg-[#0E1A34]/80 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
