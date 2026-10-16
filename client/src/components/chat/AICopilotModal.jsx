import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Sparkles,
  X,
  FileText,
  Languages,
  Wand2,
  Send,
  Bot,
  Zap,
  Check
} from 'lucide-react';

const AICopilotModal = ({ isOpen, onClose }) => {
  const { askAI } = useChat();
  const [prompt, setPrompt] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (actionType, customPrompt = null) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt && actionType !== 'SUMMARIZE') return;

    setLoading(true);
    setAiResult('');
    try {
      const res = await askAI({
        prompt: finalPrompt || 'Summarize the recent conversation',
        type: actionType,
        targetLanguage: targetLang
      });
      setAiResult(res);
    } catch (e) {
      setAiResult('Error generating AI response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop">
      <div className="w-full max-w-lg glass-panel bg-[#070D1E] rounded-3xl shadow-2xl border border-sky-400/25 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#0E1A34]/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-purple-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#070D1E] rounded-[10px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>NextBot AI Copilot</span>
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Instant Chat Assistant & Smart Tools
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action Pills */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleAction('SUMMARIZE')}
              className="p-2.5 rounded-xl glass-card bg-[#0E1A34]/60 border border-sky-400/20 hover:border-sky-400/50 text-left transition flex flex-col justify-between gap-2 group"
            >
              <FileText className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-200">
                Summarize Chat
              </span>
            </button>

            <button
              onClick={() => handleAction('REWRITE', prompt || 'Please review this message')}
              className="p-2.5 rounded-xl glass-card bg-[#0E1A34]/60 border border-purple-500/20 hover:border-purple-500/50 text-left transition flex flex-col justify-between gap-2 group"
            >
              <Wand2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-200">
                Refine Text
              </span>
            </button>

            <button
              onClick={() => handleAction('TRANSLATE', prompt || 'Hello everyone')}
              className="p-2.5 rounded-xl glass-card bg-[#0E1A34]/60 border border-emerald-500/20 hover:border-emerald-500/50 text-left transition flex flex-col justify-between gap-2 group"
            >
              <Languages className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold text-slate-200">
                Translate
              </span>
            </button>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              Ask AI or Enter Text to Process
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Write a project announcement for the team..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction('CHAT')}
                className="flex-1 glass-input text-xs text-white rounded-xl px-3 py-2.5 outline-none"
              />
              <button
                onClick={() => handleAction('CHAT')}
                disabled={loading || !prompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* AI Result Output */}
          {aiResult && (
            <div className="p-4 rounded-2xl glass-card bg-[#0A1226]/90 border border-sky-400/30 space-y-2 animate-pop">
              <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4" /> AI Output:
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(aiResult)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Copy
                </button>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {aiResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICopilotModal;
