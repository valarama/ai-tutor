import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { fromNumber, toNumber } = await request.json();

    if (!fromNumber || !toNumber) {
      return NextResponse.json({ 
        success: false,
        error: 'Both numbers required' 
      }, { status: 400 });
    }

    const response = await fetch(`${process.env.RC_SERVER_URL}/restapi/v1.0/account/~/extension/~/ring-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RC_USER_JWT}`
      },
      body: JSON.stringify({
        from: { phoneNumber: fromNumber },
        to: { phoneNumber: toNumber },
        playPrompt: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Call failed');
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true,
      status: data.status?.callStatus || 'InProgress'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}