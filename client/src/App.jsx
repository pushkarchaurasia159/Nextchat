import React from 'react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';
import { useTheme } from './context/ThemeContext';
import AuthModal from './components/auth/AuthModal';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';

function App() {
  const { user, loading } = useAuth();
  const { activeChatId, selectChat } = useChat();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#080b11] space-y-4">
        <div className="relative">
          <img
            src="/logo.png"
            alt="NextChat"
            className="w-16 h-16 rounded-3xl animate-pulse drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]"
          />
        </div>
        <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Initializing NextChat 2.0...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="h-screen w-screen bg-[#080b11] flex items-center justify-center overflow-hidden lg:p-3 select-none">
      {/* Desktop Container */}
      <div className="w-full h-full lg:max-w-[1750px] lg:h-[96vh] glass-panel rounded-none lg:rounded-3xl shadow-2xl flex overflow-hidden border border-white/10 relative">
        {/* Sidebar */}
        <div
          className={`h-full ${
            activeChatId ? 'hidden md:flex' : 'flex w-full'
          }`}
        >
          <Sidebar />
        </div>

        {/* Chat Area */}
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
