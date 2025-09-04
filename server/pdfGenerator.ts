// PDF generator using html-pdf-node
import path from "path";
import fs from "fs";
// @ts-ignore - html-pdf-node n'a pas de types TypeScript
import htmlPdf from "html-pdf-node";

interface InvoiceData {
    id: string;
    userId: string;
    amount: string;
    description: string;
    workDetails?: string | null;
    photosBefore?: string[] | null;
    photosAfter?: string[] | null;
    status: string;
    createdAt: string;
    subtotal?: string;
    vat?: string;
    total?: string;
    user?: {
        name: string;
        email: string;
        phone: string;
        address?: string;
        clientType?: string;
        companyName?: string;
        companyAddress?: string;
        companySiret?: string;
        companyVat?: string;
    };
}

export class PDFGenerator {
    private getLogoBase64(): string {
        try {
            const logoPath = path.join(process.cwd(), 'client', 'src', 'assets', 'logo-myjantes.png');
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                return `data:image/png;base64,${logoBuffer.toString('base64')}`;
            }
        } catch (error) {
            console.warn('Could not load logo:', error);
        }
        // Fallback to a simple placeholder if logo is not found
        return '';
    }

    async generateInvoicePDF(invoice: any, type: 'invoice' | 'quote' = 'invoice'): Promise<Buffer> {
        try {
            const html = this.generateMyJantesHTML(invoice, type);
            return await this.generateAdvancedPDF(invoice, html);
        } catch (error) {
            console.error("PDF generation error:", error);
            return await this.generateSimplePDF(invoice, type);
        }
    }

    async generateQuotePDF(quote: any): Promise<Buffer> {
        return this.generateInvoicePDF(quote, 'quote');
    }

    getQuotePreviewHTML(quote: any): string {
        return this.generateMyJantesHTML(quote, 'quote');
    }

    getInvoicePreviewHTML(invoice: any): string {
        return this.generateMyJantesHTML(invoice, 'invoice');
    }

    private async generateAdvancedPDF(invoice: any, html: string): Promise<Buffer> {
        try {
            // Configuration des options pour html-pdf-node
            const options = {
                format: 'A4',
                border: {
                    top: "0.5in",
                    right: "0.5in",
                    bottom: "0.5in",
                    left: "0.5in"
                },
                height: "11.7in",
                width: "8.3in",
                timeout: 30000,
                type: 'pdf',
                quality: '75'
            };

            const file = { content: html };
            
            // Générer le PDF avec html-pdf-node
            const pdfBuffer = await htmlPdf.generatePdf(file, options);
            return pdfBuffer;
        } catch (error) {
            console.error("Erreur génération PDF avec html-pdf-node:", error);
            // Fallback vers une méthode simple en cas d'erreur
            const simplePdfContent = this.generateSimplePdfContent(invoice, html);
            return Buffer.from(simplePdfContent, 'utf8');
        }
    }

    private async generateSimplePDF(invoice: any, type: 'invoice' | 'quote' = 'invoice'): Promise<Buffer> {
        const basicHtml = this.generateMyJantesHTML(invoice, type);
        return await this.generateAdvancedPDF(invoice, basicHtml);
    }

    private generateSimplePdfContent(invoice: any, html: string): string {
        // Créer un contenu PDF simple avec les données réelles
        const documentTitle = invoice.id ? `DEVIS DV-${invoice.id.substring(0, 6)}` : 'DEVIS';
        const clientName = invoice.user?.name || 'Client non spécifié';
        const amount = invoice.amount || '0';
        const description = invoice.description || 'Description non disponible';
        const date = new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR');
        
        const content = `MY JANTES - ${documentTitle}

Date: ${date}
Client: ${clientName}
Email: ${invoice.user?.email || 'N/A'}
Telephone: ${invoice.user?.phone || 'N/A'}

Description des services:
${description}

Montant total: ${amount} EUR

--
MY JANTES - SASU
46 rue de la convention 62800 Lievin
SIRET: 91367819900021 - TVA: FR73913678199`;

        return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj

4 0 obj
<< /Length ${content.length + 50} >>
stream
BT
/F1 10 Tf
50 750 Td
${content.split('\n').map((line, index) => `(${line.replace(/[()\\]/g, '\\$&')}) Tj 0 -15 Td`).join(' ')}
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${300 + content.length}
%%EOF`;
    }

    private generateMyJantesHTML(invoice: any, type: 'invoice' | 'quote' = 'invoice'): string {
        const logoBase64 = this.getLogoBase64();
        
        // Calculs financiers
        const subtotal = invoice.subtotal ? parseFloat(invoice.subtotal) : (parseFloat(invoice.amount) / 1.2);
        const vatRate = invoice.vatRate ? parseFloat(invoice.vatRate) : 20;
        const vatAmount = invoice.vat ? parseFloat(invoice.vat) : (subtotal * vatRate / 100);
        const total = invoice.amount ? parseFloat(invoice.amount) : (subtotal + vatAmount);

        // Articles/services avec détails
        const items = invoice.items || [{
            description: invoice.description || 'Service MyJantes',
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal,
            date: new Date(invoice.createdAt).toLocaleDateString("fr-FR")
        }];

        const documentTitle = type === 'quote' ? 'DEVIS' : 'FACTURE';
        const documentNumber = type === 'quote' ? `DV-${invoice.id.substring(0, 6)}` : `MY-${invoice.id.substring(0, 6)}`;

        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${documentTitle} ${documentNumber}</title>
    <style>
        @page { 
            margin: 20mm;
            size: A4;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .logo-company {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            border: 1px solid #ddd;
        }
        
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .company-title {
            font-size: 18px;
            font-weight: bold;
            color: #d30000;
            text-transform: uppercase;
        }
        
        .document-info {
            text-align: right;
        }
        
        .doc-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .doc-number {
            font-size: 12px;
            margin-bottom: 3px;
        }
        
        .doc-date {
            font-size: 10px;
            color: #666;
        }
        
        .parties {
            display: flex;
            justify-content: space-between;
            margin: 25px 0;
            gap: 30px;
        }
        
        .vendor, .client {
            width: 45%;
        }
        
        .vendor h3, .client h3 {
            font-size: 11px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
        }
        
        .address-line {
            font-size: 9px;
            margin-bottom: 2px;
            line-height: 1.1;
        }
        
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 2px solid #000;
        }
        
        .invoice-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px 5px;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
        }
        
        .invoice-table td {
            border: 1px solid #000;
            padding: 6px 5px;
            font-size: 9px;
            text-align: center;
        }
        
        .col-description { width: 40%; text-align: left !important; }
        .col-date { width: 12%; }
        .col-qty { width: 8%; }
        .col-unit { width: 8%; }
        .col-price { width: 12%; text-align: right !important; }
        .col-vat { width: 8%; }
        .col-total { width: 12%; text-align: right !important; font-weight: bold; }
        
        .totals {
            float: right;
            width: 250px;
            margin: 15px 0;
            border: 1px solid #000;
        }
        
        .totals table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .totals td {
            padding: 5px 10px;
            font-size: 9px;
            border-bottom: 1px solid #ccc;
        }
        
        .totals .total-label {
            text-align: left;
            font-weight: bold;
        }
        
        .totals .total-amount {
            text-align: right;
            font-weight: bold;
        }
        
        .totals .final-total {
            background-color: #f0f0f0;
            border: 2px solid #000;
            border-bottom: none;
            font-size: 11px;
        }
        
        .payment-section {
            clear: both;
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            gap: 30px;
        }
        
        .payment-info, .legal-info {
            width: 45%;
            font-size: 8px;
        }
        
        .payment-info h4, .legal-info h4 {
            font-size: 9px;
            font-weight: bold;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }
        
        .payment-line, .legal-line {
            margin-bottom: 2px;
        }
        
        .footer-line {
            position: fixed;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-top">
            <div class="logo-company">
                <div class="logo">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="MyJantes Logo" />` : '🔧'}
                </div>
                <div class="company-title">My Jantes</div>
            </div>
            <div class="document-info">
                <div class="doc-title">${documentTitle}</div>
                <div class="doc-number">N° ${documentNumber}</div>
                <div class="doc-date">Date: ${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</div>
                ${type === 'invoice' ? `<div class="doc-date">Échéance: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR")}</div>` : ''}
            </div>
        </div>
    </div>

    <div class="parties">
        <div class="vendor">
            <h3>Vendeur</h3>
            <div class="address-line"><strong>MY JANTES</strong></div>
            <div class="address-line">46 rue de la convention</div>
            <div class="address-line">62800 LIEVIN</div>
            <div class="address-line">Tél: 03 21 40 80 53</div>
            <div class="address-line">contact@myjantes.com</div>
            <div class="address-line">www.myjantes.fr</div>
            <div class="address-line"><strong>SIRET: 123 456 789 00012</strong></div>
            <div class="address-line"><strong>TVA: FR12345678900</strong></div>
        </div>
        
        <div class="client">
            <h3>Client</h3>
            <div class="address-line"><strong>${(invoice.user?.name || "CLIENT").toUpperCase()}</strong></div>
            ${invoice.user?.clientType === "professionnel" && invoice.user?.companyName ? `
                <div class="address-line"><strong>${invoice.user.companyName}</strong></div>
                ${invoice.user.companyAddress ? `<div class="address-line">${invoice.user.companyAddress}</div>` : ''}
                ${invoice.user.companySiret ? `<div class="address-line">SIRET: ${invoice.user.companySiret}</div>` : ''}
                ${invoice.user.companyVat ? `<div class="address-line">TVA: ${invoice.user.companyVat}</div>` : ''}
            ` : invoice.user?.address ? `<div class="address-line">${invoice.user.address}</div>` : ''}
            ${invoice.user?.email ? `<div class="address-line">${invoice.user.email}</div>` : ''}
            ${invoice.user?.phone ? `<div class="address-line">${invoice.user.phone}</div>` : ''}
        </div>
    </div>

    ${invoice.workDetails ? `
    <div class="work-details">
        <h4>Détails du travail effectué:</h4>
        <p>${invoice.workDetails}</p>
    </div>
    ` : ''}

    <table class="invoice-table">
        <thead>
            <tr>
                <th class="col-description">DESCRIPTION</th>
                <th class="col-date">DATE</th>
                <th class="col-qty">QTE</th>
                <th class="col-unit">UNITE</th>
                <th class="col-price">PRIX HT</th>
                <th class="col-vat">TVA</th>
                <th class="col-total">TOTAL TTC</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item: any) => `
                <tr>
                    <td class="col-description">${item.description || invoice.description || 'Prestations jantes et pneus'}</td>
                    <td class="col-date">${item.date || new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td class="col-qty">${item.quantity || 1}</td>
                    <td class="col-unit">unité</td>
                    <td class="col-price">${(item.unitPrice || subtotal).toFixed(2)} €</td>
                    <td class="col-vat">${vatRate}%</td>
                    <td class="col-total">${(item.total || (item.unitPrice || subtotal) * (item.quantity || 1) * (1 + vatRate/100)).toFixed(2)} €</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td class="total-label">Total HT</td>
                <td class="total-amount">${subtotal.toFixed(2)} €</td>
            </tr>
            <tr>
                <td class="total-label">TVA ${vatRate}%</td>
                <td class="total-amount">${vatAmount.toFixed(2)} €</td>
            </tr>
            <tr class="final-total">
                <td class="total-label">TOTAL TTC</td>
                <td class="total-amount">${total.toFixed(2)} €</td>
            </tr>
        </table>
    </div>

    <div class="payment-section">
        <div class="payment-info">
            <h4>Moyens de paiement</h4>
            <div class="payment-line">Banque: SOCIETE GENERALE</div>
            <div class="payment-line">Code Swift/BIC: SOGEFRPP</div>
            <div class="payment-line">IBAN: FR76 3000 3029 5800 0201 6936 525</div>
        </div>
        
        <div class="legal-info">
            <h4>Conditions de règlement</h4>
            <div class="legal-line">Paiement: 30 jours fin de mois</div>
            <div class="legal-line">Escompte: 2% à 8 jours</div>
            <div class="legal-line">Retard de paiement: 3 fois le taux légal</div>
            <div class="legal-line">Indemnité forfaitaire: 40€</div>
        </div>
    </div>

    <div class="footer-line">
        MyJantes - Spécialiste jantes et pneus - SIRET: 123 456 789 00012 - TVA: FR12345678900
    </div>

    ${invoice.photosBefore?.length || invoice.photosAfter?.length ? `
    <div class="photos-section">
        <h2 style="text-align: center; margin-bottom: 20px;">Photos des travaux</h2>
        <div class="photos-grid">
            ${invoice.photosBefore?.length ? `
                <div class="photo-group">
                    <h3>Avant</h3>
                    ${invoice.photosBefore.map((photo: string) => 
                        `<img src="${photo}" alt="Photo avant" class="photo">`
                    ).join('')}
                </div>
            ` : ''}
            
            ${invoice.photosAfter?.length ? `
                <div class="photo-group">
                    <h3>Après</h3>
                    ${invoice.photosAfter.map((photo: string) => 
                        `<img src="${photo}" alt="Photo après" class="photo">`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

</body>
</html>
        `;
    }
}
