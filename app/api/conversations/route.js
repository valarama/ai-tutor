import { Firestore } from '@google-cloud/firestore';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  databaseId: '(default)'
});

export async function GET() {
  try {
    const conversationsRef = firestore.collection('conversations');
    const snapshot = await conversationsRef
      .orderBy('startTime', 'desc')
      .limit(20)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ conversations: [] });
    }

    const conversations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      conversations.push({
        sessionId: doc.id,
        status: data.status || 'active',
        channel: data.channel || 'Audio',
        hasAudio: data.hasAudio || false,
        audioFileUrl: data.audioFileUrl || null,
        audioTranscript: data.audioTranscript || null,
        startTime: data.startTime,
        messageCount: data.turns ? data.turns.length : 0,
        turns: data.turns || []
      });
    });

    return NextResponse.json({ 
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      conversations: [] 
    }, { status: 500 });
  }
}