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
  Lock,
  MessageSquare,
  Search,
  Crown,
  Users
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
  const isCreator = activeChat.creatorId === user?.id;

  const canEditInfo = !isGroup || !activeChat.adminOnlyInfo || isAdmin;

  // Handle Avatar Change
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

  // Handle Save Name
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

  // Handle Save Description
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

  // Toggle Admin Setting: Send Messages
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

  // Toggle Admin Setting: Edit Info
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

  // Open Add Members Modal
  const openAddMembersModal = async () => {
    try {
      setLoading(true);
      setSelectedUserIds([]);
      const res = await fetch('/api/users/search', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter out users already in the group
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

  // Add Members submit
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

  // Remove Member (Admin power)
  const handleRemoveMember = async (targetUserId, targetName) => {
    if (window.confirm(`Remove ${targetName} from the group?`)) {
      try {
        await removeMemberFromGroup(activeChat.id, targetUserId);
      } catch (err) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  // Promote / Demote Admin
  const handleChangeRole = async (targetUserId, newRole) => {
    try {
      await changeGroupRole(activeChat.id, targetUserId, newRole);
    } catch (err) {
      alert(err.message || 'Failed to change role');
    }
  };

  // Leave Group
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

  // Delete Group (Creator or Admin)
  const handleDeleteGroup = async () => {
    if (
      window.confirm(
        isGroup
          ? 'Are you sure you want to permanently delete this group for all members?'
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
    <div className="w-full md:w-[380px] lg:w-[420px] h-full bg-[#111b21] border-l border-[#222d34] flex flex-col flex-shrink-0 z-20 animate-slide-left overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222d34] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#aebac1] hover:text-[#e9edef] hover:bg-[#374248] transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold text-[#e9edef]">
            {isGroup ? 'Group Info' : 'Contact Info'}
          </h2>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/60">
        {/* Profile / Group Avatar & Title Card */}
        <div className="p-6 flex flex-col items-center bg-[#111b21] text-center">
          <div
            onClick={() => canEditInfo && fileInputRef.current?.click()}
            className={`relative w-32 h-32 rounded-full overflow-hidden shadow-xl mb-4 border-2 border-[#2a3942] ${
              canEditInfo ? 'cursor-pointer group' : ''
            }`}
          >
            <Avatar
              src={activeChat.avatar}
              name={activeChat.name}
              size="xl"
              className="w-full h-full"
            />
            {canEditInfo && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[9px] uppercase tracking-wider font-semibold">
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

          {/* Group / Contact Name */}
          <div className="w-full">
            {isEditingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#202c33] text-[#e9edef] text-base font-semibold text-center rounded-lg px-3 py-1 outline-none border border-[#00a884]"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-full bg-[#00a884] text-[#111b21]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-lg font-bold text-[#e9edef] truncate">
                  {activeChat.name}
                </h3>
                {canEditInfo && isGroup && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-[#8696a0] hover:text-[#e9edef]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-[#8696a0] mt-1 font-mono">
              {isGroup
                ? `Group • ${participants.length} participants`
                : activeChat.otherUser?.phone}
            </p>
          </div>
        </div>

        {/* Description / About */}
        <div className="p-4 bg-[#111b21] space-y-1">
          <span className="text-xs font-semibold text-[#00a884]">
            {isGroup ? 'Group Description' : 'About'}
          </span>
          {isEditingDesc ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a group description..."
                className="flex-1 bg-[#202c33] text-xs text-[#e9edef] rounded px-3 py-1.5 outline-none border border-[#00a884]"
                autoFocus
              />
              <button
                onClick={handleSaveDesc}
                className="p-1.5 rounded-full bg-[#00a884] text-[#111b21]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <p className="text-xs text-[#e9edef] leading-relaxed">
                {activeChat.description ||
                  (isGroup ? 'No description added yet.' : activeChat.otherUser?.about)}
              </p>
              {canEditInfo && isGroup && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-[#8696a0] hover:text-[#e9edef] ml-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {isGroup && activeChat.createdAt && (
            <p className="text-[10px] text-[#8696a0] pt-2">
              Created on {format(new Date(activeChat.createdAt), 'MMMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Group Admin Permissions Card (Admin Only) */}
        {isGroup && isAdmin && (
          <div className="p-4 bg-[#182229] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#ffd279]">
              <Shield className="w-4 h-4 text-[#ffd279]" />
              <span>Group Settings & Admin Controls</span>
            </div>

            {/* Toggle Send Messages */}
            <div className="flex items-center justify-between bg-[#202c33] p-3 rounded-xl border border-[#2a3942]">
              <div>
                <p className="text-xs font-semibold text-[#e9edef]">
                  Send Messages
                </p>
                <p className="text-[11px] text-[#8696a0]">
                  {activeChat.adminOnlyMessage
                    ? 'Only group admins can send messages'
                    : 'All participants can send messages'}
                </p>
              </div>
              <button
                onClick={handleToggleAdminOnlyMessage}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                  activeChat.adminOnlyMessage ? 'bg-[#00a884]' : 'bg-[#374248]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                    activeChat.adminOnlyMessage ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Edit Group Info */}
            <div className="flex items-center justify-between bg-[#202c33] p-3 rounded-xl border border-[#2a3942]">
              <div>
                <p className="text-xs font-semibold text-[#e9edef]">
                  Edit Group Info
                </p>
                <p className="text-[11px] text-[#8696a0]">
                  {activeChat.adminOnlyInfo
                    ? 'Only group admins can change subject & icon'
                    : 'All participants can edit group info'}
                </p>
              </div>
              <button
                onClick={handleToggleAdminOnlyInfo}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                  activeChat.adminOnlyInfo ? 'bg-[#00a884]' : 'bg-[#374248]'
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

        {/* Participants Section (For Groups) */}
        {isGroup && (
          <div className="p-4 bg-[#111b21] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8696a0]">
                {participants.length} Participants
              </span>
              {isAdmin && (
                <button
                  onClick={openAddMembersModal}
                  className="flex items-center gap-1.5 text-xs text-[#00a884] font-semibold hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Participants
                </button>
              )}
            </div>

            {/* Participant Items */}
            <div className="divide-y divide-[#222d34]/40">
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
                        <p className="text-xs font-semibold text-[#e9edef] truncate">
                          {isMe ? 'You' : p.name}
                        </p>
                        <p className="text-[10px] text-[#8696a0] truncate">
                          {p.phone}
                        </p>
                      </div>
                    </div>

                    {/* Role Badges & Admin Actions */}
                    <div className="flex items-center gap-2">
                      {isMemberCreator && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5" /> Creator
                        </span>
                      )}
                      {isMemberAdmin && !isMemberCreator && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30">
                          Group Admin
                        </span>
                      )}

                      {/* Admin action dropdown on other members */}
                      {isAdmin && !isMe && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          {isMemberAdmin ? (
                            !isMemberCreator && (
                              <button
                                onClick={() => handleChangeRole(p.userId, 'MEMBER')}
                                className="p-1 rounded text-[#8696a0] hover:text-[#ffd279] hover:bg-[#202c33]"
                                title="Dismiss as Admin"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => handleChangeRole(p.userId, 'ADMIN')}
                              className="p-1 rounded text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33]"
                              title="Make Group Admin"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isMemberCreator && (
                            <button
                              onClick={() => handleRemoveMember(p.userId, p.name)}
                              className="p-1 rounded text-[#8696a0] hover:text-red-400 hover:bg-red-500/20"
                              title="Remove from Group"
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

        {/* Exit & Delete Actions */}
        <div className="p-4 bg-[#111b21] space-y-2">
          {isGroup ? (
            <>
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#202c33] hover:bg-red-500/10 text-red-400 font-semibold text-xs transition border border-[#2a3942]"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Group</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleDeleteGroup}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#202c33] hover:bg-red-500/20 text-red-400 font-semibold text-xs transition border border-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Group for Everyone</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleDeleteGroup}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#202c33] hover:bg-red-500/20 text-red-400 font-semibold text-xs transition border border-[#2a3942]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Conversation</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Members Sub-Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#111b21] rounded-2xl shadow-2xl border border-[#222d34] overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34]">
              <h3 className="text-sm font-semibold text-[#e9edef] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#00a884]" />
                Add Members to Group
              </h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-[#222d34]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full bg-[#202c33] text-xs text-[#e9edef] rounded-lg pl-8 pr-3 py-2 outline-none border border-[#2a3942]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#222d34]/40">
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
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                        isSelected ? 'bg-[#00a884]/20' : 'hover:bg-[#202c33]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-[#e9edef]">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-[#8696a0]">{u.phone}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#00a884] border-[#00a884] text-[#111b21]'
                            : 'border-[#8696a0]/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-3 bg-[#202c33] border-t border-[#222d34] flex justify-end gap-2">
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="px-4 py-1.5 text-xs text-[#8696a0] hover:text-[#e9edef]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembersSubmit}
                disabled={selectedUserIds.length === 0}
                className="px-4 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
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
