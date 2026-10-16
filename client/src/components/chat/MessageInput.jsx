import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import AudioRecorder from './AudioRecorder';
import AICopilotModal from './AICopilotModal';
import EmojiPicker from 'emoji-picker-react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  X,
  Lock,
  Sparkles,
  BarChart3,
  Flame,
  Code,
  Plus
} from 'lucide-react';

const TIMER_OPTIONS = [
  { label: 'Off', seconds: null },
  { label: '5 sec', seconds: 5 },
  { label: '30 sec', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '1 hour', seconds: 3600 }
];

const MessageInput = () => {
  const { user } = useAuth();
  const { activeChat, sendMessage, replyingTo, setReplyingTo } = useChat();
  const { socket } = useSocket();

  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState(null); // seconds

  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Poll Creator State
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollIsMulti, setPollIsMulti] = useState(false);

  // AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);

  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isGroup = activeChat?.isGroup;
  const myParticipant = activeChat?.participants?.find((p) => p.userId === user?.id);
  const myRole = myParticipant ? myParticipant.role : 'MEMBER';
  const isAdmin = myRole === 'ADMIN';
  const isMessageLocked = isGroup && activeChat?.adminOnlyMessage && !isAdmin;

  useEffect(() => {
    if (!isMessageLocked && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeChat?.id, isMessageLocked]);

  const handleTextChange = (e) => {
    setText(e.target.value);

    if (socket && activeChat) {
      socket.emit('typing', {
        chatId: activeChat.id,
        userName: user?.name
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { chatId: activeChat.id });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !selectedFile) || isMessageLocked) return;

    try {
      if (socket && activeChat) {
        socket.emit('stop_typing', { chatId: activeChat.id });
      }

      await sendMessage({
        content: text.trim(),
        file: selectedFile,
        replyToId: replyingTo?.id,
        selfDestructDuration: selectedTimer
      });

      setText('');
      setSelectedFile(null);
      setFilePreview(null);
      setShowEmoji(false);
      setShowAttachmentMenu(false);
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setShowAttachmentMenu(false);
    }
  };

  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(null);
      setShowAttachmentMenu(false);
    }
  };

  const handleSendVoiceNote = async (audioFile) => {
    setIsRecording(false);
    try {
      await sendMessage({
        file: audioFile,
        type: 'AUDIO',
        replyToId: replyingTo?.id,
        selfDestructDuration: selectedTimer
      });
    } catch (err) {
      alert('Failed to send voice note');
    }
  };

  // Poll Submit
  const handleCreatePollSubmit = async (e) => {
    e.preventDefault();
    const cleanOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || cleanOptions.length < 2) {
      alert('Please enter a question and at least 2 options');
      return;
    }

    const pollDataObj = {
      question: pollQuestion.trim(),
      options: cleanOptions.map((opt, idx) => ({ id: idx + 1, text: opt, votes: [] })),
      isMulti: pollIsMulti
    };

    try {
      await sendMessage({
        content: `📊 Poll: ${pollQuestion.trim()}`,
        type: 'POLL',
        pollData: pollDataObj
      });
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (err) {
      alert('Failed to create poll');
    }
  };

  if (isMessageLocked) {
    return (
      <div className="glass-panel p-4 text-center border-t border-white/10 flex items-center justify-center gap-2 text-slate-400 text-xs select-none">
        <Lock className="w-4 h-4 text-sky-400" />
        <span>Only group admins can send messages</span>
      </div>
    );
  }

  return (
    <div className="relative glass-panel bg-[#0E1A34]/90 px-4 py-2.5 border-t border-sky-400/10 z-20">
      {/* Replying Banner */}
      {replyingTo && (
        <div className="mb-2 p-2.5 glass-card border-l-4 border-sky-400 rounded-xl flex items-center justify-between text-xs animate-slide-up">
          <div className="min-w-0 pr-4">
            <span className="text-sky-400 font-bold block">
              Replying to {replyingTo.sender?.name || 'Message'}
            </span>
            <span className="text-slate-300 truncate block">
              {replyingTo.content || 'Attachment'}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Preview Banner */}
      {selectedFile && (
        <div className="mb-2 p-2.5 glass-card rounded-xl flex items-center justify-between border border-sky-400/30 animate-slide-up">
          <div className="flex items-center gap-3">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-lg"
              />
            ) : (
              <FileText className="w-8 h-8 text-sky-400" />
            )}
            <div>
              <p className="text-xs font-bold text-white truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="p-1 text-slate-400 hover:text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-3xl overflow-hidden animate-pop">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme="dark"
            lazyLoadEmojis={true}
            searchPlaceHolder="Search emoji..."
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Voice Recorder */}
      {isRecording ? (
        <AudioRecorder
          onSendAudio={handleSendVoiceNote}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        /* Message Input Bar */
        <div className="flex items-end gap-2">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            {/* Emoji */}
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-full hover:bg-white/10 transition ${
                showEmoji ? 'text-sky-400' : 'hover:text-white'
              }`}
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Attachments */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-2 rounded-full hover:bg-white/10 transition ${
                  showAttachmentMenu ? 'text-sky-400' : 'hover:text-white'
                }`}
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {showAttachmentMenu && (
                <div
                  className="absolute bottom-14 left-0 glass-panel bg-[#070D1E]/95 border border-sky-400/20 rounded-2xl shadow-2xl p-2 z-40 flex flex-col gap-1 w-48 animate-pop text-xs"
                  onMouseLeave={() => setShowAttachmentMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-slate-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>Photo / Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-slate-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPollModal(true);
                      setShowAttachmentMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-slate-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span>Create Live Poll</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + '\n```javascript\n// Code snippet\n\n```\n');
                      setShowAttachmentMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-slate-200"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Code className="w-4 h-4" />
                    </div>
                    <span>Code Snippet</span>
                  </button>
                </div>
              )}
            </div>

            {/* Self-Destruct Timer Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTimerMenu(!showTimerMenu)}
                className={`p-2 rounded-full hover:bg-white/10 transition ${
                  selectedTimer ? 'text-rose-400 bg-rose-500/20' : 'hover:text-white'
                }`}
                title="Ephemeral Timer"
              >
                <Flame className="w-5 h-5" />
              </button>

              {showTimerMenu && (
                <div
                  className="absolute bottom-14 left-0 glass-panel bg-[#070D1E]/95 border border-rose-500/30 rounded-2xl shadow-2xl p-2 z-40 flex flex-col gap-1 w-40 animate-pop text-xs"
                  onMouseLeave={() => setShowTimerMenu(false)}
                >
                  <span className="text-[10px] uppercase font-bold text-rose-400 px-2 py-1">
                    Self-Destruct Timer
                  </span>
                  {TIMER_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setSelectedTimer(opt.seconds);
                        setShowTimerMenu(false);
                      }}
                      className={`p-2 rounded-xl text-left transition ${
                        selectedTimer === opt.seconds
                          ? 'bg-rose-500/20 text-rose-300 font-bold'
                          : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ask AI Assistant */}
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="p-2 rounded-full hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 transition"
              title="NextBot AI Copilot"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocSelect}
              className="hidden"
            />
          </div>

          {/* Text Input Box */}
          <div className="flex-1 glass-input rounded-2xl px-4 py-2.5 flex items-center border border-sky-400/20 focus-within:border-sky-400/60 transition">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type a message or @ai to ask assistant..."
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none resize-none max-h-32"
            />
          </div>

          {/* Send / Mic Action */}
          <div className="mb-1">
            {text.trim() || selectedFile ? (
              <button
                type="button"
                onClick={handleSend}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/25 transition font-bold"
                title="Send"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/25 transition font-bold"
                title="Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Copilot Modal */}
      <AICopilotModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop">
          <div className="w-full max-w-md glass-panel bg-[#070D1E] rounded-3xl shadow-2xl border border-sky-400/25 overflow-hidden flex flex-col">
            <div className="p-4 bg-[#0E1A34]/80 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Create Live Poll
              </h3>
              <button
                onClick={() => setShowPollModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Poll Question
                </label>
                <input
                  type="text"
                  placeholder="e.g. Which design direction do you prefer?"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full glass-input text-xs text-white rounded-xl px-3 py-2.5 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Options
                </label>
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="w-full glass-input text-xs text-white rounded-xl px-3 py-2 outline-none"
                    required
                  />
                ))}

                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Option
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="checkbox"
                  id="multiChoice"
                  checked={pollIsMulti}
                  onChange={(e) => setPollIsMulti(e.target.checked)}
                  className="rounded accent-sky-500 cursor-pointer"
                />
                <label htmlFor="multiChoice" className="text-xs text-slate-300 cursor-pointer select-none">
                  Allow multiple answers
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg"
                >
                  Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
