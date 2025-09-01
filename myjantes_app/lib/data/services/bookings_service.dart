import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../models/booking_model.dart';

class BookingsService {
  final ApiClient _apiClient;

  BookingsService(this._apiClient);

  // Get user's bookings
  Future<List<BookingModel>> getUserBookings() async {
    try {
      final response = await _apiClient.get(ApiConstants.bookingsEndpoint);
      
      final data = response.data as List<dynamic>;
      return data.map((json) => BookingModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des réservations: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get booking by ID
  Future<BookingModel> getBookingById(String bookingId) async {
    try {
      final response = await _apiClient.get('${ApiConstants.bookingsEndpoint}/$bookingId');
      
      final data = response.data as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement de la réservation: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Create booking
  Future<BookingModel> createBooking({
    required String serviceId,
    required String date,
    required String timeSlot,
    required String vehicleBrand,
    required String vehicleModel,
    required String vehiclePlate,
    String? notes,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.bookingsEndpoint,
        data: {
          'serviceId': serviceId,
          'date': date,
          'timeSlot': timeSlot,
          'vehicleBrand': vehicleBrand,
          'vehicleModel': vehicleModel,
          'vehiclePlate': vehiclePlate,
          'notes': notes,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la création de la réservation: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Update booking
  Future<BookingModel> updateBooking(String bookingId, Map<String, dynamic> updates) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.bookingsEndpoint}/$bookingId',
        data: updates,
      );

      final data = response.data as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la mise à jour: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Cancel booking
  Future<BookingModel> cancelBooking(String bookingId) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.bookingsEndpoint}/$bookingId/cancel',
        data: {'status': 'cancelled'},
      );

      final data = response.data as Map<String, dynamic>;
      return BookingModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\'annulation: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get available time slots
  Future<List<String>> getAvailableTimeSlots(String date, String serviceId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.bookingsEndpoint}/available-slots',
        queryParameters: {
          'date': date,
          'serviceId': serviceId,
        },
      );

      final data = response.data as List<dynamic>;
      return data.cast<String>();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des créneaux: $e',
        type: ApiExceptionType.network,
      );
    }
  }
}