import React from 'react';

const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showOnlineStatus = false,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const getBgColor = (str) => {
    const colors = [
      'bg-emerald-600',
      'bg-teal-600',
      'bg-cyan-600',
      'bg-blue-600',
      'bg-indigo-600',
      'bg-violet-600',
      'bg-rose-600',
      'bg-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`relative flex-shrink-0 inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-sm bg-[#202c33]`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}

      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white shadow-sm ${getBgColor(
          name
        )} ${src ? 'hidden' : 'flex'}`}
      >
        {getInitials(name)}
      </div>

      {showOnlineStatus && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-[#111b21] ${
            size === 'sm' || size === 'xs' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
          } ${isOnline ? 'bg-[#00a884]' : 'bg-gray-500'}`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
