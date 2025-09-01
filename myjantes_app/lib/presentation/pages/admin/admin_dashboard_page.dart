import 'package:flutter/material.dart';
import 'dart:async';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/admin_dashboard_model.dart';
import '../../../data/services/admin_service.dart';
import '../../../core/di/dependency_injection.dart';
import 'admin_users_page.dart';
import 'admin_bookings_page.dart';
import 'admin_quotes_page.dart';
import 'admin_invoices_page.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final AdminService _adminService = getIt<AdminService>();
  AdminDashboardModel? _dashboardData;
  bool _isLoading = false;
  String? _error;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
    _setupAutoRefresh();
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  void _setupAutoRefresh() {
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (mounted) {
        _loadRealtimeStats();
      }
    });
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _adminService.getDashboardData();
      setState(() {
        _dashboardData = data;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadRealtimeStats() async {
    if (_dashboardData == null) return;

    try {
      final stats = await _adminService.getRealtimeStats();
      final activities = await _adminService.getRecentActivities();
      
      setState(() {
        _dashboardData = AdminDashboardModel(
          stats: stats,
          recentActivities: activities,
          revenueChart: _dashboardData!.revenueChart,
          bookingsChart: _dashboardData!.bookingsChart,
        );
      });
    } catch (e) {
      // Silently handle errors for background updates
      debugPrint('Background update error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Dashboard Admin'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'users':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const AdminUsersPage()),
                  );
                  break;
                case 'bookings':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const AdminBookingsPage()),
                  );
                  break;
                case 'quotes':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const AdminQuotesPage()),
                  );
                  break;
                case 'invoices':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const AdminInvoicesPage()),
                  );
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'users',
                child: Row(
                  children: [
                    Icon(Icons.people),
                    SizedBox(width: 8),
                    Text('Gestion Utilisateurs'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'bookings',
                child: Row(
                  children: [
                    Icon(Icons.calendar_today),
                    SizedBox(width: 8),
                    Text('Gestion Réservations'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'quotes',
                child: Row(
                  children: [
                    Icon(Icons.description),
                    SizedBox(width: 8),
                    Text('Gestion Devis'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'invoices',
                child: Row(
                  children: [
                    Icon(Icons.receipt_long),
                    SizedBox(width: 8),
                    Text('Gestion Factures'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Erreur',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDashboardData,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (_dashboardData == null) {
      return const Center(child: Text('Aucune donnée'));
    }

    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      color: const Color(AppConstants.primaryColorValue),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats overview
            _buildStatsGrid(),
            
            const SizedBox(height: 24),
            
            // Quick actions
            _buildQuickActions(),
            
            const SizedBox(height: 24),
            
            // Charts section
            Text(
              'Graphiques',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            _buildChartsSection(),
            
            const SizedBox(height: 24),
            
            // Recent activities
            Text(
              'Activité récente',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            _buildRecentActivities(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    final stats = _dashboardData!.stats;
    
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          'Utilisateurs',
          stats.totalUsers.toString(),
          Icons.people,
          Colors.blue,
        ),
        _buildStatCard(
          'Réservations',
          stats.totalBookings.toString(),
          Icons.calendar_today,
          Colors.green,
        ),
        _buildStatCard(
          'Devis',
          stats.totalQuotes.toString(),
          Icons.description,
          Colors.orange,
        ),
        _buildStatCard(
          'Factures',
          stats.totalInvoices.toString(),
          Icons.receipt_long,
          Colors.purple,
        ),
        _buildStatCard(
          'Chiffre d\\'affaires',
          stats.formattedTotalRevenue,
          Icons.euro,
          Colors.green,
        ),
        _buildStatCard(
          'Taux de réussite',
          stats.formattedCompletionRate,
          Icons.trending_up,
          Colors.teal,
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 32,
              color: color,
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    final stats = _dashboardData!.stats;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Actions rapides',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        
        if (stats.pendingQuotes > 0)
          _buildActionCard(
            'Devis en attente',
            '${stats.pendingQuotes} devis nécessitent votre attention',
            Icons.description,
            Colors.orange,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AdminQuotesPage()),
            ),
          ),
        
        if (stats.pendingBookings > 0) ...[
          const SizedBox(height: 12),
          _buildActionCard(
            'Réservations en attente',
            '${stats.pendingBookings} réservations à confirmer',
            Icons.calendar_today,
            Colors.blue,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AdminBookingsPage()),
            ),
          ),
        ],
        
        if (stats.overdueInvoices > 0) ...[
          const SizedBox(height: 12),
          _buildActionCard(
            'Factures en retard',
            '${stats.overdueInvoices} factures impayées',
            Icons.warning,
            Colors.red,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const AdminInvoicesPage()),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildActionCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.labelLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.grey[400],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChartsSection() {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chiffre d\\'affaires mensuel',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 200,
                  child: Center(
                    child: Text(
                      'Graphique du chiffre d\\'affaires\\n(${_dashboardData!.stats.formattedMonthlyRevenue} ce mois)',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Réservations par mois',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 200,
                  child: Center(
                    child: Text(
                      'Graphique des réservations\\n(${_dashboardData!.stats.totalBookings} au total)',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRecentActivities() {
    if (_dashboardData!.recentActivities.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Center(
            child: Text(
              'Aucune activité récente',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
          ),
        ),
      );
    }

    return Card(
      child: Column(
        children: _dashboardData!.recentActivities
            .take(10)
            .map((activity) => _buildActivityTile(activity))
            .toList(),
      ),
    );
  }

  Widget _buildActivityTile(RecentActivity activity) {
    IconData icon;
    Color color;

    switch (activity.type) {
      case 'booking':
        icon = Icons.calendar_today;
        color = Colors.blue;
        break;
      case 'quote':
        icon = Icons.description;
        color = Colors.orange;
        break;
      case 'invoice':
        icon = Icons.receipt_long;
        color = Colors.purple;
        break;
      case 'user':
        icon = Icons.person;
        color = Colors.green;
        break;
      default:
        icon = Icons.info;
        color = Colors.grey;
    }

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: color.withOpacity(0.1),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        activity.title,
        style: Theme.of(context).textTheme.bodyMedium,
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(activity.description),
          if (activity.userName != null)
            Text(
              'Par ${activity.userName}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
            ),
        ],
      ),
      trailing: Text(
        activity.timeAgo,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.grey,
        ),
      ),
    );
  }
}