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
        const subtotal = invoice.subtotal || (parseFloat(invoice.amount) / 1.2).toFixed(2);
        const vatAmount = invoice.vat || (parseFloat(invoice.amount) - parseFloat(subtotal)).toFixed(2);
        
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
/F2 5 0 R
>>
>>
/MediaBox [0 0 595 842]
/Contents 6 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

6 0 obj
<<
/Length 1800
>>
stream
BT

/F1 16 Tf
50 800 Td
(MY JANTES) Tj

400 0 Td
/F1 14 Tf
(FACTURE - MY-${invoice.id.substring(0, 6)}) Tj

/F2 10 Tf
0 -15 Td
(Date de facturation: ${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}) Tj

0 -12 Td
(Echéance: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR")}) Tj

0 -12 Td
(Type d'opération: Opération mixte) Tj

/F2 10 Tf
-400 -50 Td
(MY JANTES) Tj
0 -12 Td
(46 rue de la convention) Tj
0 -12 Td
(62800 Lievin) Tj
0 -12 Td
(0321408053) Tj
0 -12 Td
(contact@myjantes.com) Tj
0 -12 Td
(www.myjantes.fr) Tj

300 60 Td
(${invoice.user?.name?.toUpperCase() || "CLIENT"}) Tj
${invoice.user?.companyName ? `
0 -12 Td
(${invoice.user.companyName}) Tj` : ''}
${invoice.user?.address ? `
0 -12 Td
(${invoice.user.address}) Tj` : ''}

/F1 10 Tf
-300 -80 Td
(Description) Tj
60 0 Td
(Date) Tj
40 0 Td
(Qté) Tj
30 0 Td
(Unité) Tj
50 0 Td
(Prix unitaire) Tj
60 0 Td
(TVA) Tj
40 0 Td
(Montant) Tj

/F2 9 Tf
-280 -20 Td
(${invoice.description.substring(0, 35)}) Tj
60 0 Td
(${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}) Tj
40 0 Td
(1,00) Tj
30 0 Td
(pce) Tj
50 0 Td
(${subtotal}€) Tj
60 0 Td
(20,00 %) Tj
40 0 Td
(${parseFloat(invoice.amount).toFixed(2)}€) Tj

/F1 10 Tf
120 -50 Td
(Total HT) Tj
40 0 Td
(${subtotal}€) Tj

0 -15 Td
(TVA 20,00 %) Tj
40 0 Td
(${vatAmount}€) Tj

/F1 12 Tf
-40 -20 Td
(Total TTC) Tj
40 0 Td
(${parseFloat(invoice.amount).toFixed(2)}€) Tj

/F2 10 Tf
-200 -50 Td
(Moyens de paiement: Banque: SOCIETE GENERALE) Tj
0 -12 Td
(SWIFT/BIC: SOGEFRPP) Tj
0 -12 Td
(IBAN: FR76 3000 3029 5800 0201 6936 525) Tj

0 -20 Td
(Conditions de paiement: 30 jours) Tj

/F2 8 Tf
150 -100 Td
(MY JANTES - SASU) Tj
0 -10 Td
(46 rue de la convention 62800 Lievin) Tj
0 -10 Td
(Numéro de SIRET: 91367819900021 - Numéro de TVA FR73913678199) Tj

ET
endstream
endobj

xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000273 00000 n 
0000000365 00000 n 
0000000441 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
2291
%%EOF`;

        return Buffer.from(pdfContent, "utf8");
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
            margin-bottom: 30px;
            border: 1px solid #000;
        }
        
        .services-table th {
            background-color: #e0e0e0;
            border: 1px solid #000;
            padding: 8px 5px;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
        }
        
        .services-table td {
            border: 1px solid #000;
            padding: 8px 5px;
            text-align: center;
            font-size: 9px;
        }
        
        .description-col {
            width: 35%;
            text-align: left !important;
        }
        
        .date-col {
            width: 12%;
        }
        
        .qty-col {
            width: 8%;
        }
        
        .unit-col {
            width: 10%;
        }
        
        .price-col {
            width: 15%;
        }
        
        .vat-col {
            width: 10%;
        }
        
        .amount-col {
            width: 10%;
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
                <th class="description-col">Description</th>
                <th class="date-col">Date</th>
                <th class="qty-col">Qté</th>
                <th class="unit-col">Unité</th>
                <th class="price-col">Prix unitaire</th>
                <th class="vat-col">TVA</th>
                <th class="amount-col">Montant</th>
            </tr>
        </thead>
        <tbody>
            ${items.map(item => `
                <tr>
                    <td class="description-col" style="text-align: left;">${item.description || invoice.description}</td>
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
