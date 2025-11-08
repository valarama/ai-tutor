import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { meetingName = 'Educational Session', meetingType = 'Instant' } = await request.json();

    const response = await fetch(`${process.env.RC_SERVER_URL}/restapi/v1.0/account/~/extension/~/meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RC_USER_JWT}`
      },
      body: JSON.stringify({
        topic: meetingName,
        meetingType: meetingType,
        allowJoinBeforeHost: true,
        startHostVideo: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create meeting');
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true,
      joinUrl: data.links?.joinUri || data.joinUri,
      meetingId: data.id
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}