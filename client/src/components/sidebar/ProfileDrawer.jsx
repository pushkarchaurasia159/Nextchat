import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { ArrowLeft, Camera, Check, Edit2, Ghost, Volume2, VolumeX, Palette } from 'lucide-react';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, updateProfile, ghostMode, soundEnabled, toggleGhostMode, toggleSound } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
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
      console.error(err);
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
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 glass-panel bg-[#070D1E]/95 flex flex-col animate-slide-right backdrop-blur-2xl">
      {/* Header */}
      <div className="h-28 bg-[#0E1A34]/60 px-6 pb-4 flex items-end gap-6 text-white border-b border-sky-400/10">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold">My Profile & Settings</h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar Area */}
        <div className="flex flex-col items-center justify-center my-2">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-32 h-32 rounded-3xl cursor-pointer group shadow-2xl overflow-hidden border-2 border-sky-400/40 p-1"
          >
            <Avatar
              src={avatarPreview || user?.avatar}
              name={user?.name}
              size="xl"
              className="w-full h-full rounded-2xl"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition rounded-2xl">
              <Camera className="w-6 h-6 mb-1 text-sky-400" />
              <span className="text-[9px] uppercase font-bold tracking-wider">
                Change Photo
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
            <span className="text-xs text-sky-400 mt-2 font-mono animate-pulse">
              Saving changes...
            </span>
          )}
        </div>

        {/* Display Name */}
        <div className="glass-card bg-[#0E1A34]/60 p-4 rounded-2xl space-y-1.5 border border-sky-400/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            Display Name
          </span>
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="flex-1 glass-input text-white text-xs rounded-xl px-3 py-1.5 outline-none"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-bold text-white">{user?.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* About / Status */}
        <div className="glass-card bg-[#0E1A34]/60 p-4 rounded-2xl space-y-1.5 border border-sky-400/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            About / Bio
          </span>
          <div className="flex items-center justify-between">
            {isEditingAbout ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  autoFocus
                  className="flex-1 glass-input text-white text-xs rounded-xl px-3 py-1.5 outline-none"
                />
                <button
                  onClick={handleSaveAbout}
                  className="p-1.5 rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-xs text-slate-300">{user?.about}</span>
                <button
                  onClick={() => setIsEditingAbout(true)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Privacy & Stealth Settings */}
        <div className="glass-card bg-[#0E1A34]/60 p-4 rounded-2xl space-y-3 border border-sky-400/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Ghost className="w-3.5 h-3.5" /> NextChat Stealth & Privacy
          </span>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Ghost Mode</p>
              <p className="text-[11px] text-slate-400">
                Hide presence, freeze last seen & suppress read ticks
              </p>
            </div>
            <button
              onClick={toggleGhostMode}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                ghostMode ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                  ghostMode ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <p className="text-xs font-bold text-white">UI Sound Effects</p>
              <p className="text-[11px] text-slate-400">
                Synthesized chimes for sent & received messages
              </p>
            </div>
            <button
              onClick={toggleSound}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                soundEnabled ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="glass-card bg-[#0E1A34]/60 p-4 rounded-2xl space-y-1 border border-sky-400/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            Verified Phone Number
          </span>
          <p className="text-xs font-mono font-bold text-white">{user?.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
