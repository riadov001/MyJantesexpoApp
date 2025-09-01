class EmailTemplate {
  final String templateId;
  final String subject;
  final String htmlContent;
  final String textContent;
  final Map<String, String> variables;

  EmailTemplate({
    required this.templateId,
    required this.subject,
    required this.htmlContent,
    required this.textContent,
    required this.variables,
  });

  factory EmailTemplate.fromJson(Map<String, dynamic> json) {
    return EmailTemplate(
      templateId: json['templateId'] as String,
      subject: json['subject'] as String,
      htmlContent: json['htmlContent'] as String,
      textContent: json['textContent'] as String,
      variables: Map<String, String>.from(json['variables'] as Map),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'templateId': templateId,
      'subject': subject,
      'htmlContent': htmlContent,
      'textContent': textContent,
      'variables': variables,
    };
  }

  String get processedSubject {
    String result = subject;
    variables.forEach((key, value) {
      result = result.replaceAll('{{$key}}', value);
    });
    return result;
  }

  String get processedHtmlContent {
    String result = htmlContent;
    variables.forEach((key, value) {
      result = result.replaceAll('{{$key}}', value);
    });
    return result;
  }

  String get processedTextContent {
    String result = textContent;
    variables.forEach((key, value) {
      result = result.replaceAll('{{$key}}', value);
    });
    return result;
  }
}

// Predefined email templates
class EmailTemplates {
  static EmailTemplate bookingConfirmation({
    required String userName,
    required String serviceName,
    required String bookingDate,
    required String bookingTime,
    required String bookingId,
  }) {
    return EmailTemplate(
      templateId: 'booking_confirmation',
      subject: 'Confirmation de votre réservation MyJantes',
      htmlContent: '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmation de réservation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #000000; color: #FFFFFF;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D32F2F; margin: 0;">MyJantes</h1>
            <p style="color: #888; margin: 5px 0 0 0;">Services Automobiles</p>
        </div>
        
        <h2 style="color: #D32F2F;">Réservation confirmée</h2>
        
        <p>Bonjour {{userName}},</p>
        
        <p>Votre réservation a été confirmée avec succès !</p>
        
        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #D32F2F;">Détails de votre réservation</h3>
            <p><strong>Service :</strong> {{serviceName}}</p>
            <p><strong>Date :</strong> {{bookingDate}}</p>
            <p><strong>Heure :</strong> {{bookingTime}}</p>
            <p><strong>Numéro de réservation :</strong> {{bookingId}}</p>
        </div>
        
        <p>Nous vous attendons à l'heure convenue. En cas d'imprévu, n'hésitez pas à nous contacter.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="myjanbes://bookings/{{bookingId}}" style="background-color: #D32F2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir ma réservation</a>
        </div>
        
        <p style="color: #888; text-align: center; margin-top: 30px;">
            MyJantes - Services de jantes et pneus<br>
            Merci de votre confiance !
        </p>
    </div>
</body>
</html>
      ''',
      textContent: '''
MyJantes - Confirmation de réservation

Bonjour {{userName}},

Votre réservation a été confirmée avec succès !

Détails de votre réservation :
- Service : {{serviceName}}
- Date : {{bookingDate}}
- Heure : {{bookingTime}}
- Numéro de réservation : {{bookingId}}

Nous vous attendons à l'heure convenue. En cas d'imprévu, n'hésitez pas à nous contacter.

MyJantes - Services de jantes et pneus
Merci de votre confiance !
      ''',
      variables: {
        'userName': userName,
        'serviceName': serviceName,
        'bookingDate': bookingDate,
        'bookingTime': bookingTime,
        'bookingId': bookingId,
      },
    );
  }

  static EmailTemplate quoteReceived({
    required String userName,
    required String quoteId,
    required String description,
  }) {
    return EmailTemplate(
      templateId: 'quote_received',
      subject: 'Votre demande de devis a été reçue - MyJantes',
      htmlContent: '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Demande de devis reçue</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #000000; color: #FFFFFF;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D32F2F; margin: 0;">MyJantes</h1>
            <p style="color: #888; margin: 5px 0 0 0;">Services Automobiles</p>
        </div>
        
        <h2 style="color: #D32F2F;">Demande de devis reçue</h2>
        
        <p>Bonjour {{userName}},</p>
        
        <p>Nous avons bien reçu votre demande de devis. Notre équipe l'examine et vous enverra une proposition dans les plus brefs délais.</p>
        
        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #D32F2F;">Votre demande</h3>
            <p><strong>Numéro de devis :</strong> {{quoteId}}</p>
            <p><strong>Description :</strong> {{description}}</p>
        </div>
        
        <p>Vous recevrez un email dès que votre devis sera prêt.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="myjanbes://quotes/{{quoteId}}" style="background-color: #D32F2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Suivre mon devis</a>
        </div>
        
        <p style="color: #888; text-align: center; margin-top: 30px;">
            MyJantes - Services de jantes et pneus<br>
            Merci de votre confiance !
        </p>
    </div>
</body>
</html>
      ''',
      textContent: '''
MyJantes - Demande de devis reçue

Bonjour {{userName}},

Nous avons bien reçu votre demande de devis. Notre équipe l'examine et vous enverra une proposition dans les plus brefs délais.

Votre demande :
- Numéro de devis : {{quoteId}}
- Description : {{description}}

Vous recevrez un email dès que votre devis sera prêt.

MyJantes - Services de jantes et pneus
Merci de votre confiance !
      ''',
      variables: {
        'userName': userName,
        'quoteId': quoteId,
        'description': description,
      },
    );
  }

  static EmailTemplate quoteSent({
    required String userName,
    required String quoteId,
    required String amount,
  }) {
    return EmailTemplate(
      templateId: 'quote_sent',
      subject: 'Votre devis MyJantes est prêt !',
      htmlContent: '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Votre devis est prêt</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #000000; color: #FFFFFF;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D32F2F; margin: 0;">MyJantes</h1>
            <p style="color: #888; margin: 5px 0 0 0;">Services Automobiles</p>
        </div>
        
        <h2 style="color: #D32F2F;">Votre devis est prêt !</h2>
        
        <p>Bonjour {{userName}},</p>
        
        <p>Excellente nouvelle ! Votre devis est maintenant disponible.</p>
        
        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #D32F2F;">Devis {{quoteId}}</h3>
            <p style="font-size: 32px; color: #4CAF50; font-weight: bold; margin: 10px 0;">{{amount}}€</p>
        </div>
        
        <p>Consultez les détails de votre devis et donnez-nous votre réponse directement depuis l'application.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="myjanbes://quotes/{{quoteId}}" style="background-color: #D32F2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir mon devis</a>
        </div>
        
        <p style="color: #888; text-align: center; margin-top: 30px;">
            MyJantes - Services de jantes et pneus<br>
            Merci de votre confiance !
        </p>
    </div>
</body>
</html>
      ''',
      textContent: '''
MyJantes - Votre devis est prêt !

Bonjour {{userName}},

Excellente nouvelle ! Votre devis est maintenant disponible.

Devis {{quoteId}} : {{amount}}€

Consultez les détails de votre devis et donnez-nous votre réponse directement depuis l'application.

MyJantes - Services de jantes et pneus
Merci de votre confiance !
      ''',
      variables: {
        'userName': userName,
        'quoteId': quoteId,
        'amount': amount,
      },
    );
  }

  static EmailTemplate invoiceCreated({
    required String userName,
    required String invoiceId,
    required String amount,
    required String dueDate,
  }) {
    return EmailTemplate(
      templateId: 'invoice_created',
      subject: 'Nouvelle facture MyJantes - {{amount}}€',
      htmlContent: '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nouvelle facture</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #000000; color: #FFFFFF;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D32F2F; margin: 0;">MyJantes</h1>
            <p style="color: #888; margin: 5px 0 0 0;">Services Automobiles</p>
        </div>
        
        <h2 style="color: #D32F2F;">Nouvelle facture</h2>
        
        <p>Bonjour {{userName}},</p>
        
        <p>Votre facture est maintenant disponible.</p>
        
        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #D32F2F;">Facture {{invoiceId}}</h3>
            <p><strong>Montant :</strong> {{amount}}€</p>
            <p><strong>Échéance :</strong> {{dueDate}}</p>
        </div>
        
        <p>Vous pouvez consulter et régler votre facture depuis l'application.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="myjanbes://invoices/{{invoiceId}}" style="background-color: #D32F2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Voir ma facture</a>
        </div>
        
        <p style="color: #888; text-align: center; margin-top: 30px;">
            MyJantes - Services de jantes et pneus<br>
            Merci de votre confiance !
        </p>
    </div>
</body>
</html>
      ''',
      textContent: '''
MyJantes - Nouvelle facture

Bonjour {{userName}},

Votre facture est maintenant disponible.

Facture {{invoiceId}}
Montant : {{amount}}€
Échéance : {{dueDate}}

Vous pouvez consulter et régler votre facture depuis l'application.

MyJantes - Services de jantes et pneus
Merci de votre confiance !
      ''',
      variables: {
        'userName': userName,
        'invoiceId': invoiceId,
        'amount': amount,
        'dueDate': dueDate,
      },
    );
  }

  static EmailTemplate invoiceReminder({
    required String userName,
    required String invoiceId,
    required String amount,
    required String daysOverdue,
  }) {
    return EmailTemplate(
      templateId: 'invoice_reminder',
      subject: 'Rappel: Facture MyJantes en retard - {{amount}}€',
      htmlContent: '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rappel de facture</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #000000; color: #FFFFFF;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D32F2F; margin: 0;">MyJantes</h1>
            <p style="color: #888; margin: 5px 0 0 0;">Services Automobiles</p>
        </div>
        
        <h2 style="color: #D32F2F;">Rappel de paiement</h2>
        
        <p>Bonjour {{userName}},</p>
        
        <p>Nous vous rappelons que votre facture est en attente de paiement depuis {{daysOverdue}} jour(s).</p>
        
        <div style="background-color: #2a2a2a; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D32F2F;">
            <h3 style="margin-top: 0; color: #D32F2F;">Facture {{invoiceId}}</h3>
            <p><strong>Montant dû :</strong> {{amount}}€</p>
            <p><strong>En retard de :</strong> {{daysOverdue}} jour(s)</p>
        </div>
        
        <p>Merci de régulariser votre situation dans les plus brefs délais.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="myjanbes://invoices/{{invoiceId}}" style="background-color: #D32F2F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Régler ma facture</a>
        </div>
        
        <p style="color: #888; text-align: center; margin-top: 30px;">
            MyJantes - Services de jantes et pneus<br>
            Pour toute question, contactez-nous.
        </p>
    </div>
</body>
</html>
      ''',
      textContent: '''
MyJantes - Rappel de paiement

Bonjour {{userName}},

Nous vous rappelons que votre facture est en attente de paiement depuis {{daysOverdue}} jour(s).

Facture {{invoiceId}}
Montant dû : {{amount}}€
En retard de : {{daysOverdue}} jour(s)

Merci de régulariser votre situation dans les plus brefs délais.

MyJantes - Services de jantes et pneus
Pour toute question, contactez-nous.
      ''',
      variables: {
        'userName': userName,
        'invoiceId': invoiceId,
        'amount': amount,
        'daysOverdue': daysOverdue,
      },
    );
  }
}