class ApiConstants {
  // Base URL - À adapter selon l'environnement
  static const String baseUrl = 'https://5000-workspace.replit.dev';
  
  // Auth endpoints
  static const String loginEndpoint = '/api/auth/login';
  static const String registerEndpoint = '/api/auth/register';
  
  // User endpoints
  static const String userEndpoint = '/api/user';
  
  // Services endpoints
  static const String servicesEndpoint = '/api/services';
  
  // Bookings endpoints
  static const String bookingsEndpoint = '/api/bookings';
  
  // Quotes endpoints  
  static const String quotesEndpoint = '/api/quotes';
  
  // Invoices endpoints
  static const String invoicesEndpoint = '/api/invoices';
  
  // History endpoint
  static const String historyEndpoint = '/api/history';
  
  // Notifications endpoints
  static const String notificationsEndpoint = '/api/notifications';
  static const String notificationsUnreadCountEndpoint = '/api/notifications/unread-count';
  
  // Work progress endpoints
  static const String workProgressEndpoint = '/api/work-progress';
  
  // Admin endpoints
  static const String adminDashboardEndpoint = '/api/admin/dashboard';
  static const String adminBookingsEndpoint = '/api/admin/bookings';
  static const String adminQuotesEndpoint = '/api/admin/quotes';
  static const String adminInvoicesEndpoint = '/api/admin/invoices';
  
  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}