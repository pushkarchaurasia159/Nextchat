import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';

const AudioRecorder = ({ onSendAudio, onCancel }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    let streamInstance = null;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamInstance = stream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();

        timerIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please grant permission.');
        onCancel();
      }
    };

    startRecording();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel]);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      onSendAudio(audioFile);
    };

    mediaRecorderRef.current.stop();
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between bg-[#202c33] rounded-xl px-4 py-2 border border-[#2a3942] animate-fade-in">
      {/* Cancel button */}
      <button
        onClick={onCancel}
        type="button"
        className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition"
        title="Discard recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording Animation & Timer */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="text-sm font-mono text-[#e9edef]">
          {formatSeconds(recordingTime)}
        </span>

        {/* Pulsing soundbars */}
        <div className="flex items-center gap-1 h-6">
          <div className="w-1 bg-[#00a884] rounded-full sound-bar" />
          <div className="w-1 bg-[#00a884] rounded-full sound-bar" />
          <div className="w-1 bg-[#00a884] rounded-full sound-bar" />
          <div className="w-1 bg-[#00a884] rounded-full sound-bar" />
          <div className="w-1 bg-[#00a884] rounded-full sound-bar" />
          <div className="w-1 bg-[#00a884] rounded-full sound-bar" />
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleStopAndSend}
        type="button"
        className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-lg transition"
        title="Send voice note"
      >
        <Send className="w-5 h-5 ml-0.5" />
      </button>
    </div>
  );
};

export default AudioRecorder;
