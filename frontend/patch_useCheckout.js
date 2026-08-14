const fs = require('fs');
const path = 'src/components/checkout/useCheckoutState.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const ONLINE_PAYMENT_METHODS = ['credit_card', 'apple_pay', 'google_pay'];",
  "const ONLINE_PAYMENT_METHODS = ['stripe_online'];"
);

// Also need to initialize the state with 'stripe_online' instead of 'credit_card'
content = content.replace(
  "const [paymentMethod, setPaymentMethod] = useState('credit_card');",
  "const [paymentMethod, setPaymentMethod] = useState('stripe_online');"
);

fs.writeFileSync(path, content);
console.log('useCheckoutState patched successfully');
