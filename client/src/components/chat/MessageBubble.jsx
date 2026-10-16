import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import Ticks from '../common/Ticks';
import ReactionPicker from './ReactionPicker';
import PollCard from './PollCard';
import CodeBlock from './CodeBlock';
import SelfDestructTimer from './SelfDestructTimer';
import { format } from 'date-fns';
import {
  Reply,
  Trash2,
  Copy,
  ChevronDown,
  FileText,
  Download,
  Play,
  Pause,
  Pin,
  Smile,
  Flame,
  Bot
} from 'lucide-react';

const MessageBubble = ({ message, onViewMedia }) => {
  const { user } = useAuth();
  const { activeChat, setReplyingTo, deleteMessage, reactToMessage, pinMessage } = useChat();
  const { theme } = useTheme();

  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);

  const isMe = message.senderId === user?.id;
  const isGroup = activeChat?.isGroup;
  const isSystem = message.type === 'SYSTEM';
  const isAI = message.type === 'AI';

  const myParticipant = activeChat?.participants?.find((p) => p.userId === user?.id);
  const isAdmin = myParticipant?.role === 'ADMIN';
  const canDeleteForEveryone = isMe || (isGroup && isAdmin);

  // System Message Render
  if (isSystem) {
    return (
      <div className="flex justify-center my-2.5 px-4 animate-pop">
        <div className="glass-card bg-[#0E1A34]/60 border border-sky-400/15 text-slate-300 text-[11px] px-4 py-1.5 rounded-full shadow-lg text-center max-w-md">
          {message.content}
        </div>
      </div>
    );
  }

  // Parse reactions map
  let reactions = {};
  try {
    reactions = typeof message.reactions === 'string' ? JSON.parse(message.reactions || '{}') : (message.reactions || {});
  } catch {
    reactions = {};
  }

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setShowMenu(false);
    }
  };

  const handleReply = () => {
    setReplyingTo(message);
    setShowMenu(false);
  };

  const handleTogglePin = () => {
    pinMessage(message.id);
    setShowMenu(false);
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(isNaN(prog) ? 0 : prog);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  // Check if content is a markdown code block
  const isCode = message.type === 'CODE' || (message.content && message.content.startsWith('```') && message.content.endsWith('```'));
  const cleanCode = isCode ? message.content.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '') : '';

  return (
    <div
      className={`group relative flex flex-col mb-2 px-3 sm:px-6 transition-all ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Floating Reaction Picker */}
      {showReactionPicker && (
        <div className={`absolute -top-10 z-40 ${isMe ? 'right-6' : 'left-6'}`}>
          <ReactionPicker
            onSelectEmoji={(emoji) => reactToMessage(message.id, emoji)}
            onClose={() => setShowReactionPicker(false)}
          />
        </div>
      )}

      <div
        className={`relative max-w-[88%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-xl border backdrop-blur-xl transition duration-200 ${
          isMe
            ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400/25 rounded-tr-none shadow-[0_4px_20px_rgba(2,132,199,0.22)]'
            : isAI
            ? 'bg-gradient-to-r from-purple-950/70 to-[#0E1A34]/80 text-white border-purple-500/30 rounded-tl-none'
            : 'bg-[#13203E]/90 text-slate-100 border-sky-400/10 rounded-tl-none shadow-md'
        }`}
      >
        {/* Pinned Marker */}
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-300 mb-1">
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned</span>
          </div>
        )}

        {/* Ephemeral Timer */}
        {message.expiresAt && !message.isDeleted && (
          <div className="absolute -top-3 right-3 z-20">
            <SelfDestructTimer
              expiresAt={message.expiresAt}
              duration={message.selfDestructDuration || 30}
            />
          </div>
        )}

        {/* Action Trigger Buttons on Hover */}
        <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition z-20 flex items-center gap-0.5">
          {/* Reaction Trigger Button */}
          <button
            type="button"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1 rounded-full bg-[#070D1E]/70 hover:bg-[#070D1E] text-slate-300 hover:text-white transition"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Context Menu Trigger */}
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full bg-[#070D1E]/70 hover:bg-[#070D1E] text-slate-300 hover:text-white transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Context Dropdown */}
          {showMenu && (
            <div
              className="absolute right-0 top-7 w-44 glass-panel bg-[#070D1E]/95 border border-sky-400/20 rounded-xl shadow-2xl py-1 z-50 text-xs animate-pop"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={handleReply}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-slate-200"
              >
                <Reply className="w-3.5 h-3.5 text-sky-400" /> Reply
              </button>
              <button
                onClick={handleTogglePin}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-slate-200"
              >
                <Pin className="w-3.5 h-3.5 text-amber-400" /> {message.isPinned ? 'Unpin Message' : 'Pin Message'}
              </button>
              {message.content && !message.isDeleted && (
                <button
                  onClick={handleCopy}
                  className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-slate-200"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Text
                </button>
              )}
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => {
                  deleteMessage(message.id, false);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete for me
              </button>
              {canDeleteForEveryone && !message.isDeleted && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete message for everyone?')) {
                      deleteMessage(message.id, true);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-rose-400 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sender Name in Group Chat or AI badge */}
        {isAI ? (
          <div className="flex items-center gap-1 text-xs font-bold text-purple-400 mb-1">
            <Bot className="w-3.5 h-3.5" />
            <span>NextBot AI</span>
          </div>
        ) : (
          isGroup && !isMe && message.sender && (
            <div className="text-xs font-bold text-sky-400 mb-0.5">
              {message.sender.name}
            </div>
          )
        )}

        {/* Quoted / Replied Message */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-xl border-l-4 border-sky-400 bg-black/25 text-xs">
            <span className="font-bold text-sky-300 block mb-0.5">
              {message.replyTo.sender?.name || 'User'}
            </span>
            <p className="text-slate-300 truncate">
              {message.replyTo.content || 'Attachment'}
            </p>
          </div>
        )}

        {/* Deleted Message */}
        {message.isDeleted ? (
          <div className="italic text-slate-400 py-1 text-xs">
            🚫 This message was deleted
          </div>
        ) : (
          <>
            {/* Poll Component */}
            {message.type === 'POLL' && <PollCard message={message} />}

            {/* Code Block Component */}
            {isCode && <CodeBlock code={cleanCode} />}

            {/* Image Attachment */}
            {message.type === 'IMAGE' && message.mediaUrl && (
              <div className="my-1 rounded-xl overflow-hidden cursor-pointer max-w-sm">
                <img
                  src={message.mediaUrl}
                  alt="Attachment"
                  onClick={() => onViewMedia(message.mediaUrl, message.fileName)}
                  className="max-h-72 w-full object-cover rounded-xl hover:scale-[1.02] transition duration-200"
                />
              </div>
            )}

            {/* Voice Message */}
            {message.type === 'AUDIO' && message.mediaUrl && (
              <div className="my-1 flex items-center gap-3 bg-black/25 p-2.5 rounded-2xl min-w-[220px]">
                <audio
                  ref={audioRef}
                  src={message.mediaUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onEnded={handleAudioEnded}
                  preload="metadata"
                />
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-9 h-9 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 transition flex-shrink-0 font-bold"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex-1 flex flex-col justify-center gap-1">
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-full transition-all duration-100"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-300">Voice Note</span>
                </div>
              </div>
            )}

            {/* Document Attachment */}
            {message.type === 'DOCUMENT' && message.mediaUrl && (
              <div className="my-1 flex items-center justify-between gap-3 bg-black/25 p-2.5 rounded-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate">
                      {message.fileName || 'Attachment'}
                    </p>
                    {message.fileSize && (
                      <p className="text-[10px] text-slate-400">
                        {(message.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={message.mediaUrl}
                  download={message.fileName || 'file'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full hover:bg-white/15 text-slate-300 transition"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Text Message Content */}
            {!isCode && message.type !== 'POLL' && message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-12 pb-0.5 font-normal">
                {message.content}
              </p>
            )}
          </>
        )}

        {/* Message Footer: Timestamp & Read Status */}
        <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300/80 float-right ml-2 select-none -mt-0.5">
          <span>{format(new Date(message.createdAt || Date.now()), 'h:mm a')}</span>
          {isMe && !message.isDeleted && (
            <Ticks status={message.status} className="w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {/* Emoji Reactions Badges */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 z-10 animate-pop">
          {Object.entries(reactions).map(([emoji, uids]) => {
            if (!uids || uids.length === 0) return null;
            const hasReacted = uids.includes(user?.id);
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => reactToMessage(message.id, emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs glass-card border transition ${
                  hasReacted
                    ? 'border-sky-400/60 bg-sky-950/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                    : 'border-white/10 bg-[#0E1A34]/80 text-slate-300 hover:border-white/20'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-mono text-[10px] font-bold">{uids.length}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
