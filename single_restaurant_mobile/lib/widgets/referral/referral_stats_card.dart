import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/widgets/shimmer_loading.dart';

class ReferralStatsCard extends StatelessWidget {
  final num pointsEarned;
  final int friendsRewarded;
  final int friendsPending;
  final int friendsInvited;
  final int maxRewards;
  final num rewardValue;
  final List<dynamic> friendsList;
  final bool isLoading;

  const ReferralStatsCard({
    super.key,
    required this.pointsEarned,
    required this.friendsRewarded,
    required this.friendsPending,
    required this.friendsInvited,
    required this.maxRewards,
    required this.rewardValue,
    this.friendsList = const [],
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final remainingInvites = maxRewards > 0 ? (maxRewards - friendsRewarded).clamp(0, maxRewards) : null;
    final progress = maxRewards > 0 ? (friendsRewarded / maxRewards).clamp(0.0, 1.0) : 0.0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEADBDB), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDF2F2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF8D7DA)),
                  ),
                  child: const Icon(
                    Icons.insights_rounded,
                    color: Color(0xFF4A0E13),
                    size: 19,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Your Referral Activity',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1B0C06),
                        ),
                      ),
                      if (isLoading)
                        const BaseShimmer(
                          child: Padding(
                            padding: EdgeInsets.only(top: 3),
                            child: ShimmerBox(width: 130, height: 11, borderRadius: 3),
                          ),
                        )
                      else
                        Text(
                          maxRewards > 0
                              ? '$friendsRewarded of $maxRewards rewards claimed'
                              : '$friendsRewarded successful referrals',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                    ],
                  ),
                ),
                // Remaining Limit Badge
                if (isLoading)
                  const BaseShimmer(
                    child: ShimmerBox(width: 52, height: 22, borderRadius: 8),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFAF7F2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFC99742)),
                    ),
                    child: Text(
                      remainingInvites != null ? '$remainingInvites Left' : 'Unlimited',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF4A0E13),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Progress Bar if limit exists
          if (maxRewards > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 5,
                  backgroundColor: const Color(0xFFF3F4F6),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFC99742)),
                ),
              ),
            ),

          const SizedBox(height: 12),

          // 3 Metric Blocks Grid
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Row(
              children: [
                _buildStatTile(
                  title: 'Points Earned',
                  value: pointsEarned > 0 ? '${pointsEarned.toInt()} pts' : '0 pts',
                  subtitle: pointsEarned > 0 ? '(\$${(friendsRewarded * rewardValue).toInt()} value)' : 'Start sharing',
                  color: const Color(0xFF047857),
                  bgColor: const Color(0xFFECFDF5),
                  icon: Icons.card_giftcard_rounded,
                ),
                const SizedBox(width: 8),
                _buildStatTile(
                  title: 'Completed',
                  value: '$friendsRewarded',
                  subtitle: 'Delivered orders',
                  color: const Color(0xFF1D4ED8),
                  bgColor: const Color(0xFFEFF6FF),
                  icon: Icons.check_circle_rounded,
                ),
                const SizedBox(width: 8),
                _buildStatTile(
                  title: 'Pending',
                  value: '$friendsPending',
                  subtitle: 'Awaiting order',
                  color: const Color(0xFFB45309),
                  bgColor: const Color(0xFFFFFBEB),
                  icon: Icons.hourglass_top_rounded,
                ),
              ],
            ),
          ),

          // Friends List or Empty Message
          const SizedBox(height: 14),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),

          if (friendsList.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Text(
                'Invited Friends (${friendsList.length})',
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF374151),
                ),
              ),
            ),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              itemCount: friendsList.length > 5 ? 5 : friendsList.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final friend = friendsList[index] as Map<String, dynamic>;
                final name = friend['name'] ?? 'Friend';
                final status = friend['status'] ?? 'pending';
                final isRewarded = status == 'rewarded';

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9FAFB),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF3F4F6)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: isRewarded ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                        child: Icon(
                          isRewarded ? Icons.check : Icons.person_outline,
                          size: 15,
                          color: isRewarded ? const Color(0xFF047857) : const Color(0xFFB45309),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isRewarded ? const Color(0xFFECFDF5) : const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isRewarded ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A),
                          ),
                        ),
                        child: Text(
                          isRewarded ? '+\$${rewardValue.toInt()} Earned' : 'Joined',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isRewarded ? const Color(0xFF047857) : const Color(0xFFB45309),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ] else ...[
            Padding(
              padding: const EdgeInsets.all(14.0),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 16, color: Color(0xFF9CA3AF)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'No friends have joined yet. Share your link above to earn \$${rewardValue.toInt()} per order!',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatTile({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required Color bgColor,
    required IconData icon,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 17, color: color),
            const SizedBox(height: 4),
            isLoading
                ? const BaseShimmer(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 2),
                      child: ShimmerBox(width: 44, height: 13, borderRadius: 3),
                    ),
                  )
                : Text(
                    value,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
            const SizedBox(height: 1),
            Text(
              title,
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}
