import { Firestore } from '@google-cloud/firestore';
import { VertexAI } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  databaseId: '(default)'
});

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1'
});

export async function POST(request) {
  try {
    const { sessionId, model = 'gemini-2.5-flash' } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ 
        success: false,
        error: 'sessionId required' 
      }, { status: 400 });
    }

    const sessionRef = firestore.collection('conversations').doc(sessionId);
    const doc = await sessionRef.get();

    if (!doc.exists) {
      return NextResponse.json({ 
        success: false,
        error: 'Session not found' 
      }, { status: 404 });
    }

    const data = doc.data();
    let conversationText = '';
    
    if (data.audioTranscript) {
      conversationText += data.audioTranscript + '\n\n';
    }
    
    if (data.turns && Array.isArray(data.turns)) {
      data.turns.forEach(turn => {
        if (turn.userMessage) conversationText += `User: ${turn.userMessage}\n`;
        if (turn.botResponse) conversationText += `Bot: ${turn.botResponse}\n`;
      });
    }

    if (!conversationText.trim()) {
      return NextResponse.json({ 
        success: false,
        error: 'No conversation data' 
      });
    }

    const generativeModel = vertexAI.getGenerativeModel({ model });
    const prompt = `Summarize this educational session:\n\n${conversationText}\n\nInclude main topics, key points, and assessment.`;
    
    const result = await generativeModel.generateContent(prompt);
    const summary = result.response.candidates[0].content.parts[0].text;

    return NextResponse.json({ 
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}