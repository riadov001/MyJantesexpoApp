import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/invoice_model.dart';
import '../../../data/services/invoices_service.dart';
import '../../../core/di/dependency_injection.dart';
import 'invoice_detail_page.dart';

class InvoicesPage extends StatefulWidget {
  const InvoicesPage({super.key});

  @override
  State<InvoicesPage> createState() => _InvoicesPageState();
}

class _InvoicesPageState extends State<InvoicesPage> {
  final InvoicesService _invoicesService = getIt<InvoicesService>();
  List<InvoiceModel> _invoices = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final invoices = await _invoicesService.getUserInvoices();
      setState(() {
        _invoices = invoices;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Mes Factures'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInvoices,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: Color(AppConstants.primaryColorValue),
        ),
      );
    }

    if (_error != null) {
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
              onPressed: _loadInvoices,
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
            const SizedBox(height: 8),
            Text(
              'Vos factures apparaîtront ici\\naprès validation de vos devis.',
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
      onRefresh: _loadInvoices,
      color: const Color(AppConstants.primaryColorValue),
      child: Column(
        children: [
          // Summary card
          Container(
            margin: const EdgeInsets.all(AppConstants.defaultPadding),
            child: _buildSummaryCard(),
          ),
          
          // Invoices list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: AppConstants.defaultPadding),
              itemCount: _invoices.length,
              itemBuilder: (context, index) {
                final invoice = _invoices[index];
                return _buildInvoiceCard(invoice);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    final totalAmount = _invoices.fold<double>(0, (sum, invoice) => sum + invoice.amount);
    final paidAmount = _invoices
        .where((invoice) => invoice.isPaid)
        .fold<double>(0, (sum, invoice) => sum + invoice.amount);
    final pendingAmount = totalAmount - paidAmount;
    final overdueCount = _invoices.where((invoice) => invoice.isOverdueNow).length;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Résumé',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem(
                    'Total',
                    '${totalAmount.toStringAsFixed(2)}€',
                    Colors.blue[400]!,
                  ),
                ),
                Expanded(
                  child: _buildSummaryItem(
                    'Payé',
                    '${paidAmount.toStringAsFixed(2)}€',
                    Colors.green[400]!,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem(
                    'En attente',
                    '${pendingAmount.toStringAsFixed(2)}€',
                    Colors.orange[400]!,
                  ),
                ),
                Expanded(
                  child: _buildSummaryItem(
                    'En retard',
                    '$overdueCount facture${overdueCount > 1 ? 's' : ''}',
                    Colors.red[400]!,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildInvoiceCard(InvoiceModel invoice) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      child: InkWell(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => InvoiceDetailPage(invoiceId: invoice.id),
            ),
          );
          if (result == true) {
            _loadInvoices();
          }
        },
        borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Facture #${invoice.id.substring(0, 8)}',
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  _buildStatusChip(invoice.status, invoice.isOverdueNow),
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
              
              // Due date info
              if (invoice.dueDate != null && !invoice.isPaid) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      invoice.isOverdueNow ? Icons.warning : Icons.schedule,
                      size: 16,
                      color: invoice.isOverdueNow ? Colors.red[400] : Colors.orange[400],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      invoice.isOverdueNow
                          ? 'En retard depuis ${(-invoice.daysUntilDue).abs()} jour${(-invoice.daysUntilDue).abs() > 1 ? 's' : ''}'
                          : 'Échéance dans ${invoice.daysUntilDue} jour${invoice.daysUntilDue > 1 ? 's' : ''}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: invoice.isOverdueNow ? Colors.red[400] : Colors.orange[400],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
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