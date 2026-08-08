import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
const fetch = global.fetch || require('node-fetch');

dotenv.config();

async function testApi() {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET';
    // User from DB: 6a6494f811cb0b7ab2e01f38, role: 'merchant', tenantId: 'lassi-lounge', restaurantId: '6a6494f911cb0b7ab2e01f6e'
    const token = jwt.sign({
      id: '6a6494f811cb0b7ab2e01f38',
      tenantId: 'lassi-lounge'
    }, JWT_SECRET, { expiresIn: '1h' });

    console.log("Token generated:", token);

    const restaurantId = '6a6494f911cb0b7ab2e01f6e';
    const crmRes = await fetch(`http://127.0.0.1:5001/api/crm/restaurant/${restaurantId}/customers`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const text = await crmRes.text();
    console.log("CRM Response status:", crmRes.status);
    console.log("CRM Response:", text);

  } catch (err) {
    console.error("Test failed", err);
  }
}
testApi();
