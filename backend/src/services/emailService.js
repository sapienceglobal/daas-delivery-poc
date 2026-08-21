import logger from '../utils/logger.js';

import nodemailer from 'nodemailer';

/**
 * Email service using Nodemailer and Gmail.
 *
 * When EMAIL_APP_PASSWORD is not set, emails are logged to console instead of
 * sent — safe for development and staging environments.
 */

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const appPassword = process.env.EMAIL_APP_PASSWORD;
  const fromEmail = process.env.FROM_EMAIL;

  if (!sendgridApiKey && (!appPassword || !fromEmail)) {
    logger.warn('Email credentials not set — emails will be logged to console');
    return null;
  }

  if (sendgridApiKey) {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey', // SendGrid requires the exact string 'apikey'
        pass: sendgridApiKey
      }
    });
    logger.info('Nodemailer SendGrid transporter initialized');
  } else {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: fromEmail,
        pass: appPassword
      }
    });
    logger.info('Nodemailer Gmail transporter initialized');
  }

  return transporter;
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'projects.sapience@gmail.com';
const FROM_NAME = process.env.FROM_NAME || 'Lassi Lounge';

// ── Brand config ─────────────────────────────────────────────────────────
// Must be a public, absolute HTTPS URL — email clients cannot load local
// files or relative paths. Host this on your website (e.g. yourdomain.com/
// assets/email-logo.png) or a CDN/S3 bucket, and set BRAND_LOGO_URL in your
// env so each deployment of this white-label codebase can swap its own logo
// without touching this file.
const BRAND_LOGO_URL = process.env.BRAND_LOGO_URL || 'https://lassiloungeny.com/assets/images/branded/lassi-lounge/logo-email.png';
const BRAND_PRIMARY = '#7a0b10';   // deep maroon — matches app buttons/CTAs
const BRAND_PRIMARY_DARK = '#680307';
const BRAND_ACCENT = '#E8B93D';    // gold
const BRAND_CREAM = '#FBEFD9';
const BRAND_TEXT = '#1a1a1a';
const BRAND_MUTED = '#6b7280';
const BRAND_BORDER = '#eadfdb';

/**
 * Send a single email.
 */
export const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const mailer = initTransporter();

  const msg = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    text,
    html,
    attachments
  };

  if (!mailer) {
    logger.info(`[Email Preview] To: ${to} | Subject: ${subject}`);
    logger.debug(`[Email Preview] Body: ${text || html}`);
    return { delivered: false, preview: true };
  }

  try {
    await mailer.sendMail(msg);
    logger.info(`Email sent to ${to}: ${subject}`);
    return { delivered: true };
  } catch (error) {
    logger.error('Nodemailer email failed', {
      to,
      subject,
      error: error.message
    });
    throw error;
  }
};

// ── Shared branded layout ───────────────────────────────────────────────
// Table-based + inline styles on purpose: this is the "bulletproof" pattern
// that renders consistently across Gmail, Outlook, Apple Mail, etc. — flex/
// grid and <style> blocks are unreliable in many email clients.

const emailButton = (label, url) => `
  <a href="${url}" target="_blank" style="display:inline-block;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.4px;text-transform:uppercase;padding:14px 32px;border-radius:8px;">
    ${label}
  </a>
`;

const emailShell = ({ preheader = '', bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f4f1ee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f1ee;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${preheader}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ee;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BRAND_BORDER};">
            <tr>
              <td align="center" style="padding:28px 24px;border-bottom:1px solid ${BRAND_BORDER};">
                <img src="${BRAND_LOGO_URL}" alt="${FROM_NAME}" height="72" style="display:block;height:72px;width:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;color:${BRAND_TEXT};font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#faf8f5;border-top:1px solid ${BRAND_BORDER};">
                <p style="margin:0;font-size:12px;color:${BRAND_MUTED};text-align:center;">
                  &copy; ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// ── Template helpers ────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;color:${BRAND_TEXT};">Reset your password</h2>
    <p style="margin:0 0 8px;">Hi ${userName},</p>
    <p style="margin:0 0 24px;">
      We received a request to reset your password. Click the button below to choose a new one —
      this link expires in <strong>30 minutes</strong>.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
      ${emailButton('Reset Password', resetUrl)}
    </td></tr></table>
    <p style="margin:24px 0 0;font-size:12px;color:${BRAND_MUTED};">
      If you didn't request this, you can safely ignore this email — your password won't change.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your password',
    text: `Hi ${userName},\n\nYou requested a password reset. Use the link below to reset it (expires in 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
    html: emailShell({ preheader: 'Reset your password — link expires in 30 minutes.', bodyHtml })
  });
};

export const sendOrderConfirmationEmail = async (email, order) => {
  const itemsList = order.items?.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;">${i.quantity}x ${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid ${BRAND_BORDER};font-size:14px;text-align:right;">$${i.lineTotal.toFixed(2)}</td>
    </tr>`
  ).join('') || '';

  const bodyHtml = `
    <h2 style="margin:0 0 4px;font-size:20px;color:${BRAND_TEXT};">Order confirmed ✅</h2>
    <p style="margin:0 0 20px;color:${BRAND_MUTED};font-size:13px;">Order #${order.orderNumber} &middot; ${order.restaurantName}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${itemsList}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-top:8px;font-size:16px;font-weight:700;">Total</td>
          <td style="padding-top:8px;font-size:16px;font-weight:700;text-align:right;color:${BRAND_PRIMARY};">$${order.total.toFixed(2)}</td></tr>
    </table>
    ${order.trackingUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td>
        ${emailButton('Track Delivery', order.trackingUrl)}
      </td></tr></table>
    ` : ''}
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmed — #${order.orderNumber}`,
    text: `Your order #${order.orderNumber} has been confirmed! Total: $${order.total.toFixed(2)}`,
    html: emailShell({ preheader: `Your order #${order.orderNumber} is confirmed.`, bodyHtml })
  });
};

export const sendWelcomeEmail = async (email, userName) => {
  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td>
      <div style="width:56px;height:56px;border-radius:999px;background-color:${BRAND_CREAM};text-align:center;line-height:56px;font-size:26px;">🎉</div>
    </td></tr></table>
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND_TEXT};text-align:center;">Welcome, ${userName}!</h2>
    <p style="margin:0 0 24px;text-align:center;">
      Your account is ready. Start ordering from ${FROM_NAME} and earn loyalty points on every order —
      exclusive rewards unlock as you go.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td>
      ${emailButton('Start Ordering', `https://${(process.env.FRONTEND_URL || 'https://lassiloungeny.com')}`)}
    </td></tr></table>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to ${FROM_NAME}!`,
    text: `Hi ${userName}, welcome to ${FROM_NAME}! Start ordering your favorite food today.`,
    html: emailShell({ preheader: `Your ${FROM_NAME} account is ready.`, bodyHtml })
  });
};

export const sendOtpEmail = async (email, userName, otp) => {
  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td>
      <div style="width:56px;height:56px;border-radius:999px;background-color:${BRAND_CREAM};text-align:center;line-height:56px;font-size:26px;">✉️</div>
    </td></tr></table>
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND_TEXT};text-align:center;">Verify your email</h2>
    <p style="margin:0 0 24px;text-align:center;color:${BRAND_MUTED};">Hi ${userName}, use the code below to complete your registration.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background-color:${BRAND_CREAM};border:2px solid ${BRAND_ACCENT};border-radius:12px;padding:20px 40px;text-align:center;">
        <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:${BRAND_PRIMARY};font-family:monospace;">${otp}</span>
      </td></tr>
    </table>

    <p style="margin:0;text-align:center;font-size:13px;color:${BRAND_MUTED};">
      This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
    </p>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:${BRAND_MUTED};">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `${otp} is your ${FROM_NAME} verification code`,
    text: `Hi ${userName},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you didn't create an account, please ignore this email.`,
    html: emailShell({ preheader: `Your ${FROM_NAME} verification code is: ${otp}`, bodyHtml })
  });
};

import { generatePdfFromHtml } from './pdfService.js';
import { generateInvoiceHTML } from './documentService.js';

export const sendInvoiceEmail = async (email, order, payment = null) => {
  const orderRef = order.orderNumber || order._id.toString().slice(-6);
  const htmlContent = generateInvoiceHTML(order, payment);
  let pdfBuffer = null;
  
  try {
    pdfBuffer = await generatePdfFromHtml(htmlContent);
  } catch (error) {
    logger.error(`Failed to generate PDF for order ${orderRef}`, error);
    // Continue and send email without attachment if PDF generation fails
  }

  const emailBody = `
    <h2 style="margin:0 0 4px;font-size:20px;color:${BRAND_TEXT};">Invoice / Receipt</h2>
    <p style="margin:0 0 24px;color:${BRAND_MUTED};font-size:13px;">Order #${orderRef}</p>
    <p style="margin:0 0 24px;">
      Hi ${order.customerName || 'Customer'},<br><br>
      Thank you for your order! Please find your official invoice attached to this email as a PDF document.
    </p>
    <p style="margin:28px 0 0;font-size:12px;color:${BRAND_MUTED};">Thank you for your business!</p>
  `;

  return sendEmail({
    to: email,
    subject: `Invoice for Order #${orderRef}`,
    text: `Hi ${order.customerName || 'Customer'},\n\nPlease find your invoice for Order #${orderRef} attached.\n\nThank you!`,
    html: emailShell({ preheader: `Your invoice for Order #${orderRef} is attached`, bodyHtml: emailBody }),
    attachments: pdfBuffer ? [
      {
        filename: `Invoice_${orderRef}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ] : []
  });
};