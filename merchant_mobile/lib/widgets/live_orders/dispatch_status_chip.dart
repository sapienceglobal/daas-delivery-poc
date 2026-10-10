import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../models/order_model.dart';
import '../../services/server_clock.dart';

class DispatchStatusChip extends StatefulWidget {
  final OrderModel order;

  const DispatchStatusChip({
    super.key,
    required this.order,
  });

  @override
  State<DispatchStatusChip> createState() => _DispatchStatusChipState();
}

class _DispatchStatusChipState extends State<DispatchStatusChip> {
  final ServerClock _clock = ServerClock.instance;

  @override
  void initState() {
    super.initState();
    if (widget.order.dispatchStatus == 'scheduled') {
      _clock.attachTicker();
    }
  }

  @override
  void didUpdateWidget(covariant DispatchStatusChip oldWidget) {
    super.didUpdateWidget(oldWidget);
    final wasScheduled = oldWidget.order.dispatchStatus == 'scheduled';
    final isScheduled = widget.order.dispatchStatus == 'scheduled';

    if (!wasScheduled && isScheduled) {
      _clock.attachTicker();
    } else if (wasScheduled && !isScheduled) {
      _clock.detachTicker();
    }
  }

  @override
  void dispose() {
    if (widget.order.dispatchStatus == 'scheduled') {
      _clock.detachTicker();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.order.orderType != 'delivery') {
      return const SizedBox.shrink();
    }

    final status = widget.order.dispatchStatus;
    if (status == null || status == 'not_applicable' || status == 'cancelled') {
      return const SizedBox.shrink();
    }

    if (status == 'scheduled') {
      return ValueListenableBuilder<int>(
        valueListenable: _clock.tickNotifier,
        builder: (context, _, __) {
          final countdown = _clock.formatCountdown(widget.order.dispatchAt);
          return _buildChip(
            context,
            icon: Icons.timer_outlined,
            label: 'Rider request in $countdown',
            bgColor: AppColors.warning.withValues(alpha: 0.12),
            textColor: AppColors.warning,
            borderColor: AppColors.warning.withValues(alpha: 0.3),
          );
        },
      );
    }

    if (status == 'dispatching') {
      return _buildChip(
        context,
        iconWidget: SizedBox(
          width: 12,
          height: 12,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.info,
          ),
        ),
        label: 'Requesting rider...',
        bgColor: AppColors.info.withValues(alpha: 0.12),
        textColor: AppColors.info,
        borderColor: AppColors.info.withValues(alpha: 0.3),
      );
    }

    if (status == 'dispatched') {
      return _buildChip(
        context,
        icon: Icons.check_circle_outline,
        label: 'Rider requested',
        bgColor: AppColors.success.withValues(alpha: 0.12),
        textColor: AppColors.success,
        borderColor: AppColors.success.withValues(alpha: 0.3),
      );
    }

    if (status == 'failed') {
      return _buildChip(
        context,
        icon: Icons.error_outline,
        label: 'Rider request failed',
        bgColor: AppColors.error.withValues(alpha: 0.12),
        textColor: AppColors.error,
        borderColor: AppColors.error.withValues(alpha: 0.3),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildChip(
    BuildContext context, {
    IconData? icon,
    Widget? iconWidget,
    required String label,
    required Color bgColor,
    required Color textColor,
    required Color borderColor,
  }) {
    return Container(
      constraints: const BoxConstraints(minHeight: 28),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (iconWidget != null)
            iconWidget
          else if (icon != null)
            Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
