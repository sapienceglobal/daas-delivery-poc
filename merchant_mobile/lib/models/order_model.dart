class OrderItem {
  final String name;
  final int quantity;
  final String? size;
  final List<String> addOns;
  final String? specialInstructions;

  OrderItem({
    required this.name,
    required this.quantity,
    this.size,
    this.addOns = const [],
    this.specialInstructions,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    var addOnsList = <String>[];
    if (json['addOns'] != null) {
      if (json['addOns'] is List) {
        addOnsList = List<String>.from((json['addOns'] as List).map((a) => a['name']?.toString() ?? ''));
      }
    }
    return OrderItem(
      name: json['name'] ?? 'Unknown Item',
      quantity: json['quantity'] ?? 1,
      size: json['selectedSize'] != null ? json['selectedSize']['name'] : null,
      addOns: addOnsList,
      specialInstructions: json['specialInstructions'],
    );
  }
}

class StatusUpdate {
  final String status;
  final DateTime timestamp;
  final String? description;

  StatusUpdate({required this.status, required this.timestamp, this.description});

  factory StatusUpdate.fromJson(Map<String, dynamic> json) {
    return StatusUpdate(
      status: json['status'] ?? 'unknown',
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
      description: json['description'],
    );
  }
}

class PaymentEvent {
  final String event;
  final String? reason;
  final String? error;
  final double? amount;
  final DateTime timestamp;

  PaymentEvent({
    required this.event,
    required this.timestamp,
    this.reason,
    this.error,
    this.amount,
  });

  factory PaymentEvent.fromJson(Map<String, dynamic> json) {
    return PaymentEvent(
      event: json['event'] ?? 'unknown',
      reason: json['reason'],
      error: json['error'],
      amount: json['amount'] != null ? (json['amount'] as num).toDouble() : null,
      timestamp: json['timestamp'] != null ? DateTime.parse(json['timestamp']) : DateTime.now(),
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String status;
  final String customerName;
  final String customerPhone;
  final String orderType;
  final double total;
  final DateTime createdAt;
  final List<OrderItem> items;
  final String? specialInstructions;
  final String? courierName;
  final String? courierPhone;
  final String? customerEmail;
  final String? address;
  final String? tableNumber;
  final String paymentStatus;
  final String paymentMethod;
  final bool refunded;
  final String? refundReason;
  final List<StatusUpdate> statusUpdates;
  final List<PaymentEvent> paymentEvents;
  final double subtotal;
  final double tax;
  final double deliveryFee;
  final double discount;
  final double tip;
  final double refundAmount;
  final String? orderSource;
  final String? accountName;
  final String? accountEmail;
  final String? accountPhone;
  final bool hasAutoRefund;
  final bool autoRefundSucceeded;
  final bool autoRefundFailed;
  
  // Delivery & Tracking Fields
  final String? deliveryProvider;
  final String? deliveryId;
  final String? trackingUrl;
  final DateTime? pickupTime;
  final DateTime? deliveryTime;
  final String? courierNotes;
  final double? rating;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.customerName,
    required this.customerPhone,
    required this.orderType,
    required this.total,
    required this.createdAt,
    required this.items,
    this.specialInstructions,
    this.courierName,
    this.courierPhone,
    this.customerEmail,
    this.address,
    this.tableNumber,
    this.paymentStatus = 'unpaid',
    this.paymentMethod = 'cash',
    this.refunded = false,
    this.refundReason,
    this.statusUpdates = const [],
    this.paymentEvents = const [],
    this.subtotal = 0,
    this.tax = 0,
    this.deliveryFee = 0,
    this.discount = 0,
    this.tip = 0,
    this.refundAmount = 0,
    this.orderSource,
    this.accountName,
    this.accountEmail,
    this.accountPhone,
    this.hasAutoRefund = false,
    this.autoRefundSucceeded = false,
    this.autoRefundFailed = false,
    this.deliveryProvider,
    this.deliveryId,
    this.trackingUrl,
    this.pickupTime,
    this.deliveryTime,
    this.courierNotes,
    this.rating,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    var itemsList = <OrderItem>[];
    if (json['items'] != null) {
      itemsList = (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList();
    }
    var updatesList = <StatusUpdate>[];
    if (json['statusUpdates'] != null) {
      updatesList = (json['statusUpdates'] as List).map((i) => StatusUpdate.fromJson(i)).toList();
    }
    
    // Parse payment events for auto refund
    bool hasAutoRefund = false;
    bool autoRefundSucceeded = false;
    bool autoRefundFailed = false;
    var paymentEventsList = <PaymentEvent>[];
    
    if (json['paymentEvents'] != null) {
      final evts = json['paymentEvents'] as List;
      paymentEventsList = evts.map((e) => PaymentEvent.fromJson(e)).toList();
      hasAutoRefund = evts.any((e) => e['event'] == 'auto_refund_triggered');
      autoRefundSucceeded = json['refunded'] == true || evts.any((e) => e['event'] == 'auto_refund_succeeded');
      autoRefundFailed = !autoRefundSucceeded && evts.any((e) => e['event'] == 'auto_refund_failed');
    }
    return OrderModel(
      id: json['_id'] ?? '',
      orderNumber: json['orderNumber'] ?? json['_id']?.toString().substring((json['_id']?.toString().length ?? 6) - 6) ?? '',
      status: json['status']?.toString().toLowerCase() ?? 'new',
      customerName: json['customerName'] ?? 'Guest',
      customerPhone: json['customerPhone'] ?? 'N/A',
      orderType: json['orderType'] ?? 'delivery',
      total: (json['total'] ?? 0).toDouble(),
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
      items: itemsList,
      specialInstructions: json['specialInstructions'],
      courierName: json['courierName'],
      courierPhone: json['courierPhone'],
      paymentStatus: json['paymentStatus']?.toString().toLowerCase() ?? 'unpaid',
      paymentMethod: json['paymentMethod']?.toString().toLowerCase() ?? 'cash',
      refunded: json['refunded'] ?? false,
      refundReason: json['refundReason'],
      customerEmail: json['customerEmail'],
      address: json['deliveryAddress']?['street'] ?? json['address'],
      tableNumber: json['tableNumber'],
      statusUpdates: updatesList,
      paymentEvents: paymentEventsList,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      tax: (json['tax'] ?? 0).toDouble(),
      deliveryFee: (json['deliveryFee'] ?? 0).toDouble(),
      discount: (json['discount'] ?? 0).toDouble(),
      tip: (json['tip'] ?? 0).toDouble(),
      refundAmount: (json['refundAmount'] ?? 0).toDouble(),
      orderSource: json['orderSource'],
      accountName: json['userId']?['name'],
      accountEmail: json['userId']?['email'],
      accountPhone: json['userId']?['phone'],
      hasAutoRefund: hasAutoRefund,
      autoRefundSucceeded: autoRefundSucceeded,
      autoRefundFailed: autoRefundFailed,
      deliveryProvider: json['deliveryProvider'],
      deliveryId: json['deliveryId'],
      trackingUrl: json['trackingUrl'],
      pickupTime: json['pickupTime'] != null ? DateTime.parse(json['pickupTime']) : null,
      deliveryTime: json['deliveryTime'] != null ? DateTime.parse(json['deliveryTime']) : null,
      courierNotes: json['courierNotes'],
      rating: json['rating'] != null ? (json['rating'] as num).toDouble() : null,
    );
  }

  OrderModel copyWith({
    String? status,
  }) {
    return OrderModel(
      id: id,
      orderNumber: orderNumber,
      status: status ?? this.status,
      customerName: customerName,
      customerPhone: customerPhone,
      orderType: orderType,
      total: total,
      createdAt: createdAt,
      items: items,
      specialInstructions: specialInstructions,
      courierName: courierName,
      courierPhone: courierPhone,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod,
      refunded: refunded,
      refundReason: refundReason,
      customerEmail: customerEmail,
      address: address,
      tableNumber: tableNumber,
      statusUpdates: statusUpdates,
      paymentEvents: paymentEvents,
      subtotal: subtotal,
      tax: tax,
      deliveryFee: deliveryFee,
      discount: discount,
      tip: tip,
      refundAmount: refundAmount,
      orderSource: orderSource,
      accountName: accountName,
      accountEmail: accountEmail,
      accountPhone: accountPhone,
      hasAutoRefund: hasAutoRefund,
      autoRefundSucceeded: autoRefundSucceeded,
      autoRefundFailed: autoRefundFailed,
      deliveryProvider: deliveryProvider,
      deliveryId: deliveryId,
      trackingUrl: trackingUrl,
      pickupTime: pickupTime,
      deliveryTime: deliveryTime,
      courierNotes: courierNotes,
      rating: rating,
    );
  }
}
