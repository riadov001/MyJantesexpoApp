class AdminDashboardModel {
  final AdminStats stats;
  final List<RecentActivity> recentActivities;
  final List<ChartData> revenueChart;
  final List<ChartData> bookingsChart;

  AdminDashboardModel({
    required this.stats,
    required this.recentActivities,
    required this.revenueChart,
    required this.bookingsChart,
  });

  factory AdminDashboardModel.fromJson(Map<String, dynamic> json) {
    return AdminDashboardModel(
      stats: AdminStats.fromJson(json['stats'] as Map<String, dynamic>),
      recentActivities: (json['recentActivities'] as List<dynamic>)
          .map((item) => RecentActivity.fromJson(item as Map<String, dynamic>))
          .toList(),
      revenueChart: (json['revenueChart'] as List<dynamic>)
          .map((item) => ChartData.fromJson(item as Map<String, dynamic>))
          .toList(),
      bookingsChart: (json['bookingsChart'] as List<dynamic>)
          .map((item) => ChartData.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stats': stats.toJson(),
      'recentActivities': recentActivities.map((item) => item.toJson()).toList(),
      'revenueChart': revenueChart.map((item) => item.toJson()).toList(),
      'bookingsChart': bookingsChart.map((item) => item.toJson()).toList(),
    };
  }
}

class AdminStats {
  final int totalUsers;
  final int totalBookings;
  final int totalQuotes;
  final int totalInvoices;
  final double totalRevenue;
  final double monthlyRevenue;
  final int pendingQuotes;
  final int pendingBookings;
  final int overdueInvoices;
  final double completionRate;

  AdminStats({
    required this.totalUsers,
    required this.totalBookings,
    required this.totalQuotes,
    required this.totalInvoices,
    required this.totalRevenue,
    required this.monthlyRevenue,
    required this.pendingQuotes,
    required this.pendingBookings,
    required this.overdueInvoices,
    required this.completionRate,
  });

  factory AdminStats.fromJson(Map<String, dynamic> json) {
    return AdminStats(
      totalUsers: json['totalUsers'] as int? ?? 0,
      totalBookings: json['totalBookings'] as int? ?? 0,
      totalQuotes: json['totalQuotes'] as int? ?? 0,
      totalInvoices: json['totalInvoices'] as int? ?? 0,
      totalRevenue: double.parse(json['totalRevenue']?.toString() ?? '0'),
      monthlyRevenue: double.parse(json['monthlyRevenue']?.toString() ?? '0'),
      pendingQuotes: json['pendingQuotes'] as int? ?? 0,
      pendingBookings: json['pendingBookings'] as int? ?? 0,
      overdueInvoices: json['overdueInvoices'] as int? ?? 0,
      completionRate: double.parse(json['completionRate']?.toString() ?? '0'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalUsers': totalUsers,
      'totalBookings': totalBookings,
      'totalQuotes': totalQuotes,
      'totalInvoices': totalInvoices,
      'totalRevenue': totalRevenue,
      'monthlyRevenue': monthlyRevenue,
      'pendingQuotes': pendingQuotes,
      'pendingBookings': pendingBookings,
      'overdueInvoices': overdueInvoices,
      'completionRate': completionRate,
    };
  }

  String get formattedTotalRevenue => '${totalRevenue.toStringAsFixed(2)}€';
  String get formattedMonthlyRevenue => '${monthlyRevenue.toStringAsFixed(2)}€';
  String get formattedCompletionRate => '${(completionRate * 100).toStringAsFixed(1)}%';
}

class RecentActivity {
  final String id;
  final String type; // 'booking', 'quote', 'invoice', 'user'
  final String title;
  final String description;
  final String? userId;
  final String? userName;
  final DateTime createdAt;
  final String status;

  RecentActivity({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    this.userId,
    this.userName,
    required this.createdAt,
    required this.status,
  });

  factory RecentActivity.fromJson(Map<String, dynamic> json) {
    return RecentActivity(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      userId: json['userId'] as String?,
      userName: json['userName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      status: json['status'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'description': description,
      'userId': userId,
      'userName': userName,
      'createdAt': createdAt.toIso8601String(),
      'status': status,
    };
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

  String get typeDisplayName {
    switch (type) {
      case 'booking':
        return 'Réservation';
      case 'quote':
        return 'Devis';
      case 'invoice':
        return 'Facture';
      case 'user':
        return 'Utilisateur';
      default:
        return type;
    }
  }
}

class ChartData {
  final String label;
  final double value;
  final DateTime? date;

  ChartData({
    required this.label,
    required this.value,
    this.date,
  });

  factory ChartData.fromJson(Map<String, dynamic> json) {
    return ChartData(
      label: json['label'] as String,
      value: double.parse(json['value']?.toString() ?? '0'),
      date: json['date'] != null 
          ? DateTime.parse(json['date'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'value': value,
      'date': date?.toIso8601String(),
    };
  }
}