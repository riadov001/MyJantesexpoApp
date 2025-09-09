import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/quote_model.dart';
import '../../data/models/invoice_model.dart';
import '../../data/services/quotes_service.dart';
import '../../data/services/invoices_service.dart';
import '../../core/di/dependency_injection.dart';
import 'quotes/quote_detail_page.dart';
import 'invoices/invoice_detail_page.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> with TickerProviderStateMixin {
  final QuotesService _quotesService = getIt<QuotesService>();
  final InvoicesService _invoicesService = getIt<InvoicesService>();
  
  late TabController _tabController;
  
  List<QuoteModel> _quotes = [];
  List<InvoiceModel> _invoices = [];
  bool _isLoadingQuotes = false;
  bool _isLoadingInvoices = false;
  String? _quotesError;
  String? _invoicesError;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadQuotes(),
      _loadInvoices(),
    ]);
  }

  Future<void> _loadQuotes() async {
    setState(() {
      _isLoadingQuotes = true;
      _quotesError = null;
    });

    try {
      final quotes = await _quotesService.getUserQuotes();
      setState(() {
        _quotes = quotes;
      });
    } catch (e) {
      setState(() {
        _quotesError = e.toString();
      });
    } finally {
      setState(() {
        _isLoadingQuotes = false;
      });
    }
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoadingInvoices = true;
      _invoicesError = null;
    });

    try {
      final invoices = await _invoicesService.getUserInvoices();
      setState(() {
        _invoices = invoices;
      });
    } catch (e) {
      setState(() {
        _invoicesError = e.toString();
      });
    } finally {
      setState(() {
        _isLoadingInvoices = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Historique'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(AppConstants.primaryColorValue),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(AppConstants.primaryColorValue),
          tabs: const [
            Tab(text: 'Tout'),
            Tab(text: 'Devis'),
            Tab(text: 'Factures'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAllTab(),
          _buildQuotesTab(),
          _buildInvoicesTab(),
        ],
      ),
    );
  }

  Widget _buildAllTab() {
    // Combine quotes and invoices with timeline
    final List<TimelineItem> timelineItems = [];
    
    // Add quotes
    for (final quote in _quotes) {
      timelineItems.add(TimelineItem(
        date: quote.createdAt,
        type: 'quote',
        title: 'Devis #${quote.id.substring(0, 8)}',
        subtitle: quote.description,
        status: quote.statusText,
        amount: quote.formattedAmount,
        data: quote,
      ));
    }
    
    // Add invoices
    for (final invoice in _invoices) {
      timelineItems.add(TimelineItem(
        date: invoice.createdAt,
        type: 'invoice',
        title: 'Facture #${invoice.id.substring(0, 8)}',
        subtitle: 'Montant: ${invoice.formattedAmount}',
        status: invoice.statusText,
        amount: invoice.formattedAmount,
        data: invoice,
      ));
    }
    
    // Sort by date (most recent first)
    timelineItems.sort((a, b) => b.date.compareTo(a.date));

    if (_isLoadingQuotes || _isLoadingInvoices) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (timelineItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Aucun historique',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Vos devis et factures\\napparaîtront ici.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: timelineItems.length,
        itemBuilder: (context, index) {
          final item = timelineItems[index];
          return _buildTimelineCard(item);
        },
      ),
    );
  }

  Widget _buildQuotesTab() {
    if (_isLoadingQuotes) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_quotesError != null) {
      return _buildErrorWidget(_quotesError!, _loadQuotes);
    }

    if (_quotes.isEmpty) {
      return _buildEmptyWidget(
        Icons.description_outlined,
        'Aucun devis',
        'Vos devis apparaîtront ici.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadQuotes,
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _quotes.length,
        itemBuilder: (context, index) {
          final quote = _quotes[index];
          return _buildQuoteCard(quote);
        },
      ),
    );
  }

  Widget _buildInvoicesTab() {
    if (_isLoadingInvoices) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_invoicesError != null) {
      return _buildErrorWidget(_invoicesError!, _loadInvoices);
    }

    if (_invoices.isEmpty) {
      return _buildEmptyWidget(
        Icons.receipt_long_outlined,
        'Aucune facture',
        'Vos factures apparaîtront ici.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInvoices,
      color: const Color(AppConstants.primaryColorValue),
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        itemCount: _invoices.length,
        itemBuilder: (context, index) {
          final invoice = _invoices[index];
          return _buildInvoiceCard(invoice);
        },
      ),
    );
  }

  Widget _buildTimelineCard(TimelineItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      child: InkWell(
        onTap: () => _navigateToDetail(item),
        borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Row(
            children: [
              // Type icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: item.type == 'quote' 
                      ? Colors.blue[100] 
                      : Colors.green[100],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  item.type == 'quote' ? Icons.description : Icons.receipt_long,
                  color: item.type == 'quote' 
                      ? Colors.blue[600] 
                      : Colors.green[600],
                ),
              ),
              
              const SizedBox(width: 12),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item.title,
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                        Text(
                          _formatDate(item.date),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.subtitle,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatusChip(item.status, item.type),
                        if (item.amount != null)
                          Text(
                            item.amount!,
                            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: const Color(AppConstants.primaryColorValue),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuoteCard(QuoteModel quote) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => QuoteDetailPage(quoteId: quote.id),
          ),
        ),
        borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Devis #${quote.id.substring(0, 8)}',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  Text(
                    _formatDate(quote.createdAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                quote.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatusChip(quote.statusText, 'quote'),
                  if (quote.amount != null)
                    Text(
                      quote.formattedAmount!,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Colors.green[400],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInvoiceCard(InvoiceModel invoice) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => InvoiceDetailPage(invoiceId: invoice.id),
          ),
        ),
        borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Facture #${invoice.id.substring(0, 8)}',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  Text(
                    _formatDate(invoice.createdAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatusChip(invoice.statusText, 'invoice'),
                  Text(
                    invoice.formattedAmount,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: invoice.isPaid 
                          ? Colors.green[400] 
                          : const Color(AppConstants.primaryColorValue),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorWidget(String error, VoidCallback onRetry) {
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
            error,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onRetry,
            child: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyWidget(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status, String type) {
    Color backgroundColor;
    Color textColor;
    
    if (type == 'quote') {
      switch (status) {
        case 'En attente':
          backgroundColor = Colors.orange[100]!;
          textColor = Colors.orange[800]!;
          break;
        case 'Envoyé':
          backgroundColor = Colors.blue[100]!;
          textColor = Colors.blue[800]!;
          break;
        case 'Approuvé':
          backgroundColor = Colors.green[100]!;
          textColor = Colors.green[800]!;
          break;
        case 'Rejeté':
          backgroundColor = Colors.red[100]!;
          textColor = Colors.red[800]!;
          break;
        default:
          backgroundColor = Colors.grey[200]!;
          textColor = Colors.grey[800]!;
      }
    } else {
      switch (status) {
        case 'En attente':
          backgroundColor = Colors.orange[100]!;
          textColor = Colors.orange[800]!;
          break;
        case 'Payée':
          backgroundColor = Colors.green[100]!;
          textColor = Colors.green[800]!;
          break;
        case 'En retard':
          backgroundColor = Colors.red[100]!;
          textColor = Colors.red[800]!;
          break;
        default:
          backgroundColor = Colors.grey[200]!;
          textColor = Colors.grey[800]!;
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  void _navigateToDetail(TimelineItem item) {
    if (item.type == 'quote' && item.data is QuoteModel) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => QuoteDetailPage(quoteId: (item.data as QuoteModel).id),
        ),
      );
    } else if (item.type == 'invoice' && item.data is InvoiceModel) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => InvoiceDetailPage(invoiceId: (item.data as InvoiceModel).id),
        ),
      );
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

class TimelineItem {
  final DateTime date;
  final String type;
  final String title;
  final String subtitle;
  final String status;
  final String? amount;
  final dynamic data;

  TimelineItem({
    required this.date,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.status,
    this.amount,
    this.data,
  });
}