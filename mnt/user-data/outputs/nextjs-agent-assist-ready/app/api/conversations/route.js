import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

export const dynamic = 'force-dynamic';

const db = new Firestore({
  projectId: 'chennai-geniai',
  databaseId: '(default)'
});

export async function GET() {
  try {
    console.log('📋 Fetching conversations from Firestore...');
    
    const conversationsRef = db.collection('conversations');
    const snapshot = await conversationsRef
      .orderBy('lastUpdate', 'desc')
      .limit(50)
      .get();
    
    if (snapshot.empty) {
      console.log('⚠ No conversations found');
      return NextResponse.json({ 
        conversations: [],
        source: 'firestore-empty'
      });
    }
    
    const conversations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      const startTime = new Date(data.startTime);
      const lastUpdate = new Date(data.lastUpdate);
      const durationMs = lastUpdate - startTime;
      const durationMin = Math.floor(durationMs / 60000);
      const durationSec = Math.floor((durationMs % 60000) / 1000);
      
      conversations.push({
        sessionId: doc.id,
        duration: `${durationMin}m${durationSec}s`,
        turns: data.turns?.length || 0,
        channel: data.channel || 'phone',
        status: data.status || 'active',
        startTime: startTime.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        timestamp: startTime.getTime()
      });
    });
    
    console.log(`✓ Found ${conversations.length} conversations`);
    
    return NextResponse.json({ 
      conversations,
      source: 'firestore',
      count: conversations.length
    });
    
  } catch (error) {
    console.error('❌ Firestore fetch error:', error);
    return NextResponse.json({
      conversations: [],
      source: 'error',
      error: error.message
    }, { status: 500 });
  }
}
