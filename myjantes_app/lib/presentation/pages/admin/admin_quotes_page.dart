import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/quote_model.dart';
import '../../../data/services/admin_service.dart';
import '../../../core/di/dependency_injection.dart';

class AdminQuotesPage extends StatefulWidget {
  const AdminQuotesPage({super.key});

  @override
  State<AdminQuotesPage> createState() => _AdminQuotesPageState();
}

class _AdminQuotesPageState extends State<AdminQuotesPage> {
  final AdminService _adminService = getIt<AdminService>();
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  
  List<QuoteModel> _quotes = [];
  bool _isLoading = false;
  bool _isProcessing = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMoreData = true;
  String? _selectedStatus;

  final List<String> _statuses = ['pending', 'sent', 'approved', 'rejected'];

  @override
  void initState() {
    super.initState();
    _loadQuotes();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _loadQuotes({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMoreData = true;
        _quotes.clear();
      });
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final quotes = await _adminService.getAllQuotes(
        page: _currentPage,
        status: _selectedStatus,
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
      );
      
      setState(() {
        if (refresh) {
          _quotes = quotes;
        } else {
          _quotes.addAll(quotes);
        }
        _hasMoreData = quotes.length >= 20;
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

  Future<void> _updateQuote(QuoteModel quote, {String? status, double? amount}) async {
    setState(() {
      _isProcessing = true;
    });

    try {
      final updatedQuote = await _adminService.updateQuote(
        quote.id,
        status: status,
        amount: amount,
      );
      
      setState(() {
        final index = _quotes.indexWhere((q) => q.id == quote.id);
        if (index != -1) {
          _quotes[index] = updatedQuote;
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              amount != null 
                  ? 'Devis mis à jour avec le montant ${amount.toStringAsFixed(2)}€'
                  : 'Devis ${_getStatusText(status!)}',
            ),
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

  void _showAmountDialog(QuoteModel quote) {
    _amountController.text = quote.amount?.toString() ?? '';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(AppConstants.surfaceColorValue),
        title: const Text('Définir le montant'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Entrez le montant pour le devis #${quote.id.substring(0, 8)}:'),
            const SizedBox(height: 16),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Montant (€)',
                prefixText: '€ ',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              final amount = double.tryParse(_amountController.text);
              if (amount != null && amount > 0) {
                Navigator.pop(context);
                _updateQuote(quote, status: 'sent', amount: amount);
              }
            },
            child: const Text('Envoyer'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Gestion Devis'),
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
                    hintText: 'Rechercher par client ou description...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        _loadQuotes(refresh: true);
                      },
                    ),
                  ),
                  onSubmitted: (_) => _loadQuotes(refresh: true),
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
        _loadQuotes(refresh: true);
      },
      selectedColor: const Color(AppConstants.primaryColorValue).withOpacity(0.2),
      checkmarkColor: const Color(AppConstants.primaryColorValue),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _quotes.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_error != null && _quotes.isEmpty) {
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
              onPressed: () => _loadQuotes(refresh: true),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (_quotes.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.description_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Aucun devis',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadQuotes(refresh: true),
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _quotes.length + (_hasMoreData ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _quotes.length) {
            return _buildLoadMoreButton();
          }

          final quote = _quotes[index];
          return _buildQuoteCard(quote);
        },
      ),
    );
  }

  Widget _buildQuoteCard(QuoteModel quote) {
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
                  'Devis #${quote.id.substring(0, 8)}',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                _buildStatusChip(quote.status),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Client info
            if (quote.user != null) ...[
              Row(
                children: [
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    quote.user!.displayName.isNotEmpty 
                        ? quote.user!.displayName 
                        : quote.user!.email,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            
            // Description
            Text(
              quote.description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            
            const SizedBox(height: 12),
            
            // Details row
            Row(
              children: [
                if (quote.amount != null) ...[
                  Icon(
                    Icons.euro,
                    size: 16,
                    color: Colors.green[400],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    quote.formattedAmount!,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Colors.green[400],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 16),
                ],
                
                if (quote.photoCount > 0) ...[
                  Icon(
                    Icons.photo_library,
                    size: 16,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${quote.photoCount} photo${quote.photoCount > 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                  ),
                ],
                
                const Spacer(),
                
                Text(
                  _formatDate(quote.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Actions
            if (quote.status == 'pending') ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing 
                          ? null 
                          : () => _showAmountDialog(quote),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Chiffrer & Envoyer'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing 
                          ? null 
                          : () => _updateQuote(quote, status: 'rejected'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Rejeter'),
                    ),
                  ),
                ],
              ),
            ],
            
            if (quote.status == 'sent') ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info, color: Colors.blue[600], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Devis envoyé au client. En attente de sa réponse.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.blue[600],
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

  Widget _buildStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status) {
      case 'pending':
        backgroundColor = Colors.orange[100]!;
        textColor = Colors.orange[800]!;
        break;
      case 'sent':
        backgroundColor = Colors.blue[100]!;
        textColor = Colors.blue[800]!;
        break;
      case 'approved':
        backgroundColor = Colors.green[100]!;
        textColor = Colors.green[800]!;
        break;
      case 'rejected':
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
        onPressed: () => _loadQuotes(),
        child: const Text('Charger plus'),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'sent':
        return 'Envoyé';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${date.day}/${date.month}/${date.year}';
    } else if (difference.inDays > 0) {
      return 'il y a ${difference.inDays}j';
    } else if (difference.inHours > 0) {
      return 'il y a ${difference.inHours}h';
    } else {
      return 'il y a ${difference.inMinutes}min';
    }
  }
}