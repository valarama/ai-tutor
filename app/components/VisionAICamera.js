'use client';

import { useState, useRef } from 'react';

export default function VisionAICamera() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      alert('Camera access denied: ' + error.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    setImage(imageData);
    stopCamera();
  };

  const analyzeImage = async () => {
    if (!image) {
      alert('Please capture an image first');
      return;
    }

    setAnalyzing(true);
    setResult('');

    try {
      const response = await fetch('/api/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.description);
      } else {
        setResult('Error: ' + data.error);
      }
    } catch (error) {
      setResult('Failed to analyze: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const resetCamera = () => {
    setImage(null);
    setResult('');
    stopCamera();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">📸 Vision AI Camera</h2>
      
      {/* Camera View */}
      {!image && (
        <div className="relative bg-black rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={captureImage}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-xl font-black text-lg"
                >
                  📷 Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 shadow-xl font-black text-lg"
                >
                  ❌ Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <button
                onClick={startCamera}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-xl font-black text-lg"
              >
                📹 Start Camera
              </button>
            </div>
          )}
        </div>
      )}

      {/* Captured Image */}
      {image && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border-4 border-green-400">
            <img src={image} alt="Captured" className="w-full" />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={analyzeImage}
              disabled={analyzing}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 shadow-xl font-black text-lg"
            >
              {analyzing ? '🔍 Analyzing...' : '🤖 Analyze with AI'}
            </button>
            <button
              onClick={resetCamera}
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 shadow-xl font-black text-lg"
            >
              🔄 Retake
            </button>
          </div>

          {/* Analysis Result */}
          {result && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-4 border-blue-400">
              <h3 className="text-xl font-black text-gray-900 mb-3">🤖 AI Analysis:</h3>
              <p className="text-lg font-bold text-gray-800 leading-relaxed">{result}</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}