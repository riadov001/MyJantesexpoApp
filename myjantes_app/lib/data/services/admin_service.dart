import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../models/admin_dashboard_model.dart';
import '../models/user_model.dart';
import '../models/booking_model.dart';
import '../models/quote_model.dart';
import '../models/invoice_model.dart';

class AdminService {
  final ApiClient _apiClient;

  AdminService(this._apiClient);

  // Dashboard data
  Future<AdminDashboardModel> getDashboardData() async {
    try {
      final response = await _apiClient.get(ApiConstants.adminDashboardEndpoint);
      
      final data = response.data as Map<String, dynamic>;
      return AdminDashboardModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement du dashboard: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Users management
  Future<List<UserModel>> getAllUsers({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    try {
      final response = await _apiClient.get(
        '/api/admin/users',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      
      final data = response.data as Map<String, dynamic>;
      final users = data['users'] as List<dynamic>;
      return users.map((json) => UserModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des utilisateurs: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<UserModel> updateUserRole(String userId, String role) async {
    try {
      final response = await _apiClient.put(
        '/api/admin/users/$userId/role',
        data: {'role': role},
      );

      final data = response.data as Map<String, dynamic>;
      return UserModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la mise à jour du rôle: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<void> deleteUser(String userId) async {
    try {
      await _apiClient.delete('/api/admin/users/$userId');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la suppression de l\\'utilisateur: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Bookings management
  Future<List<BookingModel>> getAllBookings({
    int page = 1,
    int limit = 20,
    String? status,
    String? search,
  }) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.adminBookingsEndpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (status != null && status.isNotEmpty) 'status': status,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      
      final data = response.data as Map<String, dynamic>;
      final bookings = data['bookings'] as List<dynamic>;
      return bookings.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des réservations: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<BookingModel> updateBookingStatus(String bookingId, String status) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.adminBookingsEndpoint}/$bookingId/status',
        data: {'status': status},
      );

      final data = response.data as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la mise à jour de la réservation: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Quotes management
  Future<List<QuoteModel>> getAllQuotes({
    int page = 1,
    int limit = 20,
    String? status,
    String? search,
  }) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.adminQuotesEndpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (status != null && status.isNotEmpty) 'status': status,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      
      final data = response.data as Map<String, dynamic>;
      final quotes = data['quotes'] as List<dynamic>;
      return quotes.map((json) => QuoteModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des devis: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<QuoteModel> updateQuote(String quoteId, {
    String? status,
    double? amount,
  }) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.adminQuotesEndpoint}/$quoteId',
        data: {
          if (status != null) 'status': status,
          if (amount != null) 'amount': amount,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return QuoteModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la mise à jour du devis: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Invoices management
  Future<List<InvoiceModel>> getAllInvoices({
    int page = 1,
    int limit = 20,
    String? status,
    String? search,
  }) async {
    try {
      final response = await _apiClient.get(
        ApiConstants.adminInvoicesEndpoint,
        queryParameters: {
          'page': page,
          'limit': limit,
          if (status != null && status.isNotEmpty) 'status': status,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      
      final data = response.data as Map<String, dynamic>;
      final invoices = data['invoices'] as List<dynamic>;
      return invoices.map((json) => InvoiceModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des factures: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<InvoiceModel> createInvoiceFromQuote(String quoteId) async {
    try {
      final response = await _apiClient.post(
        '${ApiConstants.adminInvoicesEndpoint}/from-quote',
        data: {'quoteId': quoteId},
      );

      final data = response.data as Map<String, dynamic>;
      return InvoiceModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la création de la facture: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<InvoiceModel> updateInvoiceStatus(String invoiceId, String status) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.adminInvoicesEndpoint}/$invoiceId/status',
        data: {'status': status},
      );

      final data = response.data as Map<String, dynamic>;
      return InvoiceModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la mise à jour de la facture: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Real-time updates
  Future<AdminStats> getRealtimeStats() async {
    try {
      final response = await _apiClient.get('/api/admin/stats/realtime');
      
      final data = response.data as Map<String, dynamic>;
      return AdminStats.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des statistiques: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  Future<List<RecentActivity>> getRecentActivities({int limit = 10}) async {
    try {
      final response = await _apiClient.get(
        '/api/admin/activities/recent',
        queryParameters: {'limit': limit},
      );
      
      final data = response.data as List<dynamic>;
      return data.map((json) => RecentActivity.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des activités: $e',
        type: ApiExceptionType.network,
      );
    }
  }
}