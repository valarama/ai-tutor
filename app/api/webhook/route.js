import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { VertexAI } from '@google-cloud/vertexai';

export const dynamic = 'force-dynamic';

const db = new Firestore({
  projectId: 'chennai-geniai',
  databaseId: '(default)'
});

const vertex_ai = new VertexAI({
  project: 'chennai-geniai',
  location: 'us-central1'
});

// Retry function with exponential backoff
async function generateWithRetry(model, prompt, maxRetries = 2) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('rate limit') ||
                          error.code === 429;
      
      if (isRateLimit && attempt < maxRetries - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.log(`⏳ Rate limit in webhook. Retrying in ${delay/1000}s... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded due to rate limits');
}

async function generateEducationSuggestions(conversationHistory) {
  try {
    const model = vertex_ai.preview.getGenerativeModel({
      model: 'gemini-2.0-flash-exp'
    });

    // Trim history to reduce tokens
    const trimmedHistory = conversationHistory.length > 1500
      ? conversationHistory.substring(0, 1500) + '...[truncated]'
      : conversationHistory;

    const prompt = `You are an AI teaching assistant analyzing an educational conversation.

Conversation so far:
${trimmedHistory}

Analyze this educational interaction and provide guidance in JSON format:
{
  "nextBestAction": "What should the instructor do next to enhance learning?",
  "suggestedResponse": "A helpful teaching response or explanation",
  "learningAssessment": "Student's understanding level: Beginner/Intermediate/Advanced",
  "keyQuestions": ["Deep thinking question 1?", "Follow-up question 2?", "Application question 3?"],
  "topicsToExplore": ["Related topic 1", "Related topic 2", "Related topic 3"]
}

Keep it concise and actionable.`;

    const result = await generateWithRetry(model, prompt);
    const response = result.response;
    const text = response.candidates[0].content.parts[0].text;
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Could not parse Gemini response');
  } catch (error) {
    console.error('❌ Education suggestions error:', error.message);
    return {
      nextBestAction: "Check student understanding with follow-up questions",
      suggestedResponse: "That's a great question! Let me explain that concept in more detail...",
      learningAssessment: "Beginner - needs more foundational concepts",
      keyQuestions: [
        "Can you explain this concept in your own words?",
        "What real-world applications can you think of?",
        "How does this relate to what we learned earlier?"
      ],
      topicsToExplore: [
        "Foundational principles",
        "Practical applications",
        "Advanced concepts"
      ]
    };
  }
}

async function storeConversationTurn(sessionId, turnData) {
  const conversationRef = db.collection('conversations').document(sessionId);
  
  const doc = await conversationRef.get();
  
  if (!doc.exists) {
    await conversationRef.set({
      sessionId: sessionId,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      status: 'active',
      channel: 'dialogflow',
      turns: [],
      metadata: turnData.metadata || {}
    });
  }
  
  await conversationRef.update({
    turns: Firestore.FieldValue.arrayUnion(turnData),
    lastUpdate: new Date().toISOString()
  });
  
  console.log(`✓ Stored turn for session: ${sessionId}`);
}

export async function POST(request) {
  try {
    const webhookRequest = await request.json();
    
    console.log('📞 Dialogflow CX Webhook Request');
    
    const {
      sessionInfo = {},
      text = '',
      intentInfo = {},
      pageInfo = {},
      messages = []
    } = webhookRequest;
    
    const sessionId = sessionInfo.session?.split('/').pop() || `session-${Date.now()}`;
    const currentPage = pageInfo.displayName || 'Unknown Page';
    const currentIntent = intentInfo.displayName || 'No Intent';
    const userQuery = text || messages[0]?.text?.text?.[0] || '';
    
    console.log(`Session: ${sessionId}, Intent: ${currentIntent}, Query: ${userQuery}`);
    
    // Get conversation history
    const conversationRef = db.collection('conversations').document(sessionId);
    const conversationDoc = await conversationRef.get();
    const conversationHistory = conversationDoc.exists 
      ? conversationDoc.data().turns
          .map(t => `${t.speaker === 'customer' ? 'Student' : 'Instructor'}: ${t.text}`)
          .join('\n')
      : '';
    
    // Store student's turn
    const turnData = {
      timestamp: new Date().toISOString(),
      speaker: 'customer',
      text: userQuery,
      intent: currentIntent,
      page: currentPage,
      confidence: intentInfo.confidence || 0,
      parameters: sessionInfo.parameters || {}
    };
    
    await storeConversationTurn(sessionId, turnData);
    
    // Generate AI teaching suggestions
    const suggestions = await generateEducationSuggestions(
      conversationHistory + `\nStudent: ${userQuery}`
    );
    
    // Store suggestions in Firestore
    await conversationRef.update({
      latestSuggestions: suggestions,
      suggestionsUpdated: new Date().toISOString()
    });
    
    console.log('✓ Generated education suggestions:', suggestions.nextBestAction);
    
    // Prepare webhook response for Dialogflow CX
    const webhookResponse = {
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: [suggestions.suggestedResponse || "Let me help you understand that better."]
            }
          }
        ]
      },
      sessionInfo: {
        parameters: {
          ...sessionInfo.parameters,
          teachingSuggestion: suggestions.nextBestAction,
          learningLevel: suggestions.learningAssessment
        }
      }
    };
    
    console.log('✓ Webhook response prepared');
    
    return NextResponse.json(webhookResponse);
    
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      fulfillmentResponse: {
        messages: [
          {
            text: {
              text: ["That's an interesting question! Let me think about the best way to explain this..."]
            }
          }
        ]
      }
    });
  }
}