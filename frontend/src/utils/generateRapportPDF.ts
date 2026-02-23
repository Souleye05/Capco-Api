import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type TypeDepenseImmeuble = 'PLOMBERIE_ASSAINISSEMENT' | 'ELECTRICITE_ECLAIRAGE' | 'ENTRETIEN_MAINTENANCE' | 'SECURITE_GARDIENNAGE_ASSURANCE' | 'AUTRES_DEPENSES';

const typeDepenseLabels: Record<TypeDepenseImmeuble, string> = {
  PLOMBERIE_ASSAINISSEMENT: 'Plomberie - Assainissement',
  ELECTRICITE_ECLAIRAGE: 'Electricite - Eclairage',
  ENTRETIEN_MAINTENANCE: 'Entretien - Maintenance generale',
  SECURITE_GARDIENNAGE_ASSURANCE: 'Securite - Gardiennage - Assurance',
  AUTRES_DEPENSES: 'Autres depenses'
};

interface SimpleLot {
  id: string;
  numero: string;
  type: string;
  loyerMensuelAttendu: number;
  locataire?: { nom: string } | null;
}

interface SimplePaiement {
  montantEncaisse: number;
}

interface SimpleDepense {
  id: string;
  nature: string;
  description?: string | null;
  date: string;
  montant: number;
  typeDepense: TypeDepenseImmeuble;
}

interface LocataireStatus {
  lot: SimpleLot;
  hasPaid: boolean;
  paiement?: SimplePaiement;
}

interface SimpleRapport {
  id: string;
  immeubleId: string;
  periodeDebut: string;
  periodeFin: string;
  totalLoyers: number;
  totalDepenses: number;
  totalCommissions: number;
  netProprietaire: number;
  dateGeneration: string;
  statut: string;
  immeuble?: {
    id: string;
    nom: string;
    adresse: string;
    tauxCommissionCAPCO: number;
    proprietaire?: { nom: string };
  };
}

interface GenerateRapportPDFParams {
  rapport: SimpleRapport;
  locatairesStatus: LocataireStatus[];
  expensesByType: Record<TypeDepenseImmeuble, { total: number; items: SimpleDepense[] }>;
}

// Helper function to format currency - simple format without special chars
const formatFCFA = (amount: number): string => {
  // Format number with spaces as thousand separators
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' FCFA';
};

export async function generateRapportPDF({ rapport, locatairesStatus, expensesByType }: GenerateRapportPDFParams): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 15;

  // Load and add logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => {
        // Add logo - positioned at top left
        const logoWidth = 50;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        doc.addImage(logoImg, 'PNG', 15, yPosition, logoWidth, logoHeight);
        resolve();
      };
      logoImg.onerror = () => {
        console.warn('Could not load logo');
        resolve(); // Continue without logo
      };
      logoImg.src = '/images/capco-logo.png';
    });
  } catch (error) {
    console.warn('Error loading logo:', error);
  }

  // Header - using Century Gothic simulation (we use Helvetica as fallback in PDF)
  // Note: jsPDF doesn't support Century Gothic natively, using Helvetica which is similar
  yPosition += 5;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Navy color
  doc.text('RAPPORT DE GESTION IMMOBILIERE', pageWidth / 2 + 15, yPosition + 8, { align: 'center' });

  // Decorative line
  yPosition += 20;
  doc.setDrawColor(212, 175, 55); // Gold color
  doc.setLineWidth(1);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  // Building info section
  yPosition += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('IMMEUBLE', 20, yPosition);
  doc.text('PROPRIETAIRE', pageWidth / 2 + 10, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(rapport.immeuble?.nom || '-', 20, yPosition);
  doc.text(rapport.immeuble?.proprietaire?.nom || '-', pageWidth / 2 + 10, yPosition);

  yPosition += 5;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(rapport.immeuble?.adresse || '-', 20, yPosition);

  // Period
  yPosition += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PERIODE', 20, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Format dates without accents
  const dateDebut = new Date(rapport.periodeDebut);
  const dateFin = new Date(rapport.periodeFin);
  const moisDebut = dateDebut.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).replace('é', 'e').replace('û', 'u');
  const moisFin = dateFin.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).replace('é', 'e').replace('û', 'u');
  const periodeText = `Du ${moisDebut} au ${moisFin}`;
  doc.text(periodeText, 20, yPosition);

  // Separator
  yPosition += 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  // Section 1: Locataires
  yPosition += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. ETAT DES LOYERS', 20, yPosition);

  // Stats summary
  yPosition += 8;
  const totalPaid = locatairesStatus.filter(l => l.hasPaid).length;
  const totalUnpaid = locatairesStatus.filter(l => !l.hasPaid).length;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 197, 94); // Green
  doc.text(`${totalPaid} paye(s)`, 20, yPosition);
  doc.setTextColor(239, 68, 68); // Red
  doc.text(`${totalUnpaid} impaye(s)`, 55, yPosition);

  yPosition += 5;

  // Locataires table
  const locatairesData = locatairesStatus.map(item => [
    item.lot.locataire?.nom || '-',
    `${item.lot.numero} (${item.lot.type})`,
    formatFCFA(item.lot.loyerMensuelAttendu),
    item.paiement ? formatFCFA(item.paiement.montantEncaisse) : '-',
    item.hasPaid ? 'Paye' : 'Impaye'
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Locataire', 'Appartement', 'Loyer attendu', 'Montant paye', 'Statut']],
    body: locatairesData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' }
    },
    margin: { left: 20, right: 20 },
    didParseCell: function (data) {
      if (data.column.index === 4 && data.section === 'body') {
        const value = data.cell.raw as string;
        if (value === 'Paye') {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        } else if (value === 'Impaye') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Get the final Y position after the table
  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  // Section 2: Dépenses
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. DETAIL DES DEPENSES', 20, yPosition);

  yPosition += 8;

  // Dépenses table data
  const depensesData: string[][] = [];

  Object.entries(expensesByType).forEach(([type, data]) => {
    // Add type header row
    depensesData.push([
      typeDepenseLabels[type as TypeDepenseImmeuble],
      '',
      '',
      formatFCFA(data.total)
    ]);

    // Add individual items
    data.items.forEach(dep => {
      depensesData.push([
        '   > ' + dep.nature,
        dep.description || '-',
        new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(dep.date)),
        formatFCFA(dep.montant)
      ]);
    });
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['Type / Designation', 'Description', 'Date', 'Montant']],
    body: depensesData,
    foot: [['TOTAL DES DEPENSES', '', '', formatFCFA(rapport.totalDepenses)]],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    footStyles: {
      fillColor: [254, 226, 226],
      textColor: [239, 68, 68],
      fontSize: 9,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 55 },
      2: { cellWidth: 28 },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 20, right: 20 },
    didParseCell: function (data) {
      if (data.section === 'body') {
        const value = data.cell.raw as string;
        // Style for category headers (no indent)
        if (data.column.index === 0 && value && !value.startsWith('   >')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    }
  });

  // Get the final Y position after the table
  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page for financial summary
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Section 3: Récapitulatif financier
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. RECAPITULATIF FINANCIER', 20, yPosition);

  yPosition += 10;

  // Financial summary box
  const boxX = 20;
  const boxWidth = pageWidth - 40;
  const boxHeight = 70;

  // Draw box border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 3, 3, 'S');

  // Fill header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(boxX, yPosition, boxWidth, 12, 3, 3, 'F');
  doc.rect(boxX, yPosition + 6, boxWidth, 6, 'F'); // Fill bottom corners

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SYNTHESE', pageWidth / 2, yPosition + 8, { align: 'center' });

  yPosition += 20;

  // Financial lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  doc.text('Loyers encaisses', boxX + 10, yPosition);
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.text('+ ' + formatFCFA(rapport.totalLoyers), boxX + boxWidth - 10, yPosition, { align: 'right' });

  yPosition += 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text('Total des depenses', boxX + 10, yPosition);
  doc.setTextColor(239, 68, 68);
  doc.setFont('helvetica', 'bold');
  doc.text('- ' + formatFCFA(rapport.totalDepenses), boxX + boxWidth - 10, yPosition, { align: 'right' });

  yPosition += 10;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text('Commission CAPCO (' + rapport.immeuble?.tauxCommissionCAPCO + '%)', boxX + 10, yPosition);
  doc.setTextColor(147, 51, 234); // Purple for CAPCO
  doc.setFont('helvetica', 'bold');
  doc.text('- ' + formatFCFA(rapport.totalCommissions), boxX + boxWidth - 10, yPosition, { align: 'right' });

  // Separator line
  yPosition += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(boxX + 10, yPosition, boxX + boxWidth - 10, yPosition);

  // Net total
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('NET A REVERSER AU PROPRIETAIRE', boxX + 10, yPosition);
  doc.setFontSize(13);
  doc.text(formatFCFA(rapport.netProprietaire), boxX + boxWidth - 10, yPosition, { align: 'right' });

  // Footer
  yPosition = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  const dateGeneration = new Date();
  const dateGenText = 'Rapport genere le ' + format(dateGeneration, 'dd/MM/yyyy') + ' a ' + format(dateGeneration, 'HH:mm');
  doc.text(dateGenText, pageWidth / 2, yPosition, { align: 'center' });
  doc.text('Cabinet CAPCO - Gestion Immobiliere', pageWidth / 2, yPosition + 5, { align: 'center' });

  // Save the PDF
  const immName = (rapport.immeuble?.nom || 'Immeuble').replace(/\s+/g, '_').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a');
  const d = new Date(rapport.periodeDebut);
  const moisStr = String(d.getUTCMonth() + 1).padStart(2, '0') + '_' + d.getUTCFullYear();
  const fileName = `Rapport_Gestion_${immName}_${moisStr}.pdf`;
  doc.save(fileName);
}
