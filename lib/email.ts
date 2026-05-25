import { Resend } from "resend";

export async function sendOtpEmail(email: string, otp: string) {
  // No API key = dev mode: print to server console
  if (!process.env.RESEND_API_KEY) {
    console.log("\n================================================");
    console.log(`  📧 OTP LOGIN CODE for ${email}`);
    console.log(`  Code: ${otp}`);
    console.log(`  (expires in 10 minutes)`);
    console.log("================================================\n");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "The Birdie Club <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: email,
    subject: "Your Birdie Club login code",
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 4px;">🏸 The Birdie Club</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">Your one-time login code:</p>
        <div style="font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #16a34a;
                    padding: 20px; background: #f0fdf4; border-radius: 12px; text-align: center;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
        </p>
      </div>
    `,
  });
}
