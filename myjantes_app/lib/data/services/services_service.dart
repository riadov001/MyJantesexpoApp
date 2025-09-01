import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../models/service_model.dart';

class ServicesService {
  final ApiClient _apiClient;

  ServicesService(this._apiClient);

  // Get all services
  Future<List<ServiceModel>> getAllServices() async {
    try {
      final response = await _apiClient.get(ApiConstants.servicesEndpoint);
      
      final data = response.data as List<dynamic>;
      return data.map((json) => ServiceModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des services: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get service by ID
  Future<ServiceModel> getServiceById(String serviceId) async {
    try {
      final response = await _apiClient.get('${ApiConstants.servicesEndpoint}/$serviceId');
      
      final data = response.data as Map<String, dynamic>;
      return ServiceModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement du service: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Search services
  Future<List<ServiceModel>> searchServices(String query) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.servicesEndpoint}/search',
        queryParameters: {'q': query},
      );
      
      final data = response.data as List<dynamic>;
      return data.map((json) => ServiceModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la recherche: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get featured services
  Future<List<ServiceModel>> getFeaturedServices() async {
    try {
      final response = await _apiClient.get('${ApiConstants.servicesEndpoint}/featured');
      
      final data = response.data as List<dynamic>;
      return data.map((json) => ServiceModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des services populaires: $e',
        type: ApiExceptionType.network,
      );
    }
  }
}