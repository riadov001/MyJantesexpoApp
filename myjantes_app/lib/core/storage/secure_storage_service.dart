import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';

class SecureStorageService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    webOptions: WebOptions(
      dbName: 'MyJantesDB',
      publicKey: 'MyJantesPublicKey',
    ),
  );

  // Store string value
  static Future<void> storeString(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      throw StorageException('Erreur lors de l\'enregistrement: $e');
    }
  }

  // Get string value
  static Future<String?> getString(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      throw StorageException('Erreur lors de la lecture: $e');
    }
  }

  // Store JSON object
  static Future<void> storeJson(String key, Map<String, dynamic> value) async {
    try {
      final jsonString = json.encode(value);
      await _storage.write(key: key, value: jsonString);
    } catch (e) {
      throw StorageException('Erreur lors de l\'enregistrement JSON: $e');
    }
  }

  // Get JSON object
  static Future<Map<String, dynamic>?> getJson(String key) async {
    try {
      final jsonString = await _storage.read(key: key);
      if (jsonString == null) return null;
      return json.decode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      throw StorageException('Erreur lors de la lecture JSON: $e');
    }
  }

  // Store list
  static Future<void> storeList(String key, List<String> value) async {
    try {
      final jsonString = json.encode(value);
      await _storage.write(key: key, value: jsonString);
    } catch (e) {
      throw StorageException('Erreur lors de l\'enregistrement de la liste: $e');
    }
  }

  // Get list
  static Future<List<String>?> getList(String key) async {
    try {
      final jsonString = await _storage.read(key: key);
      if (jsonString == null) return null;
      final List<dynamic> decoded = json.decode(jsonString);
      return decoded.cast<String>();
    } catch (e) {
      throw StorageException('Erreur lors de la lecture de la liste: $e');
    }
  }

  // Store boolean
  static Future<void> storeBool(String key, bool value) async {
    try {
      await _storage.write(key: key, value: value.toString());
    } catch (e) {
      throw StorageException('Erreur lors de l\'enregistrement du boolean: $e');
    }
  }

  // Get boolean
  static Future<bool?> getBool(String key) async {
    try {
      final value = await _storage.read(key: key);
      if (value == null) return null;
      return value.toLowerCase() == 'true';
    } catch (e) {
      throw StorageException('Erreur lors de la lecture du boolean: $e');
    }
  }

  // Delete value
  static Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      throw StorageException('Erreur lors de la suppression: $e');
    }
  }

  // Delete all values
  static Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      throw StorageException('Erreur lors de la suppression complète: $e');
    }
  }

  // Check if key exists
  static Future<bool> containsKey(String key) async {
    try {
      return await _storage.containsKey(key: key);
    } catch (e) {
      throw StorageException('Erreur lors de la vérification de clé: $e');
    }
  }

  // Get all keys
  static Future<Map<String, String>> readAll() async {
    try {
      return await _storage.readAll();
    } catch (e) {
      throw StorageException('Erreur lors de la lecture complète: $e');
    }
  }
}

class StorageException implements Exception {
  final String message;

  StorageException(this.message);

  @override
  String toString() => message;
}