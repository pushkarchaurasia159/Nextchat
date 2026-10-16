import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';
import {
  X,
  Camera,
  Edit2,
  Check,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  LogOut,
  Trash2,
  Crown,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

const GroupInfoDrawer = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const {
    activeChat,
    addMembersToGroup,
    removeMemberFromGroup,
    changeGroupRole,
    updateGroupSettings,
    updateGroupInfo,
    leaveGroup,
    deleteChat
  } = useChat();

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState('');

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeChat) {
      setName(activeChat.rawName || activeChat.name || '');
      setDescription(activeChat.description || '');
    }
  }, [activeChat]);

  if (!isOpen || !activeChat) return null;

  const isGroup = activeChat.isGroup;
  const participants = activeChat.participants || [];
  const myParticipant = participants.find((p) => p.userId === user?.id);
  const myRole = myParticipant ? myParticipant.role : 'MEMBER';
  const isAdmin = myRole === 'ADMIN';

  const canEditInfo = !isGroup || !activeChat.adminOnlyInfo || isAdmin;

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file && canEditInfo) {
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        await updateGroupInfo(activeChat.id, formData);
      } catch (err) {
        alert('Failed to update group avatar');
      }
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      await updateGroupInfo(activeChat.id, formData);
      setIsEditingName(false);
    } catch (err) {
      alert('Failed to update group name');
    }
  };

  const handleSaveDesc = async () => {
    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      await updateGroupInfo(activeChat.id, formData);
      setIsEditingDesc(false);
    } catch (err) {
      alert('Failed to update group description');
    }
  };

  const handleToggleAdminOnlyMessage = async () => {
    if (!isAdmin) return;
    try {
      await updateGroupSettings(activeChat.id, {
        adminOnlyMessage: !activeChat.adminOnlyMessage
      });
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  const handleToggleAdminOnlyInfo = async () => {
    if (!isAdmin) return;
    try {
      await updateGroupSettings(activeChat.id, {
        adminOnlyInfo: !activeChat.adminOnlyInfo
      });
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  const openAddMembersModal = async () => {
    try {
      setLoading(true);
      setSelectedUserIds([]);
      const res = await fetch('/api/users/search', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const existingIds = participants.map((p) => p.userId);
        setAvailableUsers((data.users || []).filter((u) => !existingIds.includes(u.id)));
        setIsAddMemberOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await addMembersToGroup(activeChat.id, selectedUserIds);
      setIsAddMemberOpen(false);
      setSelectedUserIds([]);
    } catch (err) {
      alert(err.message || 'Failed to add members');
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (window.confirm(`Remove ${targetName} from the group?`)) {
      try {
        await removeMemberFromGroup(activeChat.id, targetUserId);
      } catch (err) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  const handleChangeRole = async (targetUserId, newRole) => {
    try {
      await changeGroupRole(activeChat.id, targetUserId, newRole);
    } catch (err) {
      alert(err.message || 'Failed to change role');
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await leaveGroup(activeChat.id);
        onClose();
      } catch (err) {
        alert(err.message || 'Failed to leave group');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (
      window.confirm(
        isGroup
          ? 'Are you sure you want to permanently delete this group?'
          : 'Delete this conversation?'
      )
    ) {
      try {
        await deleteChat(activeChat.id);
        onClose();
      } catch (err) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="w-full md:w-[380px] lg:w-[420px] h-full glass-panel bg-[#070D1E]/95 border-l border-sky-400/10 flex flex-col flex-shrink-0 z-20 animate-slide-left overflow-hidden backdrop-blur-2xl">
      {/* Header */}
      <div className="h-16 bg-[#0E1A34]/60 px-4 flex items-center justify-between border-b border-sky-400/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            {isGroup ? 'Group Management' : 'Contact Info'}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {/* Avatar & Title */}
        <div className="p-6 flex flex-col items-center text-center">
          <div
            onClick={() => canEditInfo && fileInputRef.current?.click()}
            className={`relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl mb-3 border-2 border-sky-400/40 p-1 ${
              canEditInfo ? 'cursor-pointer group' : ''
            }`}
          >
            <Avatar
              src={activeChat.avatar}
              name={activeChat.name}
              size="xl"
              className="w-full h-full rounded-2xl"
            />
            {canEditInfo && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition rounded-2xl">
                <Camera className="w-5 h-5 mb-1 text-sky-400" />
                <span className="text-[9px] uppercase tracking-wider font-bold">
                  Change Icon
                </span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />

          <div className="w-full">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input text-white text-sm font-bold text-center rounded-xl px-3 py-1 outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-xl bg-sky-500 text-slate-950"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-base font-bold text-white truncate">
                  {activeChat.name}
                </h3>
                {canEditInfo && isGroup && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              {isGroup
                ? `Group • ${participants.length} participants`
                : activeChat.otherUser?.phone}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            {isGroup ? 'Group Description' : 'Bio'}
          </span>
          {isEditingDesc ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 glass-input text-xs text-white rounded-xl px-3 py-1.5 outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveDesc}
                className="p-1.5 rounded-xl bg-sky-500 text-slate-950"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeChat.description ||
                  (isGroup ? 'No description added yet.' : activeChat.otherUser?.about)}
              </p>
              {canEditInfo && isGroup && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {isGroup && activeChat.createdAt && (
            <p className="text-[10px] text-slate-500 pt-2 font-mono">
              Created on {format(new Date(activeChat.createdAt), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Group Admin Permissions */}
        {isGroup && isAdmin && (
          <div className="p-4 space-y-3 bg-[#0E1A34]/40">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Shield className="w-4 h-4" />
              <span>Admin Privileges & Restrictions</span>
            </div>

            <div className="flex items-center justify-between glass-card bg-[#0E1A34]/60 p-3 rounded-2xl border border-sky-400/10">
              <div>
                <p className="text-xs font-bold text-white">Send Messages</p>
                <p className="text-[10px] text-slate-400">
                  {activeChat.adminOnlyMessage
                    ? 'Only group admins can post'
                    : 'All participants can post'}
                </p>
              </div>
              <button
                onClick={handleToggleAdminOnlyMessage}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                  activeChat.adminOnlyMessage ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                    activeChat.adminOnlyMessage ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between glass-card bg-[#0E1A34]/60 p-3 rounded-2xl border border-sky-400/10">
              <div>
                <p className="text-xs font-bold text-white">Edit Group Info</p>
                <p className="text-[10px] text-slate-400">
                  {activeChat.adminOnlyInfo
                    ? 'Only group admins can edit subject & icon'
                    : 'All participants can edit info'}
                </p>
              </div>
              <button
                onClick={handleToggleAdminOnlyInfo}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                  activeChat.adminOnlyInfo ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                    activeChat.adminOnlyInfo ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Participants List */}
        {isGroup && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {participants.length} Participants
              </span>
              {isAdmin && (
                <button
                  onClick={openAddMembersModal}
                  className="flex items-center gap-1.5 text-xs text-sky-400 font-bold hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Member
                </button>
              )}
            </div>

            <div className="divide-y divide-white/5">
              {participants.map((p) => {
                const isMe = p.userId === user?.id;
                const isMemberAdmin = p.role === 'ADMIN';
                const isMemberCreator = activeChat.creatorId === p.userId;

                return (
                  <div
                    key={p.id || p.userId}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={p.avatar}
                        name={p.name}
                        size="sm"
                        isOnline={p.isOnline}
                        showOnlineStatus={true}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {isMe ? 'You' : p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {p.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMemberCreator && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Creator
                        </span>
                      )}
                      {isMemberAdmin && !isMemberCreator && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                          Admin
                        </span>
                      )}

                      {isAdmin && !isMe && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          {isMemberAdmin ? (
                            !isMemberCreator && (
                              <button
                                onClick={() => handleChangeRole(p.userId, 'MEMBER')}
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/10"
                                title="Dismiss Admin"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => handleChangeRole(p.userId, 'ADMIN')}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-white/10"
                              title="Make Admin"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isMemberCreator && (
                            <button
                              onClick={() => handleRemoveMember(p.userId, p.name)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20"
                              title="Kick Member"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exit / Delete Actions */}
        <div className="p-4 space-y-2">
          {isGroup ? (
            <>
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl glass-card hover:bg-rose-500/15 text-rose-400 font-bold text-xs transition border border-rose-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Group</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleDeleteGroup}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs transition border border-rose-500/40"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Group</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleDeleteGroup}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl glass-card hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition border border-rose-500/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Conversation</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Members Sub-Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop">
          <div className="w-full max-w-md glass-panel bg-[#070D1E] rounded-3xl shadow-2xl border border-sky-400/20 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 bg-[#0E1A34]/80 flex items-center justify-between border-b border-white/10">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                Add Participants
              </h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full glass-input text-xs text-white rounded-xl pl-8 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
              {availableUsers
                .filter(
                  (u) =>
                    !searchUserQuery ||
                    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
                    u.phone.includes(searchUserQuery)
                )
                .map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() =>
                        setSelectedUserIds((prev) =>
                          prev.includes(u.id)
                            ? prev.filter((id) => id !== u.id)
                            : [...prev, u.id]
                        )
                      }
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition ${
                        isSelected ? 'bg-sky-500/20' : 'hover:bg-[#13203E]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.phone}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          isSelected
                            ? 'bg-sky-500 border-sky-500 text-slate-950 font-bold'
                            : 'border-white/20'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-3 bg-[#0E1A34]/80 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembersSubmit}
                disabled={selectedUserIds.length === 0}
                className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 text-xs font-bold rounded-xl disabled:opacity-50 transition"
              >
                Add Selected ({selectedUserIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInfoDrawer;
