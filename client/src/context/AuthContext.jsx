import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nextchat_token'));
  const [loading, setLoading] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setGhostMode(Boolean(data.user.ghostMode));
          setSoundEnabled(data.user.soundEnabled !== false);
        } else {
          localStorage.removeItem('nextchat_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        localStorage.removeItem('nextchat_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Request OTP
  const sendOtp = async (phone) => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Verify OTP (Passwordless Login / Register)
  const verifyOtp = async (phone, otp, name) => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to verify OTP');
      }
      localStorage.setItem('nextchat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setGhostMode(Boolean(data.user.ghostMode));
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Password Login (Fallback)
  const login = async (phone, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('nextchat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('nextchat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const updateProfile = async (formData) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Update profile failed');
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const toggleGhostMode = async () => {
    const newGhost = !ghostMode;
    setGhostMode(newGhost);
    try {
      const formData = new FormData();
      formData.append('ghostMode', newGhost);
      await updateProfile(formData);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSound = async () => {
    const newSound = !soundEnabled;
    setSoundEnabled(newSound);
    try {
      const formData = new FormData();
      formData.append('soundEnabled', newSound);
      await updateProfile(formData);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem('nextchat_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        ghostMode,
        soundEnabled,
        sendOtp,
        verifyOtp,
        login,
        register,
        updateProfile,
        toggleGhostMode,
        toggleSound,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
