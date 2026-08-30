# Implement QR Payment Link Persistence and Backgrounding

## User Review Required
No breaking changes. This enhances the QR payment flow by allowing the POS user to minimize the QR popup, let the order wait for payment in the background, and pull the QR code back up from the Live Orders screen.

## Proposed Changes

### Backend
#### [MODIFY] backend/src/models/Order.js
- Add paymentLinkUrl: { type: String, default: null } to the schema.

#### [MODIFY] backend/src/controllers/paymentController.js
- In createPaymentLink, save session.url to order.paymentLinkUrl before responding.

### Frontend Web
#### [MODIFY] frontend/src/app/merchant/pos/page.js
- Add "Hide (Wait in Background)" button to the QR modal.
- Remove the manual cancelOrder call when the timer reaches 0. Let the backend cron job handle it.

#### [MODIFY] frontend/src/components/merchant/LiveOrdersView.js
- For 
ew orders with payment_link and paymentStatus !== 'paid', add a "Show QR" button that opens a simple QR modal.

### Frontend Mobile
#### [MODIFY] merchant_mobile/lib/screens/pos_screen.dart
- Add "Hide (Run in Background)" button next to "Cancel Order".
- Stop calling _cancelOrder when the 5-minute UI timer reaches 0. Just show "Expired" and close the dialog.

#### [MODIFY] merchant_mobile/lib/screens/dashboard_widgets.dart
- Update the Live Orders card list to show a "Show QR" button for unpaid payment_link orders.
