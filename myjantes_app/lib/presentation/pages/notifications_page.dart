import 'package:flutter/material.dart';
import 'dart:async';
import '../../core/constants/app_constants.dart';
import '../../data/models/notification_model.dart';
import '../../data/services/notifications_service.dart';
import '../../core/di/dependency_injection.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final NotificationsService _notificationsService = getIt<NotificationsService>();
  
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMoreData = true;
  bool _showUnreadOnly = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMoreData = true;
        _notifications.clear();
      });
    }

    setState(() {
      if (refresh || _notifications.isEmpty) {
        _isLoading = true;
      } else {
        _isLoadingMore = true;
      }
      _error = null;
    });

    try {
      final notifications = await _notificationsService.getUserNotifications(
        page: _currentPage,
        unreadOnly: _showUnreadOnly,
      );
      
      setState(() {
        if (refresh || _currentPage == 1) {
          _notifications = notifications;
        } else {
          _notifications.addAll(notifications);
        }
        _hasMoreData = notifications.length >= 20;
        _currentPage++;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
      });
    }
  }

  Future<void> _markAsRead(NotificationModel notification) async {
    if (notification.read) return;

    try {
      final updatedNotification = await _notificationsService.markAsRead(notification.id);
      
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == notification.id);
        if (index != -1) {
          _notifications[index] = updatedNotification;
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _notificationsService.markAllAsRead();
      
      setState(() {
        _notifications = _notifications.map((n) => n.copyWith(read: true)).toList();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Toutes les notifications ont été marquées comme lues'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteNotification(NotificationModel notification) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(AppConstants.surfaceColorValue),
        title: const Text('Supprimer la notification'),
        content: const Text('Êtes-vous sûr de vouloir supprimer cette notification ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _notificationsService.deleteNotification(notification.id);
      
      setState(() {
        _notifications.removeWhere((n) => n.id == notification.id);
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notification supprimée'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
        actions: [
          IconButton(
            icon: Icon(_showUnreadOnly ? Icons.mail : Icons.mail_outline),
            onPressed: () {
              setState(() {
                _showUnreadOnly = !_showUnreadOnly;
              });
              _loadNotifications(refresh: true);
            },
            tooltip: _showUnreadOnly ? 'Afficher toutes' : 'Non lues seulement',
          ),
          if (_notifications.any((n) => !n.read))
            IconButton(
              icon: const Icon(Icons.done_all),
              onPressed: _markAllAsRead,
              tooltip: 'Tout marquer comme lu',
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _loadNotifications(refresh: true),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _notifications.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_error != null && _notifications.isEmpty) {
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
              onPressed: () => _loadNotifications(refresh: true),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (_notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _showUnreadOnly ? Icons.mark_email_read : Icons.notifications_none,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              _showUnreadOnly ? 'Aucune notification non lue' : 'Aucune notification',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _showUnreadOnly 
                  ? 'Toutes vos notifications ont été lues.'
                  : 'Vous recevrez ici vos notifications\\nde réservations, devis et factures.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadNotifications(refresh: true),
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _notifications.length + (_hasMoreData ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _notifications.length) {
            return _buildLoadMoreButton();
          }

          final notification = _notifications[index];
          return _buildNotificationCard(notification);
        },
      ),
    );
  }

  Widget _buildNotificationCard(NotificationModel notification) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      color: notification.read 
          ? const Color(AppConstants.surfaceColorValue)
          : const Color(AppConstants.surfaceColorValue).withOpacity(0.95),
      child: InkWell(
        onTap: () => _markAsRead(notification),
        borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  // Type icon
                  _buildTypeIcon(notification.type),
                  
                  const SizedBox(width: 12),
                  
                  // Title and status
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                notification.title,
                                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                  fontWeight: notification.read 
                                      ? FontWeight.normal 
                                      : FontWeight.bold,
                                ),
                              ),
                            ),
                            if (!notification.read)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(AppConstants.primaryColorValue),
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                        
                        Text(
                          '${notification.typeText} • ${notification.timeAgo}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Actions menu
                  PopupMenuButton<String>(
                    onSelected: (action) {
                      switch (action) {
                        case 'mark_read':
                          _markAsRead(notification);
                          break;
                        case 'delete':
                          _deleteNotification(notification);
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      if (!notification.read)
                        const PopupMenuItem(
                          value: 'mark_read',
                          child: Row(
                            children: [
                              Icon(Icons.mark_email_read, size: 16),
                              SizedBox(width: 8),
                              Text('Marquer comme lu'),
                            ],
                          ),
                        ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 16, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Supprimer', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Message
              Text(
                notification.message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: notification.read ? Colors.grey : null,
                ),
              ),
              
              // Email status
              if (notification.emailSent != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      notification.emailSent! ? Icons.email : Icons.schedule,
                      size: 16,
                      color: notification.emailSent! ? Colors.green : Colors.orange,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      notification.emailSent! ? 'Email envoyé' : 'Email en attente',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: notification.emailSent! ? Colors.green : Colors.orange,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeIcon(String type) {
    IconData icon;
    Color color;

    switch (type) {
      case 'booking':
        icon = Icons.calendar_today;
        color = Colors.blue[400]!;
        break;
      case 'quote':
        icon = Icons.description;
        color = Colors.orange[400]!;
        break;
      case 'invoice':
        icon = Icons.receipt_long;
        color = Colors.purple[400]!;
        break;
      case 'work_progress':
        icon = Icons.build;
        color = Colors.green[400]!;
        break;
      case 'email':
        icon = Icons.email;
        color = Colors.teal[400]!;
        break;
      default:
        icon = Icons.notifications;
        color = Colors.grey[400]!;
    }

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(
        icon,
        color: color,
        size: 20,
      ),
    );
  }

  Widget _buildLoadMoreButton() {
    if (_isLoadingMore) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: CircularProgressIndicator(
            color: Color(AppConstants.primaryColorValue),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: ElevatedButton(
        onPressed: () => _loadNotifications(),
        child: const Text('Charger plus'),
      ),
    );
  }
}