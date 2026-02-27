import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ArriereRow {
    immeuble_nom: string;
    lot_numero: string;
    locataire_nom: string;
    montant_du: number;
    total_paye: number;
    total_commissions: number;
    solde: number;
    statut: 'Solde' | 'Partiel' | 'Impaye';
    observation: string;
    periode: string;
    nb_paiements: number;
}

interface GenerateArrieresPDFParams {
    rows: ArriereRow[];
    totalArrieres: number;
    totalPaye: number;
    totalCommissions: number;
    totalSolde: number;
    tauxRecouvrement: number;
    immeubleFilter?: string;
}

const formatFCFA = (amount: number): string => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';
};

export async function generateArrieresPDF({
    rows,
    totalArrieres,
    totalPaye,
    totalCommissions,
    totalSolde,
    tauxRecouvrement,
    immeubleFilter
}: GenerateArrieresPDFParams): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 15;

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RAPPORT DES ARRIERES DE LOYERS', 20, yPosition + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(147, 51, 234);
    doc.text('CABINET CAPCO - GESTION IMMOBILIERE', 20, yPosition + 18);

    yPosition += 25;
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // Filter info
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`BILAN DES IMPAYES : ${immeubleFilter || 'TOUS LES IMMEUBLES'}`, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Periode : Avant Janvier 2026`, 20, yPosition + 7);

    // stats box
    yPosition += 15;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, yPosition, pageWidth - 40, 30, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL DU', 25, yPosition + 10);
    doc.text('TOTAL RECOUVRE', pageWidth / 3 + 10, yPosition + 10);
    doc.text('SOLDE RESTANT', (2 * pageWidth / 3) - 5, yPosition + 10);

    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text(formatFCFA(totalArrieres), 25, yPosition + 18);
    doc.setTextColor(34, 197, 94);
    doc.text(formatFCFA(totalPaye), pageWidth / 3 + 10, yPosition + 18);
    doc.setTextColor(217, 119, 6);
    doc.text(formatFCFA(totalSolde), (2 * pageWidth / 3) - 5, yPosition + 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Taux de recouvrement : ${tauxRecouvrement}%`, 25, yPosition + 25);

    // Table
    yPosition += 40;
    const tableData = rows.map(r => [
        r.immeuble_nom,
        r.lot_numero,
        r.locataire_nom,
        formatFCFA(r.montant_du),
        formatFCFA(r.total_paye),
        formatFCFA(r.solde),
        r.statut
    ]);

    autoTable(doc, {
        startY: yPosition,
        head: [['Immeuble', 'Lot', 'Locataire', 'Du', 'Paye', 'Solde', 'Statut']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59] },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Genere par CAPCO le ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Rapport_Arrieres_${immeubleFilter || 'Global'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
