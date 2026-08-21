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

  if (!token || !phoneNumberId || token === 'your_meta_whatsapp_api_token') {
    // If not configured, just log to console as requested
    console.log(`\n[WHATSAPP MOCK] To: ${whatsappNumber}\n${messageText}\n`);
    return;
  }

  // Formatting phone number to E.164 (remove everything except numbers, optionally keep + if present)
  let formattedNumber = whatsappNumber.replace(/[^\d+]/g, '');
  if (!formattedNumber.startsWith('+')) {
    // Assuming US default for this app
    formattedNumber = `+1${formattedNumber.replace(/^1/, '')}`;
  }
  // Meta API expects number without '+'
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
