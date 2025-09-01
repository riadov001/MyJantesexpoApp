class AppConstants {
  // App Info
  static const String appName = 'MyJantes';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String authTokenKey = 'auth_token';
  static const String userDataKey = 'user_data';
  static const String themeKey = 'theme_mode';
  
  // Colors (MyJantes theme)
  static const int primaryColorValue = 0xFFD32F2F;
  static const int backgroundColorValue = 0xFF000000;
  static const int surfaceColorValue = 0xFF1A1A1A;
  static const int onSurfaceColorValue = 0xFFFFFFFF;
  
  // Dimensions
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  
  static const double defaultRadius = 12.0;
  static const double smallRadius = 8.0;
  static const double largeRadius = 16.0;
  
  // Animation Durations
  static const int defaultAnimationDuration = 300;
  static const int shortAnimationDuration = 150;
  static const int longAnimationDuration = 500;
  
  // Network
  static const int connectionTimeout = 30000;
  static const int receiveTimeout = 30000;
  
  // Pagination
  static const int defaultPageSize = 20;
  
  // Image
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const double imageQuality = 0.8;
}