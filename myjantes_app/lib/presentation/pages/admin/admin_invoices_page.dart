import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/invoice_model.dart';
import '../../../data/services/admin_service.dart';
import '../../../core/di/dependency_injection.dart';

class AdminInvoicesPage extends StatefulWidget {
  const AdminInvoicesPage({super.key});

  @override
  State<AdminInvoicesPage> createState() => _AdminInvoicesPageState();
}

class _AdminInvoicesPageState extends State<AdminInvoicesPage> {
  final AdminService _adminService = getIt<AdminService>();
  final TextEditingController _searchController = TextEditingController();
  
  List<InvoiceModel> _invoices = [];
  bool _isLoading = false;
  bool _isProcessing = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMoreData = true;
  String? _selectedStatus;

  final List<String> _statuses = ['pending', 'paid', 'overdue', 'cancelled'];

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInvoices({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMoreData = true;
        _invoices.clear();
      });
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final invoices = await _adminService.getAllInvoices(
        page: _currentPage,
        status: _selectedStatus,
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
      );
      
      setState(() {
        if (refresh) {
          _invoices = invoices;
        } else {
          _invoices.addAll(invoices);
        }
        _hasMoreData = invoices.length >= 20;
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

  Future<void> _updateInvoiceStatus(InvoiceModel invoice, String newStatus) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final updatedInvoice = await _adminService.updateInvoiceStatus(invoice.id, newStatus);
      
      setState(() {
        final index = _invoices.indexWhere((i) => i.id == invoice.id);
        if (index != -1) {
          _invoices[index] = updatedInvoice;
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Facture ${_getStatusText(newStatus)}'),
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

  Future<void> _createInvoiceFromQuote(String quoteId) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final invoice = await _adminService.createInvoiceFromQuote(quoteId);
      
      setState(() {
        _invoices.insert(0, invoice);
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Facture créée avec succès'),
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
        title: const Text('Gestion Factures'),
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
                    hintText: 'Rechercher par client ou montant...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _loadInvoices(refresh: true);
                      },
                    ),
                  ),
                  onSubmitted: (_) => _loadInvoices(refresh: true),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('Toutes', null),
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
        _loadInvoices(refresh: true);
      },
      selectedColor: const Color(AppConstants.primaryColorValue).withOpacity(0.2),
      checkmarkColor: const Color(AppConstants.primaryColorValue),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _invoices.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_error != null && _invoices.isEmpty) {
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
              onPressed: () => _loadInvoices(refresh: true),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (_invoices.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Aucune facture',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadInvoices(refresh: true),
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _invoices.length + (_hasMoreData ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _invoices.length) {
            return _buildLoadMoreButton();
          }

          final invoice = _invoices[index];
          return _buildInvoiceCard(invoice);
        },
      ),
    );
  }

  Widget _buildInvoiceCard(InvoiceModel invoice) {
    final isOverdue = invoice.isOverdueNow;
    
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
                  'Facture #${invoice.id.substring(0, 8)}',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                _buildStatusChip(invoice.status, isOverdue),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Amount
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  invoice.formattedAmount,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: invoice.isPaid 
                        ? Colors.green[400] 
                        : const Color(AppConstants.primaryColorValue),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _formatDate(invoice.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Quote reference
            Row(
              children: [
                const Icon(Icons.description, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Devis #${invoice.quoteId.substring(0, 8)}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            
            // Due date info
            if (invoice.dueDate != null && !invoice.isPaid) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    isOverdue ? Icons.warning : Icons.schedule,
                    size: 16,
                    color: isOverdue ? Colors.red[400] : Colors.orange[400],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isOverdue
                        ? 'En retard depuis ${(-invoice.daysUntilDue).abs()} jour${(-invoice.daysUntilDue).abs() > 1 ? 's' : ''}'
                        : 'Échéance dans ${invoice.daysUntilDue} jour${invoice.daysUntilDue > 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: isOverdue ? Colors.red[400] : Colors.orange[400],
                    ),
                  ),
                ],
              ),
            ],
            
            const SizedBox(height: 16),
            
            // Actions
            if (!invoice.isPaid && !invoice.isCancelled) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing 
                          ? null 
                          : () => _updateInvoiceStatus(invoice, 'paid'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Marquer payée'),
                    ),
                  ),
                  
                  const SizedBox(width: 8),
                  
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing 
                          ? null 
                          : () => _updateInvoiceStatus(invoice, 'cancelled'),
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
            
            if (isOverdue) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.red[600], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Cette facture est en retard. Contactez le client.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.red[600],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status, bool isOverdue) {
    Color backgroundColor;
    Color textColor;
    String text;
    
    if (isOverdue) {
      backgroundColor = Colors.red[100]!;
      textColor = Colors.red[800]!;
      text = 'En retard';
    } else {
      switch (status) {
        case 'pending':
          backgroundColor = Colors.orange[100]!;
          textColor = Colors.orange[800]!;
          text = 'En attente';
          break;
        case 'paid':
          backgroundColor = Colors.green[100]!;
          textColor = Colors.green[800]!;
          text = 'Payée';
          break;
        case 'overdue':
          backgroundColor = Colors.red[100]!;
          textColor = Colors.red[800]!;
          text = 'En retard';
          break;
        case 'cancelled':
          backgroundColor = Colors.grey[200]!;
          textColor = Colors.grey[800]!;
          text = 'Annulée';
          break;
        default:
          backgroundColor = Colors.grey[200]!;
          textColor = Colors.grey[800]!;
          text = status;
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
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
        onPressed: () => _loadInvoices(),
        child: const Text('Charger plus'),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'paid':
        return 'Payée';
      case 'overdue':
        return 'En retard';
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