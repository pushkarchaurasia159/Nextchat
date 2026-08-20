import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, User, Sparkles, Image as ImageIcon, Eye, EyeOff, MessageSquare } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', name: 'India' },
  { code: '+1', country: 'US', name: 'USA / Canada' },
  { code: '+44', country: 'UK', name: 'United Kingdom' },
  { code: '+971', country: 'AE', name: 'UAE' },
  { code: '+61', country: 'AU', name: 'Australia' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+81', country: 'JP', name: 'Japan' },
  { code: '+65', country: 'SG', name: 'Singapore' }
];

const AuthModal = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [about, setAbout] = useState('Hey there! I am using NextChat.');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const fullPhone = `${countryCode}${phoneNumber.trim()}`;

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(fullPhone, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your display name');
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('phone', fullPhone);
        formData.append('password', password);
        formData.append('name', name.trim());
        formData.append('about', about.trim());
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }
        await register(formData);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper for demo registration
  const fillDemo = (num, userName) => {
    setPhoneNumber(num);
    setPassword('password123');
    if (!isLogin) {
      setName(userName);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0c1317] p-4 relative overflow-hidden">
      {/* WhatsApp Green Top Banner background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-[#00a884] z-0" />

      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00a884]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#111b21] rounded-2xl shadow-2xl border border-[#222d34] overflow-hidden z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="p-6 text-center bg-[#202c33]/50 border-b border-[#222d34]">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="NextChat Logo"
              className="w-12 h-12 rounded-xl object-contain drop-shadow-[0_0_12px_rgba(0,168,132,0.6)]"
            />
            <h1 className="text-2xl font-bold tracking-wide text-[#e9edef] flex items-center gap-2">
              NextChat
            </h1>
          </div>
          <p className="text-xs text-[#8696a0]">
            Fast, secure, real-time messaging with full admin features
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#222d34] bg-[#111b21]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              isLogin
                ? 'border-[#00a884] text-[#00a884] bg-[#202c33]/30'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 ${
              !isLogin
                ? 'border-[#00a884] text-[#00a884] bg-[#202c33]/30'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Registration Avatar & Name */}
          {!isLogin && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-16 h-16 rounded-full bg-[#202c33] border-2 border-dashed border-[#8696a0]/40 hover:border-[#00a884] cursor-pointer flex items-center justify-center overflow-hidden transition group flex-shrink-0"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#8696a0] group-hover:text-[#00a884]" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition">
                    Change
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#8696a0] mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Hunter"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#202c33] text-[#e9edef] text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1">
                  About / Status
                </label>
                <input
                  type="text"
                  placeholder="Hey there! I am using NextChat."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-[#202c33] text-[#e9edef] text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
                />
              </div>
            </div>
          )}

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-[#202c33] text-[#e9edef] text-sm rounded-lg px-2.5 py-2.5 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942] cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.country} ({c.code})
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[#202c33] text-[#e9edef] text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#202c33] text-[#e9edef] text-sm rounded-lg pl-9 pr-10 py-2.5 outline-none focus:ring-1 focus:ring-[#00a884] border border-[#2a3942]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-[#e9edef]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#02906f] text-white font-semibold rounded-lg shadow-lg shadow-[#00a884]/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              'Log In to NextChat'
            ) : (
              'Create Account'
            )}
          </button>

          {/* Quick Demo Pre-fill for instant test */}
          <div className="pt-3 border-t border-[#222d34]/60 text-center">
            <p className="text-[11px] text-[#8696a0] mb-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00a884]" /> Quick demo accounts:
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => fillDemo('9876543210', 'Alex (Admin)')}
                className="px-2.5 py-1 text-[11px] bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] rounded-md border border-[#2a3942] transition"
              >
                User 1 (Alex)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('9876543211', 'Sarah')}
                className="px-2.5 py-1 text-[11px] bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] rounded-md border border-[#2a3942] transition"
              >
                User 2 (Sarah)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('9876543212', 'Michael')}
                className="px-2.5 py-1 text-[11px] bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] rounded-md border border-[#2a3942] transition"
              >
                User 3 (Michael)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
