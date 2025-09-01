import '../../core/network/api_client.dart';
import '../../core/storage/secure_storage_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_constants.dart';
import '../models/user_model.dart';

class AuthService {
  final ApiClient _apiClient;

  AuthService(this._apiClient);

  // Login
  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String;
      final userData = data['user'] as Map<String, dynamic>;
      
      final user = UserModel.fromJson(userData);

      // Store token and user data securely
      await SecureStorageService.storeString(AppConstants.authTokenKey, token);
      await SecureStorageService.storeJson(AppConstants.userDataKey, userData);

      return AuthResponse(user: user, token: token);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la connexion: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Register
  Future<AuthResponse> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.registerEndpoint,
        data: {
          'email': email,
          'password': password,
          'name': name,
          'phone': phone,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] as String;
      final userData = data['user'] as Map<String, dynamic>;
      
      final user = UserModel.fromJson(userData);

      // Store token and user data securely
      await SecureStorageService.storeString(AppConstants.authTokenKey, token);
      await SecureStorageService.storeJson(AppConstants.userDataKey, userData);

      return AuthResponse(user: user, token: token);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de l\'inscription: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Get current user
  Future<UserModel?> getCurrentUser() async {
    try {
      final userData = await SecureStorageService.getJson(AppConstants.userDataKey);
      if (userData == null) return null;
      
      return UserModel.fromJson(userData);
    } catch (e) {
      return null;
    }
  }

  // Get current token
  Future<String?> getToken() async {
    try {
      return await SecureStorageService.getString(AppConstants.authTokenKey);
    } catch (e) {
      return null;
    }
  }

  // Check if user is authenticated
  Future<bool> isAuthenticated() async {
    try {
      final token = await getToken();
      return token != null;
    } catch (e) {
      return false;
    }
  }

  // Check if user is admin
  Future<bool> isAdmin() async {
    try {
      final user = await getCurrentUser();
      return user?.isAdmin ?? false;
    } catch (e) {
      return false;
    }
  }

  // Refresh user data
  Future<UserModel> refreshUserData() async {
    try {
      final response = await _apiClient.get(ApiConstants.userEndpoint);
      
      final userData = response.data as Map<String, dynamic>;
      final user = UserModel.fromJson(userData);

      // Update stored user data
      await SecureStorageService.storeJson(AppConstants.userDataKey, userData);

      return user;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Erreur lors de la mise à jour: $e',
        type: ApiExceptionType.network,
      );
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      // Clear stored data
      await SecureStorageService.delete(AppConstants.authTokenKey);
      await SecureStorageService.delete(AppConstants.userDataKey);
    } catch (e) {
      // Continue logout even if storage deletion fails
      print('Erreur lors de la déconnexion: $e');
    }
  }

  // Clear all auth data
  Future<void> clearAuthData() async {
    try {
      await logout();
    } catch (e) {
      print('Erreur lors de la suppression des données: $e');
    }
  }
}

class AuthResponse {
  final UserModel user;
  final String token;

  AuthResponse({
    required this.user,
    required this.token,
  });

  @override
  String toString() {
    return 'AuthResponse{user: ${user.email}, token: ${token.substring(0, 10)}...}';
  }
}