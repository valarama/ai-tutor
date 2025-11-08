import { Firestore } from '@google-cloud/firestore';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  databaseId: '(default)'
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'sessionId required',
        messages: []
      }, { status: 400 });
    }

    const sessionRef = firestore.collection('conversations').doc(sessionId);
    const doc = await sessionRef.get();

    if (!doc.exists) {
      return NextResponse.json({ 
        error: 'Session not found',
        messages: []
      }, { status: 404 });
    }

    const data = doc.data();
    const messages = [];

    if (data.audioTranscript) {
      const lines = data.audioTranscript.split('\n');
      for (const line of lines) {
        if (line.trim() === '') continue;
        const instructorMatch = line.match(/^Instructor:\s*(.+)$/);
        const studentMatch = line.match(/^Student:\s*(.+)$/);
        
        if (instructorMatch) {
          messages.push({
            role: 'instructor',
            speaker: 'Instructor',
            text: instructorMatch[1].trim()
          });
        } else if (studentMatch) {
          messages.push({
            role: 'student',
            speaker: 'Student',
            text: studentMatch[1].trim()
          });
        }
      }
    }

    if (data.turns && Array.isArray(data.turns)) {
      data.turns.forEach(turn => {
        if (turn.userMessage) {
          messages.push({
            role: 'user',
            speaker: 'User',
            text: turn.userMessage
          });
        }
        if (turn.botResponse) {
          messages.push({
            role: 'bot',
            speaker: 'Bot',
            text: turn.botResponse
          });
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      messages,
      suggestions: {}
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: error.message,
      messages: []
    }, { status: 500 });
  }
}