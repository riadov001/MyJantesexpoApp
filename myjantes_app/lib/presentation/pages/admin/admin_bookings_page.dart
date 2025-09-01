import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/booking_model.dart';
import '../../../data/services/admin_service.dart';
import '../../../core/di/dependency_injection.dart';

class AdminBookingsPage extends StatefulWidget {
  const AdminBookingsPage({super.key});

  @override
  State<AdminBookingsPage> createState() => _AdminBookingsPageState();
}

class _AdminBookingsPageState extends State<AdminBookingsPage> {
  final AdminService _adminService = getIt<AdminService>();
  final TextEditingController _searchController = TextEditingController();
  
  List<BookingModel> _bookings = [];
  bool _isLoading = false;
  bool _isProcessing = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMoreData = true;
  String? _selectedStatus;

  final List<String> _statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadBookings({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMoreData = true;
        _bookings.clear();
      });
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final bookings = await _adminService.getAllBookings(
        page: _currentPage,
        status: _selectedStatus,
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
      );
      
      setState(() {
        if (refresh) {
          _bookings = bookings;
        } else {
          _bookings.addAll(bookings);
        }
        _hasMoreData = bookings.length >= 20;
        _currentPage++;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateBookingStatus(BookingModel booking, String newStatus) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final updatedBooking = await _adminService.updateBookingStatus(booking.id, newStatus);
      
      setState(() {
        final index = _bookings.indexWhere((b) => b.id == booking.id);
        if (index != -1) {
          _bookings[index] = updatedBooking;
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Réservation ${_getStatusText(newStatus)}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Gestion Réservations'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(120),
          child: Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Rechercher par client ou service...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _loadBookings(refresh: true);
                      },
                    ),
                  ),
                  onSubmitted: (_) => _loadBookings(refresh: true),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('Tous', null),
                      const SizedBox(width: 8),
                      ..._statuses.map((status) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _buildFilterChip(_getStatusText(status), status),
                      )),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildFilterChip(String label, String? status) {
    final isSelected = _selectedStatus == status;
    
    return FilterChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (selected) {
        setState(() {
          _selectedStatus = selected ? status : null;
        });
        _loadBookings(refresh: true);
      },
      selectedColor: const Color(AppConstants.primaryColorValue).withOpacity(0.2),
      checkmarkColor: const Color(AppConstants.primaryColorValue),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _bookings.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_error != null && _bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Erreur',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadBookings(refresh: true),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (_bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Aucune réservation',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadBookings(refresh: true),
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _bookings.length + (_hasMoreData ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _bookings.length) {
            return _buildLoadMoreButton();
          }

          final booking = _bookings[index];
          return _buildBookingCard(booking);
        },
      ),
    );
  }

  Widget _buildBookingCard(BookingModel booking) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Réservation #${booking.id.substring(0, 8)}',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                _buildStatusChip(booking.status),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Client info
            if (booking.user != null) ...[
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    booking.user!.displayName.isNotEmpty 
                        ? booking.user!.displayName 
                        : booking.user!.email,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            
            // Service info
            Row(
              children: [
                const Icon(Icons.build, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    booking.serviceName ?? 'Service non défini',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Date and time
            Row(
              children: [
                const Icon(Icons.schedule, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  '${_formatDate(booking.date)} à ${booking.timeSlot}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Vehicle info
            if (booking.vehicleInfo.isNotEmpty) ...[
              Row(
                children: [
                  const Icon(Icons.directions_car, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      booking.vehicleInfo,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            
            // Notes
            if (booking.notes != null && booking.notes!.isNotEmpty) ...[
              Text(
                'Notes: ${booking.notes}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 12),
            ] else ...[
              const SizedBox(height: 12),
            ],
            
            // Actions
            if (booking.status != 'completed' && booking.status != 'cancelled') ...[
              Row(
                children: [
                  if (booking.status == 'pending') ...[
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isProcessing 
                            ? null 
                            : () => _updateBookingStatus(booking, 'confirmed'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Confirmer'),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  
                  if (booking.status == 'confirmed') ...[
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isProcessing 
                            ? null 
                            : () => _updateBookingStatus(booking, 'completed'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Terminer'),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing 
                          ? null 
                          : () => _updateBookingStatus(booking, 'cancelled'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Annuler'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status) {
      case 'pending':
        backgroundColor = Colors.orange[100]!;
        textColor = Colors.orange[800]!;
        break;
      case 'confirmed':
        backgroundColor = Colors.blue[100]!;
        textColor = Colors.blue[800]!;
        break;
      case 'completed':
        backgroundColor = Colors.green[100]!;
        textColor = Colors.green[800]!;
        break;
      case 'cancelled':
        backgroundColor = Colors.red[100]!;
        textColor = Colors.red[800]!;
        break;
      default:
        backgroundColor = Colors.grey[200]!;
        textColor = Colors.grey[800]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        _getStatusText(status),
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildLoadMoreButton() {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: CircularProgressIndicator(
            color: Color(AppConstants.primaryColorValue),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: ElevatedButton(
        onPressed: () => _loadBookings(),
        child: const Text('Charger plus'),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/'
           '${date.month.toString().padLeft(2, '0')}/'
           '${date.year}';
  }
}