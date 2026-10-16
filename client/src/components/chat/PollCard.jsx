import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { BarChart3, CheckCircle2, Circle } from 'lucide-react';

const PollCard = ({ message }) => {
  const { user } = useAuth();
  const { votePoll } = useChat();

  let poll = null;
  try {
    poll = typeof message.pollData === 'string' ? JSON.parse(message.pollData) : message.pollData;
  } catch (e) {
    return null;
  }

  if (!poll || !poll.options) return null;

  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes ? opt.votes.length : 0), 0);

  const handleOptionClick = (optionId) => {
    votePoll(message.id, optionId);
  };

  return (
    <div className="my-1.5 p-3.5 rounded-2xl glass-card bg-[#0E1A34]/80 border border-sky-400/20 text-white min-w-[260px] sm:min-w-[300px] space-y-3">
      {/* Poll Header */}
      <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-100">{poll.question}</h4>
        </div>
        <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-400/30 flex-shrink-0">
          {poll.isMulti ? 'Multi-Choice' : 'Single-Choice'}
        </span>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const voteCount = opt.votes ? opt.votes.length : 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVoted = opt.votes && opt.votes.includes(user?.id);

          return (
            <div
              key={opt.id}
              onClick={() => handleOptionClick(opt.id)}
              className={`relative overflow-hidden p-2.5 rounded-xl border cursor-pointer transition select-none group ${
                hasVoted
                  ? 'border-sky-400/60 bg-sky-950/40 shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                  : 'border-white/10 bg-[#070D1E]/60 hover:border-white/20'
              }`}
            >
              {/* Animated Percentage Fill Bar */}
              <div
                className="absolute inset-y-0 left-0 bg-sky-500/20 transition-all duration-500 rounded-xl"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {hasVoted ? (
                    <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
                  <span className="text-[11px] text-slate-400">
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                  </span>
                  <span className="font-bold text-sky-400 min-w-[32px] text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Total */}
      <div className="text-[10px] text-slate-400 text-right pt-0.5 font-mono">
        {totalVotes} total votes
      </div>
    </div>
  );
};

export default PollCard;
