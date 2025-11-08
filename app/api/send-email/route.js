import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, summary, transcript, sessionId } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email address' 
      }, { status: 400 });
    }

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'chennaigenai@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD || 'lgwsutbygdxugnbx'
      }
    });

    // Email content
    const emailSubject = `Educational Session Summary - ${sessionId}`;
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px; }
    .summary { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
    .transcript { background: white; padding: 20px; border-left: 4px solid #764ba2; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    h1 { margin: 0; font-size: 28px; }
    h2 { color: #667eea; margin-top: 0; }
    .message { white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Educational Session Summary</h1>
      <p>Session ID: ${sessionId}</p>
    </div>
    
    <div class="content">
      <div class="summary">
        <h2>📝 AI Generated Summary</h2>
        <p>${summary || 'No summary available'}</p>
      </div>
      
      <div class="transcript">
        <h2>💬 Full Transcript</h2>
        <div class="message">${transcript || 'No transcript available'}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>This email was automatically generated from your educational session.</p>
      <p>© 2025 Chennai GenAI Education Platform</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"Chennai GenAI Education" <${process.env.GMAIL_USER || 'chennaigenai@gmail.com'}>`,
      to: email,
      subject: emailSubject,
      html: emailBody
    });

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully!'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}