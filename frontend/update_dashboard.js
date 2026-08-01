const fs = require('fs');
const path = 'e:/Projects/daas-delivery-poc/frontend/src/components/merchant/DashboardView.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /export default function DashboardView\(\{(.*?)\}\) \{([\s\S]*?)const getStatusBadge/m;
const match = content.match(regex);

if (match) {
  const newLogic = \
  const salesData = (analyticsData?.dailyStats || []).map(day => {
    const date = new Date(day.date);
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: day.revenue,
      orders: day.orders
    };
  });

  const orderStatuses = ['new', 'accepted', 'preparing', 'ready', 'out for delivery', 'completed', 'cancelled'];
  const statusColors = {
    'new': '#DC2626',
    'accepted': '#F59E0B',
    'preparing': '#3B82F6',
    'ready': '#10B981',
    'out for delivery': '#8B5CF6',
    'completed': '#166534',
    'cancelled': '#9CA3AF'
  };

  const orderCounts = {};
  (orders || []).forEach(o => {
    const status = (o.status || '').toLowerCase();
    orderCounts[status] = (orderCounts[status] || 0) + 1;
  });

  const orderStatusData = orderStatuses.map(status => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: orderCounts[status] || 0,
    color: statusColors[status] || '#9CA3AF'
  })).filter(s => s.value > 0);

  const topItems = (analyticsData?.topItems || []).map((item, idx) => {
    const menuItem = (menu || []).find(m => m.name === item._id || m._id === item._id);
    return {
      rank: idx + 1,
      name: item._id,
      orders: item.quantitySold,
      revenue: item.revenueGenerated,
      img: menuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'
    };
  });

  \;
  content = content.replace(match[2], newLogic);
  
  if (!content.includes('analyticsData')) {
    content = content.replace('export default function DashboardView({', 'export default function DashboardView({ analyticsData, menu, ');
  }

  content = content.replace('May 21, 2025', '{new Date().toLocaleDateString(\\'en-US\\', { month: \\'short\\', day: \\'numeric\\', year: \\'numeric\\' })}');

  content = content.replace(
    'value=".29" icon={ShoppingCart} color="blue" trendValue={6.3}',
    'value={\$\\} icon={ShoppingCart} color="blue"'
  );
  content = content.replace(
    'value="32" icon={Users} color="green" trendValue={10.2}',
    'value={analyticsData?.summary?.newCustomers || 0} icon={Users} color="green"'
  );
  content = content.replace(
    'value="1,243" icon={Crown} color="purple" trendValue={8.6}',
    'value={analyticsData?.summary?.totalCustomers || 0} icon={Crown} color="purple"'
  );

  content = content.replace(
    /const recentOrdersMock = \\[[\\s\\S]*?\\];/,
    'const recentOrdersToDisplay = (orders || []).slice(0, 5);'
  );
  content = content.replace(/recentOrdersMock\\.map\\(\\(order\\)/g, 'recentOrdersToDisplay.map((order)');
  
  content = content.replace(/\\{order\\.customer\\}/g, '{order.customerName || \\'Guest\\'}');
  content = content.replace(/\\{order\\.items\\}/g, '{order.items?.length || 0} items');
  content = content.replace(/\\{order\\.total\\}/g, '$\\{order.total?.toFixed(2) || \\'0.00\\'\\}');
  content = content.replace(/\\{order\\.time\\}/g, '{new Date(order.createdAt).toLocaleTimeString(\\'en-US\\', { hour: \\'2-digit\\', minute: \\'2-digit\\' })}');

  content = content.replace(
    /const reservationsMock = \\[[\\s\\S]*?\\];/,
    'const todayStr = new Date().toISOString().split(\\'T\\')[0];\\n  const reservationsToDisplay = (reservations || []).filter(r => r.date && r.date.startsWith(todayStr));'
  );
  content = content.replace(/reservationsMock\\.map\\(\\(res\\)/g, 'reservationsToDisplay.map((res)');
  content = content.replace(/\\{res\\.name\\}/g, '{res.customerName || \\'Guest\\'}');
  content = content.replace(/\\{res\\.party\\}/g, '{res.partySize} ppl');

  content = content.replace(
    /const cateringMock = \\[[\\s\\S]*?\\];/,
    'const cateringToDisplay = (cateringInquiries || []).slice(0, 5);'
  );
  content = content.replace(/cateringMock\\.map\\(\\(cat\\)/g, 'cateringToDisplay.map((cat)');
  content = content.replace(/\\{cat\\.name\\}/g, '{cat.customerName || \\'Guest\\'}');
  content = content.replace(/\\{cat\\.event\\}/g, '{cat.eventType || \\'Event\\'}');
  content = content.replace(/\\{cat\\.date\\}/g, '{new Date(cat.eventDate).toLocaleDateString(\\'en-US\\', { month: \\'short\\', day: \\'numeric\\' })}');

  fs.writeFileSync(path, content);
  console.log('Successfully updated DashboardView.js with real data bindings');
} else {
  console.log('Could not match regex');
}
