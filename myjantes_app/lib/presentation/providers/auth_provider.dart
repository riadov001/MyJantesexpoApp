import 'package:flutter/material.dart';
import '../../data/models/user_model.dart';
import '../../data/services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService;
  
  UserModel? _user;
  bool _isLoading = false;
  bool _isInitialized = false;

  AuthProvider(this._authService) {
    _initialize();
  }

  // Getters
  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  bool get isInitialized => _isInitialized;

  // Initialize auth state
  Future<void> _initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _authService.getCurrentUser();
    } catch (e) {
      print('Erreur initialisation auth: $e');
    } finally {
      _isLoading = false;
      _isInitialized = true;
      notifyListeners();
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _authService.login(email, password);
      _user = response.user;
      notifyListeners();
      return true;
    } catch (e) {
      print('Erreur login: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register
  Future<bool> register({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _authService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      _user = response.user;
      notifyListeners();
      return true;
    } catch (e) {
      print('Erreur inscription: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Refresh user data
  Future<void> refreshUser() async {
    if (!isAuthenticated) return;

    try {
      _user = await _authService.refreshUserData();
      notifyListeners();
    } catch (e) {
      print('Erreur refresh user: $e');
    }
  }

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.logout();
      _user = null;
    } catch (e) {
      print('Erreur logout: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear auth data
  Future<void> clearAuthData() async {
    try {
      await _authService.clearAuthData();
      _user = null;
      notifyListeners();
    } catch (e) {
      print('Erreur clear auth data: $e');
    }
  }
}