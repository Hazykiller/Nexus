/**
 * Vertex Email Service
 * Sends OTP verification emails via Resend.
 * Falls back to console logging when RESEND_API_KEY is not set.
 */

export async function sendOtpEmail(email: string, otp: string, tier: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[Vertex] OTP for ${email}: ${otp} (no RESEND_API_KEY set — use 000000 to bypass)`);
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
        from: 'Vertex <onboarding@resend.dev>',
        to: email,
        subject: 'Your Vertex verification code',
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #6366f1; margin-bottom: 8px;">Vertex</h2>
            <p style="color: #333; font-size: 16px;">Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 24px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; border-radius: 12px; margin: 16px 0;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 14px;">This code expires in 15 minutes.</p>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Vertex] Resend API error:', data);
      // Don't throw — just log. User can use 000000.
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Vertex] Mail send failed:', error);
    // Don't throw — registration should still succeed
    return { success: false, error };
  }
}
