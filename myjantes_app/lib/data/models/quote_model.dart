class QuoteModel {
  final String id;
  final String userId;
  final String serviceId;
  final String description;
  final List<String>? photos;
  final double? amount;
  final String status;
  final DateTime createdAt;

  QuoteModel({
    required this.id,
    required this.userId,
    required this.serviceId,
    required this.description,
    this.photos,
    this.amount,
    required this.status,
    required this.createdAt,
  });

  factory QuoteModel.fromJson(Map<String, dynamic> json) {
    return QuoteModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      serviceId: json['serviceId'] as String,
      description: json['description'] as String,
      photos: json['photos'] != null 
          ? List<String>.from(json['photos'] as List) 
          : null,
      amount: json['amount'] != null 
          ? double.parse(json['amount'].toString()) 
          : null,
      status: json['status'] as String? ?? 'pending',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'serviceId': serviceId,
      'description': description,
      'photos': photos,
      'amount': amount,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // Status helpers
  bool get isPending => status == 'pending';
  bool get isSent => status == 'sent';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';

  String get statusText {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'sent':
        return 'Envoyé';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  }

  String? get formattedAmount => amount != null ? '${amount!.toStringAsFixed(2)}€' : null;
  int get photoCount => photos?.length ?? 0;

  QuoteModel copyWith({
    String? id,
    String? userId,
    String? serviceId,
    String? description,
    List<String>? photos,
    double? amount,
    String? status,
    DateTime? createdAt,
  }) {
    return QuoteModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      serviceId: serviceId ?? this.serviceId,
      description: description ?? this.description,
      photos: photos ?? this.photos,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'QuoteModel{id: $id, serviceId: $serviceId, amount: $amount, status: $status}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is QuoteModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}