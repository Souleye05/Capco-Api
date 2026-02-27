import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function createTestArrieres() {
    console.log('🏠 Création d\'arriérés de test...\n');

    try {
        // Vérifier s'il y a des immeubles et des lots
        const immeubles = await prisma.immeuble.findMany({
            include: {
                lots: {
                    include: {
                        locataire: true,
                        baux: {
                            where: { statut: 'ACTIF' },
                            orderBy: { dateDebut: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (immeubles.length === 0) {
            console.log('❌ Aucun immeuble trouvé. Créons d\'abord des données de base...');
            
            // Créer un propriétaire
            const proprietaire = await prisma.proprietaire.create({
                data: {
                    nom: 'Propriétaire Test',
                    telephone: '+221 77 123 45 67',
                    email: 'proprietaire@test.com'
                }
            });

            // Créer un immeuble
            const immeuble = await prisma.immeuble.create({
                data: {
                    nom: 'Immeuble Test',
                    adresse: '123 Rue de Test, Dakar',
                    proprietaireId: proprietaire.id,
                    tauxCommissionCapco: 5.0
                }
            });

            // Créer un locataire
            const locataire = await prisma.locataire.create({
                data: {
                    nom: 'Locataire Test',
                    telephone: '+221 77 987 65 43',
                    email: 'locataire@test.com'
                }
            });

            // Créer un lot
            const lot = await prisma.lot.create({
                data: {
                    numero: 'A01',
                    etage: '1er',
                    type: 'APPARTEMENT',
                    loyerMensuelAttendu: 150000,
                    statut: 'OCCUPE',
                    immeubleId: immeuble.id,
                    locataireId: locataire.id
                }
            });

            // Créer un bail
            await prisma.bail.create({
                data: {
                    lotId: lot.id,
                    locataireId: locataire.id,
                    dateDebut: new Date('2024-01-01'),
                    montantLoyer: 150000,
                    jourPaiementPrevu: 5,
                    statut: 'ACTIF'
                }
            });

            console.log('✅ Données de base créées');
        }

        // Récupérer les lots occupés
        const lotsOccupes = await prisma.lot.findMany({
            where: { statut: 'OCCUPE' },
            include: {
                immeuble: true,
                locataire: true,
                baux: {
                    where: { statut: 'ACTIF' },
                    orderBy: { dateDebut: 'desc' },
                    take: 1
                }
            }
        });

        if (lotsOccupes.length === 0) {
            console.log('❌ Aucun lot occupé trouvé');
            return;
        }

        // Créer des arriérés pour chaque lot
        const arrieresData = [];
        
        for (const lot of lotsOccupes.slice(0, 3)) { // Limiter à 3 lots
            const bail = lot.baux[0];
            if (!bail) continue;

            // Arriéré 1: Complètement impayé
            arrieresData.push({
                lotId: lot.id,
                montantDu: bail.montantLoyer * 2, // 2 mois d'arriérés
                montantPaye: 0,
                montantRestant: bail.montantLoyer * 2,
                periodeDebut: new Date('2025-01-01'),
                periodeFin: new Date('2025-02-28'),
                description: `Arriérés Janvier-Février 2025 - ${lot.immeuble.nom} ${lot.numero}`,
                statut: 'IMPAYE'
            });

            // Arriéré 2: Partiellement payé
            const montantDu2 = bail.montantLoyer * 3;
            const montantPaye2 = bail.montantLoyer * 1.5;
            arrieresData.push({
                lotId: lot.id,
                montantDu: montantDu2,
                montantPaye: montantPaye2,
                montantRestant: montantDu2 - montantPaye2,
                periodeDebut: new Date('2024-10-01'),
                periodeFin: new Date('2024-12-31'),
                description: `Arriérés Oct-Déc 2024 - ${lot.immeuble.nom} ${lot.numero}`,
                statut: 'PARTIEL'
            });
        }

        // Créer les arriérés
        for (const arriereData of arrieresData) {
            const arriere = await prisma.arrierage.create({
                data: arriereData
            });

            console.log(`✅ Arriéré créé: ${arriereData.description} - ${arriereData.montantDu} FCFA`);

            // Ajouter des paiements partiels pour les arriérés partiels
            if (arriereData.statut === 'PARTIEL') {
                await prisma.paiementPartielArrierage.create({
                    data: {
                        arrierageId: arriere.id,
                        date: new Date('2025-01-15'),
                        montant: arriereData.montantPaye,
                        mode: 'VIREMENT',
                        commentaire: 'Paiement partiel par virement'
                    }
                });
                console.log(`  💰 Paiement partiel ajouté: ${arriereData.montantPaye} FCFA`);
            }
        }

        console.log(`\n🎉 ${arrieresData.length} arriérés de test créés avec succès !`);
        
        // Afficher un résumé
        const totalArrieres = await prisma.arrierage.count();
        const totalMontant = await prisma.arrierage.aggregate({
            _sum: { montantDu: true, montantPaye: true }
        });

        console.log(`\n📊 Résumé:`);
        console.log(`   Total arriérés: ${totalArrieres}`);
        console.log(`   Montant total dû: ${totalMontant._sum.montantDu?.toLocaleString()} FCFA`);
        console.log(`   Montant total payé: ${totalMontant._sum.montantPaye?.toLocaleString()} FCFA`);

    } catch (error) {
        console.error('❌ Erreur lors de la création des arriérés:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestArrieres();