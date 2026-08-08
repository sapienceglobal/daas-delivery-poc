const fetch = global.fetch || require('node-fetch');

async function test() {
  const url = 'http://127.0.0.1:5001/api/crm/restaurant/6a6494f911cb0b7ab2e01f6e/customers';
  try {
    // We need a token or session. 
    // Wait, the API requires authentication. 
    // I need to login first.
    console.log("Need to login to hit API directly");
  } catch (err) {
    console.error(err);
  }
}
test();
