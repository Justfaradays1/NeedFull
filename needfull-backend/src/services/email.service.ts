// WHAT: Email service with Nodemailer integration for NeedFull notifications
// WHY: Centralized, branded email templates for auth, transfers, and task notifications
// FUTURE: Switch SMTP to Resend.com for production deliverability, add email queuing with Bull

import nodemailer from 'nodemailer';
import env from '../config/env';

// WHAT: Create Nodemailer transporter with SMTP config from environment
// WHY: Reusable connection pool for all email sending
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // Use TLS for 465, STARTTLS for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// WHAT: Helper function to send email with error logging
// WHY: Consistent error handling across all email functions (fail silently)
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `NeedFull <${env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    // WHAT: Log error but don't throw - email failure should never break main flow
    // WHY: Email is best-effort; user can still use app if email fails
    console.error(`[Email Error] Failed to send email to ${to}:`, error);
  }
}

// WHAT: HTML template utility for consistent branding across all emails
// WHY: Reduce duplication, ensure consistent brand colors and layout
function emailTemplate(content: string, footerNote?: string): string {
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
        .button:hover { background-color: #0D4F35; }
        .otp-display { font-size: 36px; letter-spacing: 8px; font-weight: 700; color: #1A6B4A; text-align: center; margin: 24px 0; font-family: 'Courier New', monospace; }
        .info-box { background-color: #E6F5EE; border-left: 4px solid #1A6B4A; padding: 16px; margin: 16px 0; border-radius: 4px; }
        .info-box p { margin: 0; color: #0D4F35; font-size: 14px; }
        .tip { background-color: white; border: 1px solid #e5e7eb; padding: 16px; margin: 12px 0; border-radius: 6px; }
        .tip strong { color: #1A6B4A; }
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
          <p style="margin-top: 16px;">© 2026 NeedFull. All rights reserved.</p>
          <p>Support: <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">support@needfull.ng</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// WHAT: Send email verification code (step 2 of registration)
// WHY: Confirm user email ownership before account activation
export async function sendEmailVerification(
  to: string,
  fullName: string,
  otp: string
): Promise<void> {
  const content = `
    <h2>Verify Your Email</h2>
    <p>Hi ${fullName},</p>
    <p>Welcome to NeedFull! To complete your registration, please verify your email address using the code below.</p>
    
    <div class="info-box">
      <p><strong>Your verification code:</strong></p>
      <div class="otp-display">${otp}</div>
      <p style="margin: 8px 0 0 0; font-size: 12px;">This code expires in 30 minutes</p>
    </div>
    
    <p>If you didn't create this account, you can safely ignore this email.</p>
    <p style="color: #666; font-size: 13px; margin-top: 24px;">Never share this code with anyone, including NeedFull staff.</p>
  `;

  const footerNote = 'Questions? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Contact our support team</a>';

  await sendEmail(to, 'Verify your NeedFull account', emailTemplate(content, footerNote));
}

// WHAT: Send password reset link
// WHY: Allow users to securely reset forgotten passwords
export async function sendPasswordReset(
  to: string,
  fullName: string,
  resetLink: string
): Promise<void> {
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${fullName},</p>
    <p>We received a request to reset your NeedFull password. Click the button below to create a new one.</p>
    
    <div style="text-align: center;">
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    
    <div class="info-box">
      <p><strong>⏱️ This link expires in 1 hour</strong></p>
    </div>
    
    <p><strong>Security note:</strong> If you didn't request a password reset, please ignore this email. Your account is secure and no changes have been made.</p>
    <p style="color: #666; font-size: 13px;">The reset link above won't work if you copy/paste it. Use the button above instead.</p>
  `;

  const footerNote = 'Still having trouble? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Get help from our team</a>';

  await sendEmail(to, 'Reset your NeedFull password', emailTemplate(content, footerNote));
}

// WHAT: Send welcome email after successful registration
// WHY: Onboard new users with quick-start guidance
export async function sendWelcomeEmail(
  to: string,
  fullName: string
): Promise<void> {
  const content = `
    <h2>Welcome to NeedFull! 🎉</h2>
    <p>Hi ${fullName},</p>
    <p>Your account is all set up. You're now part of a student community earning money by helping fellow students complete everyday tasks.</p>
    
    <h3 style="color: #1A6B4A; margin-top: 24px;">📋 Quick start in 3 steps:</h3>
    
    <div class="tip">
      <strong>1. Complete Your Profile</strong>
      <p>Add a profile photo and bio so task posters know who they're working with. Takes 2 minutes!</p>
    </div>
    
    <div class="tip">
      <strong>2. Browse Available Tasks</strong>
      <p>Check out tasks in your area and skill level. Start with easy ones to build your trust score.</p>
    </div>
    
    <div class="tip">
      <strong>3. Earn & Withdraw</strong>
      <p>Complete tasks, get verified, and withdraw your earnings via bank transfer or wallet top-up.</p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://needfull.app/feed" class="button">Go to Dashboard</a>
    </div>
    
    <p style="margin-top: 24px; color: #666; font-size: 13px;">💡 <strong>Pro tip:</strong> Complete early tasks consistently to build a high trust score—unlock higher-paying jobs and exclusive opportunities!</p>
  `;

  const footerNote = 'Welcome aboard! 🚀 Any questions? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">We\'re here to help</a>';

  await sendEmail(to, 'Welcome to NeedFull 🎉', emailTemplate(content, footerNote));
}

// WHAT: Send notification when manual transfer is received
// WHY: Confirm to user that their bank transfer was recorded and is being verified
export async function sendManualTransferReceived(
  to: string,
  fullName: string,
  amountNaira: number
): Promise<void> {
  const content = `
    <h2>Transfer Request Received</h2>
    <p>Hi ${fullName},</p>
    <p>We received your bank transfer of <span class="amount">₦${amountNaira.toLocaleString()}</span> to your NeedFull wallet.</p>
    
    <div class="info-box">
      <p><strong>⏱️ Verification in progress</strong></p>
      <p>We're verifying the payment details. This typically takes 1–2 hours during business hours.</p>
      <p>Once verified, the funds will be credited to your wallet automatically.</p>
    </div>
    
    <p style="color: #666; font-size: 13px; margin-top: 24px;">If you don't see the credit within 2 hours on business days, please contact our support team with your transaction reference.</p>
  `;

  const footerNote = 'Need help? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Contact us</a>';

  await sendEmail(to, 'Transfer request received — NeedFull', emailTemplate(content, footerNote));
}

// WHAT: Send confirmation when manual transfer is verified and credited
// WHY: Celebrate successful fund addition and show new wallet balance
export async function sendTransferConfirmed(
  to: string,
  fullName: string,
  amountNaira: number,
  newBalanceNaira: number
): Promise<void> {
  const content = `
    <h2>Transfer Confirmed ✓</h2>
    <p>Hi ${fullName},</p>
    <p>Great news! Your transfer of <span class="amount">₦${amountNaira.toLocaleString()}</span> has been verified and added to your wallet.</p>
    
    <div class="info-box">
      <p><strong>Your new wallet balance:</strong></p>
      <div style="font-size: 24px; font-weight: 700; color: #1A6B4A; text-align: center; margin: 12px 0;">₦${newBalanceNaira.toLocaleString()}</div>
    </div>
    
    <p>You can now use this balance to apply for tasks, and any earnings you complete will add to it.</p>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://needfull.app/tasks" class="button">Browse Tasks</a>
    </div>
  `;

  const footerNote = 'Questions about your balance? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Get support</a>';

  await sendEmail(to, `₦${amountNaira.toLocaleString()} added to your wallet ✓`, emailTemplate(content, footerNote));
}

// WHAT: Send notification when user is selected for a task
// WHY: Celebrate task acceptance and prompt immediate action
export async function sendTaskPaymentReleased(
  runnerEmail: string,
  runnerName: string,
  amountNaira: number,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: runnerEmail,
      subject: "Payment Released — NeedFull",
      html: `<p>Hi ${runnerName},</p><p>Your payment of ₦${amountNaira.toLocaleString()} for a task has been released to your wallet.</p><p>Thanks for using NeedFull!</p>`,
    });
  } catch (error) {
    console.error("Failed to send payment release email:", error);
  }
}

export async function sendTaskAccepted(
  to: string,
  fullName: string,
  taskTitle: string
): Promise<void> {
  const content = `
    <h2>Task Accepted! 🎯</h2>
    <p>Hi ${fullName},</p>
    <p>Congratulations! The task poster has selected you for:</p>
    
    <div class="info-box">
      <p style="margin: 0;"><strong>"${taskTitle}"</strong></p>
    </div>
    
    <h3 style="color: #1A6B4A; margin-top: 24px;">What happens next?</h3>
    <ol>
      <li><strong>Message the poster</strong> to confirm timing and location (if applicable)</li>
      <li><strong>Complete the task</strong> by the deadline</li>
      <li><strong>Get verified</strong> by the poster for payment release</li>
    </ol>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://needfull.app/tasks" class="button">View Task Details</a>
    </div>
    
    <p style="color: #666; font-size: 13px; margin-top: 24px;">💬 Communicate clearly with the poster and ask questions if anything's unclear!</p>
  `;

  const footerNote = 'Need help? <a href="mailto:support@needfull.ng" style="color: #1A6B4A; text-decoration: none;">Contact support</a>';

  await sendEmail(to, `You've been selected for a task!`, emailTemplate(content, footerNote));
}
