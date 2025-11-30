import { NextResponse } from 'next/server';
const sgMail = require('@sendgrid/mail');

export async function POST(request) {
  try {
    const { to, subject, htmlContent } = await request.json();
    
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY is not set');
      return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 500 });
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to,
      from: 'noreply@Yoombaa.com', // Make sure this sender is verified in SendGrid
      subject,
      html: htmlContent
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
