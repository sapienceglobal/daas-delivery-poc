import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/order_model.dart';
import '../../providers/order_provider.dart';

class DispatchActionButtons extends StatefulWidget {
  final OrderModel order;

  const DispatchActionButtons({
    super.key,
    required this.order,
  });

  @override
  State<DispatchActionButtons> createState() => _DispatchActionButtonsState();
}

class _DispatchActionButtonsState extends State<DispatchActionButtons> {
  bool _isActionLoading = false;

  Future<void> _handleDispatchNow(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Request Rider Now?'),
        content: const Text(
          'Are you sure you want to request a delivery courier immediately? The remaining wait time will be bypassed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.surface,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Request Now'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isActionLoading = true);
    try {
      await context.read<OrderProvider>().dispatchNow(widget.order.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rider requested successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to request rider: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  Future<void> _handlePostpone(BuildContext context, int minutes) async {
    setState(() => _isActionLoading = true);
    try {
      await context.read<OrderProvider>().dispatchPostpone(widget.order.id, minutes);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rider request delayed by +$minutes min'),
            backgroundColor: AppColors.info,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to postpone rider request: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.order.orderType != 'delivery') {
      return const SizedBox.shrink();
    }

    final status = widget.order.dispatchStatus;

    if (status == 'scheduled') {
      return Wrap(
        spacing: 8,
        runSpacing: 6,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: const Size(0, 32),
              side: const BorderSide(color: AppColors.primary, width: 1),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: _isActionLoading
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.delivery_dining, size: 16, color: AppColors.primary),
            label: const Text(
              'Request Rider Now',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
            ),
            onPressed: _isActionLoading ? null : () => _handleDispatchNow(context),
          ),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              minimumSize: const Size(0, 32),
              side: BorderSide(color: AppColors.textSecondary.withValues(alpha: 0.4)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: _isActionLoading ? null : () => _handlePostpone(context, 5),
            child: const Text(
              '+5 min',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
            ),
          ),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              minimumSize: const Size(0, 32),
              side: BorderSide(color: AppColors.textSecondary.withValues(alpha: 0.4)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: _isActionLoading ? null : () => _handlePostpone(context, 10),
            child: const Text(
              '+10 min',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
            ),
          ),
        ],
      );
    }

    if (status == 'failed') {
      return OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          minimumSize: const Size(0, 32),
          side: const BorderSide(color: AppColors.error, width: 1),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        icon: _isActionLoading
            ? const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.error),
              )
            : const Icon(Icons.refresh, size: 16, color: AppColors.error),
        label: const Text(
          'Retry Request',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.error),
        ),
        onPressed: _isActionLoading ? null : () => _handleDispatchNow(context),
      );
    }

    return const SizedBox.shrink();
  }
}
