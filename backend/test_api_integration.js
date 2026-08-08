const fetch = global.fetch || require('node-fetch');

async function testApi() {
  try {
    // 1. Login
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@lassilounge.com', password: 'password123' })
    });
    
    if (!loginRes.ok) {
      console.log("Login failed", await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    console.log("Logged in successfully. User role:", loginData.data.user.role);
    
    // Extract token from cookies or body if available.
    // The auth controller returns token in cookies, but we need to grab the cookie.
    const cookies = loginRes.headers.get('set-cookie');
    let token = '';
    if (cookies) {
      // Very naive cookie extraction
      const match = cookies.match(/token=([^;]+)/);
      if (match) token = match[1];
    }
    // Alternatively, maybe it's in the response body
    if (!token && loginData.data.token) {
      token = loginData.data.token;
    }
    
    console.log("Token acquired:", !!token);

    // 2. Fetch CRM data
    const restaurantId = loginData.data.user.restaurantId || '6a6494f911cb0b7ab2e01f6e';
    const crmRes = await fetch(`http://127.0.0.1:5001/api/crm/restaurant/${restaurantId}/customers`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cookie': `token=${token}` // Try both
      }
    });

    const crmData = await crmRes.json();
    console.log("CRM Response:", JSON.stringify(crmData, null, 2));

  } catch (err) {
    console.error("Test failed", err);
  }
}
testApi();
