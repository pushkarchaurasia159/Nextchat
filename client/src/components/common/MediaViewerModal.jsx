import React, { useEffect } from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

const MediaViewerModal = ({ mediaUrl, fileName, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mediaUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex items-center gap-3 text-white z-10">
        <a
          href={mediaUrl}
          download={fileName || 'download'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          title="Download"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="max-w-4xl max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={mediaUrl}
          alt={fileName || 'Preview'}
          className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
};

export default MediaViewerModal;
