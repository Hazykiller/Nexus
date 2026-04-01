/**
 * Vertex Professional Mailer (Resend Integration).
 * Sends high-security OTPs and account alerts to users via professional HTML templates.
 * 
 * To enable: Set RESEND_API_KEY in .env.
 */

export async function sendOtpEmail(email: string, otp: string, tier: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n========================================`);
    console.log(`🔐 VERTEX TEST OTP FOR ${email}: ${otp}`);
    console.log(`📡 TIER: ${tier}`);
    console.log(`⚠️  RESEND_API_KEY Missing: Using Terminal Log.`);
    console.log(`========================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Vertex Security <security@vertex.social>',
        to: email,
        subject: '🔐 Your Vertex Security Code',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
            <h1 style="color: #6366f1;">Vertex Security</h1>
            <p>Your 6-digit security code is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1;">
              ${otp}
            </div>
            <p>This code expires in 15 minutes.</p>
            <p style="font-size: 11px; color: #999;">Account Tier: ${tier}</p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Resend error');

    return { success: true, data };
  } catch (error) {
    console.error('[Vertex SEC] Mailer Failure:', error);
    return { success: false, error };
  }
}
