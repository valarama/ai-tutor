import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { image } = await request.json();
    
    // Remove data URL prefix
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'TEXT_DETECTION', maxResults: 5 }
            ]
          }]
        })
      }
    );

    const visionData = await visionResponse.json();
    
    if (!visionData.responses || !visionData.responses[0]) {
      return NextResponse.json({ 
        success: false, 
        error: 'No response from Vision API' 
      }, { status: 500 });
    }

    const response = visionData.responses[0];
    
    // Extract labels
    const labels = response.labelAnnotations?.map(label => label.description) || [];
    
    // Extract objects
    const objects = response.localizedObjectAnnotations?.map(obj => obj.name) || [];
    
    // Extract text
    const text = response.textAnnotations?.[0]?.description || '';
    
    // Build description
    let description = '🔍 **Vision AI Analysis**\n\n';
    
    if (objects.length > 0) {
      description += `📦 **Objects Detected:**\n${objects.join(', ')}\n\n`;
    }
    
    if (labels.length > 0) {
      description += `🏷️ **Labels:**\n${labels.slice(0, 5).join(', ')}\n\n`;
    }
    
    if (text) {
      description += `📝 **Text Found:**\n${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`;
    }
    
    if (objects.length === 0 && labels.length === 0 && !text) {
      description = '🔍 Could not detect any specific objects or text in the image.';
    }

    return NextResponse.json({ 
      success: true, 
      description,
      labels,
      objects,
      text
    });

  } catch (error) {
    console.error('Vision API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}