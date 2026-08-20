import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import AudioRecorder from './AudioRecorder';
import EmojiPicker from 'emoji-picker-react';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  FileText,
  X,
  Lock
} from 'lucide-react';

const MessageInput = () => {
  const { user } = useAuth();
  const { activeChat, sendMessage, replyingTo, setReplyingTo } = useChat();
  const { socket } = useSocket();

  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Group permission checks
  const isGroup = activeChat?.isGroup;
  const myParticipant = activeChat?.participants?.find((p) => p.userId === user?.id);
  const myRole = myParticipant ? myParticipant.role : 'MEMBER';
  const isAdmin = myRole === 'ADMIN';
  const isMessageLocked = isGroup && activeChat?.adminOnlyMessage && !isAdmin;

  // Auto focus input when chat changes
  useEffect(() => {
    if (!isMessageLocked && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeChat?.id, isMessageLocked]);

  // Handle typing status broadcast
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
        replyToId: replyingTo?.id
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
        replyToId: replyingTo?.id
      });
    } catch (err) {
      alert('Failed to send voice note');
    }
  };

  // If group is in Admin Only Messages mode and user is not Admin
  if (isMessageLocked) {
    return (
      <div className="bg-[#202c33] p-4 text-center border-t border-[#222d34] flex items-center justify-center gap-2 text-[#8696a0] text-xs select-none">
        <Lock className="w-4 h-4 text-[#00a884]" />
        <span>Only admins can send messages to this group</span>
      </div>
    );
  }

  return (
    <div className="relative bg-[#202c33] px-4 py-2 border-t border-[#222d34] z-20">
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-[#182229] border-l-4 border-[#00a884] rounded-lg flex items-center justify-between text-xs animate-slide-up">
          <div className="min-w-0 pr-4">
            <span className="text-[#00a884] font-semibold block">
              Replying to {replyingTo.sender?.name || 'Message'}
            </span>
            <span className="text-[#8696a0] truncate block">
              {replyingTo.content || (replyingTo.type === 'IMAGE' ? '📷 Photo' : 'Voice note')}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-[#8696a0] hover:text-[#e9edef]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected File Preview Banner */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-[#182229] rounded-lg flex items-center justify-between border border-[#2a3942] animate-slide-up">
          <div className="flex items-center gap-2">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <FileText className="w-8 h-8 text-[#00a884]" />
            )}
            <div>
              <p className="text-xs font-semibold text-[#e9edef] truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-[#8696a0]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="p-1 text-[#8696a0] hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden animate-fade-in">
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

      {/* Voice Recorder Mode */}
      {isRecording ? (
        <AudioRecorder
          onSendAudio={handleSendVoiceNote}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        /* Normal Input Bar */
        <div className="flex items-end gap-2">
          {/* Action buttons on left */}
          <div className="flex items-center gap-1 text-[#8696a0] mb-1">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-full hover:bg-[#374248] transition ${
                showEmoji ? 'text-[#00a884]' : 'hover:text-[#e9edef]'
              }`}
              title="Emoji"
            >
              <Smile className="w-6 h-6" />
            </button>

            {/* Attachment Menu Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-2 rounded-full hover:bg-[#374248] transition ${
                  showAttachmentMenu ? 'text-[#00a884]' : 'hover:text-[#e9edef]'
                }`}
                title="Attach"
              >
                <Paperclip className="w-6 h-6" />
              </button>

              {/* Attachment Popup Menu */}
              {showAttachmentMenu && (
                <div
                  className="absolute bottom-14 left-0 bg-[#233138] border border-[#2a3942] rounded-xl shadow-2xl p-2 z-40 flex flex-col gap-1 w-44 animate-slide-up text-xs"
                  onMouseLeave={() => setShowAttachmentMenu(false)}
                >
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#182229] text-[#e9edef] transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>Photos & Videos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#182229] text-[#e9edef] transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Document</span>
                  </button>
                </div>
              )}
            </div>

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

          {/* Textarea */}
          <div className="flex-1 bg-[#2a3942] rounded-xl px-4 py-2 flex items-center border border-transparent focus-within:border-[#00a884]/40 transition">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type a message"
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none resize-none max-h-32"
            />
          </div>

          {/* Right Action: Send or Mic */}
          <div className="mb-1">
            {text.trim() || selectedFile ? (
              <button
                type="button"
                onClick={handleSend}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition"
                title="Send message"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition"
                title="Record voice note"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
