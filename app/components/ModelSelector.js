'use client';

import { useState } from 'react';

export default function ModelSelector({ currentModel, onModelChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const models = [
    { id: 'gemini-2.5-flash', name: '🚀 Gemini 2.5 Flash', description: 'Latest & fastest', color: 'from-purple-600 to-pink-600' },
    { id: 'gemini-2.0-flash', name: '⚡ Gemini 2.0 Flash', description: 'Fast & efficient', color: 'from-blue-600 to-indigo-600' },
    { id: 'gemini-1.5-pro', name: '💎 Gemini 1.5 Pro', description: 'Most capable', color: 'from-indigo-600 to-purple-600' },
    { id: 'gemini-1.5-flash', name: '⚡ Gemini 1.5 Flash', description: 'Balanced', color: 'from-cyan-600 to-blue-600' }
  ];

  const selectedModel = models.find(m => m.id === currentModel) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${selectedModel.color} text-white rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 shadow-xl font-black text-base`}
      >
        <span>{selectedModel.name}</span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 bg-white border-4 border-indigo-500 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-6 py-5 hover:bg-gradient-to-r hover:${model.color} hover:text-white transition-all border-b-2 border-gray-200 last:border-b-0 ${
                  model.id === currentModel ? `bg-gradient-to-r ${model.color} text-white` : 'text-gray-900'
                }`}
              >
                <div className="font-black text-lg">{model.name}</div>
                <div className={`text-sm mt-1 font-semibold ${model.id === currentModel ? 'text-white opacity-90' : 'text-gray-600'}`}>
                  {model.description}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}