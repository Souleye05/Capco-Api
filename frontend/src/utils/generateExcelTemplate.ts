import * as XLSX from 'xlsx';

export const generateImportTemplate = () => {
  // Créer un nouveau workbook
  const wb = XLSX.utils.book_new();

  // Onglet 1: Propriétaires
  const proprietairesData = [
    ['nom', 'telephone', 'email', 'adresse'],
    ['Jean Dupont (exemple)', '+225 07 00 00 00', 'jean@email.com', 'Abidjan, Cocody'],
  ];
  const wsProprietaires = XLSX.utils.aoa_to_sheet(proprietairesData);
  wsProprietaires['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsProprietaires, 'Propriétaires');

  // Onglet 2: Immeubles
  const immeublesData = [
    ['nom', 'adresse', 'proprietaire_nom', 'taux_commission', 'notes'],
    ['Résidence Les Palmiers (exemple)', 'Cocody, Rue des Jardins', 'Jean Dupont (exemple)', '5', 'Immeuble de 10 lots'],
  ];
  const wsImmeubles = XLSX.utils.aoa_to_sheet(immeublesData);
  wsImmeubles['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsImmeubles, 'Immeubles');

  // Onglet 3: Locataires
  const locatairesData = [
    ['nom', 'telephone', 'email'],
    ['Marie Koné (exemple)', '+225 05 00 00 00', 'marie@email.com'],
  ];
  const wsLocataires = XLSX.utils.aoa_to_sheet(locatairesData);
  wsLocataires['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsLocataires, 'Locataires');

  // Onglet 4: Lots
  const lotsData = [
    ['numero', 'immeuble_nom', 'type', 'etage', 'loyer_mensuel', 'locataire_nom', 'statut'],
    ['A01 (exemple)', 'Résidence Les Palmiers (exemple)', 'F3', 'RDC', '150000', 'Marie Koné (exemple)', 'OCCUPE'],
    ['', '', '', '', '', '', ''],
    ['Types autorisés:', 'STUDIO, F1, F2, F3, F4, F5, MAGASIN, BUREAU, AUTRE', '', '', '', '', ''],
    ['Statuts autorisés:', 'LIBRE, OCCUPE', '', '', '', '', ''],
  ];
  const wsLots = XLSX.utils.aoa_to_sheet(lotsData);
  wsLots['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsLots, 'Lots');

  // Télécharger le fichier
  XLSX.writeFile(wb, 'template_import_immobilier.xlsx');
};
