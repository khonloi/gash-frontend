/**
 * Order Email Notification Utility
 * 
 * Sends order notification emails via EmailJS (same pattern as OTP emails)
 * This is called from the frontend when order notifications are received via Socket.IO
 * 
 * Uses a separate EmailJS template specifically for order notifications.
 * Configuration:
 * - VITE_ENABLE_ORDER_EMAIL_NOTIFICATIONS: Enable/disable order email notifications (default: false)
 * - VITE_EMAILJS_PUBLIC_KEY: EmailJS public key (shared with OTP emails)
 * - VITE_EMAILJS_SERVICE_ID: EmailJS service ID (can be shared or separate)
 * - VITE_EMAILJS_ORDER_TEMPLATE_ID: EmailJS template ID for order notifications
 */

import emailjs from '@emailjs/browser';

// Feature flag to enable/disable order email notifications
// Set to 'true' or '1' to enable, anything else to disable
const isEnabled = import.meta.env.VITE_ENABLE_ORDER_EMAIL_NOTIFICATIONS === 'true' || 
                  import.meta.env.VITE_ENABLE_ORDER_EMAIL_NOTIFICATIONS === '1';

// Initialize EmailJS with Public API Key (shared with OTP emails)
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
// Use separate template ID for order notifications
const orderTemplateId = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;

// Initialize EmailJS if public key is available
if (publicKey && publicKey !== 'your_emailjs_public_key_here') {
  emailjs.init(publicKey);
}

/**
 * Send order notification email via EmailJS
 * @param {Object} params - Email parameters
 * @param {String} params.userEmail - User email address
 * @param {String} params.userName - User name (optional)
 * @param {String} params.title - Email subject/title
 * @param {String} params.message - Email message content
 * @param {String} params.orderId - Order ID for reference (optional)
 * @returns {Promise<Object>} EmailJS response
 */
export async function sendOrderNotificationEmail({ userEmail, userName, title, message, orderId }) {
  // Check if feature is enabled
  if (!isEnabled) {
    // Silently skip - feature is disabled
    return { success: false, message: 'Order email notifications are disabled' };
  }

  // Check if EmailJS is configured
  if (!publicKey || publicKey === 'your_emailjs_public_key_here') {
    console.warn('⚠️ EmailJS not configured. Skipping order notification email.');
    return { success: false, message: 'EmailJS not configured' };
  }

  if (!serviceId || !orderTemplateId) {
    console.warn('⚠️ EmailJS Service ID or Order Template ID missing. Skipping order notification email.');
    console.warn('   Required: VITE_EMAILJS_SERVICE_ID and VITE_EMAILJS_ORDER_TEMPLATE_ID');
    return { success: false, message: 'EmailJS configuration incomplete' };
  }

  if (!userEmail) {
    console.warn('⚠️ User email is missing. Cannot send order notification email.');
    return { success: false, message: 'User email missing' };
  }

  // Prepare template parameters (matching EmailJS template variables)
  const templateParams = {
    to_email: userEmail,
    to_name: userName || userEmail.split('@')[0], // Use provided name or extract from email
    subject: title,
    message: message,
    order_id: orderId || '', // Order ID (formatted as #XXXXXXXX if provided)
  };

  try {
    // Send email via EmailJS using the order notification template
    const response = await emailjs.send(
      serviceId,
      orderTemplateId,
      templateParams
    );

    if (response.status === 200) {
      console.log('✅ Order notification email sent successfully to', userEmail);
    } else {
      console.warn('⚠️ Unexpected EmailJS response status:', response.status);
    }

    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending order notification email:', error.text || error.message);
    
    // Log helpful error messages for common issues
    if (error.status === 422) {
      console.error('   💡 Template variables mismatch. Check your EmailJS template uses: {{to_email}}, {{to_name}}, {{subject}}, {{message}}, {{order_id}}');
    } else if (error.status === 401) {
      console.error('   💡 Unauthorized - Check your EmailJS public key');
    } else if (error.status === 404) {
      console.error('   💡 Not Found - Check Service ID and Template ID');
    }

    return {
      success: false,
      message: error.text || error.message || 'Failed to send email',
      error: error,
    };
  }
}

/**
 * Extract order ID from notification message
 * @param {String} message - Notification message
 * @returns {String|null} Extracted order ID or null
 */
export function extractOrderIdFromMessage(message) {
  // Look for order ID pattern like #XXXXXXXX in the message
  const match = message.match(/#([a-f0-9]{8})/i);
  return match ? match[1] : null;
}

