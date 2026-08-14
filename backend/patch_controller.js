const fs = require('fs');
const path = 'src/controllers/orderController.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const CUSTOMER_PAYMENT_METHODS = ['credit_card', 'apple_pay', 'google_pay'];",
  "const CUSTOMER_PAYMENT_METHODS = ['credit_card', 'apple_pay', 'google_pay', 'stripe_online'];"
);

content = content.replace(
  "const STRIPE_REFUND_PAYMENT_METHODS = ['credit_card', 'debit_card', 'apple_pay', 'google_pay'];",
  "const STRIPE_REFUND_PAYMENT_METHODS = ['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online'];"
);

content = content.replaceAll(
  "['credit_card', 'debit_card', 'apple_pay', 'google_pay']",
  "['credit_card', 'debit_card', 'apple_pay', 'google_pay', 'stripe_online']"
);

fs.writeFileSync(path, content);
console.log('orderController patched');
