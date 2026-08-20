import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import Ticks from '../common/Ticks';
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
  Image as ImageIcon
} from 'lucide-react';

const MessageBubble = ({ message, onViewMedia }) => {
  const { user } = useAuth();
  const { activeChat, setReplyingTo, deleteMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef(null);

  const isMe = message.senderId === user?.id;
  const isGroup = activeChat?.isGroup;
  const isSystem = message.type === 'SYSTEM';

  // Admin privileges check for delete for everyone
  const myParticipant = activeChat?.participants?.find((p) => p.userId === user?.id);
  const isAdmin = myParticipant?.role === 'ADMIN';
  const canDeleteForEveryone = isMe || (isGroup && isAdmin);

  // System Message Render
  if (isSystem) {
    return (
      <div className="flex justify-center my-2 px-4 animate-fade-in">
        <div className="bg-[#182229] border border-[#222d34] text-[#8696a0] text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm text-center max-w-md">
          {message.content}
        </div>
      </div>
    );
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

  const handleDeleteForMe = () => {
    deleteMessage(message.id, false);
    setShowMenu(false);
  };

  const handleDeleteForEveryone = () => {
    if (window.confirm('Delete this message for everyone in the chat?')) {
      deleteMessage(message.id, true);
    }
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

  return (
    <div
      className={`group relative flex flex-col mb-1.5 px-3 sm:px-6 ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-lg px-3 py-1.5 shadow-md transition-all ${
          isMe
            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
        }`}
      >
        {/* Hover Menu Trigger */}
        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-[#aebac1] hover:text-white transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Context Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-6 w-44 bg-[#233138] border border-[#2a3942] rounded-lg shadow-2xl py-1 z-30 animate-fade-in text-xs"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={handleReply}
                className="w-full px-3 py-2 text-left hover:bg-[#182229] flex items-center gap-2 text-[#e9edef]"
              >
                <Reply className="w-3.5 h-3.5 text-[#8696a0]" /> Reply
              </button>
              {message.content && !message.isDeleted && (
                <button
                  onClick={handleCopy}
                  className="w-full px-3 py-2 text-left hover:bg-[#182229] flex items-center gap-2 text-[#e9edef]"
                >
                  <Copy className="w-3.5 h-3.5 text-[#8696a0]" /> Copy
                </button>
              )}
              <div className="h-px bg-[#2a3942] my-1" />
              <button
                onClick={handleDeleteForMe}
                className="w-full px-3 py-2 text-left hover:bg-[#182229] flex items-center gap-2 text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete for me
              </button>
              {canDeleteForEveryone && !message.isDeleted && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full px-3 py-2 text-left hover:bg-[#182229] flex items-center gap-2 text-red-400 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete for everyone
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sender Name in Group Chat */}
        {isGroup && !isMe && message.sender && (
          <div className="text-xs font-semibold text-[#00a884] mb-0.5">
            {message.sender.name}
          </div>
        )}

        {/* Quoted / Replied Message */}
        {message.replyTo && (
          <div
            className={`mb-1.5 p-2 rounded-md border-l-4 text-xs ${
              isMe
                ? 'bg-[#025143] border-[#00a884]'
                : 'bg-[#182229] border-[#53bdeb]'
            }`}
          >
            <div className="font-semibold text-[#53bdeb] text-[11px] mb-0.5">
              {message.replyTo.sender?.name || 'User'}
            </div>
            <p className="text-[#8696a0] truncate">
              {message.replyTo.isDeleted
                ? '🚫 Message deleted'
                : message.replyTo.type === 'IMAGE'
                ? '📷 Photo'
                : message.replyTo.type === 'AUDIO'
                ? '🎤 Voice Message'
                : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Deleted Message State */}
        {message.isDeleted ? (
          <div className="italic text-[#8696a0] flex items-center gap-1.5 py-1 text-xs">
            <span>🚫 This message was deleted</span>
          </div>
        ) : (
          <>
            {/* Image Attachment */}
            {message.type === 'IMAGE' && message.mediaUrl && (
              <div className="my-1 rounded-lg overflow-hidden cursor-pointer max-w-sm">
                <img
                  src={message.mediaUrl}
                  alt="Attachment"
                  onClick={() => onViewMedia(message.mediaUrl, message.fileName)}
                  className="max-h-72 w-full object-cover rounded-lg hover:opacity-95 transition"
                />
              </div>
            )}

            {/* Voice Message / Audio */}
            {message.type === 'AUDIO' && message.mediaUrl && (
              <div className="my-1 flex items-center gap-3 bg-black/20 p-2.5 rounded-xl min-w-[220px]">
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
                  className="w-9 h-9 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center hover:scale-105 transition flex-shrink-0"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Progress bar */}
                <div className="flex-1 flex flex-col justify-center gap-1">
                  <div className="w-full bg-[#2a3942] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00a884] h-full transition-all duration-100"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8696a0]">Voice Message</span>
                </div>
              </div>
            )}

            {/* Document Attachment */}
            {message.type === 'DOCUMENT' && message.mediaUrl && (
              <div className="my-1 flex items-center justify-between gap-3 bg-black/20 p-2.5 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-[#00a884]/20 text-[#00a884]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#e9edef] truncate">
                      {message.fileName || 'Attachment'}
                    </p>
                    {message.fileSize && (
                      <p className="text-[10px] text-[#8696a0]">
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
                  className="p-1.5 rounded-full hover:bg-white/10 text-[#aebac1] transition"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Text Message Content */}
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-12 pb-1">
                {message.content}
              </p>
            )}
          </>
        )}

        {/* Timestamp & Ticks Footer */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] -mt-1 float-right ml-2 select-none">
          <span>{format(new Date(message.createdAt || Date.now()), 'h:mm a')}</span>
          {isMe && !message.isDeleted && (
            <Ticks status={message.status} className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
