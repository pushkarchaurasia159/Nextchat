import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import { X, Users, Image as ImageIcon, Check, Search, Sparkles } from 'lucide-react';

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
      setError('Please provide a group subject/name');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-[#111b21] rounded-2xl shadow-2xl border border-[#222d34] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34]">
          <h2 className="text-base font-semibold text-[#e9edef] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00a884]" />
            New Group
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#374248] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 space-y-4 border-b border-[#222d34] overflow-y-auto">
            {/* Group Avatar & Name */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-full bg-[#202c33] border-2 border-dashed border-[#8696a0]/40 hover:border-[#00a884] cursor-pointer flex items-center justify-center overflow-hidden transition group flex-shrink-0"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#8696a0] group-hover:text-[#00a884]" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition">
                  Upload Icon
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
                  className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
                  required
                />
              </div>
            </div>

            {/* Group Description */}
            <input
              type="text"
              placeholder="Group description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884] text-xs cursor-pointer hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition"
                    >
                      {u.name}
                      <X className="w-3 h-3" />
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Member Selection Section */}
          <div className="flex-1 flex flex-col min-h-0 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#8696a0]">
                Add Participants ({selectedUserIds.length} selected)
              </span>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#202c33] text-[#e9edef] placeholder-[#8696a0] text-xs rounded-md pl-7 pr-2 py-1 outline-none border border-[#2a3942]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8696a0]">
                  No contacts available to add
                </div>
              ) : (
                filteredUsers.map((targetUser) => {
                  const isSelected = selectedUserIds.includes(targetUser.id);
                  return (
                    <div
                      key={targetUser.id}
                      onClick={() => toggleUser(targetUser.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                        isSelected ? 'bg-[#00a884]/15' : 'hover:bg-[#202c33]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={targetUser.avatar}
                          name={targetUser.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#e9edef]">
                            {targetUser.name}
                          </p>
                          <p className="text-[11px] text-[#8696a0]">
                            {targetUser.phone}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-[#00a884] border-[#00a884] text-[#111b21]'
                            : 'border-[#8696a0]/40'
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
          <div className="p-3 bg-[#202c33] border-t border-[#222d34] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8696a0] hover:text-[#e9edef] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2 bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold rounded-lg shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewGroupModal;
