import nodemailer from "nodemailer";

const HTML_TEMPLATE = (otp: string) => `
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
`;

export async function sendOtpEmail(email: string, otp: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  // No credentials = dev mode: print to server console
  if (!gmailUser || !gmailPass) {
    console.log("\n================================================");
    console.log(`  📧 OTP LOGIN CODE for ${email}`);
    console.log(`  Code: ${otp}`);
    console.log(`  (expires in 10 minutes)`);
    console.log("================================================\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"The Birdie Club" <${gmailUser}>`,
    to: email,
    subject: "Your Birdie Club login code",
    html: HTML_TEMPLATE(otp),
  });
}
