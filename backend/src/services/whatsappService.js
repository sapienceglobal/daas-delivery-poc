import axios from 'axios';

export const sendOrderAlert = async (restaurant, order) => {
  if (!restaurant.notificationSettings?.whatsappEnabled) {
    return;
  }
  
  const whatsappNumber = restaurant.notificationSettings?.whatsappNumber;
  if (!whatsappNumber) {
    return;
  }

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/orders/${order._id}`;
  
  const messageText = `🚨 *New Order Alert!* 🚨\n\n*Customer:* ${order.customerName}\n*Type:* ${order.orderType}\n*Total:* $${order.total.toFixed(2)}\n\n*View Order:* ${dashboardLink}`;

  if (process.env.NODE_ENV !== 'production' || !token || !phoneNumberId || token === 'your_meta_whatsapp_api_token') {
    // if not configured or not in production, just log to console
    console.log(`\n[WHATSAPP MOCK] To: ${whatsappNumber}\n${messageText}\n`);
    return;
  }

  // formatting phone number to E.164 (remove everything except numbers, optionally keep + if present)
  let formattedNumber = whatsappNumber.replace(/[^\d+]/g, '');
  if (!formattedNumber.startsWith('+')) {
    // assuming US default for this app
    formattedNumber = `+1${formattedNumber.replace(/^1/, '')}`;
  }
  // meta API expects number without '+'
  const metaNumber = formattedNumber.replace('+', '');

  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: metaNumber,
        type: 'text',
        text: {
          body: messageText
        }
      }
    });
    console.log('WhatsApp notification sent:', response.data);
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error.response?.data || error.message);
  }
};

export const sendInvoiceWhatsApp = async (customerPhone, order) => {
  if (!customerPhone) return;

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const invoiceUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/orders/${order._id}/invoice`;
  
  const messageText = `Hi ${order.customerName || 'there'}! 👋\n\nHere is the invoice for your recent order #${order.orderNumber || order._id.toString().slice(-6).toUpperCase()}.\n\n🧾 *View Invoice:* \n${invoiceUrl}\n\nThank you for choosing ${order.restaurantName}!`;

  if (process.env.NODE_ENV !== 'production' || !token || !phoneNumberId || token === 'your_meta_whatsapp_api_token') {
    // if not configured or not in production, just log to console
    console.log(`\n[WHATSAPP MOCK] To: ${customerPhone}\n${messageText}\n`);
    return;
  }

  let formattedNumber = customerPhone.replace(/[^\d+]/g, '');
  if (!formattedNumber.startsWith('+')) {
    formattedNumber = `+1${formattedNumber.replace(/^1/, '')}`;
  }
  const metaNumber = formattedNumber.replace('+', '');

  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        messaging_product: 'whatsapp',
        to: metaNumber,
        type: 'text',
        text: {
          body: messageText
        }
      }
    });
    console.log('WhatsApp invoice sent:', response.data);
  } catch (error) {
    console.error('Error sending WhatsApp invoice:', error.response?.data || error.message);
  }
};
