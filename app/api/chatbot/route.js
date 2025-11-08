import { VertexAI } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1'
});

export async function POST(request) {
  try {
    const { message, model = 'gemini-2.5-flash' } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ 
        response: 'Please provide a message.'
      }, { status: 400 });
    }

    const generativeModel = vertexAI.getGenerativeModel({
      model,
      systemInstruction: 'You are Gami, an educational AI tutor. Help students learn in a friendly way. Keep responses concise (2-4 sentences).'
    });

    const result = await generativeModel.generateContent(message);
    const aiResponse = result.response.candidates[0].content.parts[0].text;

    return NextResponse.json({ 
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      response: "Error processing request"
    }, { status: 500 });
  }
}