import { MailService } from '@sendgrid/mail';
import * as brevo from '@getbrevo/brevo';

const mailService = new MailService();

if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configuration Brevo
let brevoApiInstance: brevo.TransactionalEmailsApi | null = null;
if (process.env.BREVO_API_KEY) {
  brevoApiInstance = new brevo.TransactionalEmailsApi();
  // Configuration simplifiée pour Brevo
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

export class EmailService {
  // Envoi d'email avec Brevo (méthode principale)
  async sendEmailWithBrevo(params: {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{ content: string; filename: string; type: string }>;
  }): Promise<boolean> {
    if (!brevoApiInstance) {
      console.error('Brevo API not configured');
      return false;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { name: "MyJantes", email: "contact@myjantes.fr" };
      sendSmtpEmail.to = [{ email: params.to }];
      sendSmtpEmail.subject = params.subject;
      sendSmtpEmail.htmlContent = params.html;

      if (params.attachments && params.attachments.length > 0) {
        sendSmtpEmail.attachment = params.attachments.map(att => ({
          content: att.content,
          name: att.filename
        }));
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!
        },
        body: JSON.stringify(sendSmtpEmail)
      });

      if (!response.ok) {
        throw new Error(`Brevo API error: ${response.status} ${response.statusText}`);
      }
      console.log(`Email envoyé avec succès via Brevo à ${params.to}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi d\'email avec Brevo:', error);
      return false;
    }
  }

  // Méthode existante pour compatibilité (utilise maintenant Brevo)
  async sendInvoiceEmail(
    customerEmail: string,
    customerName: string,
    invoiceId: string,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    return this.sendEmailWithBrevo({
      to: customerEmail,
      subject: `Facture MyJantes N° ${invoiceId.substring(0, 8).toUpperCase()}`,
      html: this.generateInvoiceEmailTemplate(customerName, invoiceId),
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `facture-${invoiceId.substring(0, 8)}.pdf`,
          type: 'application/pdf',
        },
      ],
    });
  }

  // Envoi email quand facture passe en attente
  async sendInvoicePendingEmail(customerEmail: string, customerName: string, invoiceId: string, pdfBuffer: Buffer): Promise<boolean> {
    return this.sendEmailWithBrevo({
      to: customerEmail,
      subject: `Facture en attente - MyJantes N° ${invoiceId.substring(0, 8).toUpperCase()}`,
      html: this.generateInvoicePendingTemplate(customerName, invoiceId),
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `facture-${invoiceId.substring(0, 8)}.pdf`,
          type: 'application/pdf',
        },
      ],
    });
  }

  // Envoi email quand facture est payée
  async sendInvoicePaidEmail(customerEmail: string, customerName: string, invoiceId: string): Promise<boolean> {
    return this.sendEmailWithBrevo({
      to: customerEmail,
      subject: `Facture payée - Merci ! MyJantes N° ${invoiceId.substring(0, 8).toUpperCase()}`,
      html: this.generateInvoicePaidTemplate(customerName, invoiceId),
    });
  }

  // Envoi email quand devis est validé
  async sendQuoteApprovedEmail(customerEmail: string, customerName: string, quoteId: string): Promise<boolean> {
    return this.sendEmailWithBrevo({
      to: customerEmail,
      subject: `Devis validé - MyJantes N° ${quoteId.substring(0, 8).toUpperCase()}`,
      html: this.generateQuoteApprovedTemplate(customerName, quoteId),
    });
  }

  // Envoi email quand réservation est terminée
  async sendBookingCompletedEmail(customerEmail: string, customerName: string, bookingId: string): Promise<boolean> {
    return this.sendEmailWithBrevo({
      to: customerEmail,
      subject: `Service terminé - MyJantes`,
      html: this.generateBookingCompletedTemplate(customerName, bookingId),
    });
  }

  // Templates pour les différents types d'emails
  private generateInvoiceEmailTemplate(customerName: string, invoiceId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #dc2626;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MyJantes</h1>
        <p>Service professionnel de jantes et pneus</p>
    </div>
    
    <div class="content">
        <h2>Bonjour ${customerName},</h2>
        
        <p>Nous vous remercions pour votre confiance. Vous trouverez ci-joint votre facture N° <strong>${invoiceId.substring(0, 8).toUpperCase()}</strong>.</p>
        
        <p>Cette facture est également disponible dans votre espace client sur notre application.</p>
        
        <p>Pour toute question concernant cette facture, n'hésitez pas à nous contacter :</p>
        <ul>
            <li>📞 Téléphone : +33 3 21 40 80 53</li>
            <li>📧 Email : contact@myjantes.fr</li>
        </ul>
        
        <p>Nous vous remercions de votre confiance et restons à votre disposition.</p>
        
        <p><strong>L'équipe MyJantes</strong></p>
    </div>
    
    <div class="footer">
        <p>MyJantes - Service professionnel de jantes et pneus<br>
        46 rue de la Convention, 62800 Liévin<br>
        contact@myjantes.fr | +33 3 21 40 80 53</p>
    </div>
</body>
</html>
    `;
  }

  private generateInvoicePendingTemplate(customerName: string, invoiceId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f59e0b;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MyJantes</h1>
        <p>Facture en attente de règlement</p>
    </div>
    
    <div class="content">
        <h2>Bonjour ${customerName},</h2>
        
        <p>Votre facture N° <strong>${invoiceId.substring(0, 8).toUpperCase()}</strong> est maintenant en attente de règlement.</p>
        
        <p>Vous trouverez ci-joint le document PDF de votre facture.</p>
        
        <p>Pour effectuer le règlement, vous pouvez :</p>
        <ul>
            <li>📱 Régler directement depuis l'application MyJantes</li>
            <li>🏪 Passer en magasin : 46 rue de la Convention, 62800 Liévin</li>
            <li>📞 Nous contacter : +33 3 21 40 80 53</li>
        </ul>
        
        <p>Nous restons à votre disposition pour toute question.</p>
        
        <p><strong>L'équipe MyJantes</strong></p>
    </div>
    
    <div class="footer">
        <p>MyJantes - Service professionnel de jantes et pneus<br>
        46 rue de la Convention, 62800 Liévin<br>
        contact@myjantes.fr | +33 3 21 40 80 53</p>
    </div>
</body>
</html>
    `;
  }

  private generateInvoicePaidTemplate(customerName: string, invoiceId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #10b981;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f0fdf4;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MyJantes</h1>
        <p>✅ Paiement confirmé</p>
    </div>
    
    <div class="content">
        <h2>Merci ${customerName} !</h2>
        
        <p>Nous avons bien reçu le paiement de votre facture N° <strong>${invoiceId.substring(0, 8).toUpperCase()}</strong>.</p>
        
        <p>Votre règlement a été traité avec succès. Un reçu sera disponible dans votre espace client.</p>
        
        <p>🎉 Merci de faire confiance à MyJantes pour l'entretien de vos jantes et pneus !</p>
        
        <p>Nous espérons vous revoir bientôt pour vos prochains besoins.</p>
        
        <p><strong>L'équipe MyJantes</strong></p>
    </div>
    
    <div class="footer">
        <p>MyJantes - Service professionnel de jantes et pneus<br>
        46 rue de la Convention, 62800 Liévin<br>
        contact@myjantes.fr | +33 3 21 40 80 53</p>
    </div>
</body>
</html>
    `;
  }

  private generateQuoteApprovedTemplate(customerName: string, quoteId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #eff6ff;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MyJantes</h1>
        <p>✅ Devis validé</p>
    </div>
    
    <div class="content">
        <h2>Excellente nouvelle ${customerName} !</h2>
        
        <p>Votre devis N° <strong>${quoteId.substring(0, 8).toUpperCase()}</strong> a été validé et approuvé.</p>
        
        <p>Nous allons maintenant procéder à la planification de votre intervention.</p>
        
        <p>📅 <strong>Prochaines étapes :</strong></p>
        <ul>
            <li>Nous vous contacterons sous 24h pour programmer votre rendez-vous</li>
            <li>Vous recevrez une confirmation avec la date et l'heure</li>
            <li>Une facture sera générée après validation du devis</li>
        </ul>
        
        <p>Vous pouvez suivre l'avancement dans votre espace client MyJantes.</p>
        
        <p><strong>L'équipe MyJantes</strong></p>
    </div>
    
    <div class="footer">
        <p>MyJantes - Service professionnel de jantes et pneus<br>
        46 rue de la Convention, 62800 Liévin<br>
        contact@myjantes.fr | +33 3 21 40 80 53</p>
    </div>
</body>
</html>
    `;
  }

  private generateBookingCompletedTemplate(customerName: string, bookingId: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #8b5cf6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #faf5ff;
            padding: 20px;
            border-radius: 0 0 8px 8px;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MyJantes</h1>
        <p>🎉 Service terminé</p>
    </div>
    
    <div class="content">
        <h2>Bonjour ${customerName},</h2>
        
        <p>Nous avons le plaisir de vous informer que votre intervention a été terminée avec succès !</p>
        
        <p>📋 <strong>Référence :</strong> ${bookingId.substring(0, 8).toUpperCase()}</p>
        
        <p>🔧 <strong>Travaux effectués :</strong></p>
        <p>Nos experts ont terminé les travaux prévus sur vos jantes et pneus selon les standards de qualité MyJantes.</p>
        
        <p>📱 <strong>Informations importantes :</strong></p>
        <ul>
            <li>Vous pouvez venir récupérer votre véhicule</li>
            <li>Les photos avant/après sont disponibles dans votre espace client</li>
            <li>Votre facture finale sera bientôt disponible</li>
        </ul>
        
        <p>🙏 Merci de votre confiance ! N'hésitez pas à nous laisser un avis.</p>
        
        <p><strong>L'équipe MyJantes</strong></p>
    </div>
    
    <div class="footer">
        <p>MyJantes - Service professionnel de jantes et pneus<br>
        46 rue de la Convention, 62800 Liévin<br>
        contact@myjantes.fr | +33 3 21 40 80 53</p>
    </div>
</body>
</html>
    `;
  }
}