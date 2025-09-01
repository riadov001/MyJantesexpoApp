import 'package:get_it/get_it.dart';
import '../network/api_client.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/services_service.dart';
import '../../data/services/bookings_service.dart';
import '../../data/services/quotes_service.dart';
import '../../data/services/invoices_service.dart';
import '../../data/services/admin_service.dart';
import '../../data/services/notifications_service.dart';
import '../../presentation/providers/auth_provider.dart';

final GetIt getIt = GetIt.instance;

Future<void> setupDependencyInjection() async {
  // Core services
  getIt.registerLazySingleton<ApiClient>(() => ApiClient());
  
  // Data services
  getIt.registerLazySingleton<AuthService>(() => AuthService(getIt<ApiClient>()));
  getIt.registerLazySingleton<ServicesService>(() => ServicesService(getIt<ApiClient>()));
  getIt.registerLazySingleton<BookingsService>(() => BookingsService(getIt<ApiClient>()));
  getIt.registerLazySingleton<QuotesService>(() => QuotesService(getIt<ApiClient>()));
  getIt.registerLazySingleton<InvoicesService>(() => InvoicesService(getIt<ApiClient>()));
  getIt.registerLazySingleton<AdminService>(() => AdminService(getIt<ApiClient>()));
  getIt.registerLazySingleton<NotificationsService>(() => NotificationsService(getIt<ApiClient>()));
  
  // Providers
  getIt.registerFactory<AuthProvider>(() => AuthProvider(getIt<AuthService>()));
}