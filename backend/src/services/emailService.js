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

  const appPassword = process.env.EMAIL_APP_PASSWORD;
  const fromEmail = process.env.FROM_EMAIL;

  if (!appPassword || !fromEmail) {
    logger.warn('EMAIL_APP_PASSWORD or FROM_EMAIL not set — emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: fromEmail,
      pass: appPassword
    }
  });

  logger.info('Nodemailer Gmail transporter initialized');
  return transporter;
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'projects.sapience@gmail.com';
const FROM_NAME = process.env.FROM_NAME || 'Lassi Lounge';

/**
 * Send a single email.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const mailer = initTransporter();

  const msg = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    text,
    html
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

// ── Template helpers ────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text: `Hi ${userName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
        <h2 style="color: #10b981;">Password Reset</h2>
        <p>Hi ${userName},</p>
        <p>You requested a password reset. Click the button below:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `
  });
};

export const sendOrderConfirmationEmail = async (email, order) => {
  const itemsList = order.items?.map(i => `${i.quantity}x ${i.name} — $${i.lineTotal.toFixed(2)}`).join('<br>') || 'N/A';

  return sendEmail({
    to: email,
    subject: `Order Confirmed — #${order.orderNumber}`,
    text: `Your order #${order.orderNumber} has been confirmed! Total: $${order.total.toFixed(2)}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
        <h2 style="color: #10b981;">Order Confirmed! ✅</h2>
        <p><strong>Order #${order.orderNumber}</strong></p>
        <p>Restaurant: ${order.restaurantName}</p>
        <hr style="border: 1px solid #eee;">
        <p>${itemsList}</p>
        <hr style="border: 1px solid #eee;">
        <p><strong>Total: $${order.total.toFixed(2)}</strong></p>
        ${order.trackingUrl ? `<a href="${order.trackingUrl}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Track Delivery</a>` : ''}
      </div>
    `
  });
};

export const sendWelcomeEmail = async (email, userName) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Restaurant Commerce Platform!',
    text: `Hi ${userName}, welcome! Start ordering your favorite food today.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
        <h2 style="color: #10b981;">Welcome, ${userName}! 🎉</h2>
        <p>Your account is ready. Start ordering from your favorite local restaurants.</p>
        <p>Earn loyalty points on every order and unlock exclusive rewards!</p>
      </div>
    `
  });
};
