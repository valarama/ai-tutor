'use client';

import { useState, useEffect, useRef } from 'react';

export default function VoiceChatbot({ show, onClose, transcript, modelId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: transcript?.messages?.map(m => `${m.role}: ${m.text}`).join('\n') || '',
          modelId: modelId || 'gemini-2.0-flash'
        })
      });

      const data = await response.json();
      const assistantMessage = { role: 'assistant', text: data.response };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak response
      speak(data.response);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    stopSpeaking();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-8 w-[450px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border-2 border-purple-200" style={{ height: '600px' }}>
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : isListening ? 'bg-red-400 animate-pulse' : 'bg-white'}`}></div>
            <h3 className="font-bold">🎤 Voice AI Tutor</h3>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-white hover:text-gray-200 text-sm px-2 py-1 bg-white bg-opacity-20 rounded">
                🗑️
              </button>
            )}
            <button onClick={onClose} className="text-white text-2xl font-bold hover:text-gray-200">✕</button>
          </div>
        </div>
      </div>

      {/* AI Avatar */}
      <div className="p-4 bg-gradient-to-b from-purple-50 to-white border-b">
        <div className="flex items-center gap-3">
          <div className={`text-4xl ${isSpeaking ? 'animate-bounce' : isListening ? 'animate-pulse' : ''}`}>
            {isListening ? '🎤' : isSpeaking ? '🔊' : '🤖'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">AI Teaching Assistant</p>
            <p className="text-xs text-gray-600">
              {isListening ? '🎤 Listening to you...' : isSpeaking ? '🔊 Speaking...' : 'Ready to help you learn'}
            </p>
          </div>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold">
              Stop
            </button>
          )}
        </div>
        
        {/* Voice Visualization */}
        {(isListening || isSpeaking) && (
          <div className="flex justify-center gap-1 mt-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${isListening ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{
                  height: '20px',
                  animation: 'pulse 0.5s infinite',
                  animationDelay: `${i * 0.1}s`
                }}></div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-5xl mb-3">👋</p>
            <p className="font-medium mb-2">Ask me anything!</p>
            <p className="text-sm text-gray-400">Use voice 🎤 or type below</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setInput("What is quantum computing?")}
                className="block w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
                💡 What is quantum computing?
              </button>
              <button
                onClick={() => setInput("Explain superposition")}
                className="block w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm">
                🔮 Explain superposition
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block p-3 rounded-2xl max-w-[80%] shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && (
              <div className="text-left mb-3">
                <span className="inline-block p-3 rounded-2xl bg-white border border-gray-200">
                  <span className="animate-pulse">●●●</span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-2xl">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && !isListening && sendMessage()}
            placeholder="Type or speak..."
            className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={loading || isListening}
          />
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            className={`px-4 py-3 rounded-xl font-bold shadow-md transition-all ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}>
            {isListening ? '⏹️' : '🎤'}
          </button>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || isListening}
            className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 shadow-md transition-all">
            📤
          </button>
        </div>
        <p className="text-xs text-center text-gray-500">
          {isListening ? '🎤 Listening... Click again to stop' : 'Click 🎤 to speak or type your question'}
        </p>
      </div>
    </div>
  );
}