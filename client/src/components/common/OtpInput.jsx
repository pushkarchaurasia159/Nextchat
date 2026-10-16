import React, { useRef, useEffect } from 'react';

const OtpInput = ({ value, onChange, length = 6, disabled = false }) => {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (e, index) => {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = value.split('');
    newOtp[index] = char;
    const combined = newOtp.join('');
    onChange(combined);

    // Auto advance to next box
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 my-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || '';
        const isFilled = Boolean(digit);

        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={disabled}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl glass-input outline-none transition duration-200 ${
              isFilled
                ? 'border-sky-400 text-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.35)] bg-sky-950/30'
                : 'border-white/10 text-white hover:border-white/20'
            }`}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
