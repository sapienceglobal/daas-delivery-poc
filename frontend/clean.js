const fs = require('fs');
let content = fs.readFileSync('src/components/profile/tabs/LoyaltyTab.jsx', 'utf8');

// Imports
content = content.replace(/import \{ loyaltyAPI, couponAPI \} from '@\/lib\/api';/, "import { loyaltyAPI } from '@/lib/api';");

// States
content = content.replace(/const \[myCoupons, setMyCoupons\] = useState\(\[\]\);\r?\n\s*const \[publicCoupons, setPublicCoupons\] = useState\(\[\]\);\r?\n\s*const \[copiedCode, setCopiedCode\] = useState\(null\);\r?\n\s*const \[selectedCoupon, setSelectedCoupon\] = useState\(null\);\r?\n/, '');

// API calls
content = content.replace(/, activeCouponsRes/g, '');
content = content.replace(/,\r?\n\s*couponAPI\.getActive\(\)/, '');
content = content.replace(/if \(couponsRes\.status === 'fulfilled'\) \{[\s\S]*?if \(activeCouponsRes\.status === 'fulfilled'\) \{[\s\S]*?\}\r?\n/, '');

// Functions
content = content.replace(/const renderCouponCard = [\s\S]*?\}\s*;\r?\n/, '');
content = content.replace(/const copyToClipboard = [\s\S]*?\}\s*;\r?\n/, '');

// UI Sections
content = content.replace(/\{publicCoupons\.length > 0 && \([\s\S]*?<\/section>\r?\n\s*\)\}/, '');
content = content.replace(/<section id="my-wallet"[\s\S]*?<\/section>/, '');
content = content.replace(/\{selectedCoupon && \([\s\S]*?\}\s*\)\}/, '');

fs.writeFileSync('src/components/profile/tabs/LoyaltyTab.jsx', content);
console.log('Done!');
