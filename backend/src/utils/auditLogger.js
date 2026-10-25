import AuditLog from '../models/AuditLog.js';
import { extractDeviceContext } from './deviceInfo.js';
import logger from './logger.js';

/**
 * Standardized Audit Logging Helper
 * Writes immutable audit events for merchant and customer critical actions.
 * Never throws — guarantees failures won't break primary business logic.
 */
export async function logAuditEvent({
  req,
  restaurantId = null,
  userId = null,
  actorType = null, // 'merchant' | 'staff' | 'customer' | 'admin' | 'system'
  actor = null, // { userId, name, email, phone, role }
  event, // e.g. 'MERCHANT_LOGIN', 'CUSTOMER_LOGIN', 'ORDER_CREATE', etc.
  action = null, // e.g. 'LOGIN', 'CREATE', 'REMAKE', 'CANCEL', 'STATUS_CHANGE'
  severity = 'info', // 'info' | 'warning' | 'critical'
  message,
  orderId = null,
  orderNumber = null,
  metadata = {}
}) {
  try {
    const device = req ? extractDeviceContext(req) : null;

    const resolvedUser = req?.user || null;
    const finalActor = actor || (resolvedUser ? {
      userId: resolvedUser._id,
      name: resolvedUser.name || 'User',
      email: resolvedUser.email || null,
      phone: resolvedUser.phone || null,
      role: resolvedUser.role || 'customer'
    } : null);

    let resolvedActorType = actorType;
    if (!resolvedActorType) {
      if (finalActor?.role === 'customer') {
        resolvedActorType = 'customer';
      } else if (['merchant', 'admin', 'restaurant_owner', 'manager', 'staff'].includes(finalActor?.role)) {
        resolvedActorType = 'merchant';
      } else {
        resolvedActorType = 'system';
      }
    }

    const logEntry = await AuditLog.create({
      restaurantId: restaurantId || resolvedUser?.restaurantId || null,
      userId: userId || finalActor?.userId || resolvedUser?._id || null,
      actorType: resolvedActorType,
      actor: finalActor,
      event,
      action: action || event,
      severity,
      message,
      orderId,
      orderNumber,
      device,
      metadata: {
        ...metadata,
        ...(device ? { device } : {})
      },
      timestamp: new Date()
    });

    return logEntry;
  } catch (err) {
    logger.warn('Failed to record AuditLog entry', { event, error: err.message });
    return null;
  }
}
