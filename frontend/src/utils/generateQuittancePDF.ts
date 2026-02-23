import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuittanceData {
  type: 'QUITTANCE' | 'RECU';
  locataire: {
    nom: string;
    adresse?: string;
  };
  proprietaire: {
    nom: string;
  };
  immeuble: {
    nom: string;
    adresse: string;
  };
  lot: {
    numero: string;
    type?: string;
  };
  periode: string; // format yyyy-MM
  loyerMensuel: number;
  montantPaye: number;
  datePaiement: string;
  modePaiement: string;
  reference?: string;
}

const formatCurrencyPDF = (amount: number): string => {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/,/g, ' ') + ' FCFA';
};

const numberToWords = (num: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  if (num === 0) return 'zéro';
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    const rest = num % 1000000;
    return (millions === 1 ? 'un million ' : numberToWords(millions) + ' millions ') + (rest > 0 ? numberToWords(rest) : '');
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const rest = num % 1000;
    return (thousands === 1 ? 'mille ' : numberToWords(thousands) + ' mille ') + (rest > 0 ? numberToWords(rest) : '');
  }
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    const rest = num % 100;
    return (hundreds === 1 ? 'cent ' : units[hundreds] + ' cent ') + (rest > 0 ? numberToWords(rest) : '');
  }
  if (num >= 20) {
    const tenIndex = Math.floor(num / 10);
    const unit = num % 10;
    if (tenIndex === 7 || tenIndex === 9) {
      return tens[tenIndex - 1] + '-' + (num % 20 >= 10 ? teens[num % 20 - 10] : units[unit]);
    }
    return tens[tenIndex] + (unit > 0 ? '-' + units[unit] : '');
  }
  if (num >= 10) return teens[num - 10];
  return units[num];
};

export const generateQuittancePDF = async (data: QuittanceData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const isQuittance = data.type === 'QUITTANCE';
  const title = isQuittance ? 'QUITTANCE DE LOYER' : 'REÇU DE PAIEMENT PARTIEL';
  const periodeDate = new Date(data.periode + '-01');
  const periodeLabel = format(periodeDate, 'MMMM yyyy', { locale: fr }).toUpperCase();

  // Logo CAPCO - async loading
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      logoImg.onload = () => {
        const logoWidth = 40;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        doc.addImage(logoImg, 'PNG', 15, 10, logoWidth, Math.min(logoHeight, 20));
        resolve();
      };
      logoImg.onerror = () => {
        // Fallback text if image not available
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('CAPCO', 15, 25);
        resolve();
      };
      logoImg.src = '/images/capco-logo.png';
    });
  } catch (e) {
    // Fallback text if image not available
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CAPCO', 15, 25);
  }

  // Header
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('CAPCO - Cabinet Conseil', pageWidth - 15, 15, { align: 'right' });
  doc.text('Gestion Immobilière', pageWidth - 15, 21, { align: 'right' });
  doc.text('Dakar, Sénégal', pageWidth - 15, 27, { align: 'right' });

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isQuittance ? 0 : 180, isQuittance ? 100 : 100, isQuittance ? 0 : 0);
  doc.text(title, pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(periodeLabel, pageWidth / 2, 58, { align: 'center' });

  doc.setTextColor(0, 0, 0);

  // Reference
  if (data.reference) {
    doc.setFontSize(10);
    doc.text(`Référence : ${data.reference}`, pageWidth / 2, 66, { align: 'center' });
  }

  // Content
  let yPos = 80;

  // Propriétaire box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(15, yPos, (pageWidth - 40) / 2, 35, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPRIÉTAIRE', 20, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.proprietaire.nom, 20, yPos + 18);

  // Locataire box
  const rightBoxX = 15 + (pageWidth - 40) / 2 + 10;
  doc.roundedRect(rightBoxX, yPos, (pageWidth - 40) / 2, 35, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('LOCATAIRE', rightBoxX + 5, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.locataire.nom, rightBoxX + 5, yPos + 18);
  if (data.locataire.adresse) {
    doc.text(data.locataire.adresse, rightBoxX + 5, yPos + 26);
  }

  yPos += 50;

  // Bien concerné
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('BIEN CONCERNÉ', 20, yPos + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Immeuble : ${data.immeuble.nom}`, 20, yPos + 18);
  doc.text(`Adresse : ${data.immeuble.adresse}`, 20, yPos + 26);
  doc.text(`Lot : ${data.lot.numero}${data.lot.type ? ` (${data.lot.type})` : ''}`, pageWidth / 2, yPos + 18);

  yPos += 45;

  // Détails du paiement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DÉTAILS DU PAIEMENT', 15, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Table
  const tableData = [
    ['Période concernée', format(periodeDate, 'MMMM yyyy', { locale: fr })],
    ['Loyer mensuel', formatCurrencyPDF(data.loyerMensuel)],
    ['Montant payé', formatCurrencyPDF(data.montantPaye)],
    ['Date de paiement', new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(data.datePaiement))],
    ['Mode de paiement', data.modePaiement],
  ];

  if (!isQuittance) {
    tableData.push(['Reste à payer', formatCurrencyPDF(data.loyerMensuel - data.montantPaye)]);
  }

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: tableData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 80 },
    },
    margin: { left: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Montant en lettres
  doc.setFillColor(isQuittance ? 232 : 255, isQuittance ? 245 : 243, isQuittance ? 233 : 232);
  doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MONTANT EN LETTRES :', 20, yPos + 10);
  doc.setFont('helvetica', 'italic');
  const amountWords = numberToWords(data.montantPaye).charAt(0).toUpperCase() + numberToWords(data.montantPaye).slice(1) + ' francs CFA';
  doc.text(amountWords, 20, yPos + 18);

  yPos += 35;

  // Mention légale
  if (isQuittance) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Je soussigné, représentant le propriétaire, déclare avoir reçu de la part du locataire ci-dessus désigné,',
      15, yPos
    );
    doc.text(
      'la somme indiquée en paiement intégral du loyer du mois mentionné et en donne quittance, sans réserve.',
      15, yPos + 6
    );
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 80, 0);
    doc.text(
      'ATTENTION : Ce reçu atteste d\'un paiement partiel. Le solde reste dû pour la période indiquée.',
      15, yPos
    );
    doc.setTextColor(0, 0, 0);
    doc.text(
      'Une quittance de loyer sera émise une fois le paiement intégralement effectué.',
      15, yPos + 6
    );
  }

  yPos += 25;

  // Signature
  doc.setFontSize(10);
  doc.text(`Fait à Dakar, le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 20;
  doc.text('Le Gestionnaire', pageWidth - 50, yPos, { align: 'center' });
  doc.text('CAPCO', pageWidth - 50, yPos + 25, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Document généré automatiquement par CAPCO - Cabinet Conseil', pageWidth / 2, 285, { align: 'center' });

  // Download
  const fileName = isQuittance
    ? `Quittance_${data.lot.numero}_${data.periode}.pdf`
    : `Recu_${data.lot.numero}_${data.periode}.pdf`;

  doc.save(fileName);
};

export const shouldGenerateQuittance = (montantPaye: number, loyerMensuel: number): 'QUITTANCE' | 'RECU' => {
  return montantPaye >= loyerMensuel ? 'QUITTANCE' : 'RECU';
};
