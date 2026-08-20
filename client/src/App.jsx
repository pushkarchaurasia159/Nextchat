import React from 'react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';
import AuthModal from './components/auth/AuthModal';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';

function App() {
  const { user, loading } = useAuth();
  const { activeChatId, selectChat } = useChat();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#111b21] space-y-4">
        <img
          src="/logo.png"
          alt="NextChat"
          className="w-16 h-16 rounded-2xl animate-pulse drop-shadow-[0_0_15px_rgba(0,168,132,0.6)]"
        />
        <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#8696a0] font-medium tracking-wide">
          Loading NextChat...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="h-screen w-screen bg-[#0c1317] flex items-center justify-center overflow-hidden lg:p-3">
      {/* WhatsApp Desktop Container Box */}
      <div className="w-full h-full lg:max-w-[1700px] lg:h-[96vh] bg-[#111b21] rounded-none lg:rounded-xl shadow-2xl flex overflow-hidden border border-[#222d34]">
        {/* Sidebar: Visible on desktop or when no chat is active on mobile */}
        <div
          className={`h-full ${
            activeChatId ? 'hidden md:flex' : 'flex w-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Chat Area: Visible on desktop or when a chat is selected on mobile */}
        <div
          className={`h-full flex-1 ${
            activeChatId ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatArea onBackToSidebar={() => selectChat(null)} />
        </div>
      </div>
    </div>
  );
}

export default App;
