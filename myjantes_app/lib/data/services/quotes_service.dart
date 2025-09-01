import 'dart:io';
import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../models/quote_model.dart';

class QuotesService {
  final ApiClient _apiClient;

  QuotesService(this._apiClient);

  // Get user's quotes
  Future<List<QuoteModel>> getUserQuotes() async {
    try {
      final response = await _apiClient.get(ApiConstants.quotesEndpoint);
      
      final data = response.data as List<dynamic>;
      return data.map((json) => QuoteModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des devis: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get quote by ID
  Future<QuoteModel> getQuoteById(String quoteId) async {
    try {
      final response = await _apiClient.get('${ApiConstants.quotesEndpoint}/$quoteId');
      
      final data = response.data as Map<String, dynamic>;
      return QuoteModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement du devis: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Create quote request
  Future<QuoteModel> createQuoteRequest({
    required String serviceId,
    required String description,
    List<File>? photos,
  }) async {
    try {
      FormData formData = FormData.fromMap({
        'serviceId': serviceId,
        'description': description,
      });

      // Add photos if provided
      if (photos != null && photos.isNotEmpty) {
        for (int i = 0; i < photos.length; i++) {
          formData.files.add(MapEntry(
            'photos',
            await MultipartFile.fromFile(
              photos[i].path,
              filename: 'photo_$i.jpg',
            ),
          ));
        }
      }

      final response = await _apiClient.upload(
        ApiConstants.quotesEndpoint,
        formData,
      );

      final data = response.data as Map<String, dynamic>;
      return QuoteModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la création du devis: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Update quote status (approve/reject)
  Future<QuoteModel> updateQuoteStatus(String quoteId, String status) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.quotesEndpoint}/$quoteId/status',
        data: {'status': status},
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

  // Approve quote
  Future<QuoteModel> approveQuote(String quoteId) async {
    return updateQuoteStatus(quoteId, 'approved');
  }

  // Reject quote
  Future<QuoteModel> rejectQuote(String quoteId) async {
    return updateQuoteStatus(quoteId, 'rejected');
  }

  // Delete quote
  Future<void> deleteQuote(String quoteId) async {
    try {
      await _apiClient.delete('${ApiConstants.quotesEndpoint}/$quoteId');
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la suppression du devis: $e',
        type: ApiExceptionType.network,
      );
    }
  }
}