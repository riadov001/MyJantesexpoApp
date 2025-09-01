import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../constants/app_constants.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(milliseconds: AppConstants.connectionTimeout),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
      headers: ApiConstants.defaultHeaders,
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request interceptor pour ajouter le token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: AppConstants.authTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // Gestion des erreurs 401 (token expiré)
        if (error.response?.statusCode == 401) {
          await _storage.delete(key: AppConstants.authTokenKey);
          await _storage.delete(key: AppConstants.userDataKey);
        }
        handler.next(error);
      },
    ));

    // Logging interceptor (uniquement en debug)
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print(obj),
    ));
  }

  // GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Upload file
  Future<Response<T>> upload<T>(
    String path,
    FormData formData, {
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: formData,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: 'Délai de connexion dépassé',
          type: ApiExceptionType.timeout,
        );
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['message'] ?? 'Erreur serveur';
        
        if (statusCode == 401) {
          return ApiException(
            message: 'Non autorisé',
            type: ApiExceptionType.unauthorized,
            statusCode: statusCode,
          );
        } else if (statusCode == 404) {
          return ApiException(
            message: 'Ressource non trouvée',
            type: ApiExceptionType.notFound,
            statusCode: statusCode,
          );
        } else if (statusCode! >= 500) {
          return ApiException(
            message: 'Erreur serveur',
            type: ApiExceptionType.server,
            statusCode: statusCode,
          );
        } else {
          return ApiException(
            message: message,
            type: ApiExceptionType.badRequest,
            statusCode: statusCode,
          );
        }
      case DioExceptionType.cancel:
        return ApiException(
          message: 'Requête annulée',
          type: ApiExceptionType.cancel,
        );
      default:
        return ApiException(
          message: 'Erreur de connexion',
          type: ApiExceptionType.network,
        );
    }
  }
}

class ApiException implements Exception {
  final String message;
  final ApiExceptionType type;
  final int? statusCode;

  ApiException({
    required this.message,
    required this.type,
    this.statusCode,
  });

  @override
  String toString() => message;
}

enum ApiExceptionType {
  network,
  timeout,
  unauthorized,
  notFound,
  badRequest,
  server,
  cancel,
}