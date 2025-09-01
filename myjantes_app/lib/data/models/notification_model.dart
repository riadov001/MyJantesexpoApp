class NotificationModel {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type; // 'booking', 'quote', 'invoice', 'work_progress', 'email'
  final String? relatedId;
  final bool read;
  final bool? emailSent;
  final DateTime createdAt;
  final DateTime? sentAt;
  final Map<String, dynamic>? metadata;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.relatedId,
    required this.read,
    this.emailSent,
    required this.createdAt,
    this.sentAt,
    this.metadata,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      type: json['type'] as String,
      relatedId: json['relatedId'] as String?,
      read: json['read'] as bool? ?? false,
      emailSent: json['emailSent'] as bool?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      sentAt: json['sentAt'] != null 
          ? DateTime.parse(json['sentAt'] as String) 
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'message': message,
      'type': type,
      'relatedId': relatedId,
      'read': read,
      'emailSent': emailSent,
      'createdAt': createdAt.toIso8601String(),
      'sentAt': sentAt?.toIso8601String(),
      'metadata': metadata,
    };
  }

  // Type helpers
  bool get isBookingType => type == 'booking';
  bool get isQuoteType => type == 'quote';
  bool get isInvoiceType => type == 'invoice';
  bool get isWorkProgressType => type == 'work_progress';

  String get typeText {
    switch (type) {
      case 'booking':
        return 'Réservation';
      case 'quote':
        return 'Devis';
      case 'invoice':
        return 'Facture';
      case 'work_progress':
        return 'Suivi';
      default:
        return 'Notification';
    }
  }

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inMinutes < 60) {
      return 'il y a ${difference.inMinutes}min';
    } else if (difference.inHours < 24) {
      return 'il y a ${difference.inHours}h';
    } else if (difference.inDays < 7) {
      return 'il y a ${difference.inDays}j';
    } else {
      return '${createdAt.day}/${createdAt.month}';
    }
  }

  // Status helpers
  bool get isPending => emailSent == null || !emailSent!;
  bool get isDelivered => emailSent == true;
  bool get isUnread => !read && isDelivered;

  NotificationModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? message,
    String? type,
    String? relatedId,
    bool? read,
    bool? emailSent,
    DateTime? createdAt,
    DateTime? sentAt,
    Map<String, dynamic>? metadata,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      relatedId: relatedId ?? this.relatedId,
      read: read ?? this.read,
      emailSent: emailSent ?? this.emailSent,
      createdAt: createdAt ?? this.createdAt,
      sentAt: sentAt ?? this.sentAt,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  String toString() {
    return 'NotificationModel{id: $id, title: $title, type: $type, read: $read}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is NotificationModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}