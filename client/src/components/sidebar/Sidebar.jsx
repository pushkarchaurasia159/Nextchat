import React, { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import ChatList from './ChatList';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';
import ProfileDrawer from './ProfileDrawer';

const Sidebar = () => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] h-full flex flex-col glass-panel border-r border-white/10 flex-shrink-0 relative overflow-hidden">
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <SidebarHeader
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <ChatList onOpenNewChat={() => setIsNewChatOpen(true)} />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
