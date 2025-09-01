class InvoiceModel {
  final String id;
  final String userId;
  final String quoteId;
  final double amount;
  final String status;
  final String? pdfUrl;
  final DateTime createdAt;
  final DateTime? dueDate;

  InvoiceModel({
    required this.id,
    required this.userId,
    required this.quoteId,
    required this.amount,
    required this.status,
    this.pdfUrl,
    required this.createdAt,
    this.dueDate,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      quoteId: json['quoteId'] as String,
      amount: double.parse(json['amount'].toString()),
      status: json['status'] as String? ?? 'pending',
      pdfUrl: json['pdfUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      dueDate: json['dueDate'] != null 
          ? DateTime.parse(json['dueDate'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'quoteId': quoteId,
      'amount': amount,
      'status': status,
      'pdfUrl': pdfUrl,
      'createdAt': createdAt.toIso8601String(),
      'dueDate': dueDate?.toIso8601String(),
    };
  }

  // Status helpers
  bool get isPending => status == 'pending';
  bool get isPaid => status == 'paid';
  bool get isOverdue => status == 'overdue';
  bool get isCancelled => status == 'cancelled';

  String get statusText {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'paid':
        return 'Payée';
      case 'overdue':
        return 'En retard';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  }

  String get formattedAmount => '${amount.toStringAsFixed(2)}€';

  bool get isOverdueNow {
    if (dueDate == null || isPaid || isCancelled) return false;
    return DateTime.now().isAfter(dueDate!);
  }

  int get daysUntilDue {
    if (dueDate == null) return 0;
    return dueDate!.difference(DateTime.now()).inDays;
  }

  InvoiceModel copyWith({
    String? id,
    String? userId,
    String? quoteId,
    double? amount,
    String? status,
    String? pdfUrl,
    DateTime? createdAt,
    DateTime? dueDate,
  }) {
    return InvoiceModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      quoteId: quoteId ?? this.quoteId,
      amount: amount ?? this.amount,
      status: status ?? this.status,
      pdfUrl: pdfUrl ?? this.pdfUrl,
      createdAt: createdAt ?? this.createdAt,
      dueDate: dueDate ?? this.dueDate,
    );
  }

  @override
  String toString() {
    return 'InvoiceModel{id: $id, quoteId: $quoteId, amount: $amount, status: $status}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is InvoiceModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}