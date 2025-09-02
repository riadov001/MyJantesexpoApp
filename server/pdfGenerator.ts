import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

interface InvoiceData {
  id: string;
  userId: string;
  amount: string;
  description: string;
  workDetails?: string;
  photosBefore?: string[];
  photosAfter?: string[];
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
}

export class PDFGenerator {
  async generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set page size to A4
      await page.setViewport({ width: 1200, height: 1600 });
      
      const html = this.generateInvoiceHTML(invoice);
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0' 
      });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });
      
      return pdf;
    } finally {
      await browser.close();
    }
  }

  private generateInvoiceHTML(invoice: InvoiceData): string {
    const logoPath = path.join(process.cwd(), 'client/src/assets/logo.png');
    const logoBase64 = fs.existsSync(logoPath) 
      ? `data:image/png;base64,${fs.readFileSync(logoPath, 'base64')}`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture ${invoice.id}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
        }
        .logo {
            max-height: 80px;
            max-width: 200px;
        }
        .company-info {
            text-align: right;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 30px;
            text-align: center;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        .invoice-details, .client-details {
            width: 45%;
        }
        .detail-title {
            font-weight: bold;
            color: #dc2626;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .detail-item {
            margin-bottom: 5px;
        }
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .services-table th {
            background-color: #dc2626;
            color: white;
            padding: 12px;
            text-align: left;
        }
        .services-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .total-section {
            text-align: right;
            margin-bottom: 40px;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 8px;
            display: inline-block;
        }
        .photos-section {
            margin-top: 40px;
        }
        .photos-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .photo-group {
            text-align: center;
        }
        .photo-group h3 {
            color: #dc2626;
            margin-bottom: 15px;
        }
        .photo {
            max-width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            border: 2px solid #ddd;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #dc2626;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .work-details {
            background-color: #f8f8f8;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .work-details h3 {
            color: #dc2626;
            margin-top: 0;
        }
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background-color: #22c55e;
            color: white;
        }
        .status-unpaid {
            background-color: #ef4444;
            color: white;
        }
        .status-pending {
            background-color: #f59e0b;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoBase64 ? `<img src="${logoBase64}" alt="MyJantes" class="logo">` : ''}
            <div class="company-info">
                <div class="company-name">MyJantes</div>
                <div>Votre expert en jantes et pneus</div>
                <div>Email: contact@myjantes.fr</div>
                <div>Tél: +33 1 23 45 67 89</div>
            </div>
        </div>

        <div class="invoice-title">
            FACTURE N° ${invoice.id.substring(0, 8).toUpperCase()}
        </div>

        <div class="invoice-info">
            <div class="invoice-details">
                <div class="detail-title">Détails de la facture</div>
                <div class="detail-item"><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</div>
                <div class="detail-item"><strong>Statut:</strong> 
                    <span class="status-badge status-${invoice.status}">
                        ${invoice.status === 'paid' ? 'Payée' : invoice.status === 'unpaid' ? 'Impayée' : 'En attente'}
                    </span>
                </div>
            </div>
            <div class="client-details">
                <div class="detail-title">Facturation à</div>
                <div class="detail-item"><strong>${invoice.user?.name || 'Client'}</strong></div>
                <div class="detail-item">${invoice.user?.email || ''}</div>
                <div class="detail-item">${invoice.user?.phone || ''}</div>
            </div>
        </div>

        ${invoice.workDetails ? `
        <div class="work-details">
            <h3>Détails des travaux</h3>
            <p>${invoice.workDetails}</p>
        </div>
        ` : ''}

        <table class="services-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${invoice.description}</td>
                    <td style="text-align: right;">${invoice.amount}€</td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-amount">
                Total: ${invoice.amount}€
            </div>
        </div>

        ${(invoice.photosBefore?.length || invoice.photosAfter?.length) ? `
        <div class="photos-section">
            <h2 style="color: #dc2626; text-align: center;">Photos des travaux</h2>
            <div class="photos-grid">
                ${invoice.photosBefore?.length ? `
                <div class="photo-group">
                    <h3>Avant</h3>
                    ${invoice.photosBefore.map(photo => `
                        <img src="${photo}" alt="Photo avant" class="photo">
                    `).join('')}
                </div>
                ` : ''}
                ${invoice.photosAfter?.length ? `
                <div class="photo-group">
                    <h3>Après</h3>
                    ${invoice.photosAfter.map(photo => `
                        <img src="${photo}" alt="Photo après" class="photo">
                    `).join('')}
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>MyJantes</strong> - Votre expert en jantes et pneus</p>
            <p>Merci de votre confiance</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}