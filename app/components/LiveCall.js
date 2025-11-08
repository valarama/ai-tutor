'use client';

import { useState, useEffect, useRef } from 'react';

export default function LiveCall({ phoneNumber, sessionId }) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTutor, setShowTutor] = useState(true);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = () => {
    setIsCallActive(true);
    // In production, connect to actual WebRTC/Twilio
  };

  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-blue-200">
      {/* Call Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="font-bold text-gray-800">
            {isCallActive ? '🔴 Live Call' : '📞 Ready to Call'}
          </span>
        </div>
        {isCallActive && (
          <span className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {formatDuration(callDuration)}
          </span>
        )}
      </div>

      {/* AI Tutor Avatar */}
      {showTutor && (
        <div className="mb-4 relative">
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-1">
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="text-6xl mb-3 animate-bounce">🤖</div>
              <h3 className="font-bold text-gray-800 mb-1">AI Teaching Assistant</h3>
              <p className="text-sm text-gray-600">
                {isCallActive ? 'Listening and analyzing...' : 'Ready to assist'}
              </p>
              {isCallActive && (
                <div className="flex justify-center gap-1 mt-3">
                  <div className="w-2 h-8 bg-blue-500 rounded animate-pulse"></div>
                  <div className="w-2 h-12 bg-purple-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-6 bg-pink-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <div className="w-2 h-10 bg-blue-500 rounded animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowTutor(!showTutor)}
            className="absolute top-2 right-2 w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Video/Audio Display */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-4 mb-4 min-h-[200px] flex items-center justify-center relative">
        {isCallActive ? (
          <div className="text-center">
            <div className="text-white text-5xl mb-3">🎤</div>
            <p className="text-white font-semibold">Audio Connected</p>
            <p className="text-blue-300 text-sm mt-2">{phoneNumber}</p>
            {/* Audio visualization */}
            <div className="flex justify-center gap-2 mt-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-3 bg-blue-400 rounded"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animation: 'pulse 0.5s infinite',
                    animationDelay: `${i * 0.1}s`
                  }}></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-400 text-5xl mb-3">📞</div>
            <p className="text-gray-400">Click below to start call</p>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="flex gap-2">
        {!isCallActive ? (
          <button
            onClick={startCall}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 font-bold shadow-lg flex items-center justify-center gap-2">
            📞 Start Call
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}>
              {isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
            <button
              onClick={endCall}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-bold shadow-lg">
              📵 End Call
            </button>
          </>
        )}
      </div>

      {/* Call Info */}
      <div className="mt-4 p-4 bg-blue-50 rounded-xl">
        <p className="text-xs text-gray-600 mb-1">
          <span className="font-semibold">Session:</span> {sessionId}
        </p>
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Phone:</span> {phoneNumber}
        </p>
      </div>

      {!showTutor && (
        <button
          onClick={() => setShowTutor(true)}
          className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
          👁️ Show AI Tutor
        </button>
      )}
    </div>
  );
}