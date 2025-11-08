import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

export const dynamic = 'force-dynamic';

const db = new Firestore({
  projectId: 'chennai-geniai',
  databaseId: '(default)'
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID required' 
      }, { status: 400 });
    }

    console.log(`🔍 Fetching conversation: ${sessionId}`);
    
    const conversationRef = db.collection('conversations').doc(sessionId);
    const doc = await conversationRef.get();

    if (!doc.exists) {
      return NextResponse.json({ 
        messages: [],
        suggestions: {
          nextBestAction: 'No conversation found',
          suggestedResponse: '',
          upsellOpportunity: 'N/A',
          keyQuestions: []
        },
        error: 'Conversation not found'
      }, { status: 404 });
    }

    const data = doc.data();
    
    const messages = (data.turns || []).map((turn) => {
      return {
        role: turn.speaker === 'customer' ? 'customer' : 'agent',
        text: turn.text,
        intent: turn.intent || 'Unknown',
        confidence: turn.confidence || 0,
        page: turn.page || 'Unknown',
        sentiment: 'Neutral',
        time: new Date(turn.timestamp).toLocaleTimeString(),
        parameters: turn.parameters || {}
      };
    });
    
    const suggestions = data.latestSuggestions || {
      nextBestAction: 'Waiting for customer input...',
      suggestedResponse: 'How can I help you today?',
      upsellOpportunity: 'No opportunity detected yet',
      keyQuestions: [
        'What product are you calling about?',
        'What issue are you experiencing?',
        'When did you first notice this?'
      ]
    };
    
    const behavior = [
      suggestions.nextBestAction,
      'Maintain professional and empathetic tone',
      'Verify customer information before proceeding',
      'Document all troubleshooting steps taken'
    ];
    
    console.log(`✓ Retrieved ${messages.length} messages for ${sessionId}`);
    
    return NextResponse.json({ 
      messages,
      suggestions: {
        behavior,
        upsell: {
          possibility: suggestions.upsellOpportunity.toLowerCase().includes('yes') ? 'Yes' : 'No',
          explanation: suggestions.upsellOpportunity
        },
        questions: suggestions.keyQuestions
      },
      sessionId: data.sessionId,
      status: data.status,
      channel: data.channel,
      startTime: data.startTime,
      lastUpdate: data.lastUpdate
    });

  } catch (error) {
    console.error('❌ Conversation fetch error:', error);
    return NextResponse.json({
      messages: [],
      suggestions: {
        behavior: ['Error loading conversation'],
        upsell: { possibility: 'No', explanation: '' },
        questions: []
      },
      error: error.message
    }, { status: 500 });
  }
}
