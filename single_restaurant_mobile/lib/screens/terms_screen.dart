import 'package:flutter/material.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text(
          'Terms & Refund Policy',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Lassi Lounge - Order Cancellation & Refund Policy',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 16),
            Text(
              'To ensure transparency and protect both our customers and our business operations, please review our strict Cancellation and Refund policies. By placing an order with us, you agree to the following terms:',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade800, height: 1.5),
            ),
            const SizedBox(height: 24),
            _buildSection(
              title: '1. Order Cancellation by Customer',
              items: [
                'Grace Period: Customers may cancel their order for a full refund only while the order status is "Pending" or "Accepted" (i.e., before the kitchen has started preparing the food).',
                'Post-Preparation Restriction: Once the restaurant begins preparing your order (status changes to "Preparing" or "Ready"), cancellations are no longer permitted. The food costs have already been incurred, and the cancel button will be disabled on your dashboard.',
                'Auto-Refund: If an order is successfully cancelled within the grace period, an automatic 100% refund (including delivery fees) will be processed back to the original payment method.',
              ],
            ),
            _buildSection(
              title: '2. Failed Delivery (Customer\'s Fault)',
              items: [
                'If a third-party delivery partner (e.g., DoorDash, Uber) is dispatched but cannot complete the delivery due to customer negligence, no refunds will be issued.',
                'Situations that qualify as customer negligence include:\n- Providing an incorrect, incomplete, or inaccessible delivery address.\n- Customer is unresponsive to phone calls/texts from the driver upon arrival.\n- Customer fails to retrieve the food within the designated waiting period upon driver arrival.',
                'In these events, the food is considered "Delivered/Failed" and must be discarded for safety reasons. The restaurant retains the full order amount to cover the cost of prepared food and the third-party delivery fee charged to the restaurant.',
              ],
            ),
            _buildSection(
              title: '3. Failed Delivery (Driver or System Fault)',
              items: [
                'If an order fails to arrive due to circumstances outside of the customer\'s control (e.g., delivery driver accident, driver lost the order, or system failure):',
                'The customer must contact restaurant support immediately.',
                'The restaurant will initiate a manual review and dispute the charge with the third-party delivery service.',
                'A full or partial refund (or replacement order) may be issued to the customer at the restaurant\'s sole discretion once the driver\'s fault is confirmed.',
              ],
            ),
            _buildSection(
              title: '4. Restaurant Rejections',
              items: [
                'The restaurant reserves the right to reject or cancel any order before preparation begins (e.g., due to out-of-stock items, extreme kitchen volume, or technical issues). If the restaurant cancels your order, a 100% full refund will be automatically issued immediately.',
              ],
            ),
            _buildSection(
              title: '5. Loyalty Points & Coupons',
              items: [
                'Loyalty Points: If an order is cancelled, any loyalty points earned from that order will be automatically revoked. If loyalty points were used to pay for a cancelled order, those points will be refunded to your account balance. Loyalty points hold no cash value and cannot be refunded as cash.',
                'Coupons & Promotions: If an order utilizing a single-use coupon is cancelled by the customer, the coupon is considered forfeited and cannot be reused for future orders.',
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Note for Management: These policies strictly limit automatic refunds once food preparation begins or if the delivery fails after leaving the restaurant, ensuring the restaurant does not bear double losses for third-party or customer errors.',
                style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required List<String> items}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 12),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 8.0, left: 8.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('• ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Expanded(
                  child: Text(
                    item,
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade800, height: 1.5),
                  ),
                ),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }
}
