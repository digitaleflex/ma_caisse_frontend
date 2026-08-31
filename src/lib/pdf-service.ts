import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
    amount: number;
    createdAt: string;
    type?: 'sale' | 'expense';
    description?: string;
    note?: string;
    productName?: string;
    quantitySold?: number;
    unitPrice?: number;
}

interface Debtor {
    name: string;
    totalDebt: number;
    phone?: string;
}

interface InventoryItem {
    name: string;
    price: number;
    quantity: number;
}

interface ShopInfo {
    name: string;
    ownerName: string;
    phone?: string;
    email?: string;
}

const COLORS = {
    primary: [41, 128, 185] as [number, number, number],
    secondary: [66, 66, 66] as [number, number, number],
    success: [46, 204, 113] as [number, number, number],
    danger: [231, 76, 60] as [number, number, number],
    textGray: 150,
    backgroundGray: [245, 245, 245] as [number, number, number],
};

const formatCustomCurrency = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const drawHeader = (doc: jsPDF, shopInfo: ShopInfo, title: string, showDate = true) => {
    const now = new Date();

    // LEFT SIDE: Shop Info
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(shopInfo.name, 14, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    let y = 31;
    doc.text(`Propriétaire : ${shopInfo.ownerName}`, 14, y);

    if (shopInfo.phone) {
        y += 4;
        doc.text(`Tél : ${shopInfo.phone}`, 14, y);
    }
    if (shopInfo.email) {
        y += 4;
        doc.text(`Email : ${shopInfo.email}`, 14, y);
    }

    // RIGHT SIDE: Document Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(title.toUpperCase(), 196, 25, { align: 'right' });

    if (showDate) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`Date d'émission : ${format(now, 'dd/MM/yyyy HH:mm')}`, 196, 31, { align: 'right' });
    }

    const headerBottomY = Math.max(y, 35) + 5;
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.line(14, headerBottomY, 196, headerBottomY);

    return headerBottomY;
};

const drawFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const now = new Date();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textGray);
        doc.text(`Page ${i} / ${pageCount}`, 196, 285, { align: 'right' });
        doc.text(`Généré par Ma Caisse le ${format(now, 'dd/MM/yyyy')}`, 14, 285);
    }
};

const commonTableStyles = {
    theme: 'striped' as const,
    headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold' as const
    },
    alternateRowStyles: {
        fillColor: COLORS.backgroundGray
    },
    styles: {
        cellPadding: 3,
        fontSize: 9
    }
};

export const generateMonthlyReport = (
    sales: Transaction[],
    expenses: Transaction[],
    shopInfo: ShopInfo,
    title?: string
) => {
    const doc = new jsPDF();
    const now = new Date();
    const currentMonth = format(now, 'MMMM yyyy', { locale: fr });
    const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

    const reportTitle = title || `Bilan Mensuel - ${capitalizedMonth}`;
    drawHeader(doc, shopInfo, reportTitle);

    // SUMMARY
    const totalSales = sales.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = totalSales - totalExpenses;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Résultats de la période', 14, 58);

    autoTable(doc, {
        startY: 63,
        head: [['Catégorie', { content: 'Montant (FCFA)', styles: { halign: 'right' as const } }]],
        body: [
            ['Total Ventes', { content: formatCustomCurrency(totalSales), styles: { halign: 'right' as const } }],
            ['Total Dépenses', { content: formatCustomCurrency(totalExpenses), styles: { halign: 'right' as const } }],
            ['Bénéfice Net', { content: formatCustomCurrency(profit), styles: { halign: 'right' as const, fontStyle: 'bold' as const } }],
        ],
        ...commonTableStyles,
        headStyles: { ...commonTableStyles.headStyles, fillColor: COLORS.secondary },
    });

    // SALES DETAILS
    let lastY = (doc as any).lastAutoTable.finalY + 15;

    // Page break check: Ensure space for title (5mm) + table head + ~3 rows (20-30mm total)
    if (lastY > 250) {
        doc.addPage();
        lastY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Détails des Ventes', 14, lastY);

    const salesRows = sales
        .map(s => [
            format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm'),
            s.productName || s.note || 'Vente diverse',
            s.quantitySold?.toString() || '1',
            { content: formatCustomCurrency(s.unitPrice || s.amount), styles: { halign: 'right' as const } },
            { content: formatCustomCurrency(s.amount), styles: { halign: 'right' as const } }
        ]);

    autoTable(doc, {
        startY: lastY + 5,
        head: [['Date', 'Désignation', 'Qté', { content: 'P.U (FCFA)', styles: { halign: 'right' as const } }, { content: 'Total (FCFA)', styles: { halign: 'right' as const } }]],
        body: salesRows,
        ...commonTableStyles,
        headStyles: { ...commonTableStyles.headStyles, fillColor: COLORS.success },
        columnStyles: {
            2: { cellWidth: 15, halign: 'center' as const },
            3: { cellWidth: 30, halign: 'right' as const },
            4: { cellWidth: 35, halign: 'right' as const }
        }
    });

    // EXPENSES DETAILS
    lastY = (doc as any).lastAutoTable.finalY + 15;

    // Page break check: Ensure space for title + table head + ~3 rows
    if (lastY > 250) {
        doc.addPage();
        lastY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('Détails des Dépenses', 14, lastY);

    const expensesRows = expenses
        .map(e => [
            format(new Date(e.createdAt), 'dd/MM/yyyy HH:mm'),
            e.description || '-',
            { content: formatCustomCurrency(e.amount), styles: { halign: 'right' as const } }
        ]);

    autoTable(doc, {
        startY: lastY + 5,
        head: [['Date', 'Description', { content: 'Montant (FCFA)', styles: { halign: 'right' as const } }]],
        body: expensesRows,
        ...commonTableStyles,
        headStyles: { ...commonTableStyles.headStyles, fillColor: COLORS.danger },
        columnStyles: {
            2: { cellWidth: 40, halign: 'right' as const }
        }
    });

    drawFooter(doc);

    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${shopInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(now, 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
};

export const generateDebtorsReport = (
    debtors: Debtor[],
    shopInfo: ShopInfo
) => {
    const doc = new jsPDF();
    const now = new Date();

    drawHeader(doc, shopInfo, 'Liste des Créditeurs');

    // TOTAL DEBT
    const totalDebt = debtors.reduce((sum, d) => sum + Number(d.totalDebt), 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Encours Total : ${formatCustomCurrency(totalDebt)} FCFA`, 14, 58);

    // TABLE
    const rows = debtors.map(d => {
        let displayPhone = d.phone || '-';
        const cleanPhone = displayPhone.replace(/\s/g, '').replace(/^\+229/, '');
        if (/^\d{10}$/.test(cleanPhone)) {
            displayPhone = cleanPhone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        }

        return [
            d.name,
            displayPhone,
            { content: formatCustomCurrency(d.totalDebt), styles: { halign: 'right' as const } }
        ]
    });

    autoTable(doc, {
        startY: 65,
        head: [['Nom du Client', 'Téléphone', { content: 'Dette (FCFA)', styles: { halign: 'right' as const } }]],
        body: rows,
        ...commonTableStyles,
        columnStyles: {
            2: { halign: 'right' as const }
        }
    });

    drawFooter(doc);

    const fileName = `Credits_${shopInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(now, 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
}

export const generateTransactionsReport = (
    transactions: Transaction[],
    shopInfo: ShopInfo
) => {
    const doc = new jsPDF();
    const now = new Date();

    drawHeader(doc, shopInfo, 'Historique des Transactions');

    // SUMMARY
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Nombre Total : ${transactions.length} transaction${transactions.length > 1 ? 's' : ''}`, 14, 58);

    // TABLE
    const rows = transactions.map(t => [
        format(new Date(t.createdAt), 'dd/MM/yy HH:mm'),
        t.type === 'sale' ? 'Vente' : 'Dépense',
        t.productName || t.note || t.description || '-',
        t.quantitySold?.toString() || (t.type === 'sale' ? '1' : '-'),
        { content: formatCustomCurrency(t.unitPrice || t.amount), styles: { halign: 'right' as const } },
        { content: formatCustomCurrency(t.amount), styles: { halign: 'right' as const } }
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Date', 'Type', 'Description', 'Qté', { content: 'P.U (FCFA)', styles: { halign: 'right' as const } }, { content: 'Total (FCFA)', styles: { halign: 'right' as const } }]],
        body: rows,
        ...commonTableStyles,
        columnStyles: {
            0: { cellWidth: 32 },
            1: { cellWidth: 20 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 12, halign: 'center' },
            4: { cellWidth: 28, halign: 'right' },
            5: { cellWidth: 32, halign: 'right' }
        }
    });

    drawFooter(doc);

    const fileName = `Transactions_${shopInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(now, 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
}

export const generateDigitalReceipt = (
    sale: { amount: number; note?: string; createdAt: string; productName?: string; quantity?: number; unitPrice?: number },
    shopInfo: ShopInfo
) => {
    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 160] // Slightly taller for extra details
    });

    const now = new Date();
    const centerX = 40;

    // SHOP NAME
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(shopInfo.name, centerX, 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    let y = 20;
    doc.text(`Par : ${shopInfo.ownerName}`, centerX, y, { align: 'center' });
    if (shopInfo.phone) {
        y += 4;
        doc.text(`Tél : ${shopInfo.phone}`, centerX, y, { align: 'center' });
    }

    doc.setDrawColor(200);
    doc.line(10, y + 5, 70, y + 5);
    y += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("REÇU DE VENTE", centerX, y, { align: 'center' });
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`Date : ${format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}`, 10, y);
    y += 10;

    // ITEMS HEADER
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.setFontSize(7);
    doc.text("Description", 10, y);
    doc.text("Qté", 38, y);
    doc.text("P.U", 48, y);
    doc.text("Total", 70, y, { align: 'right' });
    y += 3;
    doc.line(10, y, 70, y);
    y += 6;

    // ITEM CONTENT
    doc.setFont("helvetica", "normal");
    const itemName = sale.productName || "Vente diverse";
    const splitName = doc.splitTextToSize(itemName, 25);
    doc.text(splitName, 10, y);

    const qty = sale.quantity || 1;
    const unitPrice = sale.unitPrice || (sale.amount / qty);

    doc.text(`${qty}`, 38, y);
    doc.text(`${formatCustomCurrency(Math.round(unitPrice))}`, 48, y);
    doc.text(`${formatCustomCurrency(sale.amount)}`, 70, y, { align: 'right' });

    y += (splitName.length * 4) + 6;

    // NOTE IF EXISTS
    if (sale.note && sale.note !== itemName) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100);
        const splitNote = doc.splitTextToSize(`Note: ${sale.note}`, 60);
        doc.text(splitNote, 10, y);
        y += (splitNote.length * 3) + 4;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, y, 70, y);
    y += 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("TOTAL", 10, y);
    doc.text(`${formatCustomCurrency(sale.amount)} FCFA`, 70, y, { align: 'right' });

    y += 15;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("Merci de votre achat !", centerX, y, { align: 'center' });
    y += 4;
    doc.text("Ma Caisse - ma-caisse.com", centerX, y, { align: 'center' });

    const fileName = `Recu_${format(now, 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fileName);
}

export const generateInventoryReport = (
    products: InventoryItem[],
    shopInfo: ShopInfo
) => {
    const doc = new jsPDF();
    const now = new Date();

    drawHeader(doc, shopInfo, 'État de l\'Inventaire');

    // SUMMARY
    const totalItems = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`Total produits : ${totalItems} | Unités en stock : ${totalStock}`, 14, 58);
    doc.text(`Valeur estimée du stock (Vente) : ${formatCustomCurrency(totalValue)} FCFA`, 14, 64);

    // TABLE
    const rows = products.map(p => [
        p.name,
        { content: formatCustomCurrency(p.price), styles: { halign: 'right' as const } },
        { content: p.quantity.toString(), styles: { halign: 'center' as const } },
        { content: formatCustomCurrency(p.price * p.quantity), styles: { halign: 'right' as const } }
    ]);

    autoTable(doc, {
        startY: 72,
        head: [['Désignation', { content: 'Prix (FCFA)', styles: { halign: 'right' as const } }, { content: 'Stock', styles: { halign: 'center' as const } }, { content: 'Total (FCFA)', styles: { halign: 'right' as const } }]],
        body: rows,
        ...commonTableStyles,
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 35, halign: 'right' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 40, halign: 'right' }
        }
    });

    drawFooter(doc);

    const fileName = `Inventaire_${shopInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(now, 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
};
