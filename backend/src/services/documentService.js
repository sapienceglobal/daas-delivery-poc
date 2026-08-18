/**
 * documentService.js
 * ──────────────────────────────────────────────────────────────────────────
 * Generates industry-standard print-optimized HTML documents for:
 *   - Invoice (A4 / Letter, full customer receipt with refund details)
 *   - KOT (Kitchen Order Ticket, 80mm thermal printer optimized)
 *
 * Both functions return a complete standalone HTML string.
 * The frontend opens them in a new tab; the browser's native print dialog
 * is triggered via window.print() ON THAT STANDALONE PAGE — not the dashboard.
 * ──────────────────────────────────────────────────────────────────────────
 */

const BRAND_NAME   = process.env.FROM_NAME      || 'Lassi Lounge';
const BRAND_ADDR   = process.env.BRAND_ADDRESS  || '9408 118th St, South Richmond Hill, NY 11419';
const BRAND_PHONE  = process.env.BRAND_PHONE    || '+1 347-233-3733';
const BRAND_EMAIL  = process.env.FROM_EMAIL     || 'lassiloungeny@gmail.com';
const BRAND_COLOR  = '#7a0b10';   // maroon — matches app theme
const BRAND_GOLD   = '#E8B93D';

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmt = (num, currency = 'USD') => {
  const n = parseFloat(num) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(n);
};

const fmtDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const orderTypeLabel = (t) => {
  if (t === 'dine_in') return 'Dine-In';
  if (t === 'pickup')  return 'Pickup';
  return 'Delivery';
};

const paymentMethodLabel = (m) => {
  const map = {
    credit_card: 'Credit Card', debit_card: 'Debit Card',
    apple_pay: 'Apple Pay', google_pay: 'Google Pay',
    stripe_online: 'Online Payment', cash: 'Cash',
    wallet: 'Wallet', gift_card: 'Gift Card'
  };
  return map[m] || (m || 'N/A');
};

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE — A4 / Letter professional receipt
// ═══════════════════════════════════════════════════════════════════════════

/**
 * generateInvoiceHTML(order, payment)
 * @param {Object} order   - Mongoose Order document (plain object)
 * @param {Object} payment - Mongoose Payment document (plain object, optional)
 * @returns {string} Standalone HTML page ready for window.print()
 */
export const generateInvoiceHTML = (order, payment = null) => {
  const currency = 'USD';
  const invoiceNumber = payment?.invoiceNumber || `INV-${new Date().getFullYear()}-XXXXX`;
  const orderRef = order.orderNumber || order._id?.toString?.().slice(-6) || 'N/A';
  const isRefunded = order.refunded || order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded';

  // ── Item rows ────────────────────────────────────────────────────────────
  const itemRows = (order.items || []).map(item => {
    const sizeLabel = item.selectedSize?.name ? ` (${item.selectedSize.name})` : '';
    const addOnsLabel = (item.addOns || []).length > 0
      ? `<br><span style="font-size:11px;color:#6b7280;">+ ${item.addOns.map(a => a.name).join(', ')}</span>`
      : '';
    const lineTotal = item.lineTotal || (item.price * item.quantity);
    return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;vertical-align:top;">
          ${item.name}${sizeLabel}${addOnsLabel}
          ${item.specialInstructions ? `<br><span style="font-size:11px;color:#9ca3af;font-style:italic;">${item.specialInstructions}</span>` : ''}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;text-align:center;vertical-align:top;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right;vertical-align:top;">${fmt(item.price, currency)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;vertical-align:top;">${fmt(lineTotal, currency)}</td>
      </tr>`;
  }).join('');

  // ── Payment events timeline (audit section) ──────────────────────────────
  const eventIconMap = {
    payment_confirmed:    { icon: '✅', color: '#16a34a', label: 'Payment Confirmed' },
    payment_failed:       { icon: '❌', color: '#dc2626', label: 'Payment Failed' },
    order_saved:          { icon: '📋', color: '#2563eb', label: 'Order Saved to System' },
    order_creation_failed:{ icon: '⚠️', color: '#dc2626', label: 'Order Creation Failed' },
    auto_refund_triggered:{ icon: '🔄', color: '#d97706', label: 'Auto-Refund Initiated' },
    auto_refund_succeeded:{ icon: '💚', color: '#16a34a', label: 'Auto-Refund Completed' },
    auto_refund_failed:   { icon: '🔴', color: '#dc2626', label: 'Auto-Refund Failed' },
    manual_refund:        { icon: '↩️', color: '#7c3aed', label: 'Manual Refund Processed' },
    loyalty_rollback:     { icon: '🔁', color: '#0891b2', label: 'Loyalty Points Reversed' }
  };

  const paymentEventsHTML = (order.paymentEvents || []).length > 0 ? `
    <div style="margin-top:32px;padding-top:20px;border-top:2px dashed #e5e7eb;">
      <h3 style="font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">Payment Audit Trail</h3>
      ${(order.paymentEvents || []).map(ev => {
        const info = eventIconMap[ev.event] || { icon: '📌', color: '#6b7280', label: ev.event };
        return `
          <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="font-size:16px;line-height:1.4;">${info.icon}</span>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:600;color:${info.color};">${info.label}</div>
              <div style="font-size:11px;color:#9ca3af;">${fmtDate(ev.timestamp)}${ev.amount ? ` · ${fmt(ev.amount, currency)}` : ''}${ev.stripeRefundId ? ` · Ref: ${ev.stripeRefundId}` : ''}${ev.error ? ` · Error: ${ev.error}` : ''}</div>
            </div>
          </div>`;
      }).join('')}
    </div>` : '';

  // ── Refund section ───────────────────────────────────────────────────────
  const refundSection = isRefunded ? `
    <tr>
      <td colspan="2" style="padding:6px 0;">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px 14px;">
          <div style="font-size:12px;font-weight:700;color:#dc2626;">⚡ REFUND PROCESSED</div>
          <div style="font-size:12px;color:#dc2626;margin-top:2px;">
            ${fmt(order.refundAmount || order.total, currency)} refunded
            ${order.refundReason ? ` — Reason: ${order.refundReason}` : ''}
          </div>
        </div>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} — ${BRAND_NAME}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f4f1ee;
      color: #111827;
      padding: 32px 16px;
    }
    .invoice-wrapper {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    /* Print overrides */
    @media print {
      body { background: white; padding: 0; }
      .invoice-wrapper { box-shadow: none; border-radius: 0; max-width: 100%; }
      .no-print { display: none !important; }
      @page { margin: 15mm; }
    }
    table { border-collapse: collapse; width: 100%; }
    .badge-paid    { background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0; }
    .badge-refund  { background:#fef2f2;color:#dc2626;border:1px solid #fecaca; }
    .badge-pending { background:#fffbeb;color:#b45309;border:1px solid #fde68a; }
  </style>
</head>
<body>
  <!-- Print Button (hidden on print) -->
  <div class="no-print" style="max-width:780px;margin:0 auto 16px;display:flex;justify-content:flex-end;gap:10px;">
    <button onclick="window.print()" style="background:${BRAND_COLOR};color:white;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;">
      🖨️ Print Invoice
    </button>
    <button onclick="window.close()" style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;padding:10px 20px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;">
      Close
    </button>
  </div>

  <div class="invoice-wrapper">

    <!-- Header -->
    <div style="background:${BRAND_COLOR};padding:32px 40px;color:white;">
      <table>
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;">${BRAND_NAME}</div>
            <div style="font-size:12px;opacity:0.8;margin-top:4px;">${BRAND_ADDR}</div>
            <div style="font-size:12px;opacity:0.8;">${BRAND_PHONE} · ${BRAND_EMAIL}</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:${BRAND_GOLD};">INVOICE</div>
            <div style="font-size:13px;opacity:0.9;margin-top:4px;">${invoiceNumber}</div>
            <div style="margin-top:8px;">
              <span style="font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;
                ${order.paymentStatus === 'paid' ? 'background:rgba(22,163,74,0.2);color:#4ade80;' :
                  order.paymentStatus === 'refunded' ? 'background:rgba(220,38,38,0.2);color:#fca5a5;' :
                  'background:rgba(234,179,8,0.2);color:#fde047;'}">
                ${(order.paymentStatus || 'PENDING').toUpperCase().replace('_', ' ')}
              </span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Invoice Meta + Customer Info -->
    <div style="padding:28px 40px;border-bottom:1px solid #f3f4f6;">
      <table>
        <tr>
          <td style="vertical-align:top;width:50%;">
            <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Bill To</div>
            <div style="font-size:15px;font-weight:700;color:#111827;">${order.customerName || 'Guest Customer'}</div>
            ${order.customerEmail ? `<div style="font-size:13px;color:#6b7280;margin-top:2px;">${order.customerEmail}</div>` : ''}
            ${order.customerPhone ? `<div style="font-size:13px;color:#6b7280;">${order.customerPhone}</div>` : ''}
            ${order.address ? `<div style="font-size:12px;color:#9ca3af;margin-top:4px;max-width:220px;">${order.address}</div>` : ''}
          </td>
          <td style="vertical-align:top;text-align:right;">
            <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Invoice Details</div>
            <table style="margin-left:auto;">
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:2px 12px 2px 0;">Invoice #</td>
                <td style="font-size:12px;font-weight:700;color:#111827;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:2px 12px 2px 0;">Order #</td>
                <td style="font-size:12px;font-weight:700;color:#111827;">${orderRef}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:2px 12px 2px 0;">Date</td>
                <td style="font-size:12px;color:#374151;">${fmtDate(order.createdAt)}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:2px 12px 2px 0;">Type</td>
                <td style="font-size:12px;color:#374151;">${orderTypeLabel(order.orderType)}</td>
              </tr>
              ${order.tableNumber ? `<tr><td style="font-size:12px;color:#6b7280;padding:2px 12px 2px 0;">Table</td><td style="font-size:12px;color:#374151;">${order.tableNumber}</td></tr>` : ''}
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:2px 12px 2px 0;">Payment</td>
                <td style="font-size:12px;color:#374151;">${paymentMethodLabel(order.paymentMethod)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <div style="padding:28px 40px;">
      <table>
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;text-align:left;border-bottom:2px solid #e5e7eb;">Item</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;text-align:right;border-bottom:2px solid #e5e7eb;">Unit Price</th>
            <th style="padding:10px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;text-align:right;border-bottom:2px solid #e5e7eb;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Pricing Summary -->
      <div style="display:flex;justify-content:flex-end;margin-top:20px;">
        <table style="width:280px;">
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Subtotal</td>
            <td style="padding:5px 0;font-size:13px;color:#374151;text-align:right;">${fmt(order.subtotal, currency)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Tax</td>
            <td style="padding:5px 0;font-size:13px;color:#374151;text-align:right;">${fmt(order.tax, currency)}</td>
          </tr>
          ${(order.deliveryFee || 0) > 0 ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Delivery Fee</td>
            <td style="padding:5px 0;font-size:13px;color:#374151;text-align:right;">${fmt(order.deliveryFee, currency)}</td>
          </tr>` : ''}
          ${(order.platformFee || 0) > 0 ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Platform Fee</td>
            <td style="padding:5px 0;font-size:13px;color:#374151;text-align:right;">${fmt(order.platformFee, currency)}</td>
          </tr>` : ''}
          ${(order.tip || 0) > 0 ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Tip (Gratuity)</td>
            <td style="padding:5px 0;font-size:13px;color:#374151;text-align:right;">${fmt(order.tip, currency)}</td>
          </tr>` : ''}
          ${(order.discount || 0) > 0 ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#16a34a;">Discount${order.couponCode ? ` (${order.couponCode})` : ''}</td>
            <td style="padding:5px 0;font-size:13px;color:#16a34a;text-align:right;">-${fmt(order.discount, currency)}</td>
          </tr>` : ''}
          ${(order.loyaltyDiscount || 0) > 0 ? `<tr>
            <td style="padding:5px 0;font-size:13px;color:#0891b2;">Loyalty Points Used</td>
            <td style="padding:5px 0;font-size:13px;color:#0891b2;text-align:right;">-${fmt(order.loyaltyDiscount, currency)}</td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="padding-top:10px;"><div style="height:2px;background:#e5e7eb;"></div></td>
          </tr>
          <tr>
            <td style="padding:10px 0 6px;font-size:16px;font-weight:800;color:#111827;">Total</td>
            <td style="padding:10px 0 6px;font-size:16px;font-weight:800;color:${BRAND_COLOR};text-align:right;">${fmt(order.total, currency)}</td>
          </tr>
          ${refundSection}
        </table>
      </div>
    </div>

    <!-- Payment Audit Trail -->
    ${(order.paymentEvents || []).length > 0 ? `
    <div style="padding:0 40px 28px;">
      ${paymentEventsHTML}
    </div>` : ''}

    <!-- Stripe Reference -->
    ${order.stripePaymentIntentId ? `
    <div style="padding:0 40px 28px;">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Transaction Reference</div>
        <div style="font-family:monospace;font-size:12px;color:#374151;">${order.stripePaymentIntentId}</div>
        ${payment?.invoiceNumber ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;">Invoice: ${payment.invoiceNumber}</div>` : ''}
      </div>
    </div>` : ''}

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
      <div style="font-size:12px;color:#9ca3af;">
        Thank you for dining with us! · ${BRAND_NAME} · ${BRAND_ADDR}
      </div>
      <div style="font-size:11px;color:#d1d5db;margin-top:4px;">
        Questions? Contact us at ${BRAND_EMAIL} or ${BRAND_PHONE}
      </div>
    </div>

  </div>
</body>
</html>`;
};

// ═══════════════════════════════════════════════════════════════════════════
// KOT — Kitchen Order Ticket (80mm thermal printer optimized)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * generateKOTHTML(order)
 * @param {Object} order - Mongoose Order document (plain object)
 * @returns {string} Standalone HTML page optimized for 80mm thermal printing
 *
 * Industry standard 80mm thermal KOT:
 *  - Width: 80mm (approx 302px at 96dpi, but print width uses mm)
 *  - Monospace or simple sans-serif font for thermal clarity
 *  - No colors, no backgrounds — thermal printers print black only
 *  - Large item names, bold quantities
 *  - Dashed separators (thermal standard)
 */
export const generateKOTHTML = (order) => {
  const orderRef = order.orderNumber || order._id?.toString?.().slice(-6) || 'N/A';
  const now = new Date();
  const printTime = now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const orderTime = fmtDate(order.createdAt);
  const orderTypeStr = orderTypeLabel(order.orderType).toUpperCase();

  const itemLines = (order.items || []).map(item => {
    const sizeStr = item.selectedSize?.name ? ` [${item.selectedSize.name}]` : '';
    const addOnsStr = (item.addOns || []).length > 0
      ? item.addOns.map(a => `  + ${a.name}`).join('\n')
      : '';
    const instrStr = item.specialInstructions
      ? `  *** ${item.specialInstructions} ***`
      : '';
    return `
      <tr>
        <td style="padding:4px 0;font-size:15px;font-weight:700;vertical-align:top;line-height:1.3;">
          ${item.name}${sizeStr}
          ${addOnsStr ? `<div style="font-size:12px;font-weight:400;margin-top:2px;">${item.addOns.map(a => `+ ${a.name}`).join('<br>')}</div>` : ''}
          ${item.specialInstructions ? `<div style="font-size:12px;font-style:italic;font-weight:700;margin-top:3px;">*** ${item.specialInstructions} ***</div>` : ''}
        </td>
        <td style="padding:4px 0;font-size:20px;font-weight:900;text-align:right;vertical-align:top;">x${item.quantity}</td>
      </tr>
      <tr><td colspan="2"><div style="border-bottom:1px dashed #333;margin:2px 0;"></div></td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KOT — ${orderRef}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      background: white;
      color: black;
      /* 80mm thermal: set exact width for print */
      width: 302px;
      margin: 0 auto;
      padding: 8px 6px;
    }
    @media screen {
      body {
        background: #f0f0f0;
        padding: 20px;
        width: 100%;
      }
      .kot-wrapper {
        width: 302px;
        background: white;
        margin: 0 auto;
        padding: 12px 10px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      }
      .no-print {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 16px;
      }
    }
    @media print {
      body { width: 80mm; padding: 3mm; background: white; }
      .kot-wrapper { padding: 0; box-shadow: none; }
      .no-print { display: none !important; }
      @page { size: 80mm auto; margin: 0; }
    }
    .divider { border: none; border-top: 2px dashed #333; margin: 6px 0; }
    .divider-single { border: none; border-top: 1px dashed #999; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>

  <!-- Screen print button -->
  <div class="no-print">
    <button onclick="window.print()" style="background:#111;color:white;border:none;padding:8px 20px;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;">
      🖨️ Print KOT
    </button>
    <button onclick="window.close()" style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;padding:8px 16px;border-radius:6px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;">
      Close
    </button>
  </div>

  <div class="kot-wrapper">

    <!-- Restaurant Name -->
    <div style="text-align:center;font-size:16px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
      ${BRAND_NAME}
    </div>
    <div style="text-align:center;font-size:10px;margin-top:2px;">KITCHEN ORDER TICKET</div>
    <hr class="divider">

    <!-- KOT Meta -->
    <table>
      <tr>
        <td style="font-size:11px;font-weight:700;">ORDER #</td>
        <td style="font-size:14px;font-weight:900;text-align:right;">${orderRef}</td>
      </tr>
      <tr>
        <td style="font-size:11px;font-weight:700;">TYPE</td>
        <td style="font-size:12px;font-weight:700;text-align:right;">${orderTypeStr}${order.tableNumber ? ` — TABLE ${order.tableNumber}` : ''}</td>
      </tr>
      <tr>
        <td style="font-size:11px;font-weight:700;">TIME</td>
        <td style="font-size:11px;text-align:right;">${orderTime}</td>
      </tr>
      <tr>
        <td style="font-size:11px;font-weight:700;">CUSTOMER</td>
        <td style="font-size:11px;text-align:right;">${order.customerName || 'Guest'}</td>
      </tr>
      ${order.scheduledTime ? `<tr>
        <td style="font-size:11px;font-weight:700;color:black;">⏰ SCHEDULED</td>
        <td style="font-size:11px;font-weight:700;text-align:right;">${fmtDate(order.scheduledTime)}</td>
      </tr>` : ''}
    </table>
    <hr class="divider">

    <!-- Items -->
    <div style="font-size:11px;font-weight:700;margin-bottom:4px;">ITEMS</div>
    <table>
      ${itemLines}
    </table>

    <!-- Special Instructions (order-level) -->
    ${order.specialInstructions ? `
    <hr class="divider">
    <div style="font-size:11px;font-weight:700;">SPECIAL INSTRUCTIONS</div>
    <div style="font-size:12px;margin-top:3px;font-style:italic;">
      ${order.specialInstructions}
    </div>` : ''}

    ${order.courierNotes ? `
    <hr class="divider-single">
    <div style="font-size:11px;font-weight:700;">COURIER NOTES</div>
    <div style="font-size:12px;margin-top:3px;">${order.courierNotes}</div>` : ''}

    <!-- Item Count -->
    <hr class="divider">
    <table>
      <tr>
        <td style="font-size:12px;font-weight:700;">TOTAL ITEMS</td>
        <td style="font-size:14px;font-weight:900;text-align:right;">
          ${(order.items || []).reduce((s, i) => s + i.quantity, 0)}
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <hr class="divider">
    <div style="text-align:center;font-size:10px;">KOT Printed: ${printTime}</div>
    <div style="text-align:center;font-size:10px;margin-top:2px;">${BRAND_NAME}</div>
    <div style="margin-top:8px;text-align:center;font-size:18px;letter-spacing:6px;">- - - - -</div>

  </div>
</body>
</html>`;
};
