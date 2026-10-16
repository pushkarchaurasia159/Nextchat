import React from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { Palette, Check, X } from 'lucide-react';

const ThemeSelector = ({ isOpen, onClose }) => {
  const { themeId, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-pop">
      <div className="w-full max-w-sm glass-panel bg-[#070D1E] rounded-3xl shadow-2xl border border-sky-400/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#0E1A34]/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Palette className="w-4 h-4 text-sky-400" />
            <span>Select App Theme</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme List */}
        <div className="p-4 space-y-2.5">
          {THEMES.map((t) => {
            const isSelected = themeId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border transition ${
                  isSelected
                    ? 'border-sky-400 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                    : 'border-white/10 bg-[#0E1A34]/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr ${t.gradient} shadow-md`}
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {t.name}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-sky-400" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
