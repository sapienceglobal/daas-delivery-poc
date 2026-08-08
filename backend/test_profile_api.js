import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
const fetch = global.fetch || require('node-fetch');

dotenv.config();

async function testApi() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET';
    // Merchant user in lassi-lounge DB
    const token = jwt.sign({
      id: '6a60631fa0c4ad20ccee7dd0',
      tenantId: 'lassi-lounge'
    }, JWT_SECRET, { expiresIn: '1h' });

    const restaurantId = '6a606320a0c4ad20ccee7e0c';
    const customerId = '6a60631fa0c4ad20ccee7dd4';
    
    const crmRes = await fetch(`http://127.0.0.1:5001/api/crm/restaurant/${restaurantId}/customers/${customerId}/profile`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const text = await crmRes.text();
    console.log("Profile Response status:", crmRes.status);
    console.log("Profile Response:", text);

  } catch (err) {
    console.error("Test failed", err);
  }
}
testApi();
