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

function formatBookingDateTime(date: string, hour: number) {
  const d = new Date(date + "T12:00:00");
  const dateStr = d.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const start = `${String(hour).padStart(2, "0")}:00`;
  const end = `${String(hour + 1).padStart(2, "0")}:00`;
  return { dateStr, timeStr: `${start} – ${end}` };
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    console.log(`\n[EMAIL] To: ${to}\n[EMAIL] Subject: ${subject}\n[EMAIL] (no SMTP configured)\n`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });
  await transporter.sendMail({ from: `"The Birdie Club" <${gmailUser}>`, to, subject, html });
}

export async function sendBookingConfirmedEmail(email: string, name: string, date: string, hour: number) {
  const { dateStr, timeStr } = formatBookingDateTime(date, hour);
  await sendEmail(
    email,
    "✅ Your Birdie Club session is confirmed!",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h1 style="color:#16a34a;font-size:22px;margin-bottom:4px;">🏸 The Birdie Club</h1>
      <p style="color:#6b7280;margin-bottom:20px;">Hi ${name}, your session has been confirmed.</p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#15803d;">📅 ${dateStr}</p>
        <p style="margin:0;font-size:14px;color:#166534;">🕐 ${timeStr}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">See you on the court! If you need to cancel, please do so at least 24 hours before your session.</p>
    </div>`
  );
}

export async function sendBookingCancelledEmail(email: string, name: string, date: string, hour: number, reason: string) {
  const { dateStr, timeStr } = formatBookingDateTime(date, hour);
  await sendEmail(
    email,
    "❌ Your Birdie Club session has been cancelled",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h1 style="color:#16a34a;font-size:22px;margin-bottom:4px;">🏸 The Birdie Club</h1>
      <p style="color:#6b7280;margin-bottom:20px;">Hi ${name}, unfortunately your session has been cancelled.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 4px 0;font-size:15px;font-weight:700;color:#b91c1c;">📅 ${dateStr}</p>
        <p style="margin:0;font-size:14px;color:#991b1b;">🕐 ${timeStr}</p>
      </div>
      ${reason ? `<p style="color:#374151;font-size:14px;margin-bottom:8px;"><strong>Reason:</strong> ${reason}</p>` : ""}
      <p style="color:#6b7280;font-size:14px;">Feel free to book another slot via our website. Sorry for the inconvenience.</p>
    </div>`
  );
}

export async function sendEventRegistrationConfirmedEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  seats: number
) {
  const d = new Date(eventDate + "T12:00:00");
  const dateStr = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  await sendEmail(
    email,
    `✅ Your registration for "${eventTitle}" is confirmed!`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h1 style="color:#16a34a;font-size:22px;margin-bottom:4px;">🏸 The Birdie Club</h1>
      <p style="color:#6b7280;margin-bottom:20px;">Hi ${name}, your registration has been confirmed. See you there!</p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#15803d;">🎾 ${eventTitle}</p>
        <p style="margin:0 0 4px 0;font-size:14px;color:#166534;">📅 ${dateStr}</p>
        ${eventTime ? `<p style="margin:0 0 4px 0;font-size:14px;color:#166534;">🕐 ${eventTime}</p>` : ""}
        <p style="margin:0;font-size:14px;color:#166534;">🎟️ ${seats} seat${seats > 1 ? "s" : ""} reserved</p>
      </div>
      <p style="color:#6b7280;font-size:14px;">If you need to cancel, please contact us as soon as possible. We look forward to seeing you!</p>
    </div>`
  );
}

export async function sendEventCancelledEmail(
  email: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  reason: string
) {
  const d = new Date(eventDate + "T12:00:00");
  const dateStr = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  await sendEmail(
    email,
    `❌ Event cancelled: "${eventTitle}"`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h1 style="color:#16a34a;font-size:22px;margin-bottom:4px;">🏸 The Birdie Club</h1>
      <p style="color:#6b7280;margin-bottom:20px;">Hi ${name}, we're sorry to inform you that the following event has been cancelled.</p>
      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#b91c1c;">🎾 ${eventTitle}</p>
        <p style="margin:0;font-size:14px;color:#991b1b;">📅 ${dateStr}</p>
      </div>
      ${reason ? `<p style="color:#374151;font-size:14px;margin-bottom:8px;"><strong>Reason:</strong> ${reason}</p>` : ""}
      <p style="color:#6b7280;font-size:14px;">We apologise for the inconvenience. Stay tuned for future events!</p>
    </div>`
  );
}

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

export async function sendOutreachEmail(
  email: string,
  name: string,
  eventId: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  message: string,
  siteUrl: string
) {
  const d = new Date(eventDate + "T12:00:00");
  const dateStr = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const registerUrl = `${siteUrl}/events#${eventId}`;
  await sendEmail(
    email,
    `🎾 You're invited: ${eventTitle}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h1 style="color:#16a34a;font-size:22px;margin-bottom:4px;">🏸 The Birdie Club</h1>
      <p style="color:#6b7280;margin-bottom:20px;">Hi ${name}, we have an upcoming event we think you'll love!</p>
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0 0 6px 0;font-size:16px;font-weight:700;color:#15803d;">🎾 ${eventTitle}</p>
        <p style="margin:0 0 4px 0;font-size:14px;color:#166534;">📅 ${dateStr}</p>
        ${eventTime ? `<p style="margin:0;font-size:14px;color:#166534;">🕐 ${eventTime}</p>` : ""}
      </div>
      ${message ? `<p style="color:#374151;font-size:14px;margin-bottom:20px;white-space:pre-line;">${message}</p>` : ""}
      <a href="${registerUrl}"
        style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;font-size:15px;
               padding:14px 28px;border-radius:12px;text-decoration:none;margin-bottom:20px;">
        Register Now →
      </a>
      <p style="color:#9ca3af;font-size:12px;">Login is required to register. If you no longer wish to receive updates, please contact us.</p>
    </div>`
  );
}
