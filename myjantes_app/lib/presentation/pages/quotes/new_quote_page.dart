import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/models/service_model.dart';
import '../../../data/services/services_service.dart';
import '../../../data/services/quotes_service.dart';
import '../../../core/di/dependency_injection.dart';

class NewQuotePage extends StatefulWidget {
  const NewQuotePage({super.key});

  @override
  State<NewQuotePage> createState() => _NewQuotePageState();
}

class _NewQuotePageState extends State<NewQuotePage> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final ServicesService _servicesService = getIt<ServicesService>();
  final QuotesService _quotesService = getIt<QuotesService>();
  final ImagePicker _imagePicker = ImagePicker();

  List<ServiceModel> _services = [];
  ServiceModel? _selectedService;
  List<File> _selectedPhotos = [];
  bool _isLoading = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final services = await _servicesService.getAllServices();
      setState(() {
        _services = services;
      });
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
        _isLoading = false;
      });
    }
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> images = await _imagePicker.pickMultiImage(
        imageQuality: (AppConstants.imageQuality * 100).toInt(),
      );

      final List<File> newPhotos = [];
      for (XFile image in images) {
        final file = File(image.path);
        final fileSize = await file.length();
        
        if (fileSize <= AppConstants.maxImageSize) {
          newPhotos.add(file);
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Image ${image.name} trop volumineuse (max 5MB)'),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }

      setState(() {
        _selectedPhotos.addAll(newPhotos);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur lors de la sélection: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _submitQuote() async {
    if (!_formKey.currentState!.validate() || _selectedService == null) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      await _quotesService.createQuoteRequest(
        serviceId: _selectedService!.id,
        description: _descriptionController.text.trim(),
        photos: _selectedPhotos.isNotEmpty ? _selectedPhotos : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Demande de devis envoyée avec succès!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
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
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.backgroundColorValue),
      appBar: AppBar(
        title: const Text('Nouveau Devis'),
        backgroundColor: const Color(AppConstants.backgroundColorValue),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(AppConstants.primaryColorValue),
              ),
            )
          : _buildForm(),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service selection
            Text(
              'Service',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: const Color(AppConstants.surfaceColorValue),
                borderRadius: BorderRadius.circular(AppConstants.defaultRadius),
                border: Border.all(color: Colors.grey),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<ServiceModel>(
                  value: _selectedService,
                  hint: const Text('Sélectionnez un service'),
                  isExpanded: true,
                  items: _services.map((service) {
                    return DropdownMenuItem<ServiceModel>(
                      value: service,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            service.name,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            '${service.formattedPrice} - ${service.formattedDuration}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedService = value;
                    });
                  },
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Description
            Text(
              'Description détaillée',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            
            TextFormField(
              controller: _descriptionController,
              maxLines: 6,
              decoration: const InputDecoration(
                hintText: 'Décrivez vos besoins en détail...',
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Veuillez décrire vos besoins';
                }
                if (value.trim().length < 10) {
                  return 'Description trop courte (minimum 10 caractères)';
                }
                return null;
              },
            ),
            
            const SizedBox(height: 24),
            
            // Photos section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Photos (optionnel)',
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                TextButton.icon(
                  onPressed: _pickImages,
                  icon: const Icon(Icons.add_photo_alternate),
                  label: const Text('Ajouter'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(AppConstants.primaryColorValue),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            if (_selectedPhotos.isNotEmpty) ...[
              SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _selectedPhotos.length,
                  itemBuilder: (context, index) {
                    return Container(
                      width: 100,
                      height: 100,
                      margin: const EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              _selectedPhotos[index],
                              width: 100,
                              height: 100,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedPhotos.removeAt(index);
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.close,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
            
            Text(
              'Ajoutez des photos pour nous aider à mieux comprendre vos besoins.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Submit button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: (_isSubmitting || _selectedService == null) 
                    ? null 
                    : _submitQuote,
                child: _isSubmitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'Envoyer la demande',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}