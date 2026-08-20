import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { ArrowLeft, Camera, Check, Edit2 } from 'lucide-react';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));

      // Auto save avatar
      try {
        setSaving(true);
        const formData = new FormData();
        formData.append('avatar', file);
        await updateProfile(formData);
      } catch (err) {
        console.error('Failed to update avatar:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      await updateProfile(formData);
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('about', about.trim());
      await updateProfile(formData);
      setIsEditingAbout(false);
    } catch (err) {
      console.error('Failed to update about:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#111b21] flex flex-col animate-slide-right">
      {/* Header */}
      <div className="h-28 bg-[#202c33] px-6 pb-4 flex items-end gap-6 text-[#e9edef] border-b border-[#222d34]">
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#aebac1] hover:text-[#e9edef] hover:bg-[#374248] transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar Area */}
        <div className="flex flex-col items-center justify-center my-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-36 h-36 rounded-full cursor-pointer group shadow-xl overflow-hidden border-2 border-[#2a3942]"
          >
            <Avatar
              src={avatarPreview || user?.avatar}
              name={user?.name}
              size="xl"
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-semibold tracking-wider">
                Change Profile Photo
              </span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarSelect}
            accept="image/*"
            className="hidden"
          />
          {saving && (
            <span className="text-xs text-[#00a884] mt-2 animate-pulse">
              Saving changes...
            </span>
          )}
        </div>

        {/* Your Name */}
        <div className="bg-[#202c33] p-4 rounded-xl space-y-2 border border-[#222d34]">
          <span className="text-xs font-medium text-[#00a884]">Your Name</span>
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="flex-1 bg-[#111b21] text-[#e9edef] text-sm rounded px-2.5 py-1.5 outline-none border border-[#00a884]"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#02906f]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-[#e9edef]">{user?.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-[#8696a0] hover:text-[#e9edef] p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <p className="text-[11px] text-[#8696a0]">
            This is not your username or PIN. This name will be visible to your NextChat contacts.
          </p>
        </div>

        {/* About */}
        <div className="bg-[#202c33] p-4 rounded-xl space-y-2 border border-[#222d34]">
          <span className="text-xs font-medium text-[#00a884]">About</span>
          <div className="flex items-center justify-between">
            {isEditingAbout ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  autoFocus
                  className="flex-1 bg-[#111b21] text-[#e9edef] text-sm rounded px-2.5 py-1.5 outline-none border border-[#00a884]"
                />
                <button
                  onClick={handleSaveAbout}
                  className="p-1.5 rounded-full bg-[#00a884] text-[#111b21] hover:bg-[#02906f]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-[#e9edef]">{user?.about}</span>
                <button
                  onClick={() => setIsEditingAbout(true)}
                  className="text-[#8696a0] hover:text-[#e9edef] p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Phone Number (Read-only) */}
        <div className="bg-[#202c33] p-4 rounded-xl space-y-1 border border-[#222d34]">
          <span className="text-xs font-medium text-[#00a884]">Phone Number</span>
          <p className="text-sm font-mono text-[#e9edef]">{user?.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
