import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { TypeAction } from '@/types';
import {
  DossierRecouvrementDB,
  ActionRecouvrementWithDossierDB,
  PaiementRecouvrementDB
} from '@/hooks/useDossiersRecouvrement';
import { HonorairesRecouvrementDB, DepenseDossierDB } from '@/hooks/useHonorairesDepenses';

const typeActionLabels: Record<TypeAction, string> = {
  APPEL_TELEPHONIQUE: 'Appel telephonique',
  COURRIER: 'Courrier',
  LETTRE_RELANCE: 'Lettre de relance',
  MISE_EN_DEMEURE: 'Mise en demeure',
  COMMANDEMENT_PAYER: 'Commandement de payer',
  ASSIGNATION: 'Assignation',
  REQUETE: 'Requete',
  AUDIENCE_PROCEDURE: 'Audience / Procedure',
  AUTRE: 'Autre'
};

const typeDepenseLabels: Record<string, string> = {
  FRAIS_HUISSIER: 'Frais d\'huissier',
  FRAIS_GREFFE: 'Frais de greffe',
  TIMBRES_FISCAUX: 'Timbres fiscaux',
  FRAIS_COURRIER: 'Frais de courrier',
  FRAIS_DEPLACEMENT: 'Frais de deplacement',
  FRAIS_EXPERTISE: 'Frais d\'expertise',
  AUTRES: 'Autres frais'
};

interface GenerateRapportActionsPDFParams {
  dossier: DossierRecouvrementDB;
  actions: ActionRecouvrementWithDossierDB[];
  paiements: PaiementRecouvrementDB[];
  honoraires?: HonorairesRecouvrementDB | null;
  depenses?: DepenseDossierDB[];
  totalEncaisse: number;
  soldeRestant: number;
}

// Helper function to format currency - simple format without special chars
const formatFCFA = (amount: number): string => {
  const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return formatted + ' FCFA';
};

export async function generateRapportActionsPDF({
  dossier,
  actions,
  paiements,
  honoraires,
  depenses = [],
  totalEncaisse,
  soldeRestant
}: GenerateRapportActionsPDFParams): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 15;

  // Load and add logo
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      logoImg.onload = () => {
        const logoWidth = 50;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        doc.addImage(logoImg, 'PNG', 15, yPosition, logoWidth, logoHeight);
        resolve();
      };
      logoImg.onerror = () => {
        console.warn('Could not load logo');
        resolve();
      };
      logoImg.src = '/images/capco-logo.png';
    });
  } catch (error) {
    console.warn('Error loading logo:', error);
  }

  // Header
  yPosition += 5;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('RAPPORT D\'ACTIONS - RECOUVREMENT', pageWidth / 2 + 15, yPosition + 8, { align: 'center' });

  // Decorative line
  yPosition += 20;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.line(20, yPosition, pageWidth - 20, yPosition);

  // Dossier info
  yPosition += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('DOSSIER : ' + dossier.reference, 20, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const dateCreation = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(dossier.created_at));
  doc.text('Ouvert le : ' + dateCreation, 20, yPosition);

  // Parties section
  yPosition += 12;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(20, yPosition, pageWidth - 40, 30, 3, 3, 'F');

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CREANCIER :', 30, yPosition);
  doc.text('DEBITEUR :', pageWidth / 2 + 10, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(dossier.creancier_nom, 30, yPosition);
  doc.text(dossier.debiteur_nom, pageWidth / 2 + 10, yPosition);

  if (dossier.debiteur_telephone) {
    yPosition += 5;
    doc.setTextColor(100, 116, 139);
    doc.text('Tel: ' + dossier.debiteur_telephone, pageWidth / 2 + 10, yPosition);
  }

  // Financial summary
  yPosition += 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('SITUATION FINANCIERE', 20, yPosition);

  yPosition += 8;

  const financialData = [
    ['Montant principal', formatFCFA(Number(dossier.montant_principal))],
    ['Penalites / Interets', formatFCFA(Number(dossier.penalites_interets) || 0)],
    ['Total a recouvrer', formatFCFA(Number(dossier.total_a_recouvrer))],
    ['Total encaisse', formatFCFA(totalEncaisse)],
    ['Reste a encaisser', formatFCFA(soldeRestant)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Designation', 'Montant']],
    body: financialData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 60, halign: 'right' }
    },
    margin: { left: 20, right: pageWidth - 160 },
    didParseCell: function (data) {
      if (data.section === 'body') {
        if (data.row.index === 3) {
          data.cell.styles.textColor = [34, 197, 94];
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === 4) {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Honoraires section if available
  if (honoraires) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('HONORAIRES CAPCO', 20, yPosition);

    yPosition += 8;

    const resteAPayer = Number(honoraires.montant_prevu) - Number(honoraires.montant_paye);
    const honorairesData = [
      ['Honoraires prevus', formatFCFA(Number(honoraires.montant_prevu))],
      ['Honoraires payes', formatFCFA(Number(honoraires.montant_paye))],
      ['Reste a payer', formatFCFA(resteAPayer)]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Designation', 'Montant']],
      body: honorairesData,
      theme: 'striped',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'right' }
      },
      margin: { left: 20, right: pageWidth - 160 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Depenses section if available
  if (depenses.length > 0) {
    if (yPosition > 180) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DEPENSES ENGAGEES (' + depenses.length + ')', 20, yPosition);

    yPosition += 8;

    const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
    const depensesData = depenses.map(d => [
      new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(d.date)),
      typeDepenseLabels[d.type_depense] || d.type_depense,
      d.nature,
      formatFCFA(Number(d.montant))
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Type', 'Nature', 'Montant']],
      body: depensesData,
      foot: [['', '', 'TOTAL', formatFCFA(totalDepenses)]],
      theme: 'striped',
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      footStyles: {
        fillColor: [254, 243, 199],
        textColor: [234, 88, 12],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page
  if (yPosition > 180) {
    doc.addPage();
    yPosition = 20;
  }

  // Actions timeline
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('HISTORIQUE DES ACTIONS (' + actions.length + ')', 20, yPosition);

  yPosition += 8;

  if (actions.length > 0) {
    const actionsData = actions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(action => [
        new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(action.date)),
        typeActionLabels[action.type_action],
        action.resume.substring(0, 60) + (action.resume.length > 60 ? '...' : ''),
        action.prochaine_etape || '-'
      ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Type', 'Resume', 'Prochaine etape']],
      body: actionsData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 65 },
        3: { cellWidth: 45 }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Aucune action enregistree', 20, yPosition);
    yPosition += 15;
  }

  // Check if we need a new page for payments
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Payments section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PAIEMENTS RECUS (' + paiements.length + ')', 20, yPosition);

  yPosition += 8;

  if (paiements.length > 0) {
    const modeLabels: Record<string, string> = {
      CASH: 'Especes',
      VIREMENT: 'Virement',
      CHEQUE: 'Cheque',
      WAVE: 'Wave',
      OM: 'Orange Money'
    };

    const paiementsData = paiements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(p => [
        new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(p.date)),
        formatFCFA(p.montant),
        modeLabels[p.mode] || p.mode,
        p.reference || '-',
        p.commentaire || '-'
      ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Montant', 'Mode', 'Reference', 'Commentaire']],
      body: paiementsData,
      foot: [['TOTAL', formatFCFA(totalEncaisse), '', '', '']],
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59]
      },
      footStyles: {
        fillColor: [220, 252, 231],
        textColor: [34, 197, 94],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 50 }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Aucun paiement enregistre', 20, yPosition);
    yPosition += 15;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  yPosition = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  const dateGeneration = new Date();
  const dateGenText = 'Rapport genere le ' + format(dateGeneration, 'dd/MM/yyyy') + ' a ' + format(dateGeneration, 'HH:mm');
  doc.text(dateGenText, pageWidth / 2, yPosition, { align: 'center' });
  doc.text('Cabinet CAPCO - Recouvrement de creances', pageWidth / 2, yPosition + 5, { align: 'center' });

  // Save the PDF
  const refName = dossier.reference.replace(/\s+/g, '_');
  const dateStr = format(new Date(), 'dd_MM_yyyy');
  const fileName = `Rapport_Actions_${refName}_${dateStr}.pdf`;
  doc.save(fileName);
}
