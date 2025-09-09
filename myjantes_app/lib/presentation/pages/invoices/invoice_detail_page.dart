import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/invoice_model.dart';
import '../../../data/services/invoices_service.dart';
import '../../../core/di/dependency_injection.dart';

class InvoiceDetailPage extends StatefulWidget {
  final String invoiceId;

  const InvoiceDetailPage({
    super.key,
    required this.invoiceId,
  });

  @override
  State<InvoiceDetailPage> createState() => _InvoiceDetailPageState();
}

class _InvoiceDetailPageState extends State<InvoiceDetailPage> {
  final InvoicesService _invoicesService = getIt<InvoicesService>();
  InvoiceModel? _invoice;
  bool _isLoading = false;
  bool _isProcessing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInvoice();
  }

  Future<void> _loadInvoice() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final invoice = await _invoicesService.getInvoiceById(widget.invoiceId);
      setState(() {
        _invoice = invoice;
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

  Future<void> _downloadPdf() async {
    if (_invoice == null || _invoice!.pdfUrl == null) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final url = await _invoicesService.downloadInvoicePdf(_invoice!.id);
      
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      } else {
        throw Exception('Impossible d\\'ouvrir le PDF');
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

  Future<void> _markAsPaid() async {
    if (_invoice == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(AppConstants.surfaceColorValue),
        title: const Text('Marquer comme payée'),
        content: const Text(
          'Confirmez-vous que cette facture a été payée ?\\n'
          'Cette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              
              setState(() {
                _isProcessing = true;
              });

              try {
                final updatedInvoice = await _invoicesService.markAsPaid(_invoice!.id);
                setState(() {
                  _invoice = updatedInvoice;
                });

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Facture marquée comme payée'),
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
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
            child: const Text('Confirmer'),
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
        title: Text(_invoice != null 
            ? 'Facture #${_invoice!.id.substring(0, 8)}' 
            : 'Détail de la facture'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
        actions: [
          if (_invoice != null && _invoice!.pdfUrl != null)
            IconButton(
              icon: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(Icons.download),
              onPressed: _isProcessing ? null : _downloadPdf,
              tooltip: 'Télécharger PDF',
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
              onPressed: _loadInvoice,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    if (_invoice == null) {
      return const Center(child: Text('Facture introuvable'));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatusCard(),
          const SizedBox(height: 16),
          _buildDetailsCard(),
          const SizedBox(height: 16),
          _buildAmountCard(),
          if (!_invoice!.isPaid) ...[
            const SizedBox(height: 24),
            _buildActionCard(),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    final isOverdue = _invoice!.isOverdueNow;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Statut',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                _buildStatusChip(_invoice!.status, isOverdue),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Émise le ${_formatDate(_invoice!.createdAt)}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
            if (_invoice!.dueDate != null) ...[
              const SizedBox(height: 4),
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
                        ? 'En retard depuis ${(-_invoice!.daysUntilDue).abs()} jour${(-_invoice!.daysUntilDue).abs() > 1 ? 's' : ''}'
                        : 'Échéance: ${_formatDate(_invoice!.dueDate!)} (dans ${_invoice!.daysUntilDue} jour${_invoice!.daysUntilDue > 1 ? 's' : ''})',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: isOverdue ? Colors.red[400] : Colors.orange[400],
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

  Widget _buildDetailsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Détails',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 12),
            _buildDetailRow('ID Facture', _invoice!.id),
            _buildDetailRow('ID Devis', _invoice!.quoteId),
            if (_invoice!.pdfUrl != null)
              _buildDetailRow('PDF', 'Disponible au téléchargement'),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmountCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Montant',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                _invoice!.formattedAmount,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  color: _invoice!.isPaid 
                      ? Colors.green[400] 
                      : const Color(AppConstants.primaryColorValue),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Actions',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 16),
            
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isProcessing ? null : _markAsPaid,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
                icon: _isProcessing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Icon(Icons.payment),
                label: const Text('Marquer comme payée'),
              ),
            ),
            
            const SizedBox(height: 12),
            
            Text(
              'Confirmez le paiement uniquement après avoir effectué le règlement.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
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
    return '${date.day.toString().padLeft(2, '0')}/'
           '${date.month.toString().padLeft(2, '0')}/'
           '${date.year}';
  }
}