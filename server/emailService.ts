import { MailService } from '@sendgrid/mail';

const mailService = new MailService();

if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
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
  async sendInvoiceEmail(
    customerEmail: string,
    customerName: string,
    invoiceId: string,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return false;
    }

    try {
      const email: EmailParams = {
        to: customerEmail,
        subject: `Facture MyJantes N° ${invoiceId.substring(0, 8).toUpperCase()}`,
        html: this.generateEmailTemplate(customerName, invoiceId),
        attachments: [
          {
            content: pdfBuffer.toString('base64'),
            filename: `facture-${invoiceId.substring(0, 8)}.pdf`,
            type: 'application/pdf',
          },
        ],
      };

      await mailService.send({
        ...email,
        from: 'contact@myjantes.fr',
      });

      return true;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return false;
    }
  }

  private generateEmailTemplate(customerName: string, invoiceId: string): string {
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
            <li>📞 Téléphone : +33 1 23 45 67 89</li>
            <li>📧 Email : contact@myjantes.fr</li>
        </ul>
        
        <p>Nous vous remercions de votre confiance et restons à votre disposition.</p>
        
        <p><strong>L'équipe MyJantes</strong></p>
    </div>
    
    <div class="footer">
        <p>MyJantes - Service professionnel de jantes et pneus<br>
        123 Rue de l'Automobile, 75001 Paris<br>
        contact@myjantes.fr | +33 1 23 45 67 89</p>
    </div>
</body>
</html>
    `;
  }
}