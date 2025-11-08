import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { transcript, sessionId, customPrompt, previewOnly } = await request.json();
    
    console.log('🎬 Video generation request:', { sessionId, previewOnly });
    
    // Generate or use custom prompt
    let videoPrompt = customPrompt;
    
    if (!videoPrompt && transcript) {
      const concepts = extractKeyPoints(transcript);
      videoPrompt = createEducationalPrompt(concepts);
    }
    
    // If preview only, just return the prompt
    if (previewOnly) {
      return NextResponse.json({ 
        success: true,
        videoPrompt: videoPrompt,
        message: 'Prompt generated for preview'
      });
    }
    
    console.log('📝 Generating video with Veo 3...');
    
    // For now, return instructions to use Vertex AI Studio
    // Full Veo API integration requires additional setup
    
    const vertexAIUrl = `https://console.cloud.google.com/vertex-ai/studio/media/generate?project=chennai-geniai`;
    
    return NextResponse.json({ 
      success: true,
      message: 'Video prompt ready! Use Vertex AI Studio to generate.',
      videoPrompt: videoPrompt,
      vertexAIUrl: vertexAIUrl,
      instructions: [
        '1. Click the Vertex AI Studio link below',
        '2. Paste the prompt in the text box',
        '3. Click Generate Video',
        '4. Video will be ready in 2-3 minutes'
      ],
      outputPath: `gs://chennai-geniai-videos/${sessionId}_${Date.now()}.mp4`,
      estimatedTime: '2-3 minutes',
      sessionId: sessionId
    });
    
  } catch (error) {
    console.error('❌ Video generation error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      message: 'Video generation failed. Please try again.'
    }, { status: 500 });
  }
}

function extractKeyPoints(transcript) {
  const text = transcript.toLowerCase();
  const points = {
    topic: 'Quantum Computing',
    concepts: [],
    visualMetaphors: []
  };
  
  if (text.includes('quantum')) {
    points.concepts.push('quantum mechanics');
    points.visualMetaphors.push('particles in superposition');
  }
  if (text.includes('qubit') || text.includes('cubit')) {
    points.concepts.push('qubits');
    points.visualMetaphors.push('spinning coins showing 0 and 1 simultaneously');
  }
  if (text.includes('superposition')) {
    points.concepts.push('superposition');
    points.visualMetaphors.push('cat in a box being both alive and dead');
  }
  if (text.includes('entanglement')) {
    points.concepts.push('quantum entanglement');
    points.visualMetaphors.push('connected particles reacting instantly across distance');
  }
  
  return points;
}

function createEducationalPrompt(concepts) {
  return `Create an engaging 8-second educational video about ${concepts.topic}:

VISUAL STYLE:
- Clean, modern educational animation
- Blue/purple gradient backgrounds
- Smooth cinematic transitions
- Professional typography

SCENE STRUCTURE:
[0-2s] Title card: "${concepts.topic}" with floating particles
[2-4s] Visual: ${concepts.visualMetaphors[0] || 'abstract quantum states'}
[4-6s] Split screen: classical vs quantum computing comparison
[6-8s] "Learn More" call-to-action with futuristic UI

VISUAL ELEMENTS:
- Glowing particles and energy waves
- Holographic displays
- 3D geometric shapes (qubits)
- Floating mathematical equations
- Circuit board patterns
- Light beam animations

MOOD: Inspiring, futuristic, educational
LIGHTING: Dramatic blue/cyan highlights
QUALITY: High-definition, cinematic, 720p`;
}