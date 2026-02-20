import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAudienceResults() {
  try {
    console.log('🔍 Testing audience results functionality...\n');

    // 1. Find an audience with PASSEE_NON_RENSEIGNEE status
    const audienceNonRenseignee = await prisma.audiences.findFirst({
      where: {
        statut: 'PASSEE_NON_RENSEIGNEE'
      },
      include: {
        affaire: true,
        resultat: true
      }
    });

    if (!audienceNonRenseignee) {
      console.log('❌ No audience with PASSEE_NON_RENSEIGNEE status found');
      return;
    }

    console.log('✅ Found audience to test:', {
      id: audienceNonRenseignee.id,
      affaire: audienceNonRenseignee.affaire?.reference,
      date: audienceNonRenseignee.date,
      statut: audienceNonRenseignee.statut,
      hasResult: !!audienceNonRenseignee.resultat && audienceNonRenseignee.resultat.length > 0
    });

    // 2. Test creating a result if none exists
    if (!audienceNonRenseignee.resultat || audienceNonRenseignee.resultat.length === 0) {
      console.log('\n📝 Creating test result...');
      
      const testResult = await prisma.resultatsAudiences.create({
        data: {
          audienceId: audienceNonRenseignee.id,
          type: 'DELIBERE',
          texteDelibere: 'Test délibéré - audience results functionality test',
          createdBy: 'system-test'
        }
      });

      console.log('✅ Test result created:', {
        id: testResult.id,
        type: testResult.type,
        texteDelibere: testResult.texteDelibere?.substring(0, 50) + '...'
      });

      // Update audience status
      await prisma.audiences.update({
        where: { id: audienceNonRenseignee.id },
        data: { statut: 'RENSEIGNEE' }
      });

      console.log('✅ Audience status updated to RENSEIGNEE');
    }

    // 3. Verify the result exists and can be retrieved
    const audienceWithResult = await prisma.audiences.findUnique({
      where: { id: audienceNonRenseignee.id },
      include: {
        affaire: true,
        resultat: true
      }
    });

    console.log('\n🔍 Final verification:', {
      audienceId: audienceWithResult?.id,
      statut: audienceWithResult?.statut,
      hasResult: !!audienceWithResult?.resultat && audienceWithResult.resultat.length > 0,
      resultType: audienceWithResult?.resultat?.[0]?.type
    });

    console.log('\n✅ Audience results functionality test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing audience results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAudienceResults();