import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../models/invoice_model.dart';

class InvoicesService {
  final ApiClient _apiClient;

  InvoicesService(this._apiClient);

  // Get user's invoices
  Future<List<InvoiceModel>> getUserInvoices() async {
    try {
      final response = await _apiClient.get(ApiConstants.invoicesEndpoint);
      
      final data = response.data as List<dynamic>;
      return data.map((json) => InvoiceModel.fromJson(json as Map<String, dynamic>)).toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement des factures: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get invoice by ID
  Future<InvoiceModel> getInvoiceById(String invoiceId) async {
    try {
      final response = await _apiClient.get('${ApiConstants.invoicesEndpoint}/$invoiceId');
      
      final data = response.data as Map<String, dynamic>;
      return InvoiceModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du chargement de la facture: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Mark invoice as paid
  Future<InvoiceModel> markAsPaid(String invoiceId) async {
    try {
      final response = await _apiClient.put(
        '${ApiConstants.invoicesEndpoint}/$invoiceId/pay',
        data: {'status': 'paid'},
      );

      final data = response.data as Map<String, dynamic>;
      return InvoiceModel.fromJson(data);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du paiement: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Download invoice PDF
  Future<String> downloadInvoicePdf(String invoiceId) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.invoicesEndpoint}/$invoiceId/pdf',
      );

      return response.data as String; // URL or base64 string
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors du téléchargement: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get invoice statistics
  Future<Map<String, dynamic>> getInvoiceStats() async {
    try {
      final response = await _apiClient.get('${ApiConstants.invoicesEndpoint}/stats');
      
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
}