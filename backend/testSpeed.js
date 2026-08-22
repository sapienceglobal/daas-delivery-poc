import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

console.time('request');
http.get('http://127.0.0.1:5001/api/restaurants/lassi-lounge', {
  headers: {
    'x-tenant-id': 'lassi-lounge',
    'x-app-secret': process.env.APP_SECRET || 'your_super_secret_app_key'
  }
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.timeEnd('request');
    console.log(`Received ${data.length} bytes`);
  });
}).on('error', (err) => {
  console.error(err);
});
