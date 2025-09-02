// @ts-ignore
import htmlPdf from "html-pdf-node";
import path from "path";
import fs from "fs";

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
    async generateInvoicePDF(invoice: any, type: 'invoice' | 'quote' = 'invoice'): Promise<Buffer> {
        try {
            const html = this.generateMyJantesHTML(invoice, type);
            return this.generateAdvancedPDF(invoice, html);
        } catch (error) {
            console.error("PDF generation error:", error);
            return this.generateSimplePDF(invoice, type);
        }
    }

    async generateQuotePDF(quote: any): Promise<Buffer> {
        return this.generateInvoicePDF(quote, 'quote');
    }

    private generateAdvancedPDF(invoice: any, html: string): Buffer {
        // Use HTML to PDF for better formatting
        return Buffer.from(html, 'utf8');
    }

    private generateSimplePDF(invoice: any, type: 'invoice' | 'quote' = 'invoice'): Buffer {
        return this.generateAdvancedPDF(invoice, "");
    }

    private generateMyJantesHTML(invoice: any, type: 'invoice' | 'quote' = 'invoice'): string {
        // Calculs financiers
        const subtotal = invoice.subtotal ? parseFloat(invoice.subtotal) : (parseFloat(invoice.amount) / 1.2);
        const vatRate = invoice.vatRate ? parseFloat(invoice.vatRate) : 20;
        const vatAmount = invoice.vat ? parseFloat(invoice.vat) : (subtotal * vatRate / 100);
        const total = invoice.amount ? parseFloat(invoice.amount) : (subtotal + vatAmount);

        // Articles/services avec détails
        const items = invoice.items || [{
            description: invoice.description,
            quantity: 1,
            unitPrice: subtotal,
            total: subtotal
        }];

        const documentTitle = type === 'quote' ? 'DEVIS' : 'FACTURE';
        const documentNumber = type === 'quote' ? `DV-${invoice.id.substring(0, 6)}` : `MY-${invoice.id.substring(0, 6)}`;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${documentTitle} ${documentNumber}</title>
    <style>
        @page {
            margin: 20mm;
            size: A4;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 0;
            color: #000;
            line-height: 1.2;
        }
        
        .header {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 1px solid #000;
            padding-bottom: 20px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            border: 1px solid #000;
            border-radius: 50%;
            background-color: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
        }
        
        .company-header {
            font-weight: bold;
            font-size: 16px;
        }
        
        .document-info {
            text-align: right;
        }
        
        .document-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .company-details {
            width: 100%;
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        
        .company-info, .client-info {
            width: 45%;
        }
        
        .company-info h3, .client-info h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            font-weight: bold;
        }
        
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            border: 2px solid #000;
            font-size: 9px;
        }
        
        .services-table th {
            background-color: #f5f5f5;
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            color: #000;
        }
        
        .services-table td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: center;
            font-size: 9px;
            vertical-align: middle;
        }
        
        .description-col {
            width: 40%;
            text-align: left !important;
            padding-left: 12px !important;
        }
        
        .date-col {
            width: 15%;
        }
        
        .qty-col {
            width: 10%;
        }
        
        .unit-col {
            width: 10%;
        }
        
        .price-col {
            width: 12%;
            text-align: right !important;
        }
        
        .vat-col {
            width: 8%;
        }
        
        .amount-col {
            width: 15%;
            text-align: right !important;
            font-weight: bold;
        }
        
        .totals {
            width: 100%;
            margin-bottom: 30px;
        }
        
        .totals-table {
            margin-left: auto;
            width: 200px;
        }
        
        .totals-table td {
            padding: 5px;
            border: none;
            text-align: right;
        }
        
        .totals-table .total-row {
            font-weight: bold;
            border-top: 1px solid #000;
            font-size: 12px;
        }
        
        .payment-info {
            width: 100%;
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        
        .payment-methods, .payment-terms {
            width: 45%;
        }
        
        .payment-methods h4, .payment-terms h4 {
            margin: 0 0 8px 0;
            font-size: 10px;
            font-weight: bold;
        }
        
        .footer {
            position: fixed;
            bottom: 20mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
        
        .photos-section {
            page-break-before: always;
            margin-top: 40px;
        }
        
        .photos-grid {
            display: flex;
            justify-content: space-around;
            gap: 20px;
            margin-top: 20px;
        }
        
        .photo-group {
            text-align: center;
            width: 40%;
        }
        
        .photo-group h3 {
            margin: 0 0 10px 0;
            font-size: 12px;
            font-weight: bold;
        }
        
        .photo {
            max-width: 100%;
            max-height: 150px;
            border: 1px solid #000;
            margin-bottom: 10px;
        }
        
        .work-details {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #000;
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo">🔧</div>
            <div>
                <div class="company-header">MY JANTES</div>
                <div style="font-size: 8px;">Spécialiste Jantes</div>
            </div>
        </div>
        
        <div class="document-info">
            <div class="document-title">${documentTitle} - ${documentNumber}</div>
            <div>Date de facturation: ${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</div>
            <div>Échéance: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR")}</div>
            <div>Type d'opération: Opération mixte</div>
        </div>
    </div>

    <div class="company-details">
        <div class="company-info">
            <h3>MY JANTES</h3>
            <div>46 rue de la convention</div>
            <div>62800 Lievin</div>
            <div>0321408053</div>
            <div>contact@myjantes.com</div>
            <div>www.myjantes.fr</div>
        </div>
        
        <div class="client-info">
            <div><strong>${(invoice.user?.name || "CLIENT").toUpperCase()}</strong></div>
            ${invoice.user?.clientType === "professionnel" && invoice.user?.companyName ? `
                <div><strong>${invoice.user.companyName}</strong></div>
                ${invoice.user.companyAddress ? `<div>${invoice.user.companyAddress}</div>` : ''}
                ${invoice.user.companySiret ? `<div>SIRET: ${invoice.user.companySiret}</div>` : ''}
                ${invoice.user.companyVat ? `<div>TVA: ${invoice.user.companyVat}</div>` : ''}
            ` : ''}
            ${invoice.user?.email ? `<div>${invoice.user.email}</div>` : ''}
            ${invoice.user?.phone ? `<div>${invoice.user.phone}</div>` : ''}
            ${invoice.user?.address && invoice.user?.clientType !== "professionnel" ? `<div>${invoice.user.address}</div>` : ''}
        </div>
    </div>

    ${invoice.workDetails ? `
    <div class="work-details">
        <h4>Détails du travail effectué:</h4>
        <p>${invoice.workDetails}</p>
    </div>
    ` : ''}

    <table class="services-table">
        <thead>
            <tr>
                <th class="description-col">DESCRIPTION</th>
                <th class="date-col">DATE</th>
                <th class="qty-col">QTÉ</th>
                <th class="unit-col">UNITÉ</th>
                <th class="price-col">PRIX HT</th>
                <th class="vat-col">TVA</th>
                <th class="amount-col">TOTAL TTC</th>
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
                <tr>
                    <td class="description-col">${item.description || invoice.description}</td>
                    <td class="date-col">${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td class="qty-col">${(item.quantity || 1).toFixed(2)}</td>
                    <td class="unit-col">pce</td>
                    <td class="price-col">${(item.unitPrice || subtotal).toFixed(2)}€</td>
                    <td class="vat-col">${vatRate.toFixed(2)} %</td>
                    <td class="amount-col">${(item.total || subtotal).toFixed(2)}€</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <table class="totals-table">
            <tr>
                <td><strong>Total HT</strong></td>
                <td><strong>${subtotal.toFixed(2)}€</strong></td>
            </tr>
            <tr>
                <td><strong>TVA ${vatRate.toFixed(2)} %</strong></td>
                <td><strong>${vatAmount.toFixed(2)}€</strong></td>
            </tr>
            <tr class="total-row">
                <td><strong>Total TTC</strong></td>
                <td><strong>${total.toFixed(2)}€</strong></td>
            </tr>
        </table>
    </div>

    <div class="payment-info">
        <div class="payment-methods">
            <h4>Moyens de paiement:</h4>
            <div>Banque: SOCIETE GENERALE</div>
            <div>SWIFT/BIC: SOGEFRPP</div>
            <div>IBAN: FR76 3000 3029 5800 0201 6936 525</div>
        </div>
        
        <div class="payment-terms">
            <h4>Conditions de paiement:</h4>
            <div>30 jours</div>
        </div>
    </div>

    ${invoice.photosBefore?.length || invoice.photosAfter?.length ? `
    <div class="photos-section">
        <h2 style="text-align: center; margin-bottom: 20px;">Photos des travaux</h2>
        <div class="photos-grid">
            ${invoice.photosBefore?.length ? `
                <div class="photo-group">
                    <h3>Avant</h3>
                    ${invoice.photosBefore.map(photo => 
                        `<img src="${photo}" alt="Photo avant" class="photo">`
                    ).join('')}
                </div>
            ` : ''}
            
            ${invoice.photosAfter?.length ? `
                <div class="photo-group">
                    <h3>Après</h3>
                    ${invoice.photosAfter.map(photo => 
                        `<img src="${photo}" alt="Photo après" class="photo">`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <div><strong>MY JANTES - SASU</strong></div>
        <div>46 rue de la convention 62800 Lievin</div>
        <div>Numéro de SIRET: 91367819900021 - Numéro de TVA FR73913678199</div>
    </div>
</body>
</html>
        `;
    }
}
