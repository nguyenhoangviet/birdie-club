import { Resend } from "resend";
import { formatSlotRange } from "@/lib/slots";

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

export async function sendBookingConfirmedEmail(email: string, date: string, hour: number) {
  const slotLabel = formatSlotRange(hour);
  const dateLabel = formatDisplayDate(date);

  if (!process.env.RESEND_API_KEY) {
    console.log("\n================================================");
    console.log(`  📧 BOOKING CONFIRMED for ${email}`);
    console.log(`  Date: ${dateLabel}`);
    console.log(`  Time: ${slotLabel}`);
    console.log("================================================\n");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "The Birdie Club <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: email,
    subject: "Your Birdie Club session is confirmed! 🏸",
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 4px;">🏸 The Birdie Club</h1>
        <p style="color: #374151; margin-bottom: 24px; font-size: 16px;">Your booking has been <strong>confirmed</strong>!</p>
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Date</p>
          <p style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">${dateLabel}</p>
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Time</p>
          <p style="margin: 0; color: #16a34a; font-size: 18px; font-weight: 700;">${slotLabel}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">We look forward to seeing you! Please note that cancellations are not allowed within 24 hours of the session.</p>
      </div>
    `,
  });
}

export async function sendBookingCancelledEmail(
  email: string,
  date: string,
  hour: number,
  reason: string
) {
  const slotLabel = formatSlotRange(hour);
  const dateLabel = formatDisplayDate(date);

  if (!process.env.RESEND_API_KEY) {
    console.log("\n================================================");
    console.log(`  📧 BOOKING CANCELLED for ${email}`);
    console.log(`  Date: ${dateLabel}`);
    console.log(`  Time: ${slotLabel}`);
    console.log(`  Reason: ${reason}`);
    console.log("================================================\n");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "The Birdie Club <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: email,
    subject: "Your Birdie Club session has been cancelled",
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 32px;">
        <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 4px;">🏸 The Birdie Club</h1>
        <p style="color: #374151; margin-bottom: 24px; font-size: 16px;">Your booking has been <strong>cancelled</strong>.</p>
        <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Date</p>
          <p style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">${dateLabel}</p>
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Time</p>
          <p style="margin: 0 0 16px; color: #374151; font-size: 18px; font-weight: 700;">${slotLabel}</p>
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Reason</p>
          <p style="margin: 0; color: #374151; font-size: 15px;">${reason}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you have any questions, please contact us. You are welcome to book another slot.</p>
      </div>
    `,
  });
}
