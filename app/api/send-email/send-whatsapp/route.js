import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phoneNumber, message, videoUrl } = await request.json();

    // Clean and validate phone number
    let cleanNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    // If number doesn't start with country code, add India's code (+91)
    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

    // Build WhatsApp message
    let whatsappMessage = encodeURIComponent(message || 'Educational Material');
    
    if (videoUrl) {
      whatsappMessage += encodeURIComponent(`\n\nVideo: ${videoUrl}`);
    }

    // Create WhatsApp Web URL
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${whatsappMessage}`;

    console.log('WhatsApp URL generated:', whatsappUrl);

    return NextResponse.json({ 
      success: true, 
      whatsappUrl: whatsappUrl,
      phoneNumber: `+${cleanNumber}`
    });

  } catch (error) {
    console.error('WhatsApp error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}