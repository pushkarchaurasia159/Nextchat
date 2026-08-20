import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { MessageSquarePlus, Users, User, LogOut, Sun, Moon, Sparkles } from 'lucide-react';

const SidebarHeader = ({ onOpenNewChat, onOpenNewGroup, onOpenProfile, isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();

  return (
    <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222d34] flex-shrink-0">
      {/* Current User Info */}
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
        onClick={onOpenProfile}
        title="View Profile"
      >
        <Avatar
          src={user?.avatar}
          name={user?.name || 'User'}
          size="sm"
          isOnline={true}
          showOnlineStatus={true}
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[#e9edef] group-hover:text-[#00a884] transition truncate max-w-[130px]">
            {user?.name || 'My Profile'}
          </span>
          <span className="text-[11px] text-[#8696a0] truncate max-w-[130px]">
            {user?.phone}
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1 text-[#aebac1]">
        {/* New Group Button */}
        <button
          onClick={onOpenNewGroup}
          className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition"
          title="New Group"
        >
          <Users className="w-5 h-5" />
        </button>

        {/* New Direct Chat Button */}
        <button
          onClick={onOpenNewChat}
          className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition"
          title="New Chat"
        >
          <MessageSquarePlus className="w-5 h-5" />
        </button>

        {/* Profile Settings */}
        <button
          onClick={onOpenProfile}
          className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition"
          title="Profile Settings"
        >
          <User className="w-5 h-5" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-full hover:bg-red-500/20 text-[#aebac1] hover:text-red-400 transition"
          title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;
