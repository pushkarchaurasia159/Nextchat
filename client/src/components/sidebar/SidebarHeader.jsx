import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import ThemeSelector from '../common/ThemeSelector';
import {
  MessageSquarePlus,
  Users,
  User,
  LogOut,
  Palette,
  Ghost,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';

const SidebarHeader = ({ onOpenNewChat, onOpenNewGroup, onOpenProfile }) => {
  const { user, ghostMode, soundEnabled, toggleGhostMode, toggleSound, logout } = useAuth();
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <div className="h-16 glass-panel bg-[#0E1A34]/90 px-4 flex items-center justify-between border-b border-sky-400/10 flex-shrink-0 z-20">
      {/* Current User Profile Info */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
        onClick={onOpenProfile}
        title="View Profile"
      >
        <Avatar
          src={user?.avatar}
          name={user?.name || 'User'}
          size="sm"
          isOnline={!ghostMode}
          showOnlineStatus={true}
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white group-hover:text-sky-400 transition truncate max-w-[120px] flex items-center gap-1">
            <span>{user?.name || 'My Profile'}</span>
            {ghostMode && <Ghost className="w-3 h-3 text-purple-400" />}
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
            {user?.phone}
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 text-slate-400">
        {/* Ghost Mode Toggle */}
        <button
          onClick={toggleGhostMode}
          className={`p-2 rounded-xl transition ${
            ghostMode
              ? 'bg-purple-500/25 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
              : 'hover:bg-white/10 hover:text-white'
          }`}
          title={ghostMode ? 'Ghost Mode Active (Invisible)' : 'Enable Ghost Mode'}
        >
          <Ghost className="w-4 h-4" />
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={toggleSound}
          className={`p-2 rounded-xl transition ${
            soundEnabled
              ? 'hover:bg-white/10 hover:text-sky-400'
              : 'text-slate-600 hover:bg-white/10'
          }`}
          title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme Selector */}
        <button
          onClick={() => setShowThemeModal(true)}
          className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition"
          title="Change Theme"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* New Group */}
        <button
          onClick={onOpenNewGroup}
          className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition"
          title="New Group"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* New Chat */}
        <button
          onClick={onOpenNewChat}
          className="p-2 rounded-xl hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition"
          title="New Direct Chat"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <ThemeSelector
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </div>
  );
};

export default SidebarHeader;
