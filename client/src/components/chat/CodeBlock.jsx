import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

const CodeBlock = ({ code, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden glass-card border border-white/15 bg-slate-950/80 font-mono text-xs shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-white/10 text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] uppercase font-bold text-slate-300">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Text */}
      <pre className="p-3 overflow-x-auto text-cyan-300 leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
