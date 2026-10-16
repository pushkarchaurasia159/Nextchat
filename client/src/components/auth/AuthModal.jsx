import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import OtpInput from '../common/OtpInput';
import {
  Phone,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Lock,
  User,
  MessageSquare
} from 'lucide-react';

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
  const { sendOtp, verifyOtp } = useAuth();

  // Unified OTP State: 'phone' | 'otp'
  const [step, setStep] = useState('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  const getFullPhone = () => `${countryCode}${phoneNumber.trim()}`;

  // Step 1: Send OTP to mobile
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your mobile phone number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const fullPhone = getFullPhone();
      const res = await sendOtp(fullPhone);
      setStep('otp');
      setOtpValue('');
      setReceivedOtp(res.otp || '');
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please verify your number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otpValue.length < 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const fullPhone = getFullPhone();
      await verifyOtp(fullPhone, otpValue, name);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillOtp = () => {
    if (receivedOtp) {
      setOtpValue(receivedOtp);
    }
  };

  const fillDemo = (num, userName) => {
    setPhoneNumber(num);
    setName(userName);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070D1E] p-4 relative overflow-hidden select-none">
      {/* Dynamic Luminous Background Orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-float" style={{ animationDelay: '3.5s' }} />

      {/* In-App Simulated SMS Toast */}
      {receivedOtp && step === 'otp' && (
        <div className="fixed top-6 z-50 max-w-md w-full px-4 animate-pop">
          <div className="glass-card bg-[#0E1A34]/95 border border-sky-400/40 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>SMS Code:</span>
                  <span className="font-mono text-base font-bold text-sky-400 tracking-wider">
                    {receivedOtp}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">NextChat Instant OTP</p>
              </div>
            </div>
            <button
              onClick={handleAutoFillOtp}
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition flex-shrink-0"
            >
              Auto-Fill
            </button>
          </div>
        </div>
      )}

      {/* Single Unified Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl border border-sky-400/20 overflow-hidden z-10 animate-pop">
        {/* Brand Header */}
        <div className="p-7 text-center border-b border-white/10 bg-[#0E1A34]/50">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <img
                src="/logo.png"
                alt="NextChat Logo"
                className="w-14 h-14 rounded-2xl object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]"
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                <span>NextChat</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30">
                  OTP Direct
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your mobile number to sign in or create an account
              </p>
            </div>
          </div>
        </div>

        {/* Unified Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium animate-pop">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            /* STEP 1: MOBILE NUMBER ENTRY */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mobile Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#0A1226] text-white text-xs rounded-xl px-3 py-3 outline-none border border-sky-500/20 cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#0A1226]">
                        {c.country} ({c.code})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full glass-input text-white text-sm rounded-xl pl-10 pr-3 py-3 outline-none font-mono"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Display Name</span>
                  <span className="text-[10px] text-slate-500 font-normal">(Optional for new accounts)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Hunter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input text-white text-xs rounded-xl pl-10 pr-3 py-2.5 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/25 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-400">
                  Verification code sent to
                </p>
                <p className="text-sm font-bold text-sky-400 font-mono">
                  {getFullPhone()}
                </p>
              </div>

              <OtpInput
                value={otpValue}
                onChange={setOtpValue}
                length={6}
                disabled={loading}
              />

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="hover:text-white transition"
                >
                  Edit Number
                </button>

                {resendTimer > 0 ? (
                  <span className="font-mono text-sky-400">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otpValue.length < 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/25 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Enter NextChat</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Pre-fill for instant test */}
          <div className="pt-3 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-400 mb-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> Instant demo accounts:
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => fillDemo('9876543210', 'Alex Hunter')}
                className="px-2.5 py-1 text-[11px] bg-[#0E1A34] hover:bg-[#16264A] text-slate-300 rounded-lg border border-sky-400/20 transition"
              >
                User 1 (Alex)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('9876543211', 'Sarah Connor')}
                className="px-2.5 py-1 text-[11px] bg-[#0E1A34] hover:bg-[#16264A] text-slate-300 rounded-lg border border-sky-400/20 transition"
              >
                User 2 (Sarah)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('9876543212', 'Michael Ross')}
                className="px-2.5 py-1 text-[11px] bg-[#0E1A34] hover:bg-[#16264A] text-slate-300 rounded-lg border border-sky-400/20 transition"
              >
                User 3 (Michael)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
