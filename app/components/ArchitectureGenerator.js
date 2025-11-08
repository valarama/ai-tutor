'use client';

import { useState, useEffect, useRef } from 'react';

const DEFAULT_CONFIG = {
  title: "Educational AI Platform Architecture",
  subtitle: "Complete System Design with RingCentral Integration",
  components: {
    "A1": {
      id: "dialogflow_cx",
      title: "Dialogflow CX",
      description: "Voice conversation handler",
      icon: "🎤",
      color: "blue",
      width: 280,
      height: 120,
      details: ["Speech recognition", "Intent detection", "NLU processing"],
      connections: [{ to: "B1", label: "Webhook" }]
    },
    "A2": {
      id: "web_interface",
      title: "Next.js Web App",
      description: "User interface",
      icon: "🌐",
      color: "purple",
      width: 280,
      height: 120,
      details: ["React components", "Real-time updates", "Responsive design"],
      connections: [{ to: "B1", label: "API calls" }]
    },
    "B1": {
      id: "backend_api",
      title: "Backend APIs",
      description: "Cloud Run services",
      icon: "⚙️",
      color: "green",
      width: 280,
      height: 120,
      details: ["REST endpoints", "WebSockets", "Authentication"],
      connections: [{ to: "C1", label: "Read/Write" }, { to: "C2", label: "Generate" }]
    },
    "B2": {
      id: "ringcentral",
      title: "RingCentral APIs",
      description: "Communication platform",
      icon: "📞",
      color: "yellow",
      width: 280,
      height: 120,
      details: ["Voice calling", "Video meetings", "SMS"],
      connections: [{ to: "B1", label: "Webhooks" }]
    },
    "C1": {
      id: "firestore",
      title: "Firestore Database",
      description: "Session storage",
      icon: "🗄️",
      color: "green",
      width: 280,
      height: 120,
      details: ["Conversations", "Transcripts", "User data"],
      connections: []
    },
    "C2": {
      id: "gemini",
      title: "Gemini AI",
      description: "AI processing",
      icon: "🤖",
      color: "purple",
      width: 280,
      height: 120,
      details: ["Summaries", "Analysis", "Vision AI"],
      connections: []
    }
  },
  grid: { rows: 6, cols: 4, cellWidth: 280, cellHeight: 120, gap: 20 },
  styles: {
    blue: { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-800" },
    green: { bg: "bg-green-100", border: "border-green-500", text: "text-green-800" },
    purple: { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-800" },
    yellow: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-800" }
  }
};

export default function ArchitectureGenerator() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const diagramRef = useRef(null);

  const getPixelPosition = (position) => {
    const col = position.charCodeAt(0) - 65;
    const row = parseInt(position.slice(1)) - 1;
    const { cellWidth, cellHeight, gap } = config.grid;
    return {
      x: col * (cellWidth + gap) + gap,
      y: row * (cellHeight + gap) + gap + 80
    };
  };

  const exportToPNG = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (diagramRef.current) {
        const canvas = await html2canvas(diagramRef.current, { backgroundColor: '#f8fafc' });
        const link = document.createElement('a');
        link.download = 'architecture.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Install html2canvas: npm install html2canvas');
    }
  };

  const saveJSON = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'architecture.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Control Panel */}
      <div className="bg-gray-900 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🏗️</span> Architecture Generator
          </h2>
          <button
            onClick={() => setPanelMinimized(!panelMinimized)}
            className="px-4 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-700"
          >
            {panelMinimized ? 'Expand ⬇️' : 'Minimize ⬆️'}
          </button>
        </div>
        
        {!panelMinimized && (
          <div className="flex gap-4">
            <button
              onClick={exportToPNG}
              className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700"
            >
              📥 Export PNG
            </button>
            <button
              onClick={saveJSON}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
            >
              💾 Save JSON
            </button>
            <div className="flex-1 flex items-center justify-end gap-4 text-sm">
              <span>Components: <strong>{Object.keys(config.components).length}</strong></span>
              <span>Grid: <strong>{config.grid.rows}×{config.grid.cols}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Diagram Area */}
      <div ref={diagramRef} className="flex-1 relative overflow-auto p-8 bg-gray-50">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-2">{config.title}</h1>
          <h2 className="text-xl text-gray-600 font-bold">{config.subtitle}</h2>
        </div>

        {/* Components */}
        {Object.entries(config.components).map(([pos, comp]) => {
          const pixelPos = getPixelPosition(pos);
          const style = config.styles[comp.color] || config.styles.blue;
          
          return (
            <div
              key={pos}
              className={`absolute ${style.bg} ${style.border} ${style.text} border-4 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all`}
              style={{
                left: pixelPos.x,
                top: pixelPos.y,
                width: comp.width,
                height: comp.height
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{comp.icon}</span>
                <h3 className="font-black text-lg">{comp.title}</h3>
              </div>
              <p className="text-sm font-bold mb-3">{comp.description}</p>
              <ul className="text-xs space-y-1">
                {comp.details.map((detail, i) => (
                  <li key={i}>• {detail}</li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Connection Lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {Object.entries(config.components).flatMap(([fromPos, fromComp]) =>
            (fromComp.connections || []).map((conn, idx) => {
              const toPos = conn.to;
              const toComp = config.components[toPos];
              if (!toComp) return null;

              const start = getPixelPosition(fromPos);
              const end = getPixelPosition(toPos);

              const fromX = start.x + fromComp.width / 2;
              const fromY = start.y + fromComp.height;
              const toX = end.x + toComp.width / 2;
              const toY = end.y;

              const pathData = `M ${fromX} ${fromY} C ${fromX} ${fromY + 50}, ${toX} ${toY - 50}, ${toX} ${toY}`;

              return (
                <g key={`${fromPos}-${toPos}-${idx}`}>
                  <path
                    d={pathData}
                    stroke="#4f46e5"
                    strokeWidth="3"
                    fill="none"
                    markerEnd="url(#arrow)"
                  />
                  <text
                    x={(fromX + toX) / 2}
                    y={(fromY + toY) / 2}
                    className="text-xs font-bold fill-gray-700"
                    textAnchor="middle"
                  >
                    {conn.label}
                  </text>
                </g>
              );
            })
          )}
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}