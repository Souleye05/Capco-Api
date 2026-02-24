import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import {
  DossierRecouvrement,
  TypeAction,
  PaiementRecouvrement
} from '@/hooks/useRecouvrement';

const typeActionLabels: Record<string, string> = {
  APPEL_TELEPHONIQUE: 'Appel telephonique',
  COURRIER_SIMPLE: 'Courrier simple',
  MISE_EN_DEMEURE: 'Mise en demeure',
  ASSIGNATION: 'Assignation',
  COMMANDEMENT: 'Commandement de payer',
  SAISIE: 'Saisie / Execution',
  AUTRE: 'Autre'
};

interface GenerateRapportActionsPDFParams {
  dossier: DossierRecouvrement;
  actions: any[]; // On pourra typer plus tard si besoin
  paiements: PaiementRecouvrement[];
  totalEncaisse: number;
  soldeRestant: number;
}

const formatFCFA = (amount: number): string => {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' FCFA';
};

export async function generateRapportActionsPDF({
  dossier,
  actions,
  paiements,
  totalEncaisse,
  soldeRestant
}: GenerateRapportActionsPDFParams): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 15;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('RAPPORT DE RECOUVREMENT', 20, yPosition + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 51, 234); // Indigo color for branding
  doc.text('CABINET CAPCO - GESTION DES CREANCES', 20, yPosition + 18);

  yPosition += 25;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  // Dossier summary
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`REFERENCE : ${dossier.reference}`, 20, yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Statut : ${dossier.statut.replace('_', ' ')}`, 20, yPosition + 6);
  doc.text(`Date d'ouverture : ${new Date(dossier.createdAt).toLocaleDateString()}`, 20, yPosition + 12);

  // Parties box
  yPosition += 22;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, yPosition, pageWidth - 40, 35, 2, 2, 'F');

  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('CREANCIER', 25, yPosition);
  doc.text('DEBITEUR', pageWidth / 2 + 5, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(dossier.creancierNom, 25, yPosition);
  doc.text(dossier.debiteurNom, pageWidth / 2 + 5, yPosition);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  if (dossier.creancierTelephone) doc.text(dossier.creancierTelephone, 25, yPosition + 5);
  if (dossier.debiteurTelephone) doc.text(dossier.debiteurTelephone, pageWidth / 2 + 5, yPosition + 5);
  if (dossier.debiteurAdresse) doc.text(dossier.debiteurAdresse, pageWidth / 2 + 5, yPosition + 10);

  // Financial status
  yPosition += 30;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('SITUATION FINANCIERE', 20, yPosition);

  const financialData = [
    ['Montant principal', formatFCFA(dossier.montantPrincipal)],
    ['Penalites / Interets', formatFCFA(dossier.penalitesInterets)],
    ['TOTAL DU', formatFCFA(dossier.totalARecouvrer)],
    ['TOTAL ENCAISSE', formatFCFA(totalEncaisse)],
    ['SOLDE RESTANT', formatFCFA(soldeRestant)]
  ];

  autoTable(doc, {
    startY: yPosition + 5,
    head: [['Designation', 'Montant']],
    body: financialData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'right' }
    },
    didParseCell: (data) => {
      if (data.row.index === 3) data.cell.styles.textColor = [34, 197, 94];
      if (data.row.index === 4) data.cell.styles.textColor = [220, 38, 38];
    },
    margin: { left: 20 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Actions
  doc.text('CHRONOLOGIE DES ACTIONS', 20, yPosition);

  if (actions.length > 0) {
    const actionsData = actions.map(a => [
      new Date(a.date).toLocaleDateString(),
      typeActionLabels[a.typeAction] || a.typeAction,
      a.resume,
      a.prochaineEtape || '-'
    ]);

    autoTable(doc, {
      startY: yPosition + 5,
      head: [['Date', 'Type', 'Resume', 'Echeance']],
      body: actionsData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 35 }, 2: { cellWidth: 70 }, 3: { cellWidth: 40 } },
      margin: { left: 20 }
    });
    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucune action enregistree.', 20, yPosition + 10);
    yPosition += 20;
  }

  // Payments
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('DETAIL DES PAIEMENTS RECUS', 20, yPosition);

  if (paiements.length > 0) {
    const paiementsData = paiements.map(p => [
      new Date(p.date).toLocaleDateString(),
      formatFCFA(p.montant),
      p.mode,
      p.reference || '-'
    ]);

    autoTable(doc, {
      startY: yPosition + 5,
      head: [['Date', 'Montant', 'Mode', 'Reference']],
      body: paiementsData,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105] },
      margin: { left: 20 }
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun paiement enregistre.', 20, yPosition + 10);
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Genere par CAPCOS le ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Page ${i}/${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`Rapport_Recouvrement_${dossier.reference}.pdf`);
}
