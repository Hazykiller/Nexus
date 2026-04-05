import nodemailer from 'nodemailer';

/**
 * Vertex Email Service
 * Sends OTP verification emails via Nodemailer (Gmail).
 */
export async function sendOtpEmail(to: string, otp: string, tier: string) {
  try {
    // 1. Generate a test SMTP service account from ethereal.email automatically
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Vertex Security Node" <noreply@vertex.social>',
      to,
      subject: `[Vertex] Your Verification Code: ${otp}`,
      html: `
        <div style="font-family: monospace; background-color: #050508; color: #fff; padding: 30px; border-radius: 12px; text-align: center;">
          <h2 style="color: #22d3ee; margin-bottom: 20px;">VERTEX ENCRYPTION NODE</h2>
          <p style="color: #a1a1aa;">A new node is attempting to join the network.</p>
          <p style="color: #a1a1aa;">Classification Tier: <strong style="color: #bef264;">${tier}</strong></p>
          <div style="background-color: #111; border: 1px solid #22d3ee; display: inline-block; padding: 15px 30px; margin: 25px 0; border-radius: 8px;">
            <p style="font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 4px; color: #fff;">${otp}</p>
          </div>
          <p style="color: #71717a; font-size: 12px; margin-top: 30px;">
            This temporary authentication key will self-destruct in 15 minutes.<br/>
            If you did not initiate this uplink, ignore this message.
          </p>
        </div>
      `,
    });

    // 2. Output the Ethereal URL string directly to the Next.js server console!
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n======================================================`);
    console.log(`🎯 [Ethereal Mail] OTP SENT SUCCESSFULLY TO: ${to}`);
    console.log(`🌐 [Ethereal Mail] READ THE EMAIL SECURELY HERE: ${previewUrl}`);
    console.log(`======================================================\n`);

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('SMTP Setup/Send Failed:', error);
    return { success: false, error };
  }
}
