import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../models/notification_model.dart';
import '../models/email_template_model.dart';
import '../models/user_model.dart';

class NotificationsService {
  final ApiClient _apiClient;

  NotificationsService(this._apiClient);

  // Get user notifications
  Future<List<NotificationModel>> getUserNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  }) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.notificationsEndpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          'unreadOnly': unreadOnly,
        },
      );
      
      final data = response.data as List<dynamic>;
      return data.map((json) => NotificationModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des notifications: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Mark notification as read
  Future<NotificationModel> markAsRead(String notificationId) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.notificationsEndpoint}/$notificationId/read',
        data: {'read': true},
      );

      final data = response.data as Map<String, dynamic>;
      return NotificationModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du marquage: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      await _apiClient.put('${ApiConstants.notificationsEndpoint}/mark-all-read');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du marquage: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get unread count
  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.get('${ApiConstants.notificationsEndpoint}/unread-count');
      
      final data = response.data as Map<String, dynamic>;
      return data['count'] as int? ?? 0;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Send booking confirmation email
  Future<void> sendBookingConfirmationEmail({
    required String userId,
    required String bookingId,
    required String serviceName,
    required String bookingDate,
    required String bookingTime,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/booking-confirmation',
        data: {
          'userId': userId,
          'bookingId': bookingId,
          'serviceName': serviceName,
          'bookingDate': bookingDate,
          'bookingTime': bookingTime,
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi de l\\'email: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Send quote received email
  Future<void> sendQuoteReceivedEmail({
    required String userId,
    required String quoteId,
    required String description,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/quote-received',
        data: {
          'userId': userId,
          'quoteId': quoteId,
          'description': description,
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi de l\\'email: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Send quote ready email
  Future<void> sendQuoteReadyEmail({
    required String userId,
    required String quoteId,
    required double amount,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/quote-ready',
        data: {
          'userId': userId,
          'quoteId': quoteId,
          'amount': amount,
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi de l\\'email: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Send invoice created email
  Future<void> sendInvoiceCreatedEmail({
    required String userId,
    required String invoiceId,
    required double amount,
    required DateTime dueDate,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/invoice-created',
        data: {
          'userId': userId,
          'invoiceId': invoiceId,
          'amount': amount,
          'dueDate': dueDate.toIso8601String(),
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi de l\\'email: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Send invoice reminder email
  Future<void> sendInvoiceReminderEmail({
    required String userId,
    required String invoiceId,
    required double amount,
    required int daysOverdue,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/invoice-reminder',
        data: {
          'userId': userId,
          'invoiceId': invoiceId,
          'amount': amount,
          'daysOverdue': daysOverdue,
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi de l\\'email: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Send custom email
  Future<void> sendCustomEmail({
    required String userId,
    required String subject,
    required String htmlContent,
    required String textContent,
    Map<String, String>? variables,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/custom',
        data: {
          'userId': userId,
          'subject': subject,
          'htmlContent': htmlContent,
          'textContent': textContent,
          'variables': variables ?? {},
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi de l\\'email: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Bulk send emails
  Future<void> sendBulkEmail({
    required List<String> userIds,
    required String subject,
    required String htmlContent,
    required String textContent,
    Map<String, String>? variables,
  }) async {
    try {
      await _apiClient.post(
        '${ApiConstants.notificationsEndpoint}/email/bulk',
        data: {
          'userIds': userIds,
          'subject': subject,
          'htmlContent': htmlContent,
          'textContent': textContent,
          'variables': variables ?? {},
        },
      );
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\\'envoi des emails: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get email statistics
  Future<Map<String, dynamic>> getEmailStats() async {
    try {
      final response = await _apiClient.get('${ApiConstants.notificationsEndpoint}/email/stats');
      
      return response.data as Map<String, dynamic>;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des statistiques: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Test email configuration
  Future<Map<String, dynamic>> testEmailConfiguration() async {
    try {
      final response = await _apiClient.post('${ApiConstants.notificationsEndpoint}/email/test');
      
      return response.data as Map<String, dynamic>;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du test de configuration: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Create notification (local helper)
  Future<NotificationModel> createNotification({
    required String userId,
    required String type,
    required String title,
    required String message,
    String? relatedId,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.notificationsEndpoint,
        data: {
          'userId': userId,
          'type': type,
          'title': title,
          'message': message,
          'relatedId': relatedId,
          'metadata': metadata,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return NotificationModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la création de notification: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Delete notification
  Future<void> deleteNotification(String notificationId) async {
    try {
      await _apiClient.delete('${ApiConstants.notificationsEndpoint}/$notificationId');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la suppression: $e',
        type: ApiExceptionType.network,
      );
    }
  }
}