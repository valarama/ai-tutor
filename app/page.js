'use client';

import { useState, useEffect, useRef } from 'react';
import ArchitectureGenerator from './components/ArchitectureGenerator';

export default function Home() {
  // Sessions
  const [conversations, setConversations] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [transcript, setTranscript] = useState({ messages: [], suggestions: {} });
  const [activeTab, setActiveTab] = useState('conversation');
  const [loading, setLoading] = useState(true);
  
  // AI Model
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-exp');
  
  // AI Features
  const [summary, setSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [insightsSubTab, setInsightsSubTab] = useState('summary');
  
  // Voice Chatbot
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // RingCentral Voice
  const [callFromNumber, setCallFromNumber] = useState('+919443506276');
  const [callToNumber, setCallToNumber] = useState('');
  const [callStatus, setCallStatus] = useState('');
  const [makingCall, setMakingCall] = useState(false);
  
  // RingCentral Video
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingStatus, setMeetingStatus] = useState('');
  const [creatingMeeting, setCreatingMeeting] = useState(false);

  // Load conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      if (data.conversations?.length > 0) {
        setConversations(data.conversations);
        if (!selectedSession) {
          setSelectedSession(data.conversations[0].sessionId);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      loadTranscript(selectedSession);
    }
  }, [selectedSession]);

  const loadTranscript = async (sessionId) => {
    try {
      const response = await fetch(`/api/transcript?sessionId=${sessionId}`);
      const data = await response.json();
      setTranscript(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateSummary = async () => {
    if (!selectedSession) return;
    setGeneratingSummary(true);
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession, model: selectedModel })
      });
      const data = await response.json();
      setSummary(data.success ? data.summary : 'Error: ' + data.error);
    } catch (error) {
      setSummary('Failed: ' + error.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Voice Chatbot Functions
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, model: selectedModel })
      });
      const data = await response.json();
      const aiResponse = data.response;
      setChatMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
      speakText(aiResponse);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + error.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }
    
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };
    
    recognition.start();
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // RingCentral Voice
  const makePhoneCall = async () => {
    if (!callFromNumber || !callToNumber) {
      setCallStatus('❌ Enter both numbers');
      return;
    }
    setMakingCall(true);
    setCallStatus('☎️ Initiating call...');
    
    try {
      const response = await fetch('/api/ringcentral-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromNumber: callFromNumber, toNumber: callToNumber })
      });
      const data = await response.json();
      setCallStatus(data.success ? `✅ Call ${data.status}` : `❌ ${data.error}`);
    } catch (error) {
      setCallStatus(`❌ ${error.message}`);
    } finally {
      setMakingCall(false);
    }
  };

  // RingCentral Video
  const createVideoMeeting = async () => {
    setCreatingMeeting(true);
    setMeetingStatus('🎥 Creating meeting...');
    
    try {
      const response = await fetch('/api/ringcentral-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingName: `Session - ${selectedSession}`, meetingType: 'Instant' })
      });
      const data = await response.json();
      
      if (data.success) {
        setMeetingUrl(data.joinUrl);
        setMeetingStatus('✅ Meeting created!');
      } else {
        setMeetingStatus(`❌ ${data.error}`);
      }
    } catch (error) {
      setMeetingStatus(`❌ ${error.message}`);
    } finally {
      setCreatingMeeting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 sidebar overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl mb-2">🎓 Live Sessions</h1>
            <p className="text-xl opacity-90">
              {loading ? 'Loading...' : `${conversations.length} active`}
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 animate-pulse">⏳</div>
                <p className="text-lg">Loading sessions...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📞</div>
                <p className="text-lg">No sessions yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  onClick={() => setSelectedSession(conv.sessionId)}
                  className={`session-card p-6 rounded-2xl cursor-pointer ${
                    selectedSession === conv.sessionId ? 'active' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📞</span>
                    <h3 className="text-xl font-bold truncate">{conv.sessionId}</h3>
                    {conv.hasAudio && <span className="badge badge-success">🎤</span>}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>🕐 {new Date(conv.startTime).toLocaleString()}</p>
                    <p>⏱️ {conv.duration} • 💬 {conv.turns} messages</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-lg border-b-2 border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'conversation'
                    ? 'gradient-blue'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💬 Conversation
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'insights'
                    ? 'gradient-blue'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🤖 AI Insights
              </button>
              <button
                onClick={() => setActiveTab('communications')}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'communications'
                    ? 'gradient-blue'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📞 Comms
              </button>
              <button
                onClick={() => setActiveTab('vision')}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'vision'
                    ? 'gradient-blue'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📸 Vision AI
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === 'architecture'
                    ? 'gradient-purple'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏗️ Architecture
              </button>
            </div>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-6 py-3 gradient-purple rounded-xl font-bold cursor-pointer"
            >
              <option value="gemini-2.0-flash-exp">🚀 Gemini 2.0 Flash</option>
              <option value="gemini-2.0-flash-thinking-exp">🧠 Gemini 2.0 Thinking</option>
              <option value="gemini-2.5-flash">⚡ Gemini 2.5 Flash</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto content-area p-8">
          {/* Conversation Tab */}
          {activeTab === 'conversation' && (
            <div className="max-w-5xl mx-auto">
              {!selectedSession ? (
                <div className="text-center py-20 content-card p-12">
                  <div className="text-8xl mb-6">📞</div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Select a Session</h2>
                  <p className="text-xl text-gray-600">Choose a session from the sidebar to view details</p>
                </div>
              ) : (
                <div className="content-card p-8">
                  <h2 className="text-3xl font-bold mb-8">💬 Live Conversation</h2>
                  {transcript.messages?.length > 0 ? (
                    <div className="space-y-4">
                      {transcript.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`message-bubble ${
                            msg.role === 'customer' ? 'message-student' : 'message-instructor'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{msg.role === 'customer' ? '👤' : '🎓'}</span>
                            <p className="font-bold text-lg">
                              {msg.role === 'customer' ? 'Student' : 'Instructor'}
                            </p>
                          </div>
                          <p className="text-gray-800 font-medium leading-relaxed">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">🎤</div>
                      <p className="text-2xl font-bold text-gray-600">Waiting for conversation...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'insights' && (
            <div className="max-w-5xl mx-auto">
              <div className="content-card p-8">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setInsightsSubTab('summary')}
                    className={`px-6 py-3 rounded-xl font-bold ${insightsSubTab === 'summary' ? 'gradient-blue' : 'bg-gray-200'}`}
                  >
                    📝 Summary
                  </button>
                  <button
                    onClick={() => setInsightsSubTab('diagram')}
                    className={`px-6 py-3 rounded-xl font-bold ${insightsSubTab === 'diagram' ? 'gradient-blue' : 'bg-gray-200'}`}
                  >
                    📊 Diagram
                  </button>
                  <button
                    onClick={() => setInsightsSubTab('video')}
                    className={`px-6 py-3 rounded-xl font-bold ${insightsSubTab === 'video' ? 'gradient-blue' : 'bg-gray-200'}`}
                  >
                    🎥 Video
                  </button>
                </div>

                {insightsSubTab === 'summary' && (
                  <>
                    <h2 className="text-3xl font-bold mb-6">🤖 AI Summary</h2>
                    <button
                      onClick={generateSummary}
                      disabled={generatingSummary || !selectedSession}
                      className="w-full px-8 py-4 gradient-blue rounded-xl font-bold text-lg mb-6"
                    >
                      {generatingSummary ? '⏳ Generating Summary...' : '✨ Generate AI Summary'}
                    </button>
                    {summary && (
                      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                        <pre className="whitespace-pre-wrap font-sans text-gray-800 font-medium leading-relaxed">
                          {summary}
                        </pre>
                      </div>
                    )}
                  </>
                )}

                {insightsSubTab === 'diagram' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-2xl font-bold mb-4">Diagram Generation</h3>
                    <p className="text-gray-600">Feature coming soon...</p>
                  </div>
                )}

                {insightsSubTab === 'video' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎥</div>
                    <h3 className="text-2xl font-bold mb-4">Video Prompt</h3>
                    <p className="text-gray-600">Feature coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="content-card p-8">
                <h3 className="text-2xl font-bold mb-6">📞 Voice Call (RingCentral)</h3>
                <div className="space-y-4">
                  <input
                    type="tel"
                    value={callFromNumber}
                    onChange={(e) => setCallFromNumber(e.target.value)}
                    placeholder="From: +919443506276"
                    className="w-full p-4 rounded-xl text-lg"
                  />
                  <input
                    type="tel"
                    value={callToNumber}
                    onChange={(e) => setCallToNumber(e.target.value)}
                    placeholder="To: +91..."
                    className="w-full p-4 rounded-xl text-lg"
                  />
                  {callStatus && (
                    <div className="p-4 bg-blue-50 rounded-xl text-center font-bold text-gray-800">
                      {callStatus}
                    </div>
                  )}
                  <button
                    onClick={makePhoneCall}
                    disabled={makingCall}
                    className="w-full px-8 py-4 gradient-blue rounded-xl font-bold text-lg"
                  >
                    {makingCall ? '☎️ Calling...' : '📞 Make Voice Call'}
                  </button>
                </div>
              </div>

              <div className="content-card p-8">
                <h3 className="text-2xl font-bold mb-6">🎥 Video Meeting (RingCentral)</h3>
                {meetingStatus && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl text-center font-bold text-gray-800">
                    {meetingStatus}
                  </div>
                )}
                <button
                  onClick={createVideoMeeting}
                  disabled={creatingMeeting}
                  className="w-full px-8 py-4 gradient-purple rounded-xl font-bold text-lg mb-4"
                >
                  {creatingMeeting ? '⏳ Creating Meeting...' : '🎥 Create Instant Meeting'}
                </button>
                {meetingUrl && (
                  <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                    <p className="font-bold mb-3 text-gray-800">✅ Meeting Ready!</p>
                    <a
                      href={meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline font-bold break-all"
                    >
                      {meetingUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vision AI Tab */}
          {activeTab === 'vision' && (
            <div className="max-w-5xl mx-auto">
              <div className="content-card p-8">
                <h2 className="text-3xl font-bold mb-6">📸 Vision AI Camera</h2>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-xl text-gray-600">Camera feature coming soon...</p>
                </div>
              </div>
            </div>
          )}

          {/* Architecture Tab */}
          {activeTab === 'architecture' && (
            <div className="h-full">
              <ArchitectureGenerator />
            </div>
          )}
        </div>
      </div>

      {/* Floating Voice AI Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-24 right-8 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50 flex flex-col">
          <div className="gradient-purple p-4 flex items-center justify-between text-white">
            <h3 className="text-xl font-bold">🤖 Voice AI Tutor</h3>
            <button onClick={() => setShowChatbot(false)} className="text-2xl">✕</button>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span
                  className={`inline-block p-3 rounded-xl max-w-xs break-words font-medium ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border-2 border-gray-200'
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <span className="inline-block p-3 rounded-xl bg-white border-2 border-gray-200">
                  <span className="animate-pulse">Thinking...</span>
                </span>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t-2 border-gray-200">
            {isSpeaking ? (
              <button 
                onClick={stopSpeaking} 
                className="w-full px-6 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                🔇 Interrupt Speech
              </button>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={startListening}
                    disabled={isListening}
                    className={`px-4 py-2 rounded-xl font-bold ${
                      isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {isListening ? '🎤 Listening...' : '🎤'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 p-3 rounded-xl border-2 border-gray-200"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-6 py-3 gradient-blue rounded-xl font-bold"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Chatbot Toggle Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-8 right-8 w-16 h-16 gradient-purple rounded-full shadow-2xl flex items-center justify-center text-3xl z-40"
      >
        🤖
      </button>
    </div>
  );
}