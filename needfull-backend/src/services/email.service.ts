import { Resend } from 'resend'
import { env } from '../config/env.js'

const resend = new Resend(env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[Email] Resend rejected the send:', error)
    throw new Error(`Email delivery failed: ${error.message}`)
  }

  console.log(`[Email] Sent to ${to} — Resend message ID: ${data?.id}`)
}

function brandedTemplate(content: string, footerNote?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #1A6B4A; color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 40px 20px; background-color: #f9fafb; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }
        .button { display: inline-block; background-color: #1A6B4A; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
        .info-box { background-color: #E6F5EE; border-left: 4px solid #1A6B4A; padding: 16px; margin: 16px 0; border-radius: 4px; }
        .info-box p { margin: 0; color: #0D4F35; font-size: 14px; }
        .amount { font-size: 24px; font-weight: 700; color: #1A6B4A; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NeedFull</h1>
          <p>Student Task Marketplace</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          ${footerNote || ''}
          <p style="margin-top: 16px;">&copy; 2026 NeedFull. All rights reserved.</p>
          <p>Support: <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">support@needfull.ng</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendTransferConfirmed(
  to: string,
  fullName: string,
  amountNaira: number,
  newBalanceNaira: number
): Promise<void> {
  await sendEmail({
    to,
    subject: `\u20A6${amountNaira.toLocaleString()} added to your wallet \u2713`,
    html: brandedTemplate(`
      <h2>Transfer Confirmed \u2713</h2>
      <p>Hi ${fullName},</p>
      <p>Great news! Your transfer of <span class="amount">\u20A6${amountNaira.toLocaleString()}</span> has been verified and added to your wallet.</p>
      <div class="info-box">
        <p><strong>Your new wallet balance:</strong></p>
        <div style="font-size: 24px; font-weight: 700; color: #1A6B4A; text-align: center; margin: 12px 0;">\u20A6${newBalanceNaira.toLocaleString()}</div>
      </div>
      <p>You can now use this balance to apply for tasks, and any earnings will add to it.</p>
    `, 'Questions about your balance? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Get support</a>'),
  })
}

export async function sendManualTransferReceived(
  to: string,
  fullName: string,
  amountNaira: number
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Transfer request received \u2014 NeedFull',
    html: brandedTemplate(`
      <h2>Transfer Request Received</h2>
      <p>Hi ${fullName},</p>
      <p>We received your bank transfer of <span class="amount">\u20A6${amountNaira.toLocaleString()}</span> to your NeedFull wallet.</p>
      <div class="info-box">
        <p><strong>\u23F1\uFE0F Verification in progress</strong></p>
        <p>We're verifying the payment details. This typically takes 1\u20132 hours during business hours.</p>
        <p>Once verified, the funds will be credited to your wallet automatically.</p>
      </div>
    `, 'Need help? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Contact us</a>'),
  })
}

export async function sendTaskPaymentReleased(
  runnerEmail: string,
  runnerName: string,
  amountNaira: number,
): Promise<void> {
  await sendEmail({
    to: runnerEmail,
    subject: 'Payment Released \u2014 NeedFull',
    html: brandedTemplate(`
      <h2>Payment Released \u2713</h2>
      <p>Hi ${runnerName},</p>
      <p>Your payment of <span class="amount">\u20A6${amountNaira.toLocaleString()}</span> for a task has been released to your wallet.</p>
      <p>Thanks for using NeedFull!</p>
    `),
  })
}

export function verificationEmailTemplate(otp: string, fullName: string): string {
  const firstName = fullName.split(' ')[0]
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      <div style="width: 48px; height: 48px; background: #1A6B4A; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
        <span style="color: #ffffff; font-size: 20px; font-weight: 800;">N</span>
      </div>
      <h1 style="font-size: 20px; color: #0D1410; margin: 0 0 8px;">Verify your email, ${firstName}</h1>
      <p style="font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0 0 24px;">
        Enter this code in the NeedFull app to verify your account and start posting or completing tasks.
      </p>
      <div style="background: #E6F5EE; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 800; color: #1A6B4A; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #9CA3AF; margin: 0;">This code expires in 15 minutes. If you didn't create a NeedFull account, you can safely ignore this email.</p>
    </div>
  `
}
