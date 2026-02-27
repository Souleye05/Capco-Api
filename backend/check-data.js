const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
    console.log('🔍 Vérification des données...\n');

    try {
        const immeubles = await prisma.immeuble.count();
        const lots = await prisma.lot.count();
        const locataires = await prisma.locataire.count();
        const baux = await prisma.bail.count();
        const arrieres = await prisma.arrierage.count();

        console.log(`📊 Résumé des données:`);
        console.log(`   Immeubles: ${immeubles}`);
        console.log(`   Lots: ${lots}`);
        console.log(`   Locataires: ${locataires}`);
        console.log(`   Baux: ${baux}`);
        console.log(`   Arriérés: ${arrieres}`);

        if (immeubles === 0) {
            console.log('\n❌ Aucun immeuble trouvé. Vous devez d\'abord créer des immeubles, lots et locataires.');
        } else {
            console.log('\n✅ Des données existent. Vous pouvez créer des arriérés via l\'interface.');
        }

        // Afficher quelques immeubles avec leurs lots
        if (immeubles > 0) {
            const immeublesWithLots = await prisma.immeuble.findMany({
                take: 3,
                include: {
                    lots: {
                        include: {
                            locataire: true
                        }
                    }
                }
            });

            console.log('\n🏠 Immeubles disponibles:');
            immeublesWithLots.forEach(immeuble => {
                console.log(`   ${immeuble.nom} (${immeuble.lots.length} lots)`);
                immeuble.lots.forEach(lot => {
                    console.log(`     - ${lot.numero}: ${lot.locataire?.nom || 'Vacant'} (${lot.statut})`);
                });
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();