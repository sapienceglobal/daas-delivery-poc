class ReservationModel {
  final String id;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final DateTime date;
  final String time;
  final int partySize;
  final String location;
  final String? occasion;
  final String? specialRequests;
  final String status;

  ReservationModel({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.date,
    required this.time,
    required this.partySize,
    required this.location,
    this.occasion,
    this.specialRequests,
    required this.status,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    return ReservationModel(
      id: json['_id'] ?? '',
      customerName: json['customerName'] ?? 'Unknown',
      customerPhone: json['customerPhone'] ?? 'Unknown',
      customerEmail: json['customerEmail'],
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      time: json['time'] ?? '00:00',
      partySize: json['partySize'] ?? json['guests'] ?? 1,
      location: json['location'] ?? json['seatingArea'] ?? 'Any',
      occasion: json['occasion'],
      specialRequests: json['specialRequests'],
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'date': date.toIso8601String(),
      'time': time,
      'partySize': partySize,
      'location': location,
      'occasion': occasion,
      'specialRequests': specialRequests,
      'status': status,
    };
  }

  ReservationModel copyWith({
    String? id,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    DateTime? date,
    String? time,
    int? partySize,
    String? location,
    String? occasion,
    String? specialRequests,
    String? status,
  }) {
    return ReservationModel(
      id: id ?? this.id,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      date: date ?? this.date,
      time: time ?? this.time,
      partySize: partySize ?? this.partySize,
      location: location ?? this.location,
      occasion: occasion ?? this.occasion,
      specialRequests: specialRequests ?? this.specialRequests,
      status: status ?? this.status,
    );
  }
}
